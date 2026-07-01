// supabase/functions/ipaymu-callback/index.ts
// iPaymu notifyUrl webhook. iPaymu POSTs (form-encoded) after a payment.
// We re-verify the transaction against iPaymu's "Check Transaction" API
// (never trust the raw POST) and, on success, grant premium with service_role.
//
// IMPORTANT: deploy with `--no-verify-jwt` so iPaymu can reach it:
//   supabase functions deploy ipaymu-callback --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hmacSha256Hex(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const VA = Deno.env.get('IPAYMU_VA');
    const API_KEY = Deno.env.get('IPAYMU_API_KEY');
    const MODE = (Deno.env.get('IPAYMU_MODE') ?? 'production').toLowerCase();
    if (!VA || !API_KEY) return new Response('Not configured', { status: 500 });
    const base = MODE === 'sandbox' ? 'https://sandbox.ipaymu.com' : 'https://my.ipaymu.com';

    // iPaymu sends application/x-www-form-urlencoded
    let trxId = '';
    let referenceId = '';
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const b = await req.json().catch(() => ({} as any));
      trxId = String(b.trx_id ?? b.transactionId ?? '');
      referenceId = String(b.reference_id ?? b.referenceId ?? '');
    } else {
      const form = await req.formData();
      trxId = String(form.get('trx_id') ?? '');
      referenceId = String(form.get('reference_id') ?? '');
    }
    if (!trxId) return new Response('Missing trx_id', { status: 400 });

    // ── Re-verify the transaction with iPaymu ────────────────
    const body = { transactionId: Number(trxId) };
    const jsonBody = JSON.stringify(body);
    const requestBody = (await sha256Hex(jsonBody)).toLowerCase();
    const signature = await hmacSha256Hex(API_KEY, `POST:${VA}:${requestBody}:${API_KEY}`);
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    const vResp = await fetch(`${base}/api/v2/transaction`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'va': VA, 'signature': signature, 'timestamp': timestamp,
      },
      body: jsonBody,
    });
    const v = await vResp.json().catch(() => ({} as any));
    const data = v?.Data ?? {};
    const statusCode = Number(data.StatusCode);
    const statusStr = String(data.Status ?? '').toLowerCase();
    const refFromApi = String(data.ReferenceId ?? referenceId);
    const isPaid = statusCode === 1 || statusStr === 'berhasil' || statusStr === 'success';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!refFromApi) return new Response('No reference', { status: 200 });

    const { data: order } = await admin
      .from('premium_orders')
      .select('*')
      .eq('id', refFromApi)
      .single();

    if (!order) {
      console.warn('[ipaymu-callback] order not found', refFromApi);
      return new Response('OK', { status: 200 });
    }
    if (order.status === 'paid') return new Response('OK', { status: 200 }); // idempotent

    if (!isPaid) {
      await admin.from('premium_orders')
        .update({ status: statusStr === 'expired' ? 'expired' : 'failed', ipaymu_trx_id: trxId })
        .eq('id', refFromApi);
      return new Response('OK', { status: 200 });
    }

    // ── Grant premium ────────────────────────────────────────
    // Extend from the later of now / current premium_until.
    const { data: prof } = await admin
      .from('profiles')
      .select('premium_until')
      .eq('id', order.user_id)
      .single();

    const now = Date.now();
    const currentUntil = prof?.premium_until ? new Date(prof.premium_until).getTime() : 0;
    const start = Math.max(now, currentUntil);
    const until = new Date(start + order.months * 30 * 24 * 3600 * 1000).toISOString();

    await admin.from('profiles')
      .update({ is_premium: true, premium_until: until })
      .eq('id', order.user_id);

    await admin.from('premium_orders')
      .update({ status: 'paid', ipaymu_trx_id: trxId, paid_at: new Date().toISOString() })
      .eq('id', refFromApi);

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('[ipaymu-callback] error', e);
    return new Response('Error', { status: 500 });
  }
});
