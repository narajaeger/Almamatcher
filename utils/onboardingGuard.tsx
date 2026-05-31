import { useEffect } from 'react';
import { router } from 'expo-router';
import { useProfileStore, selectOnboardingDone, selectOnboardingStep } from '../stores/profileStore';

export function useOnboardingGuard() {
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const onboardingDone = useProfileStore(selectOnboardingDone);
  const onboardingStep = useProfileStore(selectOnboardingStep);

  useEffect(() => {
    if (!profile && !isLoading) {
      fetchProfile();
      return;
    }

    if (profile && !onboardingDone) {
      const nextStep = Math.min(onboardingStep + 1, 5);
      router.replace(`/(onboarding)/step${nextStep}` as any);
    }
  }, [profile, onboardingDone, isLoading]);
}
