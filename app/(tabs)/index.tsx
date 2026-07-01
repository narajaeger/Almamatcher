// app/(tabs)/index.tsx
// Hidden tab — redirect immediately to love screen

import { Redirect } from 'expo-router';

export default function IndexRedirect() {
  return <Redirect href="/(tabs)/love" />;
}
