-- ============================================
-- ALMAMATCHER — Messages Schema
-- Jalankan di Supabase SQL Editor setelah likes_schema.sql
-- ============================================

-- Drop dependents first
DROP VIEW  IF EXISTS public.conversations_view;
DROP TABLE IF EXISTS public.messages CASCADE;

-- ============================================
-- 1. MESSAGES TABLE
-- ============================================

CREATE TABLE public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key    TEXT        NOT NULL,   -- deterministic: smaller_uuid:larger_uuid
  sender_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (char_length(content) <= 2000),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast conversation fetch
CREATE INDEX idx_messages_match_key   ON public.messages (match_key, created_at DESC);
CREATE INDEX idx_messages_sender      ON public.messages (sender_id);
CREATE INDEX idx_messages_receiver    ON public.messages (receiver_id);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only sender and receiver can read their messages
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Only sender can insert
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Receiver can mark as read (update read_at only)
CREATE POLICY "messages_update"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================
-- 3. REALTIME
-- Enable realtime on messages table so clients
-- receive new messages instantly via subscriptions.
-- ============================================

-- This adds the messages table to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
