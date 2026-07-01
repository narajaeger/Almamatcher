-- ============================================================
-- ALMAMATCHER — Privacy Fixes Migration
-- Run in Supabase SQL Editor after 20260628_security_fixes.sql
-- ============================================================

-- ============================================================
-- FIX 1: Record user consent (UU PDP compliance).
-- Stores when and which version of the privacy policy the
-- user agreed to at registration.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

-- ============================================================
-- FIX 2: Auto-delete messages when users unmatch.
-- Fires after BOTH like rows are deleted (unmatch).
-- Cleans up all messages between the two users.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_messages_on_unmatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_key TEXT;
BEGIN
  -- Build the same deterministic match_key used by chatService
  v_match_key := (
    SELECT string_agg(id_part, ':' ORDER BY id_part)
    FROM unnest(ARRAY[OLD.from_user_id::text, OLD.to_user_id::text]) AS id_part
  );

  -- Only delete messages if the reverse like no longer exists (real unmatch)
  IF NOT EXISTS (
    SELECT 1 FROM public.likes
    WHERE from_user_id = OLD.to_user_id
      AND to_user_id   = OLD.from_user_id
  ) THEN
    DELETE FROM public.messages WHERE match_key = v_match_key;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_like_delete_cleanup_messages ON public.likes;
CREATE TRIGGER on_like_delete_cleanup_messages
  AFTER DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_messages_on_unmatch();

-- ============================================================
-- FIX 3: Storage — no change needed.
-- Bucket tetap public agar avatar_url bisa langsung dipakai
-- di seluruh komponen app tanpa refactor.
-- Upload/update/delete sudah dibatasi ke folder milik user sendiri
-- lewat policy yang ada di schema.sql.
-- ============================================================
