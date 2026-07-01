// services/profileService.ts
// Semua operasi DB untuk modul Profile

import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate, ProfilePhoto } from '../types/profile';

// ============================================
// GET PROFILE
// ============================================

/** Ambil profil milik user yang sedang login */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[getMyProfile]', error.message);
    return null;
  }
  return data as Profile;
}

// Safe public fields — explicitly excludes push_token, is_premium, premium_until, email
// Base set is always present; social columns are appended only if the migration ran.
const PUBLIC_PROFILE_FIELDS_BASE =
  'id, full_name, username, avatar_url, bio, university, faculty, major, year_entry, ' +
  'birth_date, gender, height_cm, weight_kg, city_origin, mbti, zodiac, religion, ' +
  'hobbies, looking_for, onboarding_completed, created_at';
const SOCIAL_FIELDS = 'instagram, spotify, linkedin';
export const PUBLIC_PROFILE_FIELDS = `${PUBLIC_PROFILE_FIELDS_BASE}, ${SOCIAL_FIELDS}`;

// True when a Postgres/PostgREST error means an unknown column (social-links
// migration not applied yet). We retry without those columns so the app keeps working.
function isMissingColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === '42703' || err.code === 'PGRST204' ||
    /column .* does not exist|could not find the .*(instagram|spotify|linkedin)/i.test(err.message ?? '');
}

/** Ambil profil by ID (untuk lihat profil orang lain) */
export async function getProfileById(userId: string): Promise<Profile | null> {
  let { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_FIELDS)
    .eq('id', userId)
    .single();

  if (error && isMissingColumn(error)) {
    ({ data, error } = await supabase
      .from('profiles')
      .select(PUBLIC_PROFILE_FIELDS_BASE)
      .eq('id', userId)
      .single());
  }

  if (error) {
    console.error('[getProfileById]', error.message);
    return null;
  }
  return data as Profile;
}

// ============================================
// UPDATE PROFILE
// ============================================

/**
 * Update fields profil
 * Otomatis set updated_at via DB trigger
 */
export async function updateProfile(updates: ProfileUpdate): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  // If the social-links migration hasn't been applied yet, retry without those
  // columns so the rest of the profile (name, university, hobbies, …) still saves.
  if (error && isMissingColumn(error)) {
    const { instagram, spotify, linkedin, ...rest } = updates as Record<string, unknown>;
    const { error: retryErr } = await supabase
      .from('profiles')
      .update(rest)
      .eq('id', user.id);
    if (retryErr) {
      console.error('[updateProfile]', retryErr.message);
      return { success: false, error: retryErr.message };
    }
    return { success: true };
  }

  if (error) {
    console.error('[updateProfile]', error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Update step onboarding sekaligus tandai progress
 */
export async function updateOnboardingStep(
  step: number,
  data: ProfileUpdate,
  isCompleted = false
): Promise<{ success: boolean; error?: string }> {
  return updateProfile({
    ...data,
    onboarding_step: step,
    onboarding_completed: isCompleted,
  });
}

// ============================================
// USERNAME
// ============================================

/** Cek apakah username sudah dipakai orang lain */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .neq('id', user?.id ?? '')   // exclude diri sendiri
    .maybeSingle();

  if (error) return false;
  return data === null; // null = tidak ada yang pakai = available
}

// ============================================
// AVATAR / FOTO
// ============================================

/**
 * Upload avatar ke Supabase Storage.
 * Bucket tetap public agar avatar_url bisa langsung dipakai di <Image />.
 * Akses API sudah dibatasi authenticated-only lewat storage RLS policy.
 * Untuk fully-private bucket, perlu refactor semua komponen untuk pakai signed URL.
 */
export async function uploadAvatar(
  userId: string,
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<{ url: string | null; error?: string }> {
  // Convert URI ke Blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const fileName = `${userId}/avatar_${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('[uploadAvatar]', error.message);
    return { url: null, error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return { url: publicUrl };
}

/**
 * Upload dan langsung update avatar_url di profil
 */
export async function uploadAndSetAvatar(
  userId: string,
  uri: string
): Promise<{ url: string | null; error?: string }> {
  const { url, error } = await uploadAvatar(userId, uri);
  if (!url) return { url: null, error };

  const result = await updateProfile({ avatar_url: url });
  if (!result.success) return { url: null, error: result.error };

  return { url };
}

/**
 * Hapus avatar lama dari storage (opsional, untuk cleanup)
 */
export async function deleteOldAvatar(avatarUrl: string): Promise<void> {
  // Extract path dari URL
  const urlParts = avatarUrl.split('/avatars/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];
  await supabase.storage.from('avatars').remove([filePath]);
}

// ============================================
// PROFILE PHOTOS (multi-foto)
// ============================================

export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) return [];
  return data as ProfilePhoto[];
}

export async function addProfilePhoto(
  userId: string,
  url: string,
  position: number
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('profile_photos')
    .insert({ user_id: userId, url, position });

  return { success: !error };
}

export async function deleteProfilePhoto(photoId: string): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', photoId);

  return { success: !error };
}
