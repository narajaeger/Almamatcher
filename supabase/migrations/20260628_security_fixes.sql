-- ============================================================
-- ALMAMATCHER — Security Fixes Migration
-- Run this in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ============================================================
-- FIX 1: matches_view — add security_invoker so RLS on
-- the underlying `likes` table is enforced for the caller.
-- Without this any authenticated user can dump all matches.
-- ============================================================

DROP VIEW IF EXISTS public.matches_view;

CREATE VIEW public.matches_view
  WITH (security_invoker = true)
AS
SELECT
  l1.from_user_id                           AS user_id,
  l1.to_user_id                             AS matched_with_id,
  GREATEST(l1.created_at, l2.created_at)   AS matched_at
FROM public.likes AS l1
INNER JOIN public.likes AS l2
  ON  l1.from_user_id = l2.to_user_id
  AND l1.to_user_id   = l2.from_user_id;

-- ============================================================
-- FIX 2: Prevent users from self-granting premium status.
-- Any attempt to change is_premium / premium_until through
-- the normal authenticated role is silently reverted.
-- Only the service_role (admin / backend) may change these.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_premium_self_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role is exempt — it can set premium legitimately
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Revert any attempt to change premium fields
  NEW.is_premium    := OLD.is_premium;
  NEW.premium_until := OLD.premium_until;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_premium_fields ON public.profiles;
CREATE TRIGGER guard_premium_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_premium_self_grant();

-- ============================================================
-- FIX 3: Enforce that a mutual match exists before a message
-- can be inserted. Prevents any user from cold-messaging
-- anyone by directly calling the Supabase API.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_match_before_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.likes l1
    JOIN public.likes l2
      ON  l1.from_user_id = l2.to_user_id
      AND l1.to_user_id   = l2.from_user_id
    WHERE l1.from_user_id = NEW.sender_id
      AND l1.to_user_id   = NEW.receiver_id
  ) THEN
    RAISE EXCEPTION 'Cannot send message: users are not matched';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_match_before_message ON public.messages;
CREATE TRIGGER enforce_match_before_message
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_match_before_message();

-- ============================================================
-- FIX 4: Enforce daily post limit server-side.
-- Previously only checked on the client — bypassable via
-- direct API calls. Non-premium users are capped at 5/day.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_daily_post_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium  BOOLEAN;
  v_post_count  INT;
BEGIN
  SELECT is_premium INTO v_is_premium
  FROM public.profiles
  WHERE id = NEW.author_id;

  IF NOT COALESCE(v_is_premium, false) THEN
    SELECT COUNT(*) INTO v_post_count
    FROM public.community_posts
    WHERE author_id = NEW.author_id
      AND created_at >= date_trunc('day', NOW());

    IF v_post_count >= 5 THEN
      RAISE EXCEPTION 'Daily post limit reached: upgrade to premium for unlimited posts';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_post_limit ON public.community_posts;
CREATE TRIGGER enforce_post_limit
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_post_limit();

-- ============================================================
-- FIX 5: Move push_token out of the public profiles table
-- into a separate table only the owner can read.
-- Step 1: create the table and migrate existing data.
-- Step 2: drop the column from profiles.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id    UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_select" ON public.push_tokens;
DROP POLICY IF EXISTS "push_tokens_upsert" ON public.push_tokens;

-- Only the owner can read or write their own token
CREATE POLICY "push_tokens_select" ON public.push_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_upsert" ON public.push_tokens
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Migrate any existing tokens from profiles (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'push_token'
  ) THEN
    INSERT INTO public.push_tokens (user_id, token)
    SELECT id, push_token
    FROM public.profiles
    WHERE push_token IS NOT NULL
      AND push_token <> ''
    ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token;

    ALTER TABLE public.profiles DROP COLUMN IF EXISTS push_token;
  END IF;
END $$;
