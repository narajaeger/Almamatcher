// app/(tabs)/profile/edit.tsx
// Edit Profile — semua bagian profil bisa diubah di sini

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, Platform,
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
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { Colors, Radii, Spacing, Fonts, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import Icon, { type IconName } from '../../../components/ui/Icon';
import type { MBTI, Zodiac, Religion, LookingFor, Gender } from '../../../types/profile';
import { HOBBIES_LIST } from '../../../types/profile';
import { UNIVERSITIES, MAJORS } from '../../../constants/eduData';

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
const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string; icon: IconName }[] = [
  { value: 'relationship', label: 'Hubungan Serius', icon: 'heartFill' },
  { value: 'friendship',   label: 'Pertemanan',      icon: 'handshake' },
  { value: 'study_buddy',  label: 'Study Buddy',      icon: 'book' },
  { value: 'all',          label: 'Semua',            icon: 'sparkles' },
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
  const [instagram, setInstagram]     = useState(profile?.instagram ?? '');
  const [spotify, setSpotify]         = useState(profile?.spotify ?? '');
  const [linkedin, setLinkedin]       = useState(profile?.linkedin ?? '');

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
      instagram: instagram.trim() || null,
      spotify: spotify.trim() || null,
      linkedin: linkedin.trim() || null,
    });
    setIsSaving(false);

    if (success) {
      // Alert doesn't render on react-native-web — just go back there.
      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert('Tersimpan!', 'Profil kamu berhasil diperbarui.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan, coba lagi ya.');
    }
  };

  const SECTIONS: { id: Section; label: string; icon: IconName }[] = [
    { id: 'identity',    label: 'Identitas',     icon: 'user' },
    { id: 'academic',    label: 'Kampus',         icon: 'graduation' },
    { id: 'physical',    label: 'Fisik & Asal',   icon: 'ruler' },
    { id: 'personality', label: 'Kepribadian',    icon: 'sparkles' },
    { id: 'preference',  label: 'Preferensi',     icon: 'heart' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenGradient />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
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
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="camera" size={32} color={Colors.primary} weight={1.8} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Icon name="edit" size={13} color="#fff" weight={2.4} />
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
              accessibilityRole="button"
              accessibilityState={{ selected: activeSection === s.id }}
            >
              <Icon
                name={s.icon}
                size={15}
                color={activeSection === s.id ? Colors.primaryHover : Colors.textSecondary}
                weight={2}
                fill={activeSection === s.id ? Colors.primaryHover : Colors.textSecondary}
              />
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

              <Text style={styles.groupLabel}>Tautan Sosial (opsional)</Text>
              <StyledInput label="Instagram" value={instagram} onChangeText={setInstagram}
                placeholder="@username atau link" />
              <StyledInput label="Spotify" value={spotify} onChangeText={setSpotify}
                placeholder="username atau link profil" />
              <StyledInput label="LinkedIn" value={linkedin} onChangeText={setLinkedin}
                placeholder="username atau link profil" />
            </>
          )}

          {/* SECTION: Kampus */}
          {activeSection === 'academic' && (
            <>
              <Text style={styles.groupLabel}>Universitas</Text>
              <View style={styles.inputWrapper}>
                <SearchableSelect
                  value={university}
                  onChangeText={setUniversity}
                  options={UNIVERSITIES}
                  placeholder="Cari universitas... (atau ketik manual)"
                />
              </View>
              <SelectPicker label="Fakultas" value={faculty || null}
                options={FACULTY_OPTIONS} onSelect={setFaculty}
                placeholder="Pilih fakultas..." />
              <Text style={styles.groupLabel}>Program Studi / Jurusan</Text>
              <View style={styles.inputWrapper}>
                <SearchableSelect
                  value={major}
                  onChangeText={setMajor}
                  options={MAJORS}
                  placeholder="Cari jurusan/prodi... (atau ketik manual)"
                />
              </View>
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
                      <View style={styles.lookingForLeft}>
                        <Icon
                          name={opt.icon}
                          size={18}
                          color={lookingFor === opt.value ? Colors.primaryHover : Colors.textSecondary}
                          weight={2}
                          fill={lookingFor === opt.value ? Colors.primaryHover : Colors.textSecondary}
                        />
                        <Text style={[
                          styles.lookingForText,
                          lookingFor === opt.value && styles.lookingForTextSelected,
                        ]}>
                          {opt.label}
                        </Text>
                      </View>
                      {lookingFor === opt.value && <Icon name="check" size={16} color={Colors.primary} weight={3} />}
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
  safeArea: { flex: 1, backgroundColor: Colors.backgroundWarm },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(253,251,247,0.55)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 18, fontFamily: Fonts.display.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  saveBtn: { fontSize: 15, color: Colors.primary, fontFamily: Fonts.sans.bold },
  saveBtnDisabled: { color: Colors.textTertiary },
  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xxl },
  avatarContainer: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: Colors.primaryLight, overflow: 'hidden',
    borderWidth: 3, borderColor: Colors.primaryMid,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: Colors.primary, width: 30, height: 30,
    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  avatarLabel: { marginTop: Spacing.sm, fontSize: 14, color: Colors.textTertiary, fontFamily: Fonts.sans.medium },
  // Tabs
  tabsContainer: { maxHeight: 72 },
  tabs: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingVertical: Spacing.sm },
  tab: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: Radii.full, backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1.5, borderColor: Colors.border,
    flexDirection: 'row', gap: 6, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans.semibold },
  tabLabelActive: { color: Colors.primaryHover, fontFamily: Fonts.sans.bold },
  // Form
  container: { flex: 1 },
  form: { padding: Spacing.xxl, paddingBottom: TAB_SAFE_BOTTOM },
  inputWrapper: { marginBottom: Spacing.xl },
  sectionLabel: { fontSize: 14, fontFamily: Fonts.sans.semibold, color: Colors.textPrimary, marginBottom: Spacing.md },
  groupLabel: {
    fontSize: 11, fontFamily: Fonts.sans.bold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  lookingForList: { gap: Spacing.sm },
  lookingForRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.lg, borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1.5, borderColor: Colors.border,
  },
  lookingForRowSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  lookingForLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  lookingForText: { fontSize: 15, color: Colors.textSecondary, fontFamily: Fonts.sans.medium },
  lookingForTextSelected: { color: Colors.primaryHover, fontFamily: Fonts.sans.bold },
  saveSection: { marginTop: Spacing.xxl },
});
