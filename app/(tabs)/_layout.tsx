import { Tabs } from 'expo-router';
import { useOnboardingGuard } from '../../utils/onboardingGuard';

export default function TabsLayout() {
  useOnboardingGuard();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
