// supabase/functions/ipaymu-create-payment/index.ts
// Creates an iPaymu "Payment Redirect" session for an AlmaMatcher Premium plan.
//
// SECURITY: the iPaymu API key + VA live ONLY here (Edge Function secrets).
// The plan price is decided server-side — never trusted from the client.
//
// Secrets to set (Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
//   IPAYMU_VA, IPAYMU_API_KEY, IPAYMU_MODE (production|sandbox), APP_URL
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Authoritative plan catalogue (IDR). Keep in sync with the app's PLANS.
const PLANS: Record<string, { months: number; amount: number; label: string }> = {
  monthly:   { months: 1,  amount: 24000,  label: 'AlmaMatcher Premium 1 Bulan' },
  quarterly: { months: 3,  amount: 64000,  label: 'AlmaMatcher Premium 3 Bulan' },
  yearly:    { months: 12, amount: 199000, label: 'AlmaMatcher Premium 12 Bulan' },
};

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const VA = Deno.env.get('IPAYMU_VA');
    const API_KEY = Deno.env.get('IPAYMU_API_KEY');
    const MODE = (Deno.env.get('IPAYMU_MODE') ?? 'production').toLowerCase();
    const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');
    if (!VA || !API_KEY) {
      return json({ error: 'Payment not configured' }, 500);
    }
    const base = MODE === 'sandbox' ? 'https://sandbox.ipaymu.com' : 'https://my.ipaymu.com';

    // ── Authenticate the caller ──────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { plan } = await req.json().catch(() => ({}));
    const planDef = PLANS[plan as string];
    if (!planDef) return json({ error: 'Invalid plan' }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const referenceId = `prem_${user.id.slice(0, 8)}_${Date.now()}`;

    await admin.from('premium_orders').insert({
      id: referenceId,
      user_id: user.id,
      plan,
      months: planDef.months,
      amount: planDef.amount,
      status: 'pending',
    });

    // ── Build iPaymu payment request ─────────────────────────
    const notifyUrl = `${supabaseUrl}/functions/v1/ipaymu-callback`;
    const body = {
      product: [planDef.label],
      qty: ['1'],
      price: [String(planDef.amount)],
      description: ['Langganan AlmaMatcher Premium'],
      returnUrl: `${APP_URL}/premium?status=success`,
      cancelUrl: `${APP_URL}/premium?status=cancel`,
      notifyUrl,
      referenceId,
      buyerName: user.email?.split('@')[0] ?? 'Mahasiswa',
      buyerEmail: user.email ?? '',
    };

    const jsonBody = JSON.stringify(body);
    const requestBody = (await sha256Hex(jsonBody)).toLowerCase();
    const stringToSign = `POST:${VA}:${requestBody}:${API_KEY}`;
    const signature = await hmacSha256Hex(API_KEY, stringToSign);
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    const resp = await fetch(`${base}/api/v2/payment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'va': VA,
        'signature': signature,
        'timestamp': timestamp,
      },
      body: jsonBody,
    });
    const result = await resp.json().catch(() => ({}));

    const url = result?.Data?.Url;
    const sessionId = result?.Data?.SessionID;
    if (!url) {
      console.error('[ipaymu-create-payment] no url', JSON.stringify(result));
      await admin.from('premium_orders').update({ status: 'failed' }).eq('id', referenceId);
      return json({ error: 'Gagal membuat sesi pembayaran', detail: result?.Message ?? null }, 502);
    }

    await admin.from('premium_orders').update({ session_id: sessionId }).eq('id', referenceId);

    return json({ url, referenceId });
  } catch (e) {
    console.error('[ipaymu-create-payment] error', e);
    return json({ error: 'Internal error' }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
