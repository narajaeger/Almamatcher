// components/ui/FilterSheet.tsx
// Bottom sheet for Discover filters

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Platform,
} from 'react-native';
import type { DiscoverFilters } from '../../services/matchService';
import { Colors, Radii, Spacing, Fonts, Gradients } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Icon, { type IconName } from './Icon';
import SearchableSelect from './SearchableSelect';
import { UNIVERSITIES, MAJORS } from '../../constants/eduData';

interface Props {
  visible: boolean;
  initial: DiscoverFilters;
  onApply: (f: DiscoverFilters) => void;
  onClose: () => void;
}

const GENDER_OPTIONS: { value: DiscoverFilters['gender']; label: string; icon: IconName }[] = [
  { value: 'all',    label: 'Semua',      icon: 'sparkles' },
  { value: 'female', label: 'Perempuan',  icon: 'user' },
  { value: 'male',   label: 'Laki-laki',  icon: 'user' },
];

const AGE_OPTIONS = Array.from({ length: 18 }, (_, i) => 17 + i); // 17–34

export default function FilterSheet({ visible, initial, onApply, onClose }: Props) {
  const [gender, setGender]         = useState<DiscoverFilters['gender']>(initial.gender);
  const [ageMin, setAgeMin]         = useState(initial.ageMin);
  const [ageMax, setAgeMax]         = useState(initial.ageMax);
  const [university, setUniversity] = useState(initial.university);
  const [major, setMajor]           = useState(initial.major ?? '');

  const handleApply = () => {
    const safeMin = Math.min(ageMin, ageMax);
    const safeMax = Math.max(ageMin, ageMax);
    onApply({ gender, ageMin: safeMin, ageMax: safeMax, university, major });
  };

  const handleReset = () => {
    setGender('all');
    setAgeMin(17);
    setAgeMax(30);
    setUniversity('');
    setMajor('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />

      <View style={sheet.container}>
        {/* Handle */}
        <View style={sheet.handle} />

        {/* Header */}
        <View style={sheet.header}>
          <TouchableOpacity onPress={handleReset}>
            <Text style={sheet.resetText}>Reset</Text>
          </TouchableOpacity>
          <Text style={sheet.title}>Filter Pencarian</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={20} color={Colors.textTertiary} weight={2.2} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={sheet.content} showsVerticalScrollIndicator={false}>
          {/* Gender */}
          <Section title="Tampilkan">
            <View style={sheet.chipRow}>
              {GENDER_OPTIONS.map((opt) => {
                const active = gender === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[sheet.chip, active && sheet.chipActive]}
                    onPress={() => setGender(opt.value)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Icon
                      name={opt.icon}
                      size={15}
                      color={active ? Colors.primaryHover : Colors.textSecondary}
                      weight={2}
                      fill={active ? Colors.primaryHover : Colors.textSecondary}
                    />
                    <Text style={[sheet.chipText, active && sheet.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          {/* Age range */}
          <Section title={`Usia: ${ageMin}–${ageMax} tahun`}>
            <View style={sheet.ageRow}>
              <View style={sheet.agePicker}>
                <Text style={sheet.agePickerLabel}>Min</Text>
                <ScrollView
                  style={sheet.ageScroll}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={36}
                  decelerationRate="fast"
                >
                  {AGE_OPTIONS.map((age) => (
                    <TouchableOpacity
                      key={age}
                      style={[sheet.ageItem, ageMin === age && sheet.ageItemActive]}
                      onPress={() => {
                        setAgeMin(age);
                        if (age > ageMax) setAgeMax(age);
                      }}
                    >
                      <Text style={[sheet.ageItemText, ageMin === age && sheet.ageItemTextActive]}>
                        {age}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={sheet.ageDash}>–</Text>

              <View style={sheet.agePicker}>
                <Text style={sheet.agePickerLabel}>Max</Text>
                <ScrollView
                  style={sheet.ageScroll}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={36}
                  decelerationRate="fast"
                >
                  {AGE_OPTIONS.map((age) => (
                    <TouchableOpacity
                      key={age}
                      style={[sheet.ageItem, ageMax === age && sheet.ageItemActive]}
                      onPress={() => {
                        setAgeMax(age);
                        if (age < ageMin) setAgeMin(age);
                      }}
                    >
                      <Text style={[sheet.ageItemText, ageMax === age && sheet.ageItemTextActive]}>
                        {age}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Section>

          {/* University */}
          <Section title="Universitas">
            <SearchableSelect
              value={university}
              onChangeText={setUniversity}
              options={UNIVERSITIES}
              placeholder="Cari universitas... (atau ketik manual)"
            />
          </Section>

          {/* Program studi / prodi (opsional) */}
          <Section title="Program Studi">
            <SearchableSelect
              value={major}
              onChangeText={setMajor}
              options={MAJORS}
              placeholder="Cari jurusan/prodi... (atau ketik manual)"
            />
          </Section>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Apply button */}
        <View style={sheet.footer}>
          <TouchableOpacity onPress={handleApply} activeOpacity={0.9} style={sheet.applyWrap}>
            <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sheet.applyBtn}>
              <Text style={sheet.applyText}>Terapkan Filter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionS.wrapper}>
      <Text style={sectionS.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionS = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  title: { fontSize: 12, fontFamily: Fonts.sans.bold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
});

const sheet = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28,25,23,0.45)',
  },
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl, borderTopRightRadius: Radii.xxl,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderMid, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontFamily: Fonts.display.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  resetText: { fontSize: 14, color: Colors.primary, fontFamily: Fonts.sans.bold },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  // Gender chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, paddingVertical: 11, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 5,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontFamily: Fonts.sans.semibold },
  chipTextActive: { color: Colors.primaryHover },

  // Age
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  agePicker: { flex: 1, alignItems: 'center', gap: 8 },
  agePickerLabel: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.sans.semibold },
  ageScroll: { height: 144, width: '100%' },
  ageItem: {
    height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  ageItemActive: { backgroundColor: Colors.primaryLight },
  ageItemText: { fontSize: 16, color: Colors.textTertiary },
  ageItemTextActive: { fontSize: 18, color: Colors.primaryHover, fontFamily: Fonts.sans.extrabold },
  ageDash: { fontSize: 20, color: Colors.borderMid, marginTop: 28 },

  // University
  input: {
    backgroundColor: Colors.background, borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, fontFamily: Fonts.sans.regular,
  },
  clearBtn: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5 },
  clearText: { fontSize: 13, color: Colors.textTertiary, fontFamily: Fonts.sans.medium },

  // Footer
  footer: {
    paddingHorizontal: Spacing.xl, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  applyWrap: { borderRadius: Radii.full },
  applyBtn: {
    borderRadius: Radii.full, paddingVertical: 16,
    alignItems: 'center',
  },
  applyText: { color: '#FFF', fontSize: 16, fontFamily: Fonts.sans.extrabold },
});
