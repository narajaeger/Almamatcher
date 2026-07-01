// app/(tabs)/_layout.tsx — Floating liquid-glass tab bar (fully custom renderer)
// A custom `tabBar` guarantees pixel-perfect icon centering on every device
// (the default RN tab bar injects safe-area padding that pushes icons upward).

import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import {
  View, Text, StyleSheet, Platform, Pressable, Animated, useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { Colors } from '../../constants/theme';
import Icon, { type IconName } from '../../components/ui/Icon';

// ── Per-tab configuration ─────────────────────────────────────
type TabConf = {
  name: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  tint: string;
  badge?: boolean;
};

const TABS: TabConf[] = [
  { name: 'love',    label: 'Temukan', icon: 'heart', activeIcon: 'heartFill', tint: Colors.primary },
  { name: 'matches', label: 'Match',   icon: 'spark',                          tint: Colors.primary },
  { name: 'study',   label: 'Belajar', icon: 'book',                           tint: Colors.indigo },
  { name: 'chat',    label: 'Pesan',   icon: 'mail',                           tint: Colors.primary, badge: true },
  { name: 'profile', label: 'Profil',  icon: 'user',                           tint: Colors.primary },
];

const BOTTOM_INSET = Platform.OS === 'ios' ? 26 : 18;
const BAR_HEIGHT = 64;

// ── Single tab button ─────────────────────────────────────────
function TabButton({
  conf, focused, onPress, unread,
}: {
  conf: TabConf;
  focused: boolean;
  onPress: () => void;
  unread: number;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.9,
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    }).start();
  }, [focused]);

  const color = focused ? conf.tint : Colors.textTertiary;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={conf.label}
    >
      <Animated.View
        style={[
          styles.pill,
          focused && { backgroundColor: conf.tint + '22' },
          { transform: [{ scale }] },
        ]}
      >
        <Icon
          name={focused && conf.activeIcon ? conf.activeIcon : conf.icon}
          size={23}
          color={color}
          weight={focused ? 2.4 : 2}
        />
        {conf.badge && unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Custom tab bar ────────────────────────────────────────────
// Loosely typed to avoid a hard dependency on @react-navigation/bottom-tabs.
interface TabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: never) => void;
  };
}

function GlassTabBar({ state, navigation }: TabBarProps) {
  const unread = useUnreadCount();
  const { width } = useWindowDimensions();
  // Keep the floating bar from getting too wide on desktop / tablet.
  const maxWidth = Math.min(width - 36, 460);

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View style={[styles.bar, { width: maxWidth }]}>
        {/* Frosted glass background */}
        {Platform.OS !== 'web' && (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={64}
              tint="light"
              style={styles.blur}
            />
            <View pointerEvents="none" style={styles.topHighlight} />
          </View>
        )}

        {/* Tab buttons */}
        <View style={styles.row}>
          {TABS.map((conf) => {
            const route = state.routes.find((r) => r.name === conf.name);
            if (!route) return null;
            const routeIndex = state.routes.indexOf(route);
            const focused = state.index === routeIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabButton
                key={conf.name}
                conf={conf}
                focused={focused}
                onPress={onPress}
                unread={unread}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      // @ts-ignore — valid RN Navigator prop
      sceneContainerStyle={{ paddingBottom: 104 }}
      tabBar={(props) => <GlassTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="love" options={{ title: 'Temukan' }} />
      <Tabs.Screen name="matches" options={{ title: 'Match' }} />
      <Tabs.Screen name="study" options={{ title: 'Belajar' }} />
      <Tabs.Screen name="chat" options={{ title: 'Pesan' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BOTTOM_INSET,
    alignItems: 'center',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    shadowColor: '#6B6355',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 18,
    ...(Platform.OS === 'web'
      ? {
          // @ts-ignore web CSS — pronounced frosted glass
          backdropFilter: 'blur(34px) saturate(2)',
          WebkitBackdropFilter: 'blur(34px) saturate(2)',
          backgroundColor: 'rgba(253,251,247,0.5)',
          boxShadow:
            '0 12px 40px rgba(107,99,85,0.22), inset 0 1px 0 rgba(255,255,255,0.7)',
        }
      : {
          backgroundColor: 'transparent',
        }),
  },
  blur: {
    flex: 1,
    backgroundColor: 'rgba(253,251,247,0.42)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 46,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: { color: Colors.textInverse, fontSize: 9, fontWeight: '700', lineHeight: 12 },
});
