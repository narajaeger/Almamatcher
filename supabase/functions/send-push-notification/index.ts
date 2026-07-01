// supabase/functions/send-push-notification/index.ts
// Triggered by a Supabase Database Webhook on messages INSERT.
// Reads the receiver's push_token from push_tokens table and calls Expo Push API.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface MessagePayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    match_key: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
  };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
  channelId?: string;
}

Deno.serve(async (req) => {
  // SECURITY: WEBHOOK_SECRET is mandatory.
  // Set it in Supabase Dashboard → Edge Functions → send-push-notification → Secrets.
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('[send-push-notification] WEBHOOK_SECRET env var is not set — rejecting all requests');
    return new Response('Service misconfigured', { status: 500 });
  }

  const authorization = req.headers.get('authorization');
  if (authorization !== `Bearer ${webhookSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: MessagePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Only handle INSERT events on messages table
  if (payload.type !== 'INSERT' || payload.table !== 'messages') {
    return new Response('Ignored', { status: 200 });
  }

  const { sender_id, receiver_id, match_key } = payload.record;
  // Note: we intentionally do NOT use `content` in the notification body —
  // message content must never appear on the lock screen or notification history.

  // Init Supabase admin client (service_role bypasses RLS — only use server-side)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Get receiver's push token (now in separate push_tokens table) and sender's display name
  const [tokenRes, senderRes] = await Promise.all([
    supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', receiver_id)
      .single(),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sender_id)
      .single(),
  ]);

  const pushToken: string | null = tokenRes.data?.token ?? null;
  const senderName: string = senderRes.data?.full_name ?? 'Seseorang';

  if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
    return new Response(JSON.stringify({ sent: false, reason: 'no_token' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PRIVACY: body is generic — never include message content.
  // The app fetches the actual message after the user opens it.
  const message: ExpoPushMessage = {
    to: pushToken,
    title: senderName,
    body: 'Kamu punya pesan baru 💬',
    sound: 'default',
    data: {
      matchId: sender_id,
      name: senderName,
      matchKey: match_key,
    },
    channelId: 'default',
  };

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();
  console.log('[send-push-notification] result:', JSON.stringify(result));

  return new Response(JSON.stringify({ sent: true, result }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
