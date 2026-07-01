// app/(onboarding)/_layout.tsx — progress header + themed gradient shell

import { Stack } from 'expo-router';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore, selectOnboardingStep } from '../../stores/profileStore';
import { Colors, Radii, Spacing, Fonts, Gradients } from '../../constants/theme';
import ScreenGradient from '../../components/ui/ScreenGradient';

const TOTAL_STEPS = 5;

export default function OnboardingLayout() {
  const step = useProfileStore(selectOnboardingStep);
  const pct = Math.min((step / TOTAL_STEPS) * 100, 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenGradient />

      {/* Progress header */}
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={Gradients.coral}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${pct}%` as unknown as number }]}
          />
        </View>
        <Text style={styles.stepText}>
          {step < TOTAL_STEPS ? `Langkah ${step + 1} dari ${TOTAL_STEPS}` : 'Selesai!'}
        </Text>
      </View>

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  progressBarBg: {
    height: 7,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: Radii.full },
  stepText: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.sans.semibold, textAlign: 'right' },
});
