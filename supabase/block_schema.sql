-- ============================================
-- ALMAMATCHER — Block & Report Schema
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. BLOCKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.blocks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks (blocked_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Only the blocker can read/insert/delete their own blocks
CREATE POLICY "blocks_select" ON public.blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert" ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete" ON public.blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- ============================================
-- 2. REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason       TEXT        NOT NULL CHECK (reason IN (
    'spam', 'fake_profile', 'inappropriate', 'harassment', 'other'
  )),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporter can insert; only admin can read
CREATE POLICY "reports_insert" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
