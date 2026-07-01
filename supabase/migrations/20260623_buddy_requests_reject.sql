-- ============================================================
-- Buddy Requests — izinkan penerima MENOLAK permintaan
-- (RLS awal hanya mengizinkan pengirim menghapus barisnya).
-- Jalankan di Supabase SQL Editor (aman di-rerun).
-- ============================================================

-- Penerima boleh menghapus (menolak) permintaan yang ditujukan padanya
drop policy if exists "br_delete_recipient" on public.buddy_requests;
create policy "br_delete_recipient" on public.buddy_requests
  for delete using (auth.uid() = to_user_id);
