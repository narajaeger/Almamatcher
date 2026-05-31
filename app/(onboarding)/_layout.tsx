// app/(onboarding)/_layout.tsx
// Layout wrapper untuk semua screen onboarding
// Berisi progress bar + safe area

import { Stack } from 'expo-router';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useProfileStore, selectOnboardingStep } from '../../stores/profileStore';

const STEP_LABELS = ['Identitas', 'Kampus', 'Fisik', 'Kepribadian', 'Selesai'];
const TOTAL_STEPS = 5;

export default function OnboardingLayout() {
  const step = useProfileStore(selectOnboardingStep);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress header */}
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((step) / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.stepText}>
          {step < TOTAL_STEPS ? `${step + 1} dari ${TOTAL_STEPS}` : 'Selesai! 🎉'}
        </Text>
      </View>

      {/* Screens */}
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
});
