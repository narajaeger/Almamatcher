import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Validasi email .ac.id
export const isValidStudentEmail = (email: string): boolean => {
  const trimmed = email.trim().toLowerCase();
  return trimmed.endsWith('.ac.id');
};

// Where Supabase should send the user after they click an email link.
//  • Web   → back to the deployed site origin (a real URL the browser can open),
//            so we avoid the "this site can't be reached" custom-scheme error.
//  • Native → the app deep link.
export const getAuthRedirect = (nativeUrl: string): string | undefined => {
  if (Platform.OS === 'web') {
    return (typeof window !== 'undefined' && window.location?.origin)
      ? window.location.origin
      : undefined;
  }
  return nativeUrl;
};

// Map raw Supabase/network errors to friendly Indonesian messages.
// Works the same on web & native (we render these inline, not via Alert).
export const friendlyAuthError = (raw?: string): string => {
  const m = (raw || '').toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Email atau password salah — atau kamu belum punya akun. Yuk daftar dulu.';
  if (m.includes('email not confirmed') || m.includes('not confirmed'))
    return 'Email kamu belum diverifikasi. Cek inbox (atau folder spam) untuk link verifikasi.';
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already'))
    return 'Email ini sudah terdaftar. Coba masuk saja, atau gunakan "Lupa password".';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('seconds'))
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to'))
    return 'Koneksi bermasalah. Periksa internet kamu lalu coba lagi.';
  if (m.includes('.ac.id') || m.includes('kampus'))
    return 'Wajib pakai email kampus berakhiran .ac.id untuk mendaftar.';
  return raw || 'Terjadi kesalahan. Coba lagi.';
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  consent?: { consentAt: string; consentVersion: string },
) => {
  if (!isValidStudentEmail(email)) {
    throw new Error('Gunakan email kampus (.ac.id) untuk mendaftar.');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: getAuthRedirect('almamatcher://verify'),
      },
    });

    if (error) throw error;

    // Record privacy policy consent (UU PDP compliance).
    // The profile row is created by the handle_new_user trigger; we update it here
    // to stamp consent_at and consent_version immediately after signup.
    if (data.user && consent) {
      await supabase
        .from('profiles')
        .update({
          consent_at: consent.consentAt,
          consent_version: consent.consentVersion,
        })
        .eq('id', data.user.id);
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Gagal mendaftar. Coba lagi.');
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!isValidStudentEmail(email)) {
    throw new Error('Gunakan email kampus (.ac.id).');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Email atau password salah.');
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  } catch (error: any) {
    throw new Error(error.message || 'Gagal mengirim ulang email.');
  }
};