// components/ui/GlassView.tsx
// Cross-platform liquid-glass surface.
//  • Native  → expo-blur BlurView (real backdrop blur) + frosted tint + hairline border
//  • Web      → CSS backdrop-filter blur
// Use anywhere you'd want a frosted card, chip, pill, or floating bar.

import React from 'react';
import { View, Platform, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { Glass, Radii } from '../../constants/theme';

type Tone = 'light' | 'ultraLight' | 'dark';

interface Props {
  children?: React.ReactNode;
  tone?: Tone;
  intensity?: number;          // override blur strength
  radius?: number;             // border radius
  style?: StyleProp<ViewStyle>;
  /** draw the hairline glass border (default true) */
  bordered?: boolean;
}

export default function GlassView({
  children,
  tone = 'light',
  intensity,
  radius = Radii.xl,
  style,
  bordered = true,
}: Props) {
  const g = Glass[tone];
  const blurIntensity = intensity ?? g.intensity;
  const borderStyle: ViewStyle = bordered
    ? { borderWidth: 1, borderColor: g.border }
    : {};

  // ── Web: backdrop-filter ──────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          { borderRadius: radius, overflow: 'hidden', backgroundColor: g.tint },
          borderStyle,
          // @ts-ignore web-only CSS
          {
            backdropFilter: `blur(${blurIntensity}px) saturate(1.8)`,
            WebkitBackdropFilter: `blur(${blurIntensity}px) saturate(1.8)`,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ── Native: real BlurView ─────────────────────────────────────
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, borderStyle, style]}>
      <BlurView
        intensity={blurIntensity}
        tint={tone === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* warm frosted wash on top of the blur so it reads as beige glass */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: g.tint }]} pointerEvents="none" />
      {children}
    </View>
  );
}
