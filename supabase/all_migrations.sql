-- ============================================
-- ALMAMATCHER — Full Database Setup
-- Run this once in Supabase SQL Editor to
-- create all tables, views, RLS policies,
-- triggers, storage policies, and columns.
--
-- Project: ekczgiofqbroyufrgizr
-- Safe to re-run (idempotent where possible)
-- ============================================

-- ============================================
-- ALMAMATCHER — Supabase Schema
-- Paste ini ke Supabase SQL Editor, lalu klik Run
-- Aman untuk dijalankan ulang (idempotent)
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  username      TEXT UNIQUE,
  avatar_url    TEXT,
  bio           TEXT,

  -- Akademik
  university    TEXT,
  faculty       TEXT,
  major         TEXT,
  year_entry    SMALLINT,

  -- Data diri
  birth_date    DATE,
  gender        TEXT CHECK (gender IN ('male', 'female')),
  height_cm     SMALLINT,
  weight_kg     SMALLINT,
  city_origin   TEXT,

  -- Kepribadian & preferensi
  mbti          TEXT CHECK (mbti IN (
                  'INTJ','INTP','ENTJ','ENTP',
                  'INFJ','INFP','ENFJ','ENFP',
                  'ISTJ','ISFJ','ESTJ','ESFJ',
                  'ISTP','ISFP','ESTP','ESFP'
                )),
  zodiac        TEXT CHECK (zodiac IN (
                  'Aries','Taurus','Gemini','Cancer',
                  'Leo','Virgo','Libra','Scorpio',
                  'Sagittarius','Capricorn','Aquarius','Pisces'
                )),
  religion      TEXT CHECK (religion IN (
                  'Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya'
                )),
  hobbies       TEXT[],
  looking_for   TEXT CHECK (looking_for IN ('relationship','friendship','study_buddy','all')),

  -- Onboarding
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  onboarding_step       SMALLINT DEFAULT 0,

  -- Premium
  is_premium    BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profile_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  position    SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username     ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_gender        ON public.profiles (gender);
CREATE INDEX IF NOT EXISTS idx_profiles_university    ON public.profiles (university);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user    ON public.profile_photos (user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before re-creating (idempotent)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Photos are viewable by authenticated users"   ON public.profile_photos;
DROP POLICY IF EXISTS "Users can manage their own photos"            ON public.profile_photos;

-- Profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Profile photos
CREATE POLICY "Photos are viewable by authenticated users"
  ON public.profile_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own photos"
  ON public.profile_photos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TRIGGER: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop then recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. TRIGGER: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 6. STORAGE — avatars bucket
-- Run these AFTER creating the bucket in the
-- Supabase dashboard (Storage → New bucket → "avatars", Public ON)
-- ============================================

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"     ON storage.objects;

-- Public read
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated upload into own folder (userId/filename)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- SECTION: Likes, Passes, Matches View
-- ============================================
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

-- ============================================
-- SECTION: Messages
-- ============================================
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

-- ============================================
-- SECTION: Discover Filter Preferences
-- ============================================
-- ============================================
-- ALMAMATCHER — Discover Filter Preferences
-- Run in Supabase SQL Editor
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pref_gender     TEXT    CHECK (pref_gender IN ('male','female','all')) DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS pref_age_min    INTEGER DEFAULT 17,
  ADD COLUMN IF NOT EXISTS pref_age_max    INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS pref_university TEXT    DEFAULT NULL;

-- ============================================
-- SECTION: Block & Report
-- ============================================
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

-- ============================================
-- SECTION: Push Notification Token
-- ============================================
-- Add push_token column to profiles for Expo push notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT DEFAULT NULL;
