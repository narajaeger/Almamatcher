// app/_layout.tsx
// Root layout — auth guard + session listener

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useProfileStore } from '../stores/profileStore';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';
import { applyGlobalFont } from '../lib/fontPatch';
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from '../services/notificationService';

// Upgrade typography app-wide (native) before any screen renders
applyGlobalFont();

export default function RootLayout() {
  const { profile, fetchProfile, clearProfile } = useProfileStore();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // User tapped the reset-password email link
          router.replace('/(auth)/reset-password');
        } else if (event === 'SIGNED_IN' && session) {
          await fetchProfile();
          // Register push token after sign-in
          registerForPushNotifications().catch(() => {});
        } else if (event === 'SIGNED_OUT') {
          clearProfile();
          router.replace('/(auth)/login');
        }
      }
    );

    // Check initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/(auth)/login');
      } else {
        fetchProfile();
        registerForPushNotifications().catch(() => {});
      }
    });

    // Set up notification listeners (deep-link on tap)
    const cleanupListeners = setupNotificationListeners(
      undefined,
      (response) => {
        // Navigate to the relevant screen when user taps a notification
        const data = response.notification.request.content.data as any;
        if (data?.matchId) {
          router.push({
            pathname: '/(tabs)/chat/[matchId]',
            params: { matchId: data.matchId, name: data.name ?? '', avatar: data.avatar ?? '' },
          });
        } else if (data?.screen === 'matches') {
          router.push('/(tabs)/matches');
        }
      },
    );

    return () => {
      subscription.unsubscribe();
      cleanupListeners();
    };
  }, []);

  // Route guard: redirect based on profile state
  useEffect(() => {
    if (!profile) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs       = segments[0] === '(tabs)';

    if (!profile.onboarding_completed) {
      if (!inOnboarding) {
        const step = profile.onboarding_step ?? 0;
        router.replace(step === 0 ? '/(onboarding)/step1' : `/(onboarding)/step${step + 1}` as any);
      }
    } else {
      if (!inTabs) {
        router.replace('/(tabs)/love');
      }
    }
  }, [profile?.id, profile?.onboarding_completed]);

  // Hold on a warm beige screen (native splash colour) until fonts are ready
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="u/[userId]" />
      <Stack.Screen name="legal/[doc]" />
    </Stack>
  );
}
