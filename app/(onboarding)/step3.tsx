// app/(onboarding)/step3.tsx
// Step 3: Data Fisik — Tinggi, Berat, Kota Asal, Agama

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';
import {
  NumberStepper, SelectPicker, StyledInput, PrimaryButton,
} from '../../components/ui/FormComponents';
import type { Religion } from '../../types/profile';

const RELIGION_OPTIONS: Religion[] = [
  'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya',
];

export default function OnboardingStep3() {
  const { profile, saveOnboardingStep } = useProfileStore();

  const [heightCm, setHeightCm] = useState(profile?.height_cm ?? 165);
  const [weightKg, setWeightKg] = useState(profile?.weight_kg ?? 60);
  const [cityOrigin, setCityOrigin] = useState(profile?.city_origin ?? '');
  const [religion, setReligion] = useState<Religion | null>(
    (profile?.religion as Religion) ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!cityOrigin.trim()) errs.cityOrigin = 'Kota asal wajib diisi';
    if (!religion) errs.religion = 'Pilih agama';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setIsLoading(true);

    const success = await saveOnboardingStep(3, {
      height_cm: heightCm,
      weight_kg: weightKg,
      city_origin: cityOrigin.trim(),
      religion: religion!,
    });

    setIsLoading(false);
    if (success) {
      router.push('/(onboarding)/step4');
    } else {
      Alert.alert('Gagal Menyimpan', 'Coba lagi ya!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>📏</Text>
        <Text style={styles.title}>Tentang fisik & asal</Text>
        <Text style={styles.subtitle}>
          Data ini membantu orang lain mengenalmu lebih baik
        </Text>
      </View>

      {/* Tinggi & Berat badan side by side */}
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <NumberStepper
            label="Tinggi Badan"
            value={heightCm}
            onChange={setHeightCm}
            min={140}
            max={220}
            step={1}
            unit="cm"
          />
        </View>
        <View style={styles.rowItem}>
          <NumberStepper
            label="Berat Badan"
            value={weightKg}
            onChange={setWeightKg}
            min={30}
            max={150}
            step={1}
            unit="kg"
          />
        </View>
      </View>

      {/* BMI Hint */}
      <View style={styles.bmiBox}>
        <Text style={styles.bmiText}>
          BMI kamu: {(weightKg / ((heightCm / 100) ** 2)).toFixed(1)} —{' '}
          {getBmiLabel(weightKg, heightCm)}
        </Text>
      </View>

      <StyledInput
        label="Kota Asal"
        value={cityOrigin}
        onChangeText={setCityOrigin}
        placeholder="Contoh: Surakarta"
        error={errors.cityOrigin}
      />

      <SelectPicker
        label="Agama"
        value={religion}
        options={RELIGION_OPTIONS}
        onSelect={(v) => setReligion(v as Religion)}
        placeholder="Pilih agama..."
        error={errors.religion}
      />

      <View style={styles.footer}>
        <PrimaryButton title="Lanjut →" onPress={handleNext} loading={isLoading} />
        <PrimaryButton title="← Kembali" onPress={() => router.back()} variant="ghost" />
      </View>
    </ScrollView>
  );
}

function getBmiLabel(weight: number, height: number): string {
  const bmi = weight / ((height / 100) ** 2);
  if (bmi < 18.5) return 'Kurus';
  if (bmi < 25) return 'Normal ✓';
  if (bmi < 30) return 'Gemuk';
  return 'Obesitas';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  row: { flexDirection: 'row', gap: 16 },
  rowItem: { flex: 1 },
  bmiBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: -8,
    marginBottom: 20,
  },
  bmiText: { fontSize: 13, color: '#166534', textAlign: 'center' },
  footer: { gap: 12, marginTop: 8 },
});
