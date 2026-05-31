// stores/profileStore.ts
// Zustand store untuk state profil user

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyProfile, updateProfile, updateOnboardingStep } from '../services/profileService';
import type { Profile, ProfileUpdate } from '../types/profile';

interface ProfileState {
  // State
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<boolean>;
  saveOnboardingStep: (step: number, data: ProfileUpdate, isCompleted?: boolean) => Promise<boolean>;
  clearProfile: () => void;
  setProfile: (profile: Profile) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      /**
       * Fetch profil dari Supabase dan simpan ke store
       */
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        const profile = await getMyProfile();
        set({ profile, isLoading: false });
      },

      /**
       * Update profil — optimistic update: update store dulu, baru kirim ke DB
       */
      updateProfile: async (updates: ProfileUpdate) => {
        const prev = get().profile;
        if (!prev) return false;

        // Optimistic update
        set({ profile: { ...prev, ...updates } });

        const result = await updateProfile(updates);

        if (!result.success) {
          // Rollback jika gagal
          set({ profile: prev, error: result.error ?? 'Update failed' });
          return false;
        }
        return true;
      },

      /**
       * Simpan data onboarding per step
       */
      saveOnboardingStep: async (step: number, data: ProfileUpdate, isCompleted = false) => {
        const prev = get().profile;
        if (!prev) return false;

        // Optimistic update
        set({
          profile: {
            ...prev,
            ...data,
            onboarding_step: step,
            onboarding_completed: isCompleted,
          },
        });

        const result = await updateOnboardingStep(step, data, isCompleted);

        if (!result.success) {
          set({ profile: prev, error: result.error });
          return false;
        }
        return true;
      },

      /**
       * Set profil langsung (misal setelah upload avatar)
       */
      setProfile: (profile: Profile) => set({ profile }),

      /**
       * Clear saat logout
       */
      clearProfile: () => set({ profile: null, error: null }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Hanya persist data profil, bukan loading state
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

// ============================================
// Selector helpers — pakai ini di komponen
// ============================================

/** Apakah onboarding sudah selesai? */
export const selectOnboardingDone = (state: ProfileState) =>
  state.profile?.onboarding_completed ?? false;

/** Step onboarding saat ini */
export const selectOnboardingStep = (state: ProfileState) =>
  state.profile?.onboarding_step ?? 0;

/** Apakah profil sudah ter-load? */
export const selectProfileReady = (state: ProfileState) =>
  !state.isLoading && state.profile !== null;

/** Hitung umur dari birth_date */
export const selectAge = (state: ProfileState): number | null => {
  const bd = state.profile?.birth_date;
  if (!bd) return null;
  const today = new Date();
  const birth = new Date(bd);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};
