// app/(tabs)/love.tsx — Discover / Swipe screen
// Design: cinematic full-bleed card stack, liquid glass chips,
//         decorative background blobs, Pinterest-style typography

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  Image, TouchableOpacity, Modal,
  Animated, Platform, Dimensions, PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';
import {
  getDiscoverProfiles, likeUser, passUser,
  DEFAULT_FILTERS, type DiscoverFilters,
} from '../../services/matchService';
import { supabase } from '../../lib/supabase';
import FilterSheet from '../../components/ui/FilterSheet';
import Icon from '../../components/ui/Icon';
import { DiscoverCardSkeleton } from '../../components/ui/Skeleton';
import PressableScale from '../../components/ui/PressableScale';
import { Colors, Radii, Spacing, Shadows, Fonts } from '../../constants/theme';
import ScreenGradient from '../../components/ui/ScreenGradient';
import GlassView from '../../components/ui/GlassView';
import { PLACEHOLDER_PROFILES, type DiscoverCardItem } from '../../constants/placeholderProfiles';

const { width: SW, height: SH } = Dimensions.get('window');
const CARD_W = Math.min(SW - 32, 390);
// Portrait card (taller than wide) so it reads as a rectangle, not a square.
const CARD_H = Math.min(Math.round(CARD_W * 1.5), Math.round(SH * 0.70));
const SWIPE_THRESHOLD = Math.min(SW, CARD_W) * 0.28;

// ── Supabase helpers ──────────────────────────────────────────

function isFilterActive(f: DiscoverFilters) {
  return (
    f.gender !== 'all' ||
    f.ageMin !== DEFAULT_FILTERS.ageMin ||
    f.ageMax !== DEFAULT_FILTERS.ageMax ||
    f.university.trim() !== '' ||
    (f.major?.trim() ?? '') !== ''
  );
}

async function saveFilters(f: DiscoverFilters) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({
    pref_gender: f.gender, pref_age_min: f.ageMin,
    pref_age_max: f.ageMax, pref_university: f.university || null,
  }).eq('id', user.id);
}

async function loadSavedFilters(): Promise<DiscoverFilters> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_FILTERS;
  const { data } = await supabase
    .from('profiles')
    .select('pref_gender, pref_age_min, pref_age_max, pref_university')
    .eq('id', user.id).single();
  if (!data) return DEFAULT_FILTERS;
  return {
    gender: (data.pref_gender as DiscoverFilters['gender']) ?? DEFAULT_FILTERS.gender,
    ageMin: data.pref_age_min ?? DEFAULT_FILTERS.ageMin,
    ageMax: data.pref_age_max ?? DEFAULT_FILTERS.ageMax,
    university: data.pref_university ?? '',
    // `major` is a session-only filter (not persisted to a profile column)
    major: '',
  };
}

// ── Screen ────────────────────────────────────────────────────

