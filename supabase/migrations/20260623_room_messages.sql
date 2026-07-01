-- ============================================================
-- Room Group Chat — AlmaMatcher
-- Shared realtime chatbox inside Study Rooms.
-- Jalankan di Supabase SQL Editor (aman di-rerun).
-- ============================================================

-- Bersih dulu agar idempotent
drop table if exists public.room_messages cascade;

-- ---- Table ----
create table public.room_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.study_rooms(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id)    on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---- Indexes ----
create index room_messages_room_idx        on public.room_messages(room_id, created_at);
create index room_messages_sender_idx      on public.room_messages(sender_id);

-- ---- RLS ----
alter table public.room_messages enable row level security;

-- Helper: apakah auth user adalah anggota room ini?
-- (dipakai di policy select & insert)

-- Anggota room boleh membaca pesan room tersebut
create policy "room_messages_select" on public.room_messages
  for select using (
    exists (
      select 1 from public.study_room_members m
      where m.room_id = room_messages.room_id
        and m.user_id = auth.uid()
    )
  );

-- Anggota room boleh mengirim pesan atas namanya sendiri
create policy "room_messages_insert" on public.room_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.study_room_members m
      where m.room_id = room_messages.room_id
        and m.user_id = auth.uid()
    )
  );

-- Pengirim boleh menghapus pesannya sendiri
create policy "room_messages_delete" on public.room_messages
  for delete using (sender_id = auth.uid());

-- ---- Realtime ----
-- Tambahkan ke publikasi realtime (abaikan error kalau sudah ada)
do $$
begin
  begin
    alter publication supabase_realtime add table public.room_messages;
  exception
    when duplicate_object then null;
    when others then null;
  end;
end $$;
