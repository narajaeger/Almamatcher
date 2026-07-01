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
