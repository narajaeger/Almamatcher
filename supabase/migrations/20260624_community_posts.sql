-- ============================================================
-- Community Posts — AlmaMatcher
-- Feed ala Twitter di tab Belajar. Non-premium dibatasi 5 post/hari
-- (dicek di service; tersedia juga fungsi penghitung di sini).
-- Jalankan di Supabase SQL Editor (aman di-rerun).
-- ============================================================

drop view  if exists public.community_posts_with_counts cascade;
drop table if exists public.post_likes        cascade;
drop table if exists public.community_posts    cascade;

-- ---- Posts ----
create table public.community_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ---- Likes ----
create table public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ---- Indexes ----
create index community_posts_created_idx on public.community_posts(created_at desc);
create index community_posts_author_date_idx on public.community_posts(author_id, created_at);
create index post_likes_post_idx on public.post_likes(post_id);
create index post_likes_user_idx on public.post_likes(user_id);

-- ---- RLS ----
alter table public.community_posts enable row level security;
alter table public.post_likes      enable row level security;

create policy "cp_select" on public.community_posts for select using (true);
create policy "cp_insert" on public.community_posts for insert with check (auth.uid() = author_id);
create policy "cp_delete" on public.community_posts for delete using (auth.uid() = author_id);

create policy "pl_select" on public.post_likes for select using (true);
create policy "pl_insert" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "pl_delete" on public.post_likes for delete using (auth.uid() = user_id);

-- ---- View: post + jumlah like ----
create view public.community_posts_with_counts as
select
  p.id, p.author_id, p.content, p.created_at,
  coalesce(l.like_count, 0) as like_count
from public.community_posts p
left join (
  select post_id, count(*)::int as like_count
  from public.post_likes
  group by post_id
) l on l.post_id = p.id;

-- ---- Function: jumlah post user hari ini (untuk limit harian) ----
create or replace function public.get_today_post_count(p_user_id uuid)
returns int language sql security definer as $$
  select count(*)::int
  from public.community_posts
  where author_id = p_user_id
    and created_at >= date_trunc('day', now());
$$;

-- ---- Realtime ----
do $$
begin
  begin
    alter publication supabase_realtime add table public.community_posts;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.post_likes;
  exception when others then null;
  end;
end $$;
