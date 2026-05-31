import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Listen auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) await fetchProfile();
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && profile?.is_onboarding_complete === false) {
      router.replace('/(onboarding)/step1');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, profile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}