// app/(onboarding)/step1.tsx
// Step 1: Identitas diri — Nama, Username, Tanggal Lahir, Gender

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfileStore } from '../../stores/profileStore';
import { checkUsernameAvailable } from '../../services/profileService';
import {
  StyledInput, GenderSelector, PrimaryButton,
} from '../../components/ui/FormComponents';
import type { Gender } from '../../types/profile';

export default function OnboardingStep1() {
  const { saveOnboardingStep } = useProfileStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validasi username: hanya huruf, angka, underscore
  const handleUsernameChange = (text: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = 'Nama minimal 2 karakter';
    if (username.length < 3) errs.username = 'Username minimal 3 karakter';
    if (username.length > 20) errs.username = 'Username maksimal 20 karakter';
    if (!birthDate) errs.birthDate = 'Tanggal lahir wajib diisi';
    if (birthDate) {
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 17) errs.birthDate = 'Kamu harus berumur minimal 17 tahun';
      if (age > 35) errs.birthDate = 'Usia tidak valid';
    }
    if (!gender) errs.gender = 'Pilih gendermu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    setIsLoading(true);

    // Cek username availability
    const available = await checkUsernameAvailable(username);
    if (!available) {
      setErrors({ username: 'Username sudah dipakai, coba yang lain' });
      setIsLoading(false);
      return;
    }

    const success = await saveOnboardingStep(1, {
      full_name: fullName.trim(),
      username: username.toLowerCase(),
      birth_date: birthDate!.toISOString().split('T')[0],
      gender: gender!,
    });

    setIsLoading(false);

    if (success) {
      router.push('/(onboarding)/step2');
    } else {
      Alert.alert('Gagal Menyimpan', 'Coba lagi ya!');
    }
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 17); // min 17 tahun

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>Halo! Kenalan dulu yuk</Text>
        <Text style={styles.subtitle}>
          Isi data dasar kamu buat profil Almamatcher
        </Text>
      </View>

      {/* Form */}
      <StyledInput
        label="Nama Lengkap"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Contoh: Budi Santoso"
        error={errors.fullName}
      />

      <StyledInput
        label="Username"
        value={username}
        onChangeText={handleUsernameChange}
        placeholder="contoh: budi_ux"
        maxLength={20}
        error={errors.username}
      />
      <Text style={styles.hint}>Hanya huruf kecil, angka, dan underscore (_)</Text>

      {/* Date Picker */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Tanggal Lahir</Text>
        {Platform.OS === 'web' ? (
          <View style={[styles.dateButton, errors.birthDate ? styles.inputError : null]}>
            {/* @ts-ignore */}
            <input
              type="date"
              value={birthDate && !isNaN(birthDate.getTime()) ? birthDate.toISOString().split('T')[0] : ''}
              max={maxDate.toISOString().split('T')[0]}
              min="1990-01-01"
              onChange={(e: any) => {
                const val = e.target.value;
                if (!val) return;
                const [y, m, d] = val.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                if (!isNaN(date.getTime())) setBirthDate(date);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 16,
                color: birthDate ? '#111827' : '#9CA3AF',
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.dateButton, errors.birthDate ? styles.inputError : null]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={birthDate ? styles.dateValue : styles.datePlaceholder}>
                {birthDate
                  ? birthDate.toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : 'Pilih tanggal lahir'}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate ?? maxDate}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                minimumDate={new Date(1990, 0, 1)}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setBirthDate(date);
                }}
              />
            )}
          </>
        )}
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
      </View>

      <GenderSelector
        value={gender}
        onChange={setGender}
        error={errors.gender}
      />

      {/* Next Button */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Lanjut →"
          onPress={handleNext}
          loading={isLoading}
        />
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
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: -14, marginBottom: 20 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  dateButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: { borderColor: '#EF4444' },
  dateValue: { fontSize: 16, color: '#111827' },
  datePlaceholder: { fontSize: 16, color: '#9CA3AF' },
  calendarIcon: { fontSize: 18 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  footer: { marginTop: 16 },
  webDateInput: { color: '#111827', fontSize: 16 },
});
