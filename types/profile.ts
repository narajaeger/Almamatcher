// types/profile.ts
// Semua tipe data untuk modul Profile

import { UNIVERSITIES } from '../constants/eduData';

export type Gender = 'male' | 'female';

export type MBTI =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export type Zodiac =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type Religion =
  | 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | 'Lainnya';

export type LookingFor = 'relationship' | 'friendship' | 'study_buddy' | 'all';

// Profile lengkap dari DB
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;

  // Akademik
  university: string | null;
  faculty: string | null;
  major: string | null;
  year_entry: number | null;

  // Data diri
  birth_date: string | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  city_origin: string | null;

  // Preferensi
  mbti: MBTI | null;
  zodiac: Zodiac | null;
  religion: Religion | null;
  hobbies: string[] | null;
  looking_for: LookingFor | null;

  // Social links (URL or handle)
  instagram: string | null;
  spotify: string | null;
  linkedin: string | null;

  // Discover preferences
  pref_gender: 'male' | 'female' | 'all' | null;
  pref_age_min: number | null;
  pref_age_max: number | null;
  pref_university: string | null;

  // Push notifications
  push_token: string | null;

  // Status
  onboarding_completed: boolean;
  onboarding_step: number;
  is_premium: boolean;
  premium_until: string | null;

  created_at: string;
  updated_at: string;
}

// Subset untuk update (semua opsional)
export type ProfileUpdate = Partial<Omit<Profile,
  'id' | 'email' | 'created_at' | 'updated_at' | 'is_premium' | 'premium_until'
>>;

export interface OnboardingStepData {
  step1: { full_name: string; username: string; birth_date: string; gender: Gender; };
  step2: { university: string; faculty: string; major: string; year_entry: number; };
  step3: { height_cm: number; weight_kg: number; city_origin: string; religion: Religion; };
  step4: { mbti: MBTI | null; zodiac: Zodiac | null; hobbies: string[]; };
  step5: { looking_for: LookingFor; bio: string; avatar_url: string | null; };
}

export interface ProfilePhoto {
  id: string;
  user_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface ProfileCard {
  id: string;
  full_name: string;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  age: number | null;
  gender: Gender | null;
  mbti: MBTI | null;
  zodiac: Zodiac | null;
  hobbies: string[] | null;
  bio: string | null;
}

export const HOBBIES_LIST = [
  'Musik', 'Gaming', 'Olahraga', 'Memasak', 'Membaca',
  'Fotografi', 'Traveling', 'Nonton Film', 'Seni & Desain',
  'Coding', 'Menulis', 'Hiking', 'Yoga', 'Menyanyi',
  'Dance', 'Basket', 'Futsal', 'Badminton', 'Renang', 'Lainnya',
] as const;

export type Hobby = typeof HOBBIES_LIST[number];

// Re-exported from constants/eduData so onboarding/edit screens share the
// same (much larger, and correctly-abbreviated) list used by search filters.
// Previously this was a short, hand-rolled duplicate that also contained a
// wrong entry ("UNS - Universitas Negeri Surakarta" — UNS is actually
// Universitas Sebelas Maret), which is part of why searching by abbreviation
// didn't line up with what people had picked during onboarding.
export const UNIVERSITIES_LIST = [...UNIVERSITIES, 'Lainnya'] as const;
