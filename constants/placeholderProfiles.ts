// constants/placeholderProfiles.ts
// Temporary sample profiles shown on the Discover screen while the real user
// base is still small. They are clearly flagged (isPlaceholder) so the UI can
// label them "Contoh • Sementara" and the swipe handlers skip server calls.

import type { ProfileCard } from '../types/profile';
import type { MBTI, Zodiac } from '../types/profile';

export type DiscoverCardItem = ProfileCard & { isPlaceholder?: boolean };

export const PLACEHOLDER_PROFILES: DiscoverCardItem[] = [
  {
    id: 'placeholder-1', full_name: 'Putri Maharani', avatar_url: null,
    university: 'Universitas Indonesia', major: 'Ilmu Komunikasi',
    age: 20, gender: 'female', mbti: 'ENFP' as MBTI, zodiac: 'Leo' as Zodiac,
    hobbies: ['Membaca', 'Fotografi', 'Traveling'],
    bio: 'Suka diskusi soal film & isu sosial. Cari teman ngopi sambil belajar.',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-2', full_name: 'Bagas Pratama', avatar_url: null,
    university: 'Institut Teknologi Bandung', major: 'Teknik Informatika',
    age: 21, gender: 'male', mbti: 'INTP' as MBTI, zodiac: 'Virgo' as Zodiac,
    hobbies: ['Coding', 'Gaming', 'Basket'],
    bio: 'Anak coding yang lagi belajar UI/UX. Open buat ngoding bareng.',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-3', full_name: 'Salsabila Putri', avatar_url: null,
    university: 'Universitas Gadjah Mada', major: 'Psikologi',
    age: 19, gender: 'female', mbti: 'INFJ' as MBTI, zodiac: 'Pisces' as Zodiac,
    hobbies: ['Menulis', 'Musik', 'Yoga'],
    bio: 'Pendengar yang baik. Suka journaling dan eksplor kafe estetik.',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-4', full_name: 'Raka Adyatma', avatar_url: null,
    university: 'Universitas Airlangga', major: 'Manajemen',
    age: 22, gender: 'male', mbti: 'ENTJ' as MBTI, zodiac: 'Aries' as Zodiac,
    hobbies: ['Futsal', 'Traveling', 'Memasak'],
    bio: 'Suka bahas bisnis & startup. Cari partner diskusi yang ambisius.',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-5', full_name: 'Nadia Rahmawati', avatar_url: null,
    university: 'Universitas Padjadjaran', major: 'Kedokteran',
    age: 20, gender: 'female', mbti: 'ISFJ' as MBTI, zodiac: 'Cancer' as Zodiac,
    hobbies: ['Membaca', 'Renang', 'Nonton Film'],
    bio: 'Calon dokter yang butuh study buddy buat belajar bareng. 📚',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-6', full_name: 'Fauzan Hakim', avatar_url: null,
    university: 'Institut Teknologi Sepuluh Nopember', major: 'Teknik Mesin',
    age: 21, gender: 'male', mbti: 'ISTP' as MBTI, zodiac: 'Capricorn' as Zodiac,
    hobbies: ['Hiking', 'Gaming', 'Badminton'],
    bio: 'Suka otak-atik mesin & naik gunung. Santai tapi serius kalau belajar.',
    isPlaceholder: true,
  },
];
