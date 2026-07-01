// app/(tabs)/study/create-room.tsx — Create Study Room

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createRoom } from '../../../services/studyRoomService';
import { Colors, Radii, Spacing, Shadows, Fonts, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import Icon from '../../../components/ui/Icon';

type Mode = 'silent' | 'discuss';
const CAPACITIES = [2, 3, 4, 5, 8, 10, 15, 20];

export default function CreateRoomScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [mode, setMode] = useState<Mode>('discuss');
  const [maxCapacity, setMaxCapacity] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isValid = name.trim().length >= 3 && subject.trim().length >= 2;

  const handleCreate = async () => {
    if (!isValid) return;
    setFormError(null);
    setIsLoading(true);
    const result = await createRoom({
      name: name.trim(),
      subject: subject.trim(),
      university: university.trim() || undefined,
      faculty: faculty.trim() || undefined,
      mode,
      max_capacity: maxCapacity,
    });
    setIsLoading(false);
    if (result.error) { setFormError(result.error); return; }
    if (result.room) {
      router.replace({ pathname: '/(tabs)/study/room/[roomId]', params: { roomId: result.room.id } });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={Colors.indigoLight} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
          </TouchableOpacity>
          <Text style={styles.title}>Buat Study Room</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>

          <Field label="Nama Room" required>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Belajar Kalkulus Bareng"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={60}
            />
          </Field>

          <Field label="Topik / Mata Kuliah" required>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kalkulus II, Fisika Dasar"
              placeholderTextColor={Colors.textTertiary}
              value={subject}
              onChangeText={setSubject}
              maxLength={60}
            />
          </Field>

          <Field label="Kampus" hint="opsional">
            <TextInput
              style={styles.input}
              placeholder="Nama universitas..."
              placeholderTextColor={Colors.textTertiary}
              value={university}
              onChangeText={setUniversity}
              maxLength={80}
            />
          </Field>

          <Field label="Fakultas" hint="opsional">
            <TextInput
              style={styles.input}
              placeholder="Contoh: Teknik, Ekonomi"
              placeholderTextColor={Colors.textTertiary}
              value={faculty}
              onChangeText={setFaculty}
              maxLength={60}
            />
          </Field>

          <Field label="Mode Belajar">
            <View style={styles.modeRow}>
              <ModeOption
                label="Diskusi"
                desc="Boleh tanya & ngobrol"
                selected={mode === 'discuss'}
                onPress={() => setMode('discuss')}
              />
              <ModeOption
                label="Silent"
                desc="Fokus, tanpa gangguan"
                selected={mode === 'silent'}
                onPress={() => setMode('silent')}
              />
            </View>
          </Field>

          <Field label={`Kapasitas · ${maxCapacity} orang`}>
            <View style={styles.capRow}>
              {CAPACITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.capPill, maxCapacity === c && styles.capPillActive]}
                  onPress={() => setMaxCapacity(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.capPillText, maxCapacity === c && styles.capPillTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </View>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || isLoading) && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={!isValid || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.submitBtnText}>Buat Room</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {required && <Text style={fieldStyles.required}>*</Text>}
        {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function ModeOption({
  label, desc, selected, onPress,
}: { label: string; desc: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[modeStyles.option, selected && modeStyles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[modeStyles.radio, selected && modeStyles.radioSelected]}>
        {selected && <View style={modeStyles.radioDot} />}
      </View>
      <View style={modeStyles.textCol}>
        <Text style={[modeStyles.label, selected && modeStyles.labelSelected]}>{label}</Text>
        <Text style={modeStyles.desc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  scroll: { padding: Spacing.xl, paddingBottom: TAB_SAFE_BOTTOM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  form: { gap: Spacing.xl },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeRow: { flexDirection: 'row', gap: Spacing.md },
  capRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  capPill: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  capPillActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  capPillText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  capPillTextActive: { color: Colors.textInverse },
  submitBtn: {
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.xxl,
    ...Shadows.sm,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Colors.textInverse, fontFamily: Fonts.sans.bold, fontSize: 16 },
  errorBanner: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(226,84,91,0.1)', borderWidth: 1, borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 11,
  },
  errorBannerText: { fontSize: 13, color: Colors.error, fontWeight: '500' },
});

const fieldStyles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  required: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  hint: { fontSize: 12, color: Colors.textTertiary },
});

const modeStyles = StyleSheet.create({
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigoLight,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.indigo },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: Radii.full,
    backgroundColor: Colors.indigo,
  },
  textCol: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  labelSelected: { color: Colors.indigo },
  desc: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
});
