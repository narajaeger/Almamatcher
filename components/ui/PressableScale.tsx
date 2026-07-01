// components/ui/PressableScale.tsx
// Tappable wrapper that gives a subtle spring "press" scale + opacity feedback.
// Drop-in replacement for TouchableOpacity for buttons/CTAs.
// Forwards accessibility props so icon-only buttons stay screen-reader friendly.

import React, { useRef } from 'react';
import { Animated, Pressable, type ViewStyle, type StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** how far to scale down on press (default 0.94) */
  scaleTo?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityHint?: string;
}

export default function PressableScale({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.94,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityHint,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity: disabled ? 0.4 : 1 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Fade + rise-in wrapper for cards/list items ───────────────
export function FadeInView({
  children,
  style,
  duration = 280,
  delay = 0,
  /** changing this key re-triggers the fade (e.g. the current card id) */
  triggerKey,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  delay?: number;
  triggerKey?: string | number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [triggerKey]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
