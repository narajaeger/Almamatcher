-- ============================================
-- ALMAMATCHER — Supabase Schema (Fase 2)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE profiles (
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
  year_entry    SMALLINT,               -- Tahun masuk, misal 2021

  -- Data diri
  birth_date    DATE,
  gender        TEXT CHECK (gender IN ('male', 'female')),
  height_cm     SMALLINT,
  weight_kg     SMALLINT,
  city_origin   TEXT,

  -- Preferensi & kepribadian
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
  hobbies       TEXT[],                 -- Array: ['musik', 'hiking', ...]
  looking_for   TEXT CHECK (looking_for IN ('relationship', 'friendship', 'study_buddy', 'all')),

  -- Onboarding status
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  onboarding_step       SMALLINT DEFAULT 0,

  -- Premium
  is_premium    BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: profile_photos (multi-foto)
-- ============================================
CREATE TABLE profile_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  position    SMALLINT DEFAULT 0,      -- Urutan foto (0 = utama)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

-- Profiles: user bisa baca profil publik, hanya edit milik sendiri
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Profile photos
CREATE POLICY "Photos are viewable by authenticated users"
  ON profile_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own photos"
  ON profile_photos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKET: avatars
-- Jalankan di Storage > New Bucket
-- ============================================
-- Bucket name: avatars
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
