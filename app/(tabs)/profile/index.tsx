// app/(tabs)/profile/index.tsx — My Profile (big photo card + glass sections)

import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Image, TouchableOpacity, SafeAreaView, RefreshControl,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore, selectAge } from '../../../stores/profileStore';
import type { Profile } from '../../../types/profile';
import { Colors, Radii, Spacing, Fonts, Gradients, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import GlassView from '../../../components/ui/GlassView';
import Icon from '../../../components/ui/Icon';
import SocialLinks from '../../../components/ui/SocialLinks';

const { width: SW } = Dimensions.get('window');
const PHOTO_W = SW - Spacing.xl * 2;
const PHOTO_H = Math.min(PHOTO_W * 1.18, 440);

export default function MyProfileScreen() {
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const age = useProfileStore(selectAge);

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  if (!profile) return <LoadingPlaceholder />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchProfile} tintColor={Colors.primary} />
        }
      >
        {/* ── Photo hero card ── */}
        <View style={styles.photoCard}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.photo} />
          ) : (
            <LinearGradient colors={Gradients.romance} style={styles.photo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.photoInitial}>{profile.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </LinearGradient>
          )}

          {/* top action buttons */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/edit')} activeOpacity={0.85}>
              <GlassView tone="dark" radius={Radii.full} style={styles.editBtn}>
                <Icon name="edit" size={15} color="#fff" weight={2.2} />
                <Text style={styles.editBtnText}>Edit</Text>
              </GlassView>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/settings')} activeOpacity={0.85}>
              <GlassView tone="dark" radius={Radii.full} style={styles.iconBtn}>
                <Icon name="gear" size={19} color="#fff" weight={2} />
              </GlassView>
            </TouchableOpacity>
          </View>

          {profile.is_premium && (
            <View style={styles.premiumBadge}>
              <Icon name="crown" size={13} color={Colors.gold} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}

          {/* bottom scrim + identity */}
          <LinearGradient colors={Gradients.scrim} style={styles.scrim} />
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{profile.full_name ?? 'Nama belum diisi'}</Text>
              {age ? <Text style={styles.age}>{age}</Text> : null}
            </View>
            <Text style={styles.username}>@{profile.username ?? '—'}</Text>
            <View style={styles.pillRow}>
              {profile.gender && (
                <OnPhotoPill label={profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'} />
              )}
              {profile.city_origin && <OnPhotoPill label={profile.city_origin} />}
            </View>
          </View>
        </View>

        {/* bio */}
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile/edit')}>
            <Text style={styles.bioPlaceholder}>+ Tambah bio</Text>
          </TouchableOpacity>
        )}

        {/* completeness */}
        <ProfileCompleteness profile={profile} />

        {/* Learn about Premium */}
        <TouchableOpacity
          style={styles.premiumLearn}
          onPress={() => router.push('/premium')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Pelajari lebih lanjut tentang Premium"
        >
          <View style={styles.premiumLearnIcon}>
            <Icon name="crown" size={20} color={Colors.gold} fill={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumLearnTitle}>
              {profile.is_premium ? 'AlmaMatcher Premium aktif' : 'Pelajari AlmaMatcher Premium'}
            </Text>
            <Text style={styles.premiumLearnSub}>
              {profile.is_premium ? 'Lihat semua keuntungan VIP-mu' : 'Lihat semua fitur & keuntungan VIP'}
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={Colors.textTertiary} weight={2} />
        </TouchableOpacity>

        {/* sections */}
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
              <View style={styles.hobbiesChips}>
                {profile.hobbies.map((h) => (
                  <View key={h} style={styles.hobbyChip}>
                    <Text style={styles.hobbyChipText}>{h}</Text>
                  </View>
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

        <View style={{ height: TAB_SAFE_BOTTOM }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function OnPhotoPill({ label }: { label: string }) {
  return (
    <View style={pillStyles.pill}>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}
const pillStyles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  label: { fontSize: 12, color: '#fff', fontFamily: Fonts.sans.semibold },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      <GlassView tone="light" radius={Radii.lg} style={sectionStyles.card}>
        {children}
      </GlassView>
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  title: {
    fontFamily: Fonts.sans.bold,
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  card: { padding: Spacing.lg, gap: Spacing.md },
});

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans.regular },
  value: {
    fontSize: 14, color: Colors.textPrimary, fontFamily: Fonts.sans.semibold,
    textAlign: 'right', flex: 1, paddingLeft: 12,
  },
});

function ProfileCompleteness({ profile }: { profile: Profile }) {
  const fields = [
    profile.full_name, profile.avatar_url, profile.bio,
    profile.university, profile.major, profile.height_cm,
    profile.mbti, profile.hobbies?.length,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  return (
    <View style={pcStyles.wrapper}>
      <GlassView tone="light" radius={Radii.lg} style={pcStyles.card}>
        <View style={pcStyles.row}>
          <Text style={pcStyles.label}>Kelengkapan Profil</Text>
          <Text style={pcStyles.pct}>{pct}%</Text>
        </View>
        <View style={pcStyles.barBg}>
          <LinearGradient
            colors={Gradients.coral}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[pcStyles.barFill, { width: `${pct}%` as unknown as number }]}
          />
        </View>
        {pct < 100 && (
          <Text style={pcStyles.hint}>Profil lengkap mendapat lebih banyak perhatian</Text>
        )}
      </GlassView>
    </View>
  );
}
const pcStyles = StyleSheet.create({
  wrapper: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  card: { padding: Spacing.lg, gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontFamily: Fonts.sans.semibold, color: Colors.textSecondary },
  pct: { fontSize: 14, fontFamily: Fonts.sans.extrabold, color: Colors.primary },
  barBg: { height: 7, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: Radii.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radii.full },
  hint: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.sans.regular },
});

function LoadingPlaceholder() {
  return (
    <View style={loadStyles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
const loadStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundWarm },
});

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
  scroll: { paddingTop: Spacing.md },

  // Photo hero
  photoCard: {
    width: PHOTO_W,
    height: PHOTO_H,
    alignSelf: 'center',
    borderRadius: Radii.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
    marginBottom: Spacing.lg,
  },
  photo: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 120, color: 'rgba(255,255,255,0.85)', fontFamily: Fonts.display.extrabold },
  topRow: {
    position: 'absolute',
    top: Spacing.md, left: Spacing.md, right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  editBtnText: { color: '#fff', fontSize: 13, fontFamily: Fonts.sans.bold },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  premiumBadge: {
    position: 'absolute', top: 60, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(28,25,23,0.5)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full,
    borderWidth: 1, borderColor: Colors.gold + '66',
  },
  premiumBadgeText: { fontSize: 11, color: Colors.goldLight, fontFamily: Fonts.sans.bold },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  identity: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.xl, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  name: { fontSize: 30, fontFamily: Fonts.display.extrabold, color: '#fff', letterSpacing: -0.8 },
  age: { fontSize: 24, fontFamily: Fonts.sans.regular, color: 'rgba(255,255,255,0.92)' },
  username: { fontSize: 14, color: 'rgba(255,255,255,0.78)', fontFamily: Fonts.sans.medium },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },

  // premium learn-more
  premiumLearn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    padding: Spacing.lg, borderRadius: Radii.lg,
    backgroundColor: Colors.goldLight,
    borderWidth: 1, borderColor: Colors.gold + '55',
  },
  premiumLearnIcon: {
    width: 40, height: 40, borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumLearnTitle: { fontSize: 14.5, fontFamily: Fonts.sans.bold, color: Colors.textPrimary },
  premiumLearnSub: { fontSize: 12.5, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, marginTop: 2 },

  // bio
  bio: {
    fontSize: 15, color: Colors.textSecondary, fontFamily: Fonts.sans.regular,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, lineHeight: 23,
  },
  bioPlaceholder: {
    fontSize: 14, color: Colors.primary, fontFamily: Fonts.sans.semibold,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
  },

  hobbiesWrapper: { gap: Spacing.sm },
  infoLabel: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.sans.regular },
  hobbiesChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  hobbyChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: Radii.full,
  },
  hobbyChipText: { fontSize: 12, color: Colors.primaryHover, fontFamily: Fonts.sans.semibold },
  lookingForBadge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radii.full, alignSelf: 'flex-start',
  },
  lookingForText: { fontSize: 14, color: Colors.secondaryHover, fontFamily: Fonts.sans.semibold },
});
