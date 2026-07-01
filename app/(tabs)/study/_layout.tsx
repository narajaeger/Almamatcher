// app/(tabs)/study/_layout.tsx
import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="rooms" />
      <Stack.Screen name="create-room" />
      <Stack.Screen name="room/[roomId]" />
    </Stack>
  );
}