export default function LoveScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const [cards, setCards] = useState<DiscoverCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActing, setIsActing] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [matchModal, setMatchModal] = useState<{ visible: boolean; profile?: DiscoverCardItem }>({ visible: false });
  const scaleAnim = useState(new Animated.Value(0))[0];
  // Swipe gesture position for the front card
  const position = useRef(new Animated.ValueXY()).current;
  // VIP: rewind + super crush
  const isPremium = profile?.is_premium ?? false;
  const lastActionRef = useRef<{ id: string; action: 'like' | 'pass'; placeholder: boolean } | null>(null);
  const [, setCanRewind] = useState(false);

  const loadCards = useCallback(async (f?: DiscoverFilters) => {
    setIsLoading(true);
    setCurrentIndex(0);
    position.setValue({ x: 0, y: 0 });
    const data = await getDiscoverProfiles(f ?? filters);
    // While the real user base is small, top up the stack with clearly-labeled
    // sample profiles so the screen never feels empty.
    setCards([...data, ...PLACEHOLDER_PROFILES]);
    setIsLoading(false);
  }, [filters, position]);

  useEffect(() => {
    (async () => {
      const saved = await loadSavedFilters();
      setFilters(saved);
      loadCards(saved);
    })();
  }, []);

  const handleApplyFilters = useCallback((f: DiscoverFilters) => {
    setFilters(f);
    setShowFilters(false);
    saveFilters(f);
    loadCards(f);
  }, [loadCards]);

  const showMatchModal = (p: DiscoverCardItem) => {
    setMatchModal({ visible: true, profile: p });
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }).start();
  };

  const doLike = useCallback(async (card: DiscoverCardItem) => {
    lastActionRef.current = { id: card.id, action: 'like', placeholder: !!card.isPlaceholder };
    setCanRewind(true);
    setIsActing(true);
    setCurrentIndex((i) => i + 1);
    // Placeholder cards are samples only — don't hit the server.
    if (card.isPlaceholder) { setIsActing(false); return; }
    const result = await likeUser(card.id);
    setIsActing(false);
    if (result.matched && result.matchedProfile) showMatchModal(result.matchedProfile);
  }, []);

  const doPass = useCallback(async (card: DiscoverCardItem) => {
    lastActionRef.current = { id: card.id, action: 'pass', placeholder: !!card.isPlaceholder };
    setCanRewind(true);
    setIsActing(true);
    setCurrentIndex((i) => i + 1);
    if (card.isPlaceholder) { setIsActing(false); return; }
    await passUser(card.id);
    setIsActing(false);
  }, []);

  // VIP — Rewind the last swipe (premium only).
  const handleRewind = useCallback(async () => {
    if (!isPremium) { router.push('/premium' as any); return; }
    const last = lastActionRef.current;
    if (!last || currentIndex === 0) return;
    setCurrentIndex((i) => Math.max(0, i - 1));
    position.setValue({ x: 0, y: 0 });
    setCanRewind(false);
    lastActionRef.current = null;
    if (!last.placeholder) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const table = last.action === 'like' ? 'likes' : 'passes';
        await supabase.from(table).delete()
          .eq('from_user_id', user.id).eq('to_user_id', last.id)
          .then(() => {}, () => {});
      }
    }
  }, [isPremium, currentIndex, position, router]);

  // VIP — Super Crush: a standout like with an upward fling (premium only).
  const handleSuperCrush = useCallback(() => {
    if (!isPremium) { router.push('/premium' as any); return; }
    if (isActing || currentIndex >= cards.length) return;
    const card = cards[currentIndex];
    if (!card) return;
    Animated.timing(position, {
      toValue: { x: 0, y: -SH }, duration: 280, useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      doLike(card);
    });
  }, [isPremium, isActing, currentIndex, cards, position, doLike, router]);

  // Animate the front card off-screen, then run the like/pass action.
  const forceSwipe = useCallback((dir: 'left' | 'right') => {
    if (isActing || currentIndex >= cards.length) return;
    const card = cards[currentIndex];
    if (!card) return;
    Animated.timing(position, {
      toValue: { x: dir === 'right' ? SW * 1.25 : -SW * 1.25, y: 40 },
      duration: 240,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      if (dir === 'right') doLike(card); else doPass(card);
    });
  }, [isActing, currentIndex, cards, position, doLike, doPass]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
  }, [position]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) forceSwipe('right');
        else if (g.dx < -SWIPE_THRESHOLD) forceSwipe('left');
        else resetPosition();
      },
      onPanResponderTerminate: () => resetPosition(),
    }),
    [position, forceSwipe, resetPosition],
  );

  const rotate = position.x.interpolate({
    inputRange: [-SW / 2, 0, SW / 2], outputRange: ['-9deg', '0deg', '9deg'], extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({ inputRange: [10, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -10], outputRange: [1, 0], extrapolate: 'clamp' });

  const handleViewFullProfile = useCallback(() => {
    const c = cards[currentIndex];
    if (!c || c.isPlaceholder) return;
    router.push({ pathname: '/u/[userId]', params: { userId: c.id } });
  }, [cards, currentIndex, router]);

  const card0 = cards[currentIndex];
  const card1 = cards[currentIndex + 1];
  const card2 = cards[currentIndex + 2];
  const hasCard = !isLoading && card0 && currentIndex < cards.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient />

      {/* ── Header ── */}
      <GlassView tone="light" radius={0} bordered={false} style={styles.header}>
        <View>
          <Text style={styles.wordmark}>alma</Text>
          <Text style={styles.wordmarkSub}>matcher</Text>
        </View>
        <View style={styles.headerRight}>
          {profile?.is_premium && (
            <View style={styles.premiumPill}>
              <Icon name="crown" size={12} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.filterBtn, isFilterActive(filters) && styles.filterBtnActive]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
            accessibilityLabel="Filter pencarian"
            accessibilityRole="button"
          >
            <FilterBarsIcon active={isFilterActive(filters)} />
            {isFilterActive(filters) && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </GlassView>

      <FilterSheet
        visible={showFilters}
        initial={filters}
        onApply={handleApplyFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* ── Card area ── */}
      <View style={styles.cardArea}>
        {isLoading ? (
          <DiscoverCardSkeleton width={CARD_W} height={CARD_H} />
        ) : !hasCard ? (
          <EmptyState onRefresh={loadCards} />
        ) : (
          <View style={styles.stack}>
            {card2 && (
              <View style={[styles.cardSlot, styles.back2]} pointerEvents="none">
                <DiscoverCard card={card2} />
              </View>
            )}
            {card1 && (
              <View style={[styles.cardSlot, styles.back1]} pointerEvents="none">
                <DiscoverCard card={card1} />
              </View>
            )}

            {/* Draggable front card (front sits above the back cards) */}
            <Animated.View
              key={card0.id}
              style={[
                styles.cardSlot, styles.front,
                { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
              ]}
              {...panResponder.panHandlers}
            >
              <DiscoverCard card={card0} />
              {!card0.isPlaceholder && (
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={handleViewFullProfile}
                  activeOpacity={0.85}
                  accessibilityLabel="Lihat profil lengkap"
                  accessibilityRole="button"
                >
                  <Text style={styles.viewProfileTxt}>Profil</Text>
                  <Icon name="arrowRight" size={15} color="#fff" weight={2.6} />
                </TouchableOpacity>
              )}
              <Animated.View style={[swipeSt.badge, swipeSt.badgeLike, { opacity: likeOpacity }]} pointerEvents="none">
                <Text style={swipeSt.badgeLikeTxt}>SUKA</Text>
              </Animated.View>
              <Animated.View style={[swipeSt.badge, swipeSt.badgeNope, { opacity: nopeOpacity }]} pointerEvents="none">
                <Text style={swipeSt.badgeNopeTxt}>LEWATI</Text>
              </Animated.View>
            </Animated.View>

            {/* Floating action buttons overlapping the card's bottom corners */}
            <View style={styles.actions} pointerEvents="box-none">
              <PressableScale
                style={[styles.btnSmall, styles.btnRewind]}
                onPress={handleRewind}
                accessibilityLabel="Rewind profil terakhir (VIP)"
              >
                <Icon name="chevronLeft" size={20} color={Colors.gold} weight={2.8} />
                {!isPremium && <View style={styles.vipDot}><Icon name="crown" size={9} color="#fff" fill="#fff" /></View>}
              </PressableScale>

              <PressableScale
                style={styles.btnPass}
                onPress={() => forceSwipe('left')}
                disabled={isActing}
                accessibilityLabel="Lewati profil ini"
              >
                <Icon name="close" size={24} color={Colors.textSecondary} weight={2.6} />
              </PressableScale>

              <PressableScale
                style={[styles.btnSmall, styles.btnSuper]}
                onPress={handleSuperCrush}
                disabled={isActing}
                accessibilityLabel="Super Crush (VIP)"
              >
                <Icon name="bolt" size={20} color="#fff" />
                {!isPremium && <View style={styles.vipDot}><Icon name="crown" size={9} color="#fff" fill="#fff" /></View>}
              </PressableScale>

              <PressableScale
                style={styles.btnLike}
                onPress={() => forceSwipe('right')}
                disabled={isActing}
                scaleTo={0.9}
                accessibilityLabel="Suka profil ini"
              >
                <Icon name="heartFill" size={30} color="#fff" />
              </PressableScale>
            </View>
          </View>
        )}
      </View>

      {/* ── Match modal ── */}
      <Modal visible={matchModal.visible} transparent animationType="fade">
        <View style={matchSt.overlay}>
          <Animated.View style={[matchSt.card, { transform: [{ scale: scaleAnim }] }]}>
            <View style={matchSt.iconRing}>
              <View style={matchSt.iconCircle}>
                <Icon name="heartFill" size={24} color="#fff" />
              </View>
            </View>
            <Text style={matchSt.title}>Cocok!</Text>
            <Text style={matchSt.subtitle}>
              Kamu dan {matchModal.profile?.full_name} saling suka
            </Text>
            <View style={matchSt.avatarRow}>
              <MatchAvatar p={profile} />
              <View style={matchSt.linkRow}>
                <View style={matchSt.linkLine} />
                <View style={matchSt.linkDot}><Icon name="heartFill" size={13} color="#fff" /></View>
                <View style={matchSt.linkLine} />
              </View>
              <MatchAvatar p={matchModal.profile} />
            </View>
            <TouchableOpacity
              style={matchSt.btnChat}
              onPress={() => {
                const m = matchModal.profile;
                setMatchModal({ visible: false });
                if (m) router.push({ pathname: '/(tabs)/chat/[matchId]', params: { matchId: m.id, name: m.full_name ?? '', avatar: m.avatar_url ?? '' } });
              }}
              activeOpacity={0.85}
            >
              <Text style={matchSt.btnChatTxt}>Mulai Ngobrol</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMatchModal({ visible: false })}>
              <Text style={matchSt.btnSkip}>Lanjut Explore</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function FilterBarsIcon({ active }: { active: boolean }) {
  const c = active ? Colors.primary : Colors.textSecondary;
  return (
    <View style={{ gap: 4, alignItems: 'flex-end' }}>
      {[16, 11, 7].map((w, i) => (
        <View key={i} style={{ width: w, height: 1.5, backgroundColor: c, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function MatchAvatar({ p }: { p?: { avatar_url?: string | null; full_name?: string | null } | null }) {
  return (
    <View style={matchSt.avatarRing}>
      {p?.avatar_url
        ? <Image source={{ uri: p.avatar_url }} style={matchSt.avatarImg} />
        : (
          <View style={matchSt.avatarFb}>
            <Text style={matchSt.avatarInit}>{p?.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
    </View>
  );
}

// Full-bleed cinematic card
function DiscoverCard({ card }: { card: DiscoverCardItem }) {
  return (
    <View style={cardSt.card}>
      {card.avatar_url
        ? <Image source={{ uri: card.avatar_url }} style={cardSt.photo} resizeMode="cover" />
        : card.isPlaceholder
          ? (
            <View style={cardSt.photoFb}>
              <View style={cardSt.anonCircle}>
                <Icon name="user" size={64} color={Colors.primary} weight={1.6} />
              </View>
            </View>
          )
          : (
            <View style={cardSt.photoFb}>
              <Text style={cardSt.photoInit}>{card.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}

      {card.isPlaceholder && (
        <View style={cardSt.sampleRibbon} pointerEvents="none">
          <Text style={cardSt.sampleRibbonText}>CONTOH · SEMENTARA</Text>
        </View>
      )}

      {/* Gradient overlay via CSS on web, solid dark overlay on native */}
      <View
        style={cardSt.gradient}
        // @ts-ignore web-only inline style override
        {...(Platform.OS === 'web' ? {
          style: [cardSt.gradient, {
            backgroundImage: 'linear-gradient(to top, rgba(10,7,5,0.92) 0%, rgba(10,7,5,0.55) 45%, rgba(10,7,5,0.0) 75%)',
          }],
        } : {})}
      />

      {/* Info panel */}
      <View style={cardSt.info}>
        <View style={cardSt.nameRow}>
          <Text style={cardSt.name}>{card.full_name}</Text>
          {card.age && <Text style={cardSt.age}>{card.age}</Text>}
        </View>

        {(card.university || card.major) && (
          <Text style={cardSt.uni} numberOfLines={1}>
            {[card.major, card.university].filter(Boolean).join('  ·  ')}
          </Text>
        )}

        {card.bio && <Text style={cardSt.bio} numberOfLines={2}>{card.bio}</Text>}

        {(card.mbti || card.zodiac || card.hobbies?.length) ? (
          <View style={cardSt.chips}>
            {card.mbti    && <GlassChip label={card.mbti} />}
            {card.zodiac  && <GlassChip label={card.zodiac} />}
            {card.hobbies?.slice(0, 3).map((h) => <GlassChip key={h} label={h} />)}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function GlassChip({ label }: { label: string }) {
  return (
    <View style={chipSt.chip}>
      <Text style={chipSt.txt}>{label}</Text>
    </View>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={emptySt.wrap}>
      {/* Decorative concentric circles */}
      <View style={emptySt.circles}>
        <View style={emptySt.c3} />
        <View style={emptySt.c2} />
        <View style={emptySt.c1}>
          <Icon name="heart" size={26} color={Colors.primary} weight={2} />
        </View>
      </View>
      <Text style={emptySt.title}>Semua sudah dilihat</Text>
      <Text style={emptySt.desc}>
        Coba lagi nanti atau ubah{'\n'}filter pencarian kamu.
      </Text>
      <TouchableOpacity style={emptySt.btn} onPress={onRefresh} activeOpacity={0.85}>
        <Text style={emptySt.btnTxt}>Muat Ulang</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          backgroundColor: 'rgba(253,251,247,0.45)',
        } as any
      : {}),
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 28,
    fontFamily: Fonts.display.extrabold,
  },
  wordmarkSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    marginTop: -2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.gold + '50',
  },
  premiumText: { fontSize: 11, fontWeight: '700', color: Colors.gold },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(253,251,247,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5, borderColor: Colors.background,
  },

  // Card area + stack
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    width: CARD_W,
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSlot: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  back1: {
    transform: [{ scale: 0.95 }, { translateY: -10 }],
    opacity: 0.72,
    zIndex: 1,
  },
  back2: {
    transform: [{ scale: 0.90 }, { translateY: -20 }],
    opacity: 0.45,
    zIndex: 0,
  },
  // Front card must sit above the back cards so they never show through.
  front: {
    zIndex: 20,
    ...(Platform.OS === 'web' ? { cursor: 'grab' } as any : {}),
  },

  // Floating action buttons — overlap the card's bottom corners
  actions: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    zIndex: 30,
  },
  btnPass: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(253,251,247,0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  btnLike: {
    width: 66,
    height: 66,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  btnSmall: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  btnRewind: {
    backgroundColor: 'rgba(253,251,247,0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  btnSuper: {
    backgroundColor: Colors.secondary,
  },
  vipDot: {
    position: 'absolute', top: -2, right: -2,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.background,
  },
  viewProfileBtn: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(28,25,23,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    zIndex: 6,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
  },
  viewProfileTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  disabled: { opacity: 0.35 },
});

const cardSt = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
    ...Shadows.lg,
  },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  photoFb: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  photoInit: {
    fontSize: 96, fontWeight: '700', color: Colors.primary, opacity: 0.4,
    fontFamily: Fonts.display.extrabold,
  },
  anonCircle: {
    width: 132, height: 132, borderRadius: 66,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  sampleRibbon: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: 'rgba(28,25,23,0.62)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px)' } as any : {}),
  },
  sampleRibbonText: { fontSize: 10, fontWeight: '800', color: '#FDFBF7', letterSpacing: 1 },

  // gradient overlay
  gradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '80%',
    // native fallback (no CSS gradient available)
    ...(Platform.OS !== 'web' ? { backgroundColor: 'rgba(10,7,5,0.0)' } : {}),
  },

  // info floating over photo
  info: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: Spacing.xxl,
    paddingBottom: 88,
    gap: Spacing.sm,
    ...(Platform.OS !== 'web' ? { backgroundColor: 'rgba(10,7,5,0.62)' } : {}),
  },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FDFBF7',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'web' ? "'Plus Jakarta Sans', sans-serif" : undefined,
  },
  age: { fontSize: 22, fontWeight: '300', color: 'rgba(253,251,247,0.88)' },
  uni: { fontSize: 13, color: 'rgba(253,251,247,0.72)', fontWeight: '400', letterSpacing: 0.3 },
  bio: { fontSize: 14, color: 'rgba(253,251,247,0.78)', lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
});

const swipeSt = StyleSheet.create({
  badge: {
    position: 'absolute', top: 26,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radii.md, borderWidth: 3,
  },
  badgeLike: {
    left: 20, borderColor: Colors.secondary, transform: [{ rotate: '-12deg' }],
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badgeNope: {
    right: 20, borderColor: Colors.primary, transform: [{ rotate: '12deg' }],
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badgeLikeTxt: { fontSize: 26, fontWeight: '900', color: Colors.secondary, letterSpacing: 1 },
  badgeNopeTxt: { fontSize: 26, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
});

const chipSt = StyleSheet.create({
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
  },
  txt: { fontSize: 12, fontWeight: '500', color: '#FDFBF7', letterSpacing: 0.2 },
});

const emptySt = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.lg, paddingHorizontal: 40 },
  circles: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  c3: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1, borderColor: Colors.borderMid,
    opacity: 0.5,
  },
  c2: {
    position: 'absolute',
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
    opacity: 0.6,
  },
  c1: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  heartIcon: { fontSize: 26, color: Colors.primary },
  title: {
    fontSize: 22, fontWeight: '700', color: Colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? "'Plus Jakarta Sans', sans-serif" : undefined,
  },
  desc: {
    fontSize: 14, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: Radii.full, marginTop: Spacing.xs,
    ...Shadows.primary,
  },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
});

const matchSt = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.72)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl, padding: 32,
    alignItems: 'center', gap: Spacing.lg,
    width: '100%', maxWidth: 360,
    ...Shadows.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.primary,
  },
  iconHeart: { fontSize: 22, color: '#fff' },
  title: {
    fontSize: 34, fontWeight: '800', color: Colors.primary,
    letterSpacing: -1.5,
    fontFamily: Fonts.display.extrabold,
  },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
  avatarRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2.5, borderColor: Colors.primaryMid,
    overflow: 'hidden', ...Shadows.sm,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFb: { flex: 1, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkLine: { width: 14, height: 1, backgroundColor: Colors.borderMid },
  linkDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  linkHeart: { fontSize: 12, color: '#fff' },
  btnChat: {
    backgroundColor: Colors.primary, borderRadius: Radii.full,
    paddingVertical: 15, width: '100%', alignItems: 'center',
    ...Shadows.primary,
  },
  btnChatTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSkip: { color: Colors.textTertiary, fontSize: 14, fontWeight: '500', paddingVertical: 6 },
});
