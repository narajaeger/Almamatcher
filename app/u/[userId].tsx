// app/u/[userId].tsx — Public profile (top-level route, outside the tab stacks)
// Viewing someone else's profile here never replaces the user's own Profil tab.

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Image, TouchableOpacity, SafeAreaView, ActivityIndicator, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfileById } from '../../services/profileService';
import type { Profile } from '../../types/profile';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients } from '../../constants/theme';
import ScreenGradient from '../../components/ui/ScreenGradient';
import GlassView from '../../components/ui/GlassView';
import Icon from '../../components/ui/Icon';
import SocialLinks from '../../components/ui/SocialLinks';

const { width: SW } = Dimensions.get('window');
const PHOTO_W = Math.min(SW, 480) - Spacing.xl * 2;
const PHOTO_H = Math.min(PHOTO_W * 1.18, 440);

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PublicProfileScreen() {
  const { userId, fromChat } = useLocalSearchParams<{ userId: string; fromChat?: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Resilient fetch of safe public fields (falls back if social-links
      // migration hasn't been applied yet).
      const data = await getProfileById(userId);
      setProfile(data);
      setIsLoading(false);
    })();
  }, [userId]);

  const handleChat = () => {
    if (!profile) return;
    router.replace({
      pathname: '/(tabs)/chat/[matchId]',
      params: { matchId: profile.id, name: profile.full_name ?? '', avatar: profile.avatar_url ?? '' },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenGradient />
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenGradient />
        <View style={styles.center}>
          <Text style={styles.errorText}>Profil tidak ditemukan</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const age = calcAge(profile.birth_date);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{profile.full_name ?? 'Profil'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo card */}
        <View style={styles.photoCard}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.photo} />
          ) : (
            <LinearGradient colors={Gradients.romance} style={styles.photo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.photoInitial}>{profile.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </LinearGradient>
          )}
          <LinearGradient colors={Gradients.scrim} style={styles.scrim} />
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{profile.full_name ?? '—'}</Text>
              {age ? <Text style={styles.age}>{age}</Text> : null}
            </View>
            {profile.username && <Text style={styles.username}>@{profile.username}</Text>}
            <View style={styles.pillRow}>
              {profile.gender && <OnPhotoPill label={profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'} />}
              {profile.city_origin && <OnPhotoPill label={profile.city_origin} />}
            </View>
          </View>
        </View>

        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <Section title="Info Kampus">
          <InfoRow label="Universitas" value={profile.university} />
          <InfoRow label="Jurusan" value={profile.major} />
          <InfoRow label="Fakultas" value={profile.faculty} />
          <InfoRow label="Angkatan" value={profile.year_entry?.toString()} />
        </Section>

        <Section title="Data Diri">
          <InfoRow label="Tinggi" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
          <InfoRow label="Berat" value={profile.weight_kg ? `${profile.weight_kg} kg` : null} />
          <InfoRow label="Agama" value={profile.religion} />
        </Section>

        <Section title="Kepribadian">
          <InfoRow label="MBTI" value={profile.mbti} />
          <InfoRow label="Zodiak" value={profile.zodiac} />
          {profile.hobbies && profile.hobbies.length > 0 && (
            <View style={styles.hobbiesWrapper}>
              <Text style={styles.infoLabel}>Hobi</Text>
              <View style={styles.hobbyChips}>
                {profile.hobbies.map((h) => (
                  <View key={h} style={styles.hobbyChip}><Text style={styles.hobbyChipText}>{h}</Text></View>
                ))}
              </View>
            </View>
          )}
        </Section>

        {profile.looking_for && (
          <Section title="Tujuan">
            <View style={styles.lookingForBadge}>
              <Text style={styles.lookingForText}>{getLookingForLabel(profile.looking_for)}</Text>
            </View>
          </Section>
        )}

        {(profile.instagram || profile.spotify || profile.linkedin) && (
          <Section title="Sosial">
            <SocialLinks instagram={profile.instagram} spotify={profile.spotify} linkedin={profile.linkedin} />
          </Section>
        )}

        <View style={{ height: fromChat !== '1' ? 120 : 40 }} />
      </ScrollView>

      {/* Chat CTA */}
      {fromChat !== '1' && (
        <View style={styles.ctaBar}>
          <TouchableOpacity onPress={handleChat} activeOpacity={0.9} style={styles.ctaWrap}>
            <LinearGradient colors={Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chatBtn}>
              <Icon name="chat" size={18} color="#fff" weight={2.2} />
              <Text style={styles.chatBtnText}>Kirim Pesan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function OnPhotoPill({ label }: { label: string }) {
  return <View style={chipStyles.pill}><Text style={chipStyles.pillLabel}>{label}</Text></View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      <GlassView tone="light" radius={Radii.lg} style={sectionStyles.card}>{children}</GlassView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function getLookingForLabel(lf: string): string {
  const map: Record<string, string> = {
    relationship: 'Hubungan Serius',
    friendship: 'Pertemanan',
    study_buddy: 'Study Buddy',
    all: 'Terbuka untuk Semua',
  };
  return map[lf] ?? lf;
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 18, fontFamily: Fonts.display.bold, color: Colors.textPrimary, flex: 1, textAlign: 'center', letterSpacing: -0.3 },
  content: { paddingTop: Spacing.xs },

  photoCard: {
    width: PHOTO_W, height: PHOTO_H, alignSelf: 'center',
    borderRadius: Radii.xxl, overflow: 'hidden', backgroundColor: Colors.surfaceAlt, marginBottom: Spacing.lg,
  },
  photo: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 120, color: 'rgba(255,255,255,0.85)', fontFamily: Fonts.display.extrabold },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  identity: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.xl, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  name: { fontSize: 30, fontFamily: Fonts.display.extrabold, color: '#fff', letterSpacing: -0.8 },
  age: { fontSize: 24, fontFamily: Fonts.sans.regular, color: 'rgba(255,255,255,0.92)' },
  username: { fontSize: 14, color: 'rgba(255,255,255,0.78)', fontFamily: Fonts.sans.medium },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },

  bio: { fontSize: 15, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, lineHeight: 23 },
  hobbiesWrapper: { gap: Spacing.sm },
  infoLabel: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans.regular },
  hobbyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  hobbyChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 11, paddingVertical: 5, borderRadius: Radii.full },
  hobbyChipText: { fontSize: 12, color: Colors.primaryHover, fontFamily: Fonts.sans.semibold },
  lookingForBadge: { backgroundColor: Colors.secondaryLight, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radii.full, alignSelf: 'flex-start' },
  lookingForText: { fontSize: 14, color: Colors.secondaryHover, fontFamily: Fonts.sans.semibold },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 28,
  },
  ctaWrap: { borderRadius: Radii.full, ...Shadows.primary },
  chatBtn: { flexDirection: 'row', gap: 8, borderRadius: Radii.full, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  chatBtnText: { color: '#fff', fontSize: 16, fontFamily: Fonts.sans.bold },
  errorText: { fontSize: 16, color: Colors.textSecondary, fontFamily: Fonts.sans.medium },
  backLink: { marginTop: 8 },
  backLinkText: { color: Colors.primary, fontSize: 15, fontFamily: Fonts.sans.bold },
});

const chipStyles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radii.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)',
  },
  pillLabel: { fontSize: 12, color: '#fff', fontFamily: Fonts.sans.semibold },
});

const sectionStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  title: { fontSize: 11, fontFamily: Fonts.sans.bold, color: Colors.textTertiary, marginBottom: Spacing.sm, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1.4 },
  card: { padding: Spacing.lg, gap: Spacing.md },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans.regular },
  value: { fontSize: 14, color: Colors.textPrimary, fontFamily: Fonts.sans.semibold, textAlign: 'right', flex: 1, paddingLeft: 12 },
});
