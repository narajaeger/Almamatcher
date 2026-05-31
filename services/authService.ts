import { supabase } from '../lib/supabase';

// Validasi email .ac.id
export const isValidStudentEmail = (email: string): boolean => {
  const trimmed = email.trim().toLowerCase();
  return trimmed.endsWith('.ac.id');
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!isValidStudentEmail(email)) {
    throw new Error('Gunakan email kampus (.ac.id) untuk mendaftar.');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: 'almamatcher://verify',
      },
    });

    if (error) throw error;
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