// components/ui/SocialLinks.tsx
// Renders tappable Instagram / Spotify / LinkedIn links on a profile.
// Stored values may be a full URL or just a handle — both are normalized.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Radii, Fonts } from '../../constants/theme';

type Props = {
  instagram?: string | null;
  spotify?: string | null;
  linkedin?: string | null;
};

const BRAND = {
  instagram: { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.12)' },
  spotify:   { label: 'Spotify',   color: '#1DB954', bg: 'rgba(29,185,84,0.12)' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', bg: 'rgba(10,102,194,0.12)' },
};

function buildUrl(kind: keyof typeof BRAND, raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const h = v.replace(/^@/, '');
  if (kind === 'instagram') return `https://instagram.com/${h}`;
  if (kind === 'linkedin') return `https://www.linkedin.com/in/${h}`;
  return `https://open.spotify.com/user/${h}`; // spotify
}

function pretty(raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) {
    return v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
  }
  return v.startsWith('@') ? v : `@${v}`;
}

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function SocialLinks({ instagram, spotify, linkedin }: Props) {
  const entries: { kind: keyof typeof BRAND; value: string }[] = [];
  if (instagram?.trim()) entries.push({ kind: 'instagram', value: instagram });
  if (spotify?.trim()) entries.push({ kind: 'spotify', value: spotify });
  if (linkedin?.trim()) entries.push({ kind: 'linkedin', value: linkedin });
  if (entries.length === 0) return null;

  return (
    <View style={styles.row}>
      {entries.map(({ kind, value }) => {
        const b = BRAND[kind];
        return (
          <TouchableOpacity
            key={kind}
            style={[styles.pill, { backgroundColor: b.bg, borderColor: b.color + '40' }]}
            onPress={() => openLink(buildUrl(kind, value))}
            activeOpacity={0.75}
            accessibilityRole="link"
            accessibilityLabel={`${b.label}: ${pretty(value)}`}
            {...(Platform.OS === 'web' ? { } : {})}
          >
            <View style={[styles.dot, { backgroundColor: b.color }]} />
            <View>
              <Text style={[styles.brand, { color: b.color }]}>{b.label}</Text>
              <Text style={styles.handle} numberOfLines={1}>{pretty(value)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: Radii.md, borderWidth: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  brand: { fontSize: 12, fontFamily: Fonts.sans.bold },
  handle: { fontSize: 12, color: '#6B6355', fontFamily: Fonts.sans.regular, maxWidth: 150 },
});
