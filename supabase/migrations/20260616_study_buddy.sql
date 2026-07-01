-- ============================================================
-- Study Buddy System — AlmaMatcher (v2 — safe idempotent)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Drop existing objects bersih dulu (aman di-rerun)
drop function  if exists public.get_today_study_minutes(uuid) cascade;
drop view      if exists public.study_rooms_with_count cascade;
drop table     if exists public.buddy_requests      cascade;
drop table     if exists public.study_sessions      cascade;
drop table     if exists public.study_room_members  cascade;
drop table     if exists public.study_rooms         cascade;

-- ---- 1. Study Rooms ----
create table public.study_rooms (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  subject      text not null,
  university   text,
  faculty      text,
  mode         text not null default 'discuss' check (mode in ('silent', 'discuss')),
  max_capacity int  not null default 5 check (max_capacity between 2 and 20),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---- 2. Study Room Members ----
create table public.study_room_members (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid not null references public.study_rooms(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

-- ---- 3. Study Sessions ----
create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  room_id          uuid references public.study_rooms(id) on delete set null,
  duration_minutes int not null default 0,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  session_date     date not null default current_date
);

-- ---- 4. Buddy Requests ----
create table public.buddy_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id   uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

-- ---- Indexes ----
create index study_rooms_university_idx      on public.study_rooms(university);
create index study_rooms_active_idx          on public.study_rooms(is_active);
create index study_room_members_room_idx     on public.study_room_members(room_id);
create index study_room_members_user_idx     on public.study_room_members(user_id);
create index study_sessions_user_date_idx    on public.study_sessions(user_id, session_date);
create index buddy_requests_to_user_idx      on public.buddy_requests(to_user_id);
create index buddy_requests_from_user_idx    on public.buddy_requests(from_user_id);

-- ---- RLS ----
alter table public.study_rooms          enable row level security;
alter table public.study_room_members   enable row level security;
alter table public.study_sessions       enable row level security;
alter table public.buddy_requests       enable row level security;

create policy "study_rooms_select" on public.study_rooms for select using (true);
create policy "study_rooms_insert" on public.study_rooms for insert with check (auth.uid() = creator_id);
create policy "study_rooms_update" on public.study_rooms for update using (auth.uid() = creator_id);
create policy "study_rooms_delete" on public.study_rooms for delete using (auth.uid() = creator_id);

create policy "srm_select" on public.study_room_members for select using (true);
create policy "srm_insert" on public.study_room_members for insert with check (auth.uid() = user_id);
create policy "srm_delete" on public.study_room_members for delete using (auth.uid() = user_id);

create policy "ss_select" on public.study_sessions for select using (auth.uid() = user_id);
create policy "ss_insert" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "ss_update" on public.study_sessions for update using (auth.uid() = user_id);

create policy "br_select" on public.buddy_requests
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "br_insert" on public.buddy_requests for insert with check (auth.uid() = from_user_id);
create policy "br_delete" on public.buddy_requests for delete using (auth.uid() = from_user_id);

-- ---- View: room + jumlah member ----
create view public.study_rooms_with_count as
select
  r.id, r.creator_id, r.name, r.subject,
  r.university, r.faculty, r.mode,
  r.max_capacity, r.is_active, r.created_at, r.updated_at,
  coalesce(m.member_count, 0) as member_count
from public.study_rooms r
left join (
  select room_id, count(*)::int as member_count
  from public.study_room_members
  group by room_id
) m on m.room_id = r.id;

-- ---- Function: menit belajar hari ini ----
create function public.get_today_study_minutes(p_user_id uuid)
returns int language sql security definer as $$
  select coalesce(sum(duration_minutes), 0)::int
  from public.study_sessions
  where user_id = p_user_id
    and session_date = current_date;
$$;
