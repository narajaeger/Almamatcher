// app/(onboarding)/step5.tsx
// Step 5 (Final): Foto, Bio, Tujuan — selesaikan onboarding

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';
import { useImagePicker } from '../../hooks/useImagePicker';
import {
  StyledInput, SelectPicker, PrimaryButton,
} from '../../components/ui/FormComponents';
import type { LookingFor } from '../../types/profile';

const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string; emoji: string; desc: string }[] = [
  { value: 'relationship', label: 'Hubungan Serius', emoji: '💕', desc: 'Cari pasangan yang meaningful' },
  { value: 'friendship',   label: 'Pertemanan',      emoji: '🤝', desc: 'Cari teman baru dari kampus' },
  { value: 'study_buddy',  label: 'Study Buddy',     emoji: '📚', desc: 'Cari teman belajar & diskusi' },
  { value: 'all',          label: 'Semua',            emoji: '🌟', desc: 'Buka ke segala kemungkinan' },
];

export default function OnboardingStep5() {
  const { profile, saveOnboardingStep } = useProfileStore();
  const { pickAndUploadAvatar, isUploading } = useImagePicker();

  const [bio, setBio] = useState(profile?.bio ?? '');
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(
    (profile?.looking_for as LookingFor) ?? null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickPhoto = async () => {
    const url = await pickAndUploadAvatar();
    if (url) setAvatarUrl(url);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (bio.trim().length < 10) errs.bio = 'Bio minimal 10 karakter';
    if (!lookingFor) errs.lookingFor = 'Pilih tujuanmu';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFinish = async () => {
    if (!validate()) return;
    setIsLoading(true);

    // Step 5 = onboarding selesai
    const success = await saveOnboardingStep(
      5,
      {
        bio: bio.trim(),
        looking_for: lookingFor!,
        avatar_url: avatarUrl,
      },
      true   // isCompleted = true
    );

    setIsLoading(false);
    if (success) {
      // Redirect ke main app
      router.replace('/(tabs)/love');
    } else {
      Alert.alert('Gagal Menyimpan', 'Coba lagi ya!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Hampir selesai!</Text>
        <Text style={styles.subtitle}>Tambahkan foto & cerita tentang dirimu</Text>
      </View>

      {/* Avatar Upload */}
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
              <Text style={styles.avatarPlaceholderText}>Tambah Foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {avatarUrl && (
          <TouchableOpacity onPress={handlePickPhoto}>
            <Text style={styles.changePhotoText}>Ganti foto</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.avatarHint}>
          Foto membuat profilmu 10x lebih sering dilihat! 🔥
        </Text>
      </View>

      {/* Bio */}
      <StyledInput
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Ceritakan sedikit tentang dirimu, hobimu, atau apa yang kamu cari..."
        multiline
        maxLength={200}
        error={errors.bio}
      />

      {/* Looking For */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Tujuanku di sini</Text>
        {errors.lookingFor && (
          <Text style={styles.errorText}>{errors.lookingFor}</Text>
        )}
        <View style={styles.lookingForGrid}>
          {LOOKING_FOR_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.lookingForCard,
                lookingFor === opt.value && styles.lookingForCardSelected,
              ]}
              onPress={() => setLookingFor(opt.value)}
            >
              <Text style={styles.lookingForEmoji}>{opt.emoji}</Text>
              <Text style={[
                styles.lookingForLabel,
                lookingFor === opt.value && styles.lookingForLabelSelected,
              ]}>
                {opt.label}
              </Text>
              <Text style={styles.lookingForDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Finish */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Mulai Almamatcher! 🚀"
          onPress={handleFinish}
          loading={isLoading}
        />
        <PrimaryButton title="← Kembali" onPress={() => router.back()} variant="ghost" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 28, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarContainer: {
    width: 120, height: 120, borderRadius: 60,
    overflow: 'hidden', backgroundColor: '#F3F4F6',
    borderWidth: 3, borderColor: '#EC4899',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center', gap: 4 },
  avatarPlaceholderIcon: { fontSize: 32 },
  avatarPlaceholderText: { fontSize: 13, color: '#9CA3AF' },
  changePhotoText: { fontSize: 14, color: '#EC4899', fontWeight: '600', marginTop: 10 },
  avatarHint: { fontSize: 12, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  // Looking for grid
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  errorText: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
  lookingForGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lookingForCard: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  lookingForCardSelected: {
    backgroundColor: '#FCE7F3',
    borderColor: '#EC4899',
  },
  lookingForEmoji: { fontSize: 24 },
  lookingForLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  lookingForLabelSelected: { color: '#EC4899' },
  lookingForDesc: { fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  footer: { gap: 12, marginTop: 8 },
});
