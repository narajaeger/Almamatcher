-- 20260629_social_links.sql
-- Optional social links shown on a user's profile.
-- Values may be a full URL or just a handle/username — the app normalizes both.

alter table public.profiles
  add column if not exists instagram text,
  add column if not exists spotify   text,
  add column if not exists linkedin  text;
