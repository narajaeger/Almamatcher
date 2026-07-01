// components/ui/Skeleton.tsx
// Lightweight shimmer placeholders — premium-feeling loading states.
// Uses a looping opacity pulse (native-driver friendly, works on web too).

import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radii, Spacing } from '../../constants/theme';

// ── Base shimmering block ─────────────────────────────────────
export function Skeleton({
  width,
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: Colors.surfaceAlt,
          opacity: pulse,
        },
        style as any,
      ]}
    />
  );
}

// ── A single list-row skeleton (avatar + two text lines) ──────
export function ListItemSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={52} height={52} radius={26} />
      <View style={styles.rowText}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="85%" height={11} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={36} height={36} radius={18} />
    </View>
  );
}

// ── A full list of row skeletons (drop-in for loading lists) ──
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </View>
  );
}

// ── Big card skeleton for the Discover swipe screen ───────────
export function DiscoverCardSkeleton({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.bigCard, { width, height }]}>
      <Skeleton width="100%" height={height} radius={Radii.xxl} />
      <View style={styles.bigCardInfo}>
        <Skeleton width="55%" height={26} radius={10} />
        <Skeleton width="75%" height={13} radius={7} style={{ marginTop: 12 }} />
        <View style={styles.bigCardChips}>
          <Skeleton width={56} height={22} radius={11} />
          <Skeleton width={70} height={22} radius={11} />
          <Skeleton width={48} height={22} radius={11} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  rowText: { flex: 1 },
  bigCard: {
    borderRadius: Radii.xxl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bigCardInfo: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: Spacing.xxl,
    paddingBottom: 88,
  },
  bigCardChips: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md },
});
