import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  university?: string;
  major?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_premium: boolean;
  is_onboarding_complete: boolean;
  active_mode: 'love' | 'study';
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setActiveMode: (mode: 'love' | 'study') => void;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setActiveMode: async (mode) => {
    const { user } = get();
    if (!user) return;

    // Update lokal dulu (optimistic update)
    set((state) => ({
      profile: state.profile ? { ...state.profile, active_mode: mode } : null,
    }));

    // Sync ke database
    try {
      await supabase
        .from('profiles')
        .update({ active_mode: mode })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to update mode:', error);
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ profile: data, isLoading: false });
    } catch (error) {
      console.error('fetchProfile error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    } catch (error) {
      console.error('signOut error:', error);
    }
  },
}));