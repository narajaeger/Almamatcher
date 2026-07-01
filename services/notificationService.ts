// services/notificationService.ts
// Expo Push Notifications — register token, local + remote handling

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// ============================================
// NOTIFICATION HANDLER (foreground behaviour)
// ============================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================
// REGISTER FOR PUSH NOTIFICATIONS
// Stores the Expo push token in the profiles table.
// ============================================

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push notifications require a physical device
    console.log('[Notifications] Skipping — not a physical device');
    return null;
  }

  // Android: create a default notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AlmaMatcher',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EC4899',
    });
  }

  // Request permission
  const permResult = await Notifications.getPermissionsAsync();
  let isGranted = (permResult as any).granted ?? (permResult as any).status === 'granted';

  if (!isGranted) {
    const reqResult = await Notifications.requestPermissionsAsync();
    isGranted = (reqResult as any).granted ?? (reqResult as any).status === 'granted';
  }

  if (!isGranted) {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Get Expo push token — uses EAS projectId from app config if available
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  const token = tokenData.data;
  console.log('[Notifications] Push token:', token);

  // Persist to push_tokens table (separate from profiles for privacy)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('push_tokens')
      .upsert({ user_id: user.id, token, updated_at: new Date().toISOString() });
  }

  return token;
}

// ============================================
// LOCAL NOTIFICATIONS
// Used to show in-app notification when app is backgrounded
// ============================================

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: 'default' },
    trigger: null, // immediate
  });
}

// ============================================
// SETUP NOTIFICATION LISTENERS
// Call this once in the root layout.
// Returns a cleanup function.
// ============================================

export function setupNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
): () => void {
  const sub1 = Notifications.addNotificationReceivedListener((notification) => {
    onNotification?.(notification);
  });

  const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse?.(response);
  });

  return () => {
    sub1.remove();
    sub2.remove();
  };
}
