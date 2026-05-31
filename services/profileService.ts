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

/** Ambil profil by ID (untuk lihat profil orang lain) */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

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
 * Upload avatar ke Supabase Storage
 * Mengembalikan public URL
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
      upsert: true,       // Timpa jika sudah ada
    });

  if (error) {
    console.error('[uploadAvatar]', error.message);
    return { url: null, error: error.message };
  }

  // Ambil public URL
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
