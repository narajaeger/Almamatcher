// components/ui/GradientBackdrop.tsx
// Full-screen animated gradient backdrop with softly drifting colour blobs.
// Base wash = warm beige→coral→teal (Gradients.dawn). Blobs breathe & drift on a loop.

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

interface BlobCfg {
  size: number;
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

const BLOBS: BlobCfg[] = [
  { size: 340, colors: ['#FF8A7A', '#FF6B6B'], start: { x: -90, y: -60 },  delay: 0,    driftX: 26,  driftY: 20, opacity: 0.55 },
  { size: 300, colors: ['#5BD0C4', '#2DB5A8'], start: { x: SW - 200, y: 80 }, delay: 900, driftX: -22, driftY: 28, opacity: 0.42 },
  { size: 260, colors: ['#FFC08A', '#FF8A7A'], start: { x: SW - 150, y: SH - 320 }, delay: 1700, driftX: -18, driftY: -24, opacity: 0.4 },
  { size: 240, colors: ['#9CDDD4', '#5BD0C4'], start: { x: -70, y: SH - 260 }, delay: 2400, driftX: 24, driftY: -18, opacity: 0.34 },
];

function Blob({ cfg }: { cfg: BlobCfg }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 6500,
          delay: cfg.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cfg.delay, t]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.driftX] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.driftY] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size / 2,
          left: cfg.start.x,
          top: cfg.start.y,
          opacity: cfg.opacity,
          transform: [{ translateX }, { translateY }, { scale }],
          // soft edges: heavy blur on web; native leans on low opacity + layering
          ...(Platform.OS === 'web' ? ({ filter: `blur(${cfg.size * 0.18}px)` } as any) : {}),
        },
      ]}
    >
      <LinearGradient
        colors={cfg.colors}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={{ width: '100%', height: '100%', borderRadius: cfg.size / 2 }}
      />
    </Animated.View>
  );
}

interface Props {
  /** dim the blobs (e.g. behind a busy form). 0–1 */
  blobOpacity?: number;
  children?: React.ReactNode;
}

export default function GradientBackdrop({ children, blobOpacity = 1 }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* base wash */}
      <LinearGradient
        colors={Gradients.dawn}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* drifting colour blobs */}
      <View style={[StyleSheet.absoluteFill, { opacity: blobOpacity }]} pointerEvents="none">
        {BLOBS.map((cfg, i) => (
          <Blob key={i} cfg={cfg} />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute' },
});
