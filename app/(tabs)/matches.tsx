// app/(tabs)/matches.tsx — Mutual Match & Liked You

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, Image, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMyMatches, getLikedYouProfiles, type MatchWithProfile } from '../../services/matchService';
import { useProfileStore } from '../../stores/profileStore';
import type { ProfileCard } from '../../types/profile';
import { Colors, Radii, Spacing, Shadows, TAB_SAFE_BOTTOM } from '../../constants/theme';
import ScreenGradient from '../../components/ui/ScreenGradient';
import Icon, { type IconName } from '../../components/ui/Icon';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { FadeInView } from '../../components/ui/PressableScale';

type TabKey = 'matches' | 'liked';

export default function MatchesScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const isPremium = profile?.is_premium ?? false;

  const [activeTab, setActiveTab] = useState<TabKey>('matches');
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [likedYou, setLikedYou] = useState<{ profile: ProfileCard; likedAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    const [matchData, likedData] = await Promise.all([
      getMyMatches(),
      getLikedYouProfiles(),
    ]);
    setMatches(matchData);
    setLikedYou(likedData);
    if (refresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const refreshControl = (
    <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />
  );

  const activeCount = activeTab === 'matches' ? matches.length : likedYou.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {activeTab === 'matches' ? 'Match' : 'Suka Kamu'}
          </Text>
          <Text style={styles.subtitle}>
            {activeCount > 0 ? `${activeCount} orang` : 'Belum ada'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
          onPress={() => setActiveTab('matches')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>
            Mutual Match
          </Text>
          {matches.length > 0 && (
            <View style={[styles.tabCount, activeTab === 'matches' && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === 'matches' && styles.tabCountTextActive]}>
                {matches.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
          onPress={() => setActiveTab('liked')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'liked' && styles.tabTextActive]}>
            Suka Kamu
          </Text>
          {likedYou.length > 0 && (
            <View style={[styles.tabCount, activeTab === 'liked' && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === 'liked' && styles.tabCountTextActive]}>
                {likedYou.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ListSkeleton count={6} />
      ) : activeTab === 'matches' ? (
        matches.length === 0 ? (
          <EmptyState
            icon="mail"
            title="Belum ada match"
            desc="Suka profil seseorang? Tunggu mereka suka balik dan kalian akan match di sini."
          />
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.profile.id}
            contentContainerStyle={styles.list}
            refreshControl={refreshControl}
            renderItem={({ item, index }) => (
              <FadeInView triggerKey={item.profile.id} delay={Math.min(index * 40, 240)}>
                <MatchCard match={item} router={router} />
              </FadeInView>
            )}
          />
        )
      ) : (
        !isPremium ? (
          <VipUpsell count={likedYou.length} router={router} />
        ) : likedYou.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Belum ada yang suka"
            desc="Terus explore! Mungkin ada yang akan tertarik dengan profilmu."
          />
        ) : (
          <FlatList
            data={likedYou}
            keyExtractor={(item) => item.profile.id}
            contentContainerStyle={styles.list}
            refreshControl={refreshControl}
            renderItem={({ item, index }) => (
              <FadeInView triggerKey={item.profile.id} delay={Math.min(index * 40, 240)}>
                <LikedYouCard item={item} index={index} isPremium={isPremium} router={router} />
              </FadeInView>
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}

function MatchCard({ match, router }: { match: MatchWithProfile; router: ReturnType<typeof useRouter> }) {
  const { profile, matchedAt } = match;

  const goToChat = () => router.push({
    pathname: '/(tabs)/chat/[matchId]',
    params: { matchId: profile.id, name: profile.full_name ?? '', avatar: profile.avatar_url ?? '' },
  });

  const goToProfile = () => router.push({
    pathname: '/u/[userId]',
    params: { userId: profile.id },
  });

  return (
    <TouchableOpacity style={cardStyles.card} onPress={goToChat} activeOpacity={0.8}>
      <TouchableOpacity onPress={goToProfile} activeOpacity={0.8}>
        <View style={cardStyles.avatarWrap}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={cardStyles.avatar} />
          ) : (
            <View style={cardStyles.avatarFallback}>
              <Text style={cardStyles.avatarInitial}>
                {profile.full_name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={cardStyles.onlineDot} />
        </View>
      </TouchableOpacity>

      <View style={cardStyles.info}>
        <Text style={cardStyles.name}>{profile.full_name}</Text>
        {profile.university && (
          <Text style={cardStyles.sub} numberOfLines={1}>{profile.university}</Text>
        )}
        <Text style={cardStyles.time}>{formatTimeAgo(matchedAt)}</Text>
      </View>

      {profile.mbti && (
        <View style={cardStyles.chip}>
          <Text style={cardStyles.chipText}>{profile.mbti}</Text>
        </View>
      )}

      <TouchableOpacity
        style={cardStyles.chatBtn}
        onPress={goToChat}
        accessibilityLabel={`Buka chat dengan ${profile.full_name ?? 'match'}`}
        accessibilityRole="button"
      >
        <Icon name="arrowRight" size={17} color={Colors.primary} weight={2.4} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function LikedYouCard({
  item, index, isPremium, router,
}: {
  item: { profile: ProfileCard; likedAt: string };
  index: number;
  isPremium: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const { profile } = item;
  const isBlurred = !isPremium && index > 0;

  const goToProfile = () => {
    if (isBlurred) return;
    router.push({ pathname: '/u/[userId]', params: { userId: profile.id } });
  };

  return (
    <TouchableOpacity
      style={likedStyles.card}
      onPress={goToProfile}
      activeOpacity={isBlurred ? 1 : 0.8}
    >
      <View style={likedStyles.avatarWrap}>
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={likedStyles.avatar}
            blurRadius={isBlurred ? 18 : 0}
          />
        ) : (
          <View style={[likedStyles.avatarFallback, isBlurred && likedStyles.blurredFallback]}>
            <Text style={likedStyles.avatarInitial}>
              {isBlurred ? '?' : (profile.full_name?.[0]?.toUpperCase() ?? '?')}
            </Text>
          </View>
        )}
        <View style={likedStyles.heartBadge}>
          <Icon name="heartFill" size={12} color={Colors.primary} />
        </View>
      </View>

      <View style={likedStyles.info}>
        <Text style={[likedStyles.name, isBlurred && likedStyles.blurredText]}>
          {isBlurred ? '· · · · · ·' : (profile.full_name ?? 'Seseorang')}
        </Text>
        {profile.university && (
          <Text style={[likedStyles.sub, isBlurred && likedStyles.blurredText]} numberOfLines={1}>
            {isBlurred ? 'Upgrade untuk melihat' : profile.university}
          </Text>
        )}
        {!isBlurred && profile.age && (
          <Text style={likedStyles.sub}>{profile.age} tahun</Text>
        )}
        <Text style={likedStyles.time}>{formatTimeAgo(item.likedAt)}</Text>
      </View>

      {isBlurred ? (
        <TouchableOpacity
          style={likedStyles.lockBtn}
          onPress={() => router.push('/premium' as any)}
          activeOpacity={0.8}
          accessibilityLabel="Upgrade ke Premium untuk melihat"
          accessibilityRole="button"
        >
          <Icon name="lock" size={16} color={Colors.textTertiary} weight={2.2} />
          <Text style={likedStyles.lockText}>Premium</Text>
        </TouchableOpacity>
      ) : (
        profile.mbti && (
          <View style={likedStyles.chip}>
            <Text style={likedStyles.chipText}>{profile.mbti}</Text>
          </View>
        )
      )}
    </TouchableOpacity>
  );
}

const VIP_PERKS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'heartFill', title: 'Lihat semua yang Suka Kamu', desc: 'Langsung tahu siapa saja yang menyukaimu, tanpa nunggu.' },
  { icon: 'bolt', title: 'Super Crush', desc: 'Kirim suka spesial biar profilmu menonjol & diprioritaskan.' },
  { icon: 'arrowRight', title: 'Rewind Swipe', desc: 'Salah geser? Tarik kembali profil terakhir kapan saja.' },
  { icon: 'sparkles', title: 'Prioritas di Temukan', desc: 'Profilmu muncul lebih sering ke orang lain.' },
  { icon: 'search', title: 'Filter Lanjutan', desc: 'Saring berdasarkan universitas, jurusan, dan lainnya.' },
  { icon: 'ban', title: 'Tanpa Iklan', desc: 'Pengalaman bersih tanpa gangguan.' },
];

function VipUpsell({ count, router }: { count: number; router: ReturnType<typeof useRouter> }) {
  return (
    <ScrollView contentContainerStyle={vipStyles.scroll} showsVerticalScrollIndicator={false}>
      <View style={vipStyles.hero}>
        <View style={vipStyles.lockRing}>
          <Icon name="lock" size={30} color={Colors.primary} weight={2} />
        </View>
        <Text style={vipStyles.title}>
          {count > 0 ? `${count} orang menyukaimu` : 'Lihat siapa yang menyukaimu'}
        </Text>
        <Text style={vipStyles.subtitle}>
          Buka fitur VIP untuk melihat semua yang suka kamu — plus banyak keuntungan lainnya.
        </Text>
      </View>

      <View style={vipStyles.perks}>
        {VIP_PERKS.map((p, i) => (
          <View key={i} style={vipStyles.perkRow}>
            <View style={vipStyles.perkIcon}>
              <Icon name={p.icon} size={18} color={Colors.primary} weight={2.2} fill={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={vipStyles.perkTitle}>{p.title}</Text>
              <Text style={vipStyles.perkDesc}>{p.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={vipStyles.cta}
        onPress={() => router.push('/premium' as any)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Langganan VIP"
      >
        <Icon name="crown" size={18} color="#fff" />
        <Text style={vipStyles.ctaText}>Langganan VIP — mulai Rp 24.000/bln</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function EmptyState({ icon, title, desc }: { icon: IconName; title: string; desc: string }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Icon name={icon} size={30} color={Colors.primary} weight={2} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.desc}>{desc}</Text>
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xl,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 12,
    paddingBottom: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabCount: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tabCountTextActive: {
    color: Colors.primary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: TAB_SAFE_BOTTOM },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.primaryMid,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: Radii.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 3,
  },
  chip: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  chipText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnIcon: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});

const likedStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.primaryMid,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurredFallback: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  blurredText: {
    color: Colors.border,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 3,
  },
  chip: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  chipText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  lockBtn: {
    alignItems: 'center',
    gap: 3,
  },
  lockIcon: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  lockText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
});

const vipStyles = StyleSheet.create({
  scroll: { padding: Spacing.xl, paddingBottom: TAB_SAFE_BOTTOM, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  lockRing: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primaryMid, marginBottom: Spacing.xs,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  perks: {
    backgroundColor: Colors.surface, borderRadius: Radii.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.xs,
    ...Shadows.sm,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  perkIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  perkTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.textPrimary },
  perkDesc: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: 16,
    ...Shadows.primary,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 28,
    color: Colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
