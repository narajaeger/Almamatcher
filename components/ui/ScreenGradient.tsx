// components/ui/ScreenGradient.tsx
// Lightweight static warm gradient base for full screens (no animation, cheap).
// Drop as the first child of a screen, with the screen container background set
// transparent, so content floats over the beige→coral→teal dawn wash.

import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients, Colors } from '../../constants/theme';

const { width: SW } = Dimensions.get('window');

interface Props {
  /** show a soft coral glow blob top-right (default true) */
  glow?: boolean;
  /** tint of the corner glow */
  glowColor?: string;
}

export default function ScreenGradient({ glow = true, glowColor = Colors.primaryLight }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={Gradients.dawn}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {glow && (
        <View
          style={[
            styles.glow,
            {
              backgroundColor: glowColor,
              ...(Platform.OS === 'web' ? ({ filter: 'blur(72px)' } as any) : {}),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: SW * 0.7,
    height: SW * 0.7,
    borderRadius: SW * 0.35,
    opacity: 0.5,
  },
});
