// app/(tabs)/profile/edit.tsx
// Edit Profile — semua bagian profil bisa diubah di sini

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  Image, TouchableOpacity, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../../stores/profileStore';
import { useImagePicker } from '../../../hooks/useImagePicker';
import {
  StyledInput, SelectPicker, ChipSelector,
  GenderSelector, NumberStepper, PrimaryButton,
} from '../../../components/ui/FormComponents';
import type { MBTI, Zodiac, Religion, LookingFor, Gender } from '../../../types/profile';
import { HOBBIES_LIST, UNIVERSITIES_LIST } from '../../../types/profile';

// Re-use lists dari step onboarding
const MBTI_OPTIONS: MBTI[] = [
  'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP',
];
const ZODIAC_OPTIONS: Zodiac[] = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];
const RELIGION_OPTIONS: Religion[] = [
  'Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya',
];
const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string }[] = [
  { value: 'relationship', label: '💕 Hubungan Serius' },
  { value: 'friendship',   label: '🤝 Pertemanan' },
  { value: 'study_buddy',  label: '📚 Study Buddy' },
  { value: 'all',          label: '🌟 Semua' },
];
const FACULTY_OPTIONS = [
  'Teknik','Ekonomi & Bisnis','Hukum','Kedokteran','FMIPA',
  'Ilmu Sosial & Politik','Ilmu Budaya / Sastra','Pendidikan',
  'Psikologi','Pertanian','Kehutanan','Farmasi','Kesehatan Masyarakat',
  'Ilmu Komputer / Informatika','Komunikasi','Desain','Lainnya',
];

type Section = 'identity' | 'academic' | 'physical' | 'personality' | 'preference';

