// app/(tabs)/profile/index.tsx
// Screen profil saya — tampilan profil lengkap + tombol edit

import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Image, TouchableOpacity, SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useProfileStore, selectAge } from '../../../stores/profileStore';
import type { Profile } from '../../../types/profile';

export default function MyProfileScreen() {
  const { profile, fetchProfile, isLoading } = useProfileStore();
  const age = useProfileStore(selectAge);

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  if (!profile) return <LoadingPlaceholder />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchProfile} />
        }
      >
        {/* Header Card */}
        <View style={styles.heroCard}>
          {/* Edit button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/(tabs)/profile/edit')}
          >
            <Text style={styles.editBtnText}>✏️ Edit Profil</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            {profile.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐</Text>
              </View>
            )}
          </View>

          {/* Name & basic info */}
          <Text style={styles.name}>{profile.full_name ?? 'Belum diisi'}</Text>
          <Text style={styles.username}>@{profile.username ?? '—'}</Text>

          {/* Chips: age, uni, major */}
          <View style={styles.chipsRow}>
            {age && <Chip icon="🎂" label={`${age} tahun`} />}
            {profile.gender && (
              <Chip icon={profile.gender === 'male' ? '👨' : '👩'}
                    label={profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'} />
            )}
            {profile.city_origin && <Chip icon="📍" label={profile.city_origin} />}
          </View>

          {/* Bio */}
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/edit')}>
              <Text style={styles.bioPlaceholder}>+ Tambah bio</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Akademik */}
        <Section title="🎓 Info Kampus">
          <InfoRow icon="🏫" label="Universitas" value={profile.university} />
          <InfoRow icon="📚" label="Jurusan" value={profile.major} />
          <InfoRow icon="🏛️" label="Fakultas" value={profile.faculty} />
          <InfoRow icon="📅" label="Angkatan" value={profile.year_entry?.toString()} />
        </Section>

        {/* Fisik */}
        <Section title="📏 Data Diri">
          <InfoRow icon="📐" label="Tinggi" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
          <InfoRow icon="⚖️" label="Berat" value={profile.weight_kg ? `${profile.weight_kg} kg` : null} />
          <InfoRow icon="🙏" label="Agama" value={profile.religion} />
        </Section>

        {/* Kepribadian */}
        <Section title="✨ Kepribadian">
          <InfoRow icon="🧠" label="MBTI" value={profile.mbti} />
          <InfoRow icon="⭐" label="Zodiak" value={profile.zodiac} />
          {profile.hobbies && profile.hobbies.length > 0 && (
            <View style={styles.hobbiesWrapper}>
              <Text style={styles.infoLabel}>🎯 Hobi</Text>
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

        {/* Looking for */}
        {profile.looking_for && (
          <Section title="💭 Tujuan">
            <View style={styles.lookingForBadge}>
              <Text style={styles.lookingForText}>
                {getLookingForLabel(profile.looking_for)}
              </Text>
            </View>
          </Section>
        )}

        {/* Profile completeness */}
        <ProfileCompleteness profile={profile} />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Sub-components ----

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.icon}>{icon}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F4F6', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20,
  },
  icon: { fontSize: 13 },
  label: { fontSize: 13, color: '#374151' },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  card: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, gap: 12 },
});

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16, width: 24 },
  label: { fontSize: 14, color: '#6B7280', flex: 1 },
  value: { fontSize: 14, color: '#111827', fontWeight: '500', textAlign: 'right', flex: 1 },
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
      <Text style={pcStyles.title}>Kelengkapan Profil</Text>
      <View style={pcStyles.barBg}>
        <View style={[pcStyles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={pcStyles.pct}>{pct}% lengkap</Text>
      {pct < 100 && (
        <Text style={pcStyles.hint}>
          Profil lengkap = lebih banyak match! 💕
        </Text>
      )}
    </View>
  );
}
const pcStyles = StyleSheet.create({
  wrapper: { marginHorizontal: 20, padding: 16, backgroundColor: '#FFF5F7', borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  barBg: { height: 8, backgroundColor: '#FCE7F3', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#EC4899', borderRadius: 4 },
  pct: { fontSize: 13, color: '#EC4899', fontWeight: '700', marginTop: 6, textAlign: 'right' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});

function LoadingPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 32 }}>⏳</Text>
      <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Loading profil...</Text>
    </View>
  );
}

function getLookingForLabel(lf: string): string {
  const map: Record<string, string> = {
    relationship: '💕 Hubungan Serius',
    friendship: '🤝 Pertemanan',
    study_buddy: '📚 Study Buddy',
    all: '🌟 Terbuka Untuk Semua',
  };
  return map[lf] ?? lf;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  heroCard: {
    alignItems: 'center', padding: 24, paddingTop: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  editBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginBottom: 16,
  },
  editBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#EC4899' },
  avatarFallback: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FCE7F3', borderWidth: 3, borderColor: '#EC4899',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '800', color: '#EC4899' },
  premiumBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: '#FCD34D', width: 26, height: 26,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  premiumBadgeText: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12 },
  username: { fontSize: 14, color: '#9CA3AF', marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
  bio: { fontSize: 15, color: '#374151', textAlign: 'center', marginTop: 14, lineHeight: 22, paddingHorizontal: 8 },
  bioPlaceholder: { fontSize: 15, color: '#EC4899', marginTop: 14, fontStyle: 'italic' },
  hobbiesWrapper: { gap: 8 },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  hobbiesChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hobbyChip: { backgroundColor: '#FCE7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  hobbyChipText: { fontSize: 13, color: '#EC4899' },
  lookingForBadge: {
    backgroundColor: '#FCE7F3', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  lookingForText: { fontSize: 15, color: '#EC4899', fontWeight: '600' },
  bottomPad: { height: 32 },
});
