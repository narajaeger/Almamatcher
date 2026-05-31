// app/(onboarding)/step2.tsx
// Step 2: Info Kampus — Universitas, Fakultas, Jurusan, Angkatan

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';
import {
  StyledInput, SelectPicker, PrimaryButton,
} from '../../components/ui/FormComponents';
import { UNIVERSITIES_LIST } from '../../types/profile';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) =>
  String(CURRENT_YEAR - i)
);

const FACULTY_OPTIONS = [
  'Teknik', 'Ekonomi & Bisnis', 'Hukum', 'Kedokteran', 'FMIPA',
  'Ilmu Sosial & Politik', 'Ilmu Budaya / Sastra', 'Pendidikan',
  'Psikologi', 'Pertanian', 'Kehutanan', 'Farmasi', 'Kesehatan Masyarakat',
  'Ilmu Komputer / Informatika', 'Komunikasi', 'Desain', 'Lainnya',
];

export default function OnboardingStep2() {
  const { profile, saveOnboardingStep } = useProfileStore();

  const [university, setUniversity] = useState(profile?.university ?? '');
  const [faculty, setFaculty] = useState(profile?.faculty ?? '');
  const [major, setMajor] = useState(profile?.major ?? '');
  const [yearEntry, setYearEntry] = useState(profile?.year_entry?.toString() ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!university.trim()) errs.university = 'Universitas wajib diisi';
    if (!faculty) errs.faculty = 'Pilih fakultas';
    if (major.trim().length < 2) errs.major = 'Jurusan minimal 2 karakter';
    if (!yearEntry) errs.yearEntry = 'Pilih tahun masuk';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setIsLoading(true);

    const success = await saveOnboardingStep(2, {
      university: university.trim(),
      faculty,
      major: major.trim(),
      year_entry: parseInt(yearEntry),
    });

    setIsLoading(false);
    if (success) {
      router.push('/(onboarding)/step3');
    } else {
      Alert.alert('Gagal Menyimpan', 'Coba lagi ya!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🎓</Text>
        <Text style={styles.title}>Cerita soal kampusmu</Text>
        <Text style={styles.subtitle}>
          Ini buat bantu nemuin teman satu kampus atau satu jurusan
        </Text>
      </View>

      <SelectPicker
        label="Universitas"
        value={university || null}
        options={[...UNIVERSITIES_LIST]}
        onSelect={setUniversity}
        placeholder="Pilih universitas..."
        error={errors.university}
      />

      {/* Atau isi manual jika universitas tidak ada di list */}
      {university === 'Lainnya' && (
        <StyledInput
          label="Nama Universitas (isi manual)"
          value={university === 'Lainnya' ? '' : university}
          onChangeText={setUniversity}
          placeholder="Contoh: Universitas XYZ"
          error={errors.university}
        />
      )}

      <SelectPicker
        label="Fakultas"
        value={faculty || null}
        options={FACULTY_OPTIONS}
        onSelect={setFaculty}
        placeholder="Pilih fakultas..."
        error={errors.faculty}
      />

      <StyledInput
        label="Program Studi / Jurusan"
        value={major}
        onChangeText={setMajor}
        placeholder="Contoh: Teknik Informatika"
        error={errors.major}
      />

      <SelectPicker
        label="Angkatan (Tahun Masuk)"
        value={yearEntry || null}
        options={YEAR_OPTIONS}
        onSelect={setYearEntry}
        placeholder="Pilih angkatan..."
        error={errors.yearEntry}
      />

      {/* Info bahwa ini dipakai untuk verifikasi */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Pastikan universitas sesuai dengan email .ac.id yang kamu daftarkan
        </Text>
      </View>

      {/* Navigation */}
      <View style={styles.footer}>
        <PrimaryButton title="Lanjut →" onPress={handleNext} loading={isLoading} />
        <PrimaryButton
          title="← Kembali"
          onPress={() => router.back()}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  infoText: { fontSize: 13, color: '#92400E' },
  footer: { gap: 12 },
});
