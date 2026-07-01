-- ============================================
-- ALMAMATCHER — Likes & Matches Schema
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Drop dependents first (order matters)
DROP VIEW  IF EXISTS public.matches_view;
DROP TABLE IF EXISTS public.passes CASCADE;
DROP TABLE IF EXISTS public.likes  CASCADE;

-- ============================================
-- 1. LIKES TABLE
-- ============================================

CREATE TABLE public.likes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ============================================
-- 2. PASSES TABLE
-- ============================================

CREATE TABLE public.passes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_likes_from  ON public.likes  (from_user_id);
CREATE INDEX idx_likes_to    ON public.likes  (to_user_id);
CREATE INDEX idx_passes_from ON public.passes (from_user_id);

-- ============================================
-- 4. MATCHES VIEW
-- Each mutual match appears once per user.
-- Query: SELECT * FROM matches_view WHERE user_id = auth.uid()
-- ============================================

CREATE VIEW public.matches_view AS
SELECT
  l1.from_user_id                           AS user_id,
  l1.to_user_id                             AS matched_with_id,
  GREATEST(l1.created_at, l2.created_at)   AS matched_at
FROM public.likes AS l1
INNER JOIN public.likes AS l2
  ON  l1.from_user_id = l2.to_user_id
  AND l1.to_user_id   = l2.from_user_id;

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select"
  ON public.likes FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "likes_insert"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "likes_delete"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = from_user_id);

CREATE POLICY "passes_select"
  ON public.passes FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id);

CREATE POLICY "passes_insert"
  ON public.passes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);