export default function EditProfileScreen() {
  const { profile, updateProfile, isLoading } = useProfileStore();
  const { pickAndUploadAvatar, isUploading } = useImagePicker();

  // ---- Local form state (semua section) ----
  const [fullName, setFullName]       = useState(profile?.full_name ?? '');
  const [username, setUsername]       = useState(profile?.username ?? '');
  const [bio, setBio]                 = useState(profile?.bio ?? '');
  const [university, setUniversity]   = useState(profile?.university ?? '');
  const [faculty, setFaculty]         = useState(profile?.faculty ?? '');
  const [major, setMajor]             = useState(profile?.major ?? '');
  const [yearEntry, setYearEntry]     = useState(profile?.year_entry?.toString() ?? '');
  const [heightCm, setHeightCm]       = useState(profile?.height_cm ?? 165);
  const [weightKg, setWeightKg]       = useState(profile?.weight_kg ?? 60);
  const [cityOrigin, setCityOrigin]   = useState(profile?.city_origin ?? '');
  const [religion, setReligion]       = useState<Religion | null>(profile?.religion as Religion ?? null);
  const [gender, setGender]           = useState<Gender | null>(profile?.gender as Gender ?? null);
  const [mbti, setMbti]               = useState<MBTI | null>(profile?.mbti as MBTI ?? null);
  const [zodiac, setZodiac]           = useState<Zodiac | null>(profile?.zodiac as Zodiac ?? null);
  const [hobbies, setHobbies]         = useState<string[]>(profile?.hobbies ?? []);
  const [lookingFor, setLookingFor]   = useState<LookingFor | null>(profile?.looking_for as LookingFor ?? null);
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(profile?.avatar_url ?? null);

  const [activeSection, setActiveSection] = useState<Section>('identity');
  const [isSaving, setIsSaving] = useState(false);

  const handlePickPhoto = async () => {
    const url = await pickAndUploadAvatar();
    if (url) setAvatarUrl(url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateProfile({
      full_name: fullName.trim(),
      username: username.toLowerCase().trim(),
      bio: bio.trim(),
      university: university.trim(),
      faculty,
      major: major.trim(),
      year_entry: yearEntry ? parseInt(yearEntry) : undefined,
      height_cm: heightCm,
      weight_kg: weightKg,
      city_origin: cityOrigin.trim(),
      religion: religion ?? undefined,
      gender: gender ?? undefined,
      mbti: mbti ?? undefined,
      zodiac: zodiac ?? undefined,
      hobbies,
      looking_for: lookingFor ?? undefined,
    });
    setIsSaving(false);

    if (success) {
      Alert.alert('Tersimpan! ✓', 'Profil kamu berhasil diperbarui.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan, coba lagi ya.');
    }
  };

  const SECTIONS: { id: Section; label: string; emoji: string }[] = [
    { id: 'identity',    label: 'Identitas',     emoji: '👤' },
    { id: 'academic',    label: 'Kampus',         emoji: '🎓' },
    { id: 'physical',    label: 'Fisik & Asal',   emoji: '📏' },
    { id: 'personality', label: 'Kepribadian',    emoji: '✨' },
    { id: 'preference',  label: 'Preferensi',     emoji: '💭' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}>
            {isSaving ? '...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickPhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="large" color="#EC4899" />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderIcon}>📸</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>
            {profile?.username ? `@${profile.username}` : 'Tap untuk ganti foto'}
          </Text>
        </View>

        {/* Section Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabs}
        >
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.tab, activeSection === s.id && styles.tabActive]}
              onPress={() => setActiveSection(s.id)}
            >
              <Text style={styles.tabEmoji}>{s.emoji}</Text>
              <Text style={[styles.tabLabel, activeSection === s.id && styles.tabLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Form Content by Section */}
        <View style={styles.form}>

          {/* SECTION: Identitas */}
          {activeSection === 'identity' && (
            <>
              <StyledInput label="Nama Lengkap" value={fullName} onChangeText={setFullName}
                placeholder="Nama lengkapmu" />
              <StyledInput label="Username" value={username} onChangeText={setUsername}
                placeholder="username_kamu" maxLength={20} />
              <StyledInput label="Bio" value={bio} onChangeText={setBio}
                placeholder="Ceritakan tentang dirimu..." multiline maxLength={200} />
              <GenderSelector value={gender} onChange={setGender} />
            </>
          )}

          {/* SECTION: Kampus */}
          {activeSection === 'academic' && (
            <>
              <SelectPicker label="Universitas" value={university || null}
                options={[...UNIVERSITIES_LIST]} onSelect={setUniversity}
                placeholder="Pilih universitas..." />
              <SelectPicker label="Fakultas" value={faculty || null}
                options={FACULTY_OPTIONS} onSelect={setFaculty}
                placeholder="Pilih fakultas..." />
              <StyledInput label="Program Studi / Jurusan" value={major}
                onChangeText={setMajor} placeholder="Contoh: Teknik Informatika" />
              <SelectPicker label="Angkatan"
                value={yearEntry || null}
                options={Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i))}
                onSelect={setYearEntry} placeholder="Tahun masuk..." />
            </>
          )}

          {/* SECTION: Fisik & Asal */}
          {activeSection === 'physical' && (
            <>
              <NumberStepper label="Tinggi Badan" value={heightCm} onChange={setHeightCm}
                min={140} max={220} unit="cm" />
              <NumberStepper label="Berat Badan" value={weightKg} onChange={setWeightKg}
                min={30} max={150} unit="kg" />
              <StyledInput label="Kota Asal" value={cityOrigin} onChangeText={setCityOrigin}
                placeholder="Contoh: Surakarta" />
              <SelectPicker label="Agama" value={religion} options={RELIGION_OPTIONS}
                onSelect={(v) => setReligion(v as Religion)} placeholder="Pilih agama..." />
            </>
          )}

          {/* SECTION: Kepribadian */}
          {activeSection === 'personality' && (
            <>
              <SelectPicker label="Tipe MBTI" value={mbti} options={MBTI_OPTIONS}
                onSelect={(v) => setMbti(v as MBTI)} placeholder="Pilih MBTI..." />
              <SelectPicker label="Zodiak" value={zodiac} options={ZODIAC_OPTIONS}
                onSelect={(v) => setZodiac(v as Zodiac)} placeholder="Pilih zodiak..." />
              <ChipSelector label="Hobi & Minat" options={HOBBIES_LIST}
                selected={hobbies} onToggle={(h) =>
                  setHobbies((p) => p.includes(h) ? p.filter((x) => x !== h) : [...p, h])
                } maxSelect={8} />
            </>
          )}

          {/* SECTION: Preferensi */}
          {activeSection === 'preference' && (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.sectionLabel}>Tujuanku di Almamatcher</Text>
                <View style={styles.lookingForList}>
                  {LOOKING_FOR_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.lookingForRow,
                        lookingFor === opt.value && styles.lookingForRowSelected,
                      ]}
                      onPress={() => setLookingFor(opt.value)}
                    >
                      <Text style={[
                        styles.lookingForText,
                        lookingFor === opt.value && styles.lookingForTextSelected,
                      ]}>
                        {opt.label}
                      </Text>
                      {lookingFor === opt.value && <Text style={styles.check}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Save Button di bawah form */}
          <View style={styles.saveSection}>
            <PrimaryButton
              title={isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              onPress={handleSave}
              loading={isSaving}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { fontSize: 15, color: '#6B7280' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveBtn: { fontSize: 15, color: '#EC4899', fontWeight: '700' },
  saveBtnDisabled: { color: '#D1D5DB' },
  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F3F4F6', overflow: 'hidden',
    borderWidth: 3, borderColor: '#EC4899',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center' },
  avatarPlaceholderIcon: { fontSize: 36 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#EC4899', width: 28, height: 28,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  avatarEditIcon: { fontSize: 12 },
  avatarLabel: { marginTop: 8, fontSize: 14, color: '#9CA3AF' },
  // Tabs
  tabsContainer: { maxHeight: 72 },
  tabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    flexDirection: 'row', gap: 6, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#FCE7F3', borderColor: '#EC4899' },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabLabelActive: { color: '#EC4899', fontWeight: '700' },
  // Form
  container: { flex: 1 },
  form: { padding: 24 },
  inputWrapper: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  lookingForList: { gap: 10 },
  lookingForRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderRadius: 12,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  lookingForRowSelected: { backgroundColor: '#FCE7F3', borderColor: '#EC4899' },
  lookingForText: { fontSize: 15, color: '#374151' },
  lookingForTextSelected: { color: '#EC4899', fontWeight: '600' },
  check: { fontSize: 16, color: '#EC4899' },
  saveSection: { marginTop: 24 },
});
