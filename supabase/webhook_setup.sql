-- ============================================
-- ALMAMATCHER — Database Webhook Setup
-- Triggers send-push-notification Edge Function
-- on every new message INSERT.
--
-- Prerequisites:
--   1. Deploy the Edge Function:
--      supabase functions deploy send-push-notification
--
--   2. Set env vars in Supabase Dashboard → Edge Functions → send-push-notification:
--      SUPABASE_URL          (auto-set)
--      SUPABASE_SERVICE_ROLE_KEY (auto-set)
--      WEBHOOK_SECRET        your-secret-here (optional but recommended)
--
--   3. Run this SQL in the Supabase SQL Editor.
--      Replace YOUR_PROJECT_REF with: ekczgiofqbroyufrgizr
--      Replace YOUR_WEBHOOK_SECRET with the same value you set above.
-- ============================================

-- Enable the pg_net extension (needed for HTTP calls from SQL triggers)
-- This should already be enabled in new Supabase projects.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Webhook via Supabase Database Webhooks
-- Go to: Dashboard → Database → Webhooks → Create a new hook
-- Fill in:
--   Name:         send_push_on_message
--   Table:        messages
--   Events:       INSERT
--   Method:       POST
--   URL:          https://ekczgiofqbroyufrgizr.supabase.co/functions/v1/send-push-notification
--   HTTP Headers:
--     Content-Type: application/json
--     Authorization: Bearer YOUR_WEBHOOK_SECRET
-- ============================================

-- Alternatively, use supabase_functions.http_request directly via trigger:

CREATE OR REPLACE FUNCTION public.notify_push_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _url  TEXT := 'https://ekczgiofqbroyufrgizr.supabase.co/functions/v1/send-push-notification';
  _body JSONB;
BEGIN
  _body := jsonb_build_object(
    'type',  'INSERT',
    'table', 'messages',
    'record', jsonb_build_object(
      'id',          NEW.id,
      'match_key',   NEW.match_key,
      'sender_id',   NEW.sender_id,
      'receiver_id', NEW.receiver_id,
      'content',     NEW.content,
      'created_at',  NEW.created_at
    )
  );

  PERFORM net.http_post(
    url     := _url,
    body    := _body::TEXT,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.webhook_secret', true)
    )
  );

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS on_message_insert_push ON public.messages;
CREATE TRIGGER on_message_insert_push
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_message();

-- Set the webhook secret (replace with your actual secret)
-- ALTER DATABASE postgres SET app.webhook_secret = 'your-secret-here';
