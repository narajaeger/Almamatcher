// services/buddyService.ts
// Buddy Finder — cari study partner by jurusan/universitas

import { supabase } from '../lib/supabase';
import type { ProfileCard } from '../types/profile';
import { buildEduOrFilter } from '../constants/eduData';

export interface BuddyFilters {
  university: string;
  major: string;
  faculty: string;
}

export const DEFAULT_BUDDY_FILTERS: BuddyFilters = {
  university: '',
  major: '',
  faculty: '',
};

export async function getBuddyProfiles(
  filters: BuddyFilters = DEFAULT_BUDDY_FILTERS,
): Promise<ProfileCard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university, major, birth_date, gender, mbti, zodiac, hobbies, bio')
    .eq('onboarding_completed', true)
    .neq('id', user.id)
    .limit(40);

  if (filters.university.trim()) {
    const orFilter = buildEduOrFilter('university', filters.university);
    if (orFilter) query = query.or(orFilter);
  }
  if (filters.major.trim()) {
    query = query.ilike('major', `%${filters.major.trim()}%`);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((p: any) => ({
    ...p,
    age: p.birth_date
      ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null,
  }));
}

export async function sendBuddyRequest(toUserId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('buddy_requests')
    .insert({ from_user_id: user.id, to_user_id: toUserId });

  if (error && error.code !== '23505') return { error: error.message };
  return {};
}

export async function cancelBuddyRequest(toUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('buddy_requests')
    .delete()
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId);
}

export async function getBuddyRequestStatus(
  toUserId: string,
): Promise<'none' | 'sent' | 'received' | 'mutual'> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'none';

  const [{ data: sent }, { data: received }] = await Promise.all([
    supabase.from('buddy_requests').select('id')
      .eq('from_user_id', user.id).eq('to_user_id', toUserId).maybeSingle(),
    supabase.from('buddy_requests').select('id')
      .eq('from_user_id', toUserId).eq('to_user_id', user.id).maybeSingle(),
  ]);

  if (sent && received) return 'mutual';
  if (sent) return 'sent';
  if (received) return 'received';
  return 'none';
}

/**
 * Terima permintaan study buddy dari `fromUserId`.
 * Implementasi: buat permintaan balik (dari saya → dia) sehingga statusnya
 * menjadi 'mutual'. Idempotent terhadap duplikat (kode 23505 diabaikan).
 */
export async function acceptBuddyRequest(fromUserId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('buddy_requests')
    .insert({ from_user_id: user.id, to_user_id: fromUserId });

  if (error && error.code !== '23505') return { error: error.message };
  return {};
}

/**
 * Tolak permintaan study buddy yang masuk dari `fromUserId`.
 * Menghapus baris (to_user_id = saya). Membutuhkan policy RLS
 * "br_delete_recipient" (lihat migration 20260623_buddy_requests_reject.sql).
 */
export async function rejectBuddyRequest(fromUserId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('buddy_requests')
    .delete()
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function getMyBuddyRequests(): Promise<{
  incoming: ProfileCard[];
  outgoing: string[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { incoming: [], outgoing: [] };

  const [{ data: incomingRows }, { data: outgoingRows }] = await Promise.all([
    supabase.from('buddy_requests').select('from_user_id').eq('to_user_id', user.id),
    supabase.from('buddy_requests').select('to_user_id').eq('from_user_id', user.id),
  ]);

  const outgoingIds = (outgoingRows ?? []).map((r: any) => r.to_user_id as string);
  const outgoingSet = new Set(outgoingIds);

  // Exclude requests that are already mutual (i.e. we've accepted them —
  // acceptBuddyRequest inserts a reciprocal row instead of deleting the
  // original one, so without this filter an accepted request would keep
  // reappearing in the "incoming" inbox forever).
  const incomingIds = (incomingRows ?? [])
    .map((r: any) => r.from_user_id as string)
    .filter((id: string) => !outgoingSet.has(id));

  let incoming: ProfileCard[] = [];
  if (incomingIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, university, major, birth_date, gender, mbti, zodiac, hobbies, bio')
      .in('id', incomingIds);

    incoming = (profiles ?? []).map((p: any) => ({
      ...p,
      age: p.birth_date
        ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null,
    }));
  }

  return { incoming, outgoing: outgoingIds };
}
