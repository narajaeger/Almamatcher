-- Add push_token column to profiles for Expo push notifications
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT DEFAULT NULL;
