// services/matchService.ts
// Like, pass, match, dan unmatch logic

import { supabase } from '../lib/supabase';
import type { ProfileCard } from '../types/profile';
import { getBlockedIds } from './blockService';
import { buildEduOrFilter } from '../constants/eduData';

export async function likeUser(toUserId: string): Promise<{
  success: boolean;
  matched: boolean;
  matchedProfile?: ProfileCard;
  error?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, matched: false, error: 'Not authenticated' };

  const { error: likeError } = await supabase
    .from('likes')
    .insert({ from_user_id: user.id, to_user_id: toUserId });

  if (likeError && likeError.code !== '23505') {
    return { success: false, matched: false, error: likeError.message };
  }

  const { data: reverselike } = await supabase
    .from('likes')
    .select('id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', user.id)
    .maybeSingle();

  if (!reverselike) return { success: true, matched: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university, major, birth_date, gender, mbti, zodiac, hobbies, bio')
    .eq('id', toUserId)
    .single();

  const matchedProfile: ProfileCard | undefined = profile
    ? {
        ...profile,
        age: profile.birth_date
          ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
          : null,
      }
    : undefined;

  return { success: true, matched: true, matchedProfile };
}

export async function passUser(toUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('passes').insert({ from_user_id: user.id, to_user_id: toUserId })
    .then(() => {}, () => {});
}

export interface DiscoverFilters {
  gender: 'male' | 'female' | 'all';
  ageMin: number;
  ageMax: number;
  university: string;
  /** Program studi / jurusan (opsional) */
  major: string;
}

export const DEFAULT_FILTERS: DiscoverFilters = {
  gender: 'all',
  ageMin: 17,
  ageMax: 30,
  university: '',
  major: '',
};

export async function getDiscoverProfiles(
  filters: DiscoverFilters = DEFAULT_FILTERS,
): Promise<ProfileCard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: likedData }, { data: passedData }, blockedIds] = await Promise.all([
    supabase.from('likes').select('to_user_id').eq('from_user_id', user.id),
    supabase.from('passes').select('to_user_id').eq('from_user_id', user.id),
    getBlockedIds(),
  ]);

  const excludeIds = [
    user.id,
    ...(likedData ?? []).map((r: any) => r.to_user_id),
    ...(passedData ?? []).map((r: any) => r.to_user_id),
    ...blockedIds,
  ];

  const now = new Date();
  const maxBirth = new Date(now.getFullYear() - filters.ageMin, now.getMonth(), now.getDate());
  const minBirth = new Date(now.getFullYear() - filters.ageMax - 1, now.getMonth(), now.getDate());

  let query = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university, major, birth_date, gender, mbti, zodiac, hobbies, bio')
    .eq('onboarding_completed', true)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .gte('birth_date', minBirth.toISOString().slice(0, 10))
    .lte('birth_date', maxBirth.toISOString().slice(0, 10))
    .limit(30);

  if (filters.gender !== 'all') query = query.eq('gender', filters.gender);
  if (filters.university.trim()) {
    const orFilter = buildEduOrFilter('university', filters.university);
    if (orFilter) query = query.or(orFilter);
  }
  if (filters.major?.trim()) query = query.ilike('major', `%${filters.major.trim()}%`);

  const { data } = await query;
  if (!data) return [];

  return data.map((p: any) => ({
    ...p,
    age: p.birth_date
      ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null,
  }));
}

export interface MatchWithProfile {
  matchedAt: string;
  profile: ProfileCard;
}

export async function getMyMatches(): Promise<MatchWithProfile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: matchRows } = await supabase
    .from('matches_view')
    .select('matched_with_id, matched_at')
    .eq('user_id', user.id);

  if (!matchRows || matchRows.length === 0) return [];

  const otherIds = matchRows.map((r: any) => r.matched_with_id);
  const matchedAtMap: Record<string, string> = {};
  matchRows.forEach((r: any) => { matchedAtMap[r.matched_with_id] = r.matched_at; });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university, major, birth_date, gender, mbti, zodiac, hobbies, bio')
    .in('id', otherIds);

  if (!profiles) return [];

  return profiles.map((p: any) => ({
    matchedAt: matchedAtMap[p.id],
    profile: {
      ...p,
      age: p.birth_date
        ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null,
    },
  }));
}

export async function getLikedYouProfiles(): Promise<{ profile: ProfileCard; likedAt: string }[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: likers } = await supabase
    .from('likes')
    .select('from_user_id, created_at')
    .eq('to_user_id', user.id);

  if (!likers || likers.length === 0) return [];

  const { data: ourLikes } = await supabase
    .from('likes')
    .select('to_user_id')
    .eq('from_user_id', user.id);

  const alreadyLikedBack = new Set((ourLikes ?? []).map((r: any) => r.to_user_id));
  const blockedIds = await getBlockedIds();
  const blockedSet = new Set(blockedIds);

  const pendingLikers = likers.filter(
    (r: any) => !alreadyLikedBack.has(r.from_user_id) && !blockedSet.has(r.from_user_id),
  );

  if (pendingLikers.length === 0) return [];

  const likerIds = pendingLikers.map((r: any) => r.from_user_id);
  const likedAtMap: Record<string, string> = {};
  pendingLikers.forEach((r: any) => { likedAtMap[r.from_user_id] = r.created_at; });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university, major, birth_date, gender, mbti, zodiac, hobbies, bio')
    .in('id', likerIds)
    .eq('onboarding_completed', true);

  if (!profiles) return [];

  return profiles.map((p: any) => ({
    likedAt: likedAtMap[p.id],
    profile: {
      ...p,
      age: p.birth_date
        ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null,
    },
  }));
}

export async function unmatchUser(otherUserId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Delete messages first (before likes, so the match_key can still be computed)
  const match_key = [user.id, otherUserId].sort().join(':');
  await supabase.from('messages').delete().eq('match_key', match_key);

  // Delete both like rows — the DB trigger cleanup_messages_on_unmatch also
  // handles this as a safety net, but client-side deletion is faster.
  await supabase.from('likes').delete()
    .eq('from_user_id', user.id).eq('to_user_id', otherUserId);
  await supabase.from('likes').delete()
    .eq('from_user_id', otherUserId).eq('to_user_id', user.id);

  return {};
}
