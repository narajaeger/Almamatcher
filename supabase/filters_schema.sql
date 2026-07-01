-- ============================================
-- ALMAMATCHER — Discover Filter Preferences
-- Run in Supabase SQL Editor
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pref_gender     TEXT    CHECK (pref_gender IN ('male','female','all')) DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS pref_age_min    INTEGER DEFAULT 17,
  ADD COLUMN IF NOT EXISTS pref_age_max    INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS pref_university TEXT    DEFAULT NULL;
