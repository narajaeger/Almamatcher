// app/(onboarding)/step4.tsx
// Step 4: Kepribadian — MBTI, Zodiak, Hobi

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';
import { ChipSelector, SelectPicker, PrimaryButton } from '../../components/ui/FormComponents';
import type { MBTI, Zodiac } from '../../types/profile';
import { HOBBIES_LIST } from '../../types/profile';

const MBTI_OPTIONS: MBTI[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const ZODIAC_OPTIONS: Zodiac[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Deskripsi singkat MBTI buat hint
const MBTI_DESC: Partial<Record<MBTI, string>> = {
  INFP: 'Si mediator yang idealis', ENFP: 'Si aktivis yang bersemangat',
  INTJ: 'Si arsitek yang strategis', ENTP: 'Si debater yang inovatif',
  ISFJ: 'Si pembela yang setia', ESFJ: 'Si konsul yang perhatian',
};

export default function OnboardingStep4() {
  const { profile, saveOnboardingStep } = useProfileStore();

  const [mbti, setMbti] = useState<MBTI | null>((profile?.mbti as MBTI) ?? null);
  const [zodiac, setZodiac] = useState<Zodiac | null>((profile?.zodiac as Zodiac) ?? null);
  const [hobbies, setHobbies] = useState<string[]>(profile?.hobbies ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleHobby = (hobby: string) => {
    setHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (hobbies.length === 0) errs.hobbies = 'Pilih minimal 1 hobi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setIsLoading(true);

    const success = await saveOnboardingStep(4, {
      mbti: mbti ?? null,
      zodiac: zodiac ?? null,
      hobbies,
    });

    setIsLoading(false);
    if (success) {
      router.push('/(onboarding)/step5');
    } else {
      Alert.alert('Gagal Menyimpan', 'Coba lagi ya!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Kepribadianmu</Text>
        <Text style={styles.subtitle}>
          Ini yang paling seru — biar pasangan cocok sama kamu!
        </Text>
      </View>

      {/* MBTI */}
      <SelectPicker
        label="Tipe MBTI (opsional)"
        value={mbti}
        options={MBTI_OPTIONS}
        onSelect={(v) => setMbti(v as MBTI)}
        placeholder="Pilih MBTI kamu..."
      />
      {mbti && MBTI_DESC[mbti] && (
        <View style={styles.mbtiHint}>
          <Text style={styles.mbtiHintText}>💭 {MBTI_DESC[mbti]}</Text>
        </View>
      )}
      {!mbti && (
        <Text style={styles.skip}>Belum tahu? Kamu bisa skip ini 😊</Text>
      )}

      {/* Zodiak */}
      <SelectPicker
        label="Zodiak (opsional)"
        value={zodiac}
        options={ZODIAC_OPTIONS}
        onSelect={(v) => setZodiac(v as Zodiac)}
        placeholder="Pilih zodiak kamu..."
      />

      {/* Hobi */}
      <ChipSelector
        label="Hobi & Minat"
        options={HOBBIES_LIST}
        selected={hobbies}
        onToggle={toggleHobby}
        maxSelect={8}
        error={errors.hobbies}
      />

      <View style={styles.footer}>
        <PrimaryButton title="Lanjut →" onPress={handleNext} loading={isLoading} />
        <PrimaryButton title="← Kembali" onPress={() => router.back()} variant="ghost" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  mbtiHint: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginTop: -12,
    marginBottom: 20,
  },
  mbtiHintText: { fontSize: 13, color: '#1D4ED8' },
  skip: { fontSize: 13, color: '#9CA3AF', marginTop: -14, marginBottom: 20 },
  footer: { gap: 12, marginTop: 8 },
});
