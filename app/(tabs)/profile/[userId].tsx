// app/(tabs)/profile/[userId].tsx
// Public profiles moved to the top-level /u/[userId] route so they no longer
// replace the user's own Profil tab. This redirect keeps any old links working.

import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyPublicProfileRedirect() {
  const { userId, fromChat } = useLocalSearchParams<{ userId: string; fromChat?: string }>();
  return <Redirect href={{ pathname: '/u/[userId]', params: { userId, fromChat: fromChat ?? '' } }} />;
}
