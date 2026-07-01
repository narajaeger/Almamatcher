// app/(tabs)/study/index.tsx — Study Buddy Home

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getBuddyProfiles, sendBuddyRequest, cancelBuddyRequest, getMyBuddyRequests,
  acceptBuddyRequest, rejectBuddyRequest,
  type BuddyFilters, DEFAULT_BUDDY_FILTERS,
} from '../../../services/buddyService';
import { getMyRooms, type StudyRoom } from '../../../services/studyRoomService';
import type { ProfileCard } from '../../../types/profile';
import { Colors, Radii, Spacing, Shadows, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import Icon, { type IconName } from '../../../components/ui/Icon';
import { ListSkeleton } from '../../../components/ui/Skeleton';
import CommunityFeed from '../../../components/community/CommunityFeed';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { UNIVERSITIES, MAJORS } from '../../../constants/eduData';

const STUDY_SUGGESTIONS = [...MAJORS, ...UNIVERSITIES];

type TabKey = 'buddy' | 'rooms' | 'community';

export default function StudyScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('buddy');
  const [buddies, setBuddies] = useState<ProfileCard[]>([]);
  const [myRooms, setMyRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [incoming, setIncoming] = useState<ProfileCard[]>([]);
  const [filters, setFilters] = useState<BuddyFilters>(DEFAULT_BUDDY_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [buddyError, setBuddyError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    const [buddyData, roomData, reqs] = await Promise.all([
      getBuddyProfiles(filters),
      getMyRooms(),
      getMyBuddyRequests().catch(() => ({ incoming: [] as ProfileCard[], outgoing: [] as string[] })),
    ]);
    setBuddies(buddyData);
    setMyRooms(roomData);
    setIncoming(reqs.incoming);
    setSentRequests(new Set(reqs.outgoing));
    if (refresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, []);

  const handleAccept = useCallback(async (profile: ProfileCard) => {
    const id = profile.id;
    setBuddyError(null);
    // optimistic: remove from inbox
    setIncoming((prev) => prev.filter((p) => p.id !== id));
    setSentRequests((prev) => new Set(prev).add(id));
    const res = await acceptBuddyRequest(id);
    if (res.error) {
      setBuddyError('Gagal menerima permintaan. Coba lagi sebentar ya.');
      return;
    }
    // langsung buka chat sebagai teman belajar
    router.push({
      pathname: '/(tabs)/chat/[matchId]',
      params: { matchId: id, name: profile.full_name ?? '', avatar: profile.avatar_url ?? '', kind: 'buddy' },
    });
  }, [router]);

  const handleReject = useCallback(async (profile: ProfileCard) => {
    const id = profile.id;
    setBuddyError(null);
    setIncoming((prev) => prev.filter((p) => p.id !== id));
    const res = await rejectBuddyRequest(id);
    if (res.error) {
      setBuddyError('Gagal menolak permintaan. Coba lagi sebentar ya.');
    }
  }, []);

  const handleSearch = useCallback(() => {
    const newFilters: BuddyFilters = {
      ...filters,
      major: searchText.trim(),
      university: searchText.trim() ? '' : filters.university,
    };
    setFilters(newFilters);
    getBuddyProfiles(newFilters).then(setBuddies);
  }, [searchText, filters]);

  const handleBuddyRequest = useCallback(async (profile: ProfileCard) => {
    const id = profile.id;
    setBuddyError(null);

    // Toggle off — cancel an existing request
    if (sentRequests.has(id)) {
      await cancelBuddyRequest(id);
      setSentRequests((prev) => { const s = new Set(prev); s.delete(id); return s; });
      return;
    }

    // Send the request; surface any failure (works on web & native)
    const res = await sendBuddyRequest(id);
    if (res.error) {
      setBuddyError('Gagal menambahkan teman belajar. Coba lagi sebentar ya.');
      return;
    }
    setSentRequests((prev) => new Set(prev).add(id));

    // NOTE: do NOT navigate into the chat here. The request is only
    // one-directional until the other person accepts — the buddy chat
    // trigger (and hasMutualBuddy check) requires BOTH sides to have
    // requested each other, so messages sent before that would silently
    // fail and vanish. Chat only opens once mutual (see handleAccept).
  }, [sentRequests]);

  const refreshControl = (
    <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={Colors.indigo} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={Colors.indigoLight} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Belajar</Text>
          <Text style={styles.subtitle}>Temukan teman belajar</Text>
        </View>
        <TouchableOpacity
          style={styles.roomsBtn}
          onPress={() => router.push('/(tabs)/study/rooms')}
          activeOpacity={0.8}
        >
          <Text style={styles.roomsBtnText}>Semua Room</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buddy' && styles.tabActive]}
          onPress={() => setActiveTab('buddy')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'buddy' && styles.tabTextActive]}>
            Buddy Finder
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rooms' && styles.tabActive]}
          onPress={() => setActiveTab('rooms')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>
            Room Saya
          </Text>
          {myRooms.length > 0 && (
            <View style={[styles.tabCount, activeTab === 'rooms' && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === 'rooms' && styles.tabCountTextActive]}>
                {myRooms.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.tabActive]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
            Komunitas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'community' ? (
        <CommunityFeed />
      ) : activeTab === 'buddy' ? (
        <>
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchableSelect
                value={searchText}
                onChangeText={setSearchText}
                options={STUDY_SUGGESTIONS}
                placeholder="Cari jurusan atau kampus..."
                accent={Colors.indigo}
                onSelect={(v) => {
                  const next: BuddyFilters = { ...filters, major: v.trim(), university: '' };
                  setFilters(next);
                  getBuddyProfiles(next).then(setBuddies);
                }}
              />
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
              <Text style={styles.searchBtnText}>Cari</Text>
            </TouchableOpacity>
          </View>

          {buddyError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{buddyError}</Text>
            </View>
          )}

          {!isLoading && incoming.length > 0 && (
            <View style={inboxStyles.section}>
              <View style={inboxStyles.headerRow}>
                <Text style={inboxStyles.title}>Permintaan Masuk</Text>
                <View style={inboxStyles.countPill}>
                  <Text style={inboxStyles.countText}>{incoming.length}</Text>
                </View>
              </View>
              {incoming.map((p) => (
                <View key={p.id} style={inboxStyles.card}>
                  {p.avatar_url ? (
                    <Image source={{ uri: p.avatar_url }} style={inboxStyles.avatar} />
                  ) : (
                    <View style={inboxStyles.avatarFallback}>
                      <Text style={inboxStyles.avatarInitial}>
                        {p.full_name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <View style={inboxStyles.info}>
                    <Text style={inboxStyles.name} numberOfLines={1}>{p.full_name ?? 'Seseorang'}</Text>
                    {(p.major || p.university) && (
                      <Text style={inboxStyles.detail} numberOfLines={1}>
                        {[p.major, p.university].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    <Text style={inboxStyles.hint}>ingin jadi teman belajarmu</Text>
                  </View>
                  <View style={inboxStyles.actions}>
                    <TouchableOpacity
                      style={inboxStyles.rejectBtn}
                      onPress={() => handleReject(p)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Tolak permintaan dari ${p.full_name ?? 'pengguna'}`}
                      accessibilityRole="button"
                    >
                      <Icon name="close" size={18} color={Colors.textSecondary} weight={2.4} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={inboxStyles.acceptBtn}
                      onPress={() => handleAccept(p)}
                      activeOpacity={0.85}
                      accessibilityLabel={`Terima permintaan dari ${p.full_name ?? 'pengguna'}`}
                      accessibilityRole="button"
                    >
                      <Icon name="check" size={18} color="#fff" weight={2.6} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {isLoading ? (
            <ListSkeleton count={6} />
          ) : buddies.length === 0 ? (
            <EmptyState
              icon="search"
              title="Tidak ada hasil"
              desc="Coba ubah filter pencarian kamu."
            />
          ) : (
            <FlatList
              data={buddies}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              refreshControl={refreshControl}
              renderItem={({ item }) => (
                <BuddyCard
                  profile={item}
                  isSent={sentRequests.has(item.id)}
                  onRequest={() => handleBuddyRequest(item)}
                  onViewProfile={() =>
                    router.push({ pathname: '/u/[userId]', params: { userId: item.id } })
                  }
                />
              )}
            />
          )}
        </>
      ) : (
        isLoading ? (
          <ListSkeleton count={5} />
        ) : myRooms.length === 0 ? (
          <View style={styles.emptyRooms}>
            <EmptyState
              icon="book"
              title="Belum join room"
              desc="Temukan atau buat Study Room dan mulai belajar bersama!"
            />
            <TouchableOpacity
              style={styles.createRoomBtn}
              onPress={() => router.push('/(tabs)/study/rooms')}
              activeOpacity={0.8}
            >
              <Text style={styles.createRoomBtnText}>Cari Study Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={myRooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={refreshControl}
            renderItem={({ item }) => (
              <RoomCard
                room={item}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/study/room/[roomId]', params: { roomId: item.id } })
                }
              />
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}

// ---- Sub-components ----

function BuddyCard({
  profile, isSent, onRequest, onViewProfile,
}: {
  profile: ProfileCard;
  isSent: boolean;
  onRequest: () => void;
  onViewProfile: () => void;
}) {
  return (
    <TouchableOpacity style={buddyStyles.card} onPress={onViewProfile} activeOpacity={0.8}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={buddyStyles.avatar} />
      ) : (
        <View style={buddyStyles.avatarFallback}>
          <Text style={buddyStyles.avatarInitial}>
            {profile.full_name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      <View style={buddyStyles.info}>
        <Text style={buddyStyles.name} numberOfLines={1}>{profile.full_name}</Text>
        {profile.major && (
          <Text style={buddyStyles.detail} numberOfLines={1}>{profile.major}</Text>
        )}
        {profile.university && (
          <Text style={buddyStyles.detail} numberOfLines={1}>{profile.university}</Text>
        )}
        <View style={buddyStyles.chips}>
          {profile.mbti && (
            <View style={buddyStyles.chip}>
              <Text style={buddyStyles.chipText}>{profile.mbti}</Text>
            </View>
          )}
          {profile.hobbies?.slice(0, 2).map((h) => (
            <View key={h} style={[buddyStyles.chip, buddyStyles.chipGreen]}>
              <Text style={[buddyStyles.chipText, buddyStyles.chipTextGreen]}>{h}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[buddyStyles.requestBtn, isSent && buddyStyles.requestBtnSent]}
        onPress={(e) => { e.stopPropagation(); onRequest(); }}
        activeOpacity={0.8}
        accessibilityLabel={isSent ? `Batalkan permintaan ke ${profile.full_name ?? 'pengguna'}` : `Kirim permintaan teman belajar ke ${profile.full_name ?? 'pengguna'}`}
        accessibilityRole="button"
      >
        <Icon
          name={isSent ? 'check' : 'plus'}
          size={18}
          color={isSent ? Colors.secondary : Colors.indigo}
          weight={2.6}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function RoomCard({ room, onPress }: { room: StudyRoom; onPress: () => void }) {
  const isFull = room.member_count >= room.max_capacity;
  return (
    <TouchableOpacity style={roomStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={roomStyles.topRow}>
        <View style={[roomStyles.modeTag, room.mode === 'silent' && roomStyles.modeTagSilent]}>
          <Text style={[roomStyles.modeText, room.mode === 'silent' && roomStyles.modeTextSilent]}>
            {room.mode === 'silent' ? 'Silent' : 'Diskusi'}
          </Text>
        </View>
        <View style={[roomStyles.statusDot, isFull ? roomStyles.statusFull : roomStyles.statusOpen]} />
      </View>
      <Text style={roomStyles.name} numberOfLines={1}>{room.name}</Text>
      <Text style={roomStyles.subject} numberOfLines={1}>{room.subject}</Text>
      {room.university && (
        <Text style={roomStyles.university} numberOfLines={1}>{room.university}</Text>
      )}
      <Text style={[roomStyles.capacity, isFull && roomStyles.capacityFull]}>
        {room.member_count}/{room.max_capacity} anggota{isFull ? ' · Penuh' : ''}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, title, desc }: { icon: IconName; title: string; desc: string }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Icon name={icon} size={30} color={Colors.indigo} weight={2} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.desc}>{desc}</Text>
    </View>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  roomsBtn: {
    backgroundColor: Colors.indigoLight,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.indigo + '40',
  },
  roomsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.indigo,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.lg,
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
  tabActive: { borderBottomColor: Colors.indigo },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textTertiary },
  tabTextActive: { color: Colors.indigo, fontWeight: '600' },
  tabCount: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountActive: { backgroundColor: Colors.indigoLight },
  tabCountText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
  tabCountTextActive: { color: Colors.indigo },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchBtn: {
    backgroundColor: Colors.indigo,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    ...Shadows.sm,
  },
  searchBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 14 },
  errorBanner: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: 'rgba(226,84,91,0.1)', borderWidth: 1, borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  errorBannerText: { fontSize: 13, color: Colors.error, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: TAB_SAFE_BOTTOM },
  emptyRooms: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingBottom: TAB_SAFE_BOTTOM },
  createRoomBtn: {
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingVertical: 13,
    paddingHorizontal: 28,
    ...Shadows.sm,
  },
  createRoomBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 14 },
});

const buddyStyles = StyleSheet.create({
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
  avatar: {
    width: 54,
    height: 54,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.indigo + '60',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight,
    borderWidth: 1.5,
    borderColor: Colors.indigo + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: Colors.indigo },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  detail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  chip: {
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  chipText: { fontSize: 11, fontWeight: '500', color: Colors.indigo },
  chipGreen: { backgroundColor: Colors.secondaryLight },
  chipTextGreen: { color: Colors.secondary },
  requestBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.indigo + '40',
  },
  requestBtnSent: {
    backgroundColor: Colors.secondaryLight,
    borderColor: Colors.secondary + '40',
  },
  requestBtnText: { fontSize: 18, color: Colors.indigo, lineHeight: 22 },
  requestBtnTextSent: { fontSize: 14, color: Colors.secondary, fontWeight: '700' },
});

const roomStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modeTag: {
    backgroundColor: Colors.indigoLight,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  modeTagSilent: { backgroundColor: Colors.surfaceAlt },
  modeText: { fontSize: 11, fontWeight: '600', color: Colors.indigo },
  modeTextSilent: { color: Colors.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: Radii.full },
  statusOpen: { backgroundColor: Colors.success },
  statusFull: { backgroundColor: Colors.error },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  subject: { fontSize: 13, color: Colors.textSecondary },
  university: { fontSize: 12, color: Colors.textTertiary },
  capacity: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  capacityFull: { color: Colors.error },
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
    backgroundColor: Colors.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  icon: { fontSize: 28, color: Colors.indigo },
  title: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

const inboxStyles = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  title: {
    fontSize: 13, fontWeight: '700', color: Colors.indigo,
    letterSpacing: 0.4, textTransform: 'uppercase',
  },
  countPill: {
    backgroundColor: Colors.indigo, borderRadius: Radii.full,
    minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.indigoLight + '66',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.indigo + '33',
  },
  avatar: {
    width: 46, height: 46, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: Colors.indigo + '60',
  },
  avatarFallback: {
    width: 46, height: 46, borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight,
    borderWidth: 1.5, borderColor: Colors.indigo + '60',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: Colors.indigo },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  detail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  hint: { fontSize: 11, color: Colors.indigo, marginTop: 2, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  rejectBtn: {
    width: 36, height: 36, borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtn: {
    width: 36, height: 36, borderRadius: Radii.full,
    backgroundColor: Colors.indigo,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
});
