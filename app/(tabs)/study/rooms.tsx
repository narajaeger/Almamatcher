// app/(tabs)/study/rooms.tsx — All Study Rooms

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getStudyRooms, joinRoom, type StudyRoom,
  type StudyRoomFilters,
} from '../../../services/studyRoomService';
import { Colors, Radii, Spacing, Shadows, Fonts, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import Icon from '../../../components/ui/Icon';

type ModeFilter = 'all' | 'silent' | 'discuss';

const MODE_OPTIONS: { key: ModeFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'silent', label: 'Silent' },
  { key: 'discuss', label: 'Diskusi' },
];

export default function RoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    const filters: StudyRoomFilters = {
      university: '',
      subject: searchText.trim(),
      mode: modeFilter,
    };
    const data = await getStudyRooms(filters);
    setRooms(data);
    if (refresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, [searchText, modeFilter]);

  useEffect(() => { load(); }, [modeFilter]);

  const handleJoin = useCallback(async (room: StudyRoom) => {
    setJoiningId(room.id);
    await joinRoom(room.id);
    setJoiningId(null);
    router.push({ pathname: '/(tabs)/study/room/[roomId]', params: { roomId: room.id } });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={Colors.indigoLight} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
        </TouchableOpacity>
        <Text style={styles.title}>Study Rooms</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(tabs)/study/create-room')}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={15} color={Colors.textInverse} weight={2.6} />
          <Text style={styles.createBtnText}>Buat</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari topik atau mata kuliah..."
          placeholderTextColor={Colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />
      </View>

      {/* Mode filter pills */}
      <View style={styles.filterRow}>
        {MODE_OPTIONS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterPill, modeFilter === key && styles.filterPillActive]}
            onPress={() => setModeFilter(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, modeFilter === key && styles.filterPillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.indigo} />
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Icon name="book" size={30} color={Colors.indigo} weight={2} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada room</Text>
          <Text style={styles.emptyDesc}>Jadilah yang pertama membuat Study Room!</Text>
          <TouchableOpacity
            style={styles.createBigBtn}
            onPress={() => router.push('/(tabs)/study/create-room')}
            activeOpacity={0.8}
          >
            <Text style={styles.createBigBtnText}>Buat Room Baru</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={Colors.indigo} />
          }
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              isJoining={joiningId === item.id}
              onJoin={() => handleJoin(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function RoomCard({
  room, isJoining, onJoin,
}: { room: StudyRoom; isJoining: boolean; onJoin: () => void }) {
  const isFull = room.member_count >= room.max_capacity;
  const pct = Math.min((room.member_count / room.max_capacity) * 100, 100);

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.modeTag, room.mode === 'silent' && cardStyles.modeTagSilent]}>
          <Text style={[cardStyles.modeText, room.mode === 'silent' && cardStyles.modeTextSilent]}>
            {room.mode === 'silent' ? 'Silent' : 'Diskusi'}
          </Text>
        </View>
        <View style={[cardStyles.statusDot, isFull ? cardStyles.dotFull : cardStyles.dotOpen]} />
      </View>

      <Text style={cardStyles.name} numberOfLines={1}>{room.name}</Text>
      <Text style={cardStyles.subject}>{room.subject}</Text>
      {room.university && <Text style={cardStyles.meta}>{room.university}</Text>}
      {room.faculty && <Text style={cardStyles.meta}>{room.faculty}</Text>}

      {/* Capacity bar */}
      <View style={cardStyles.capRow}>
        <View style={cardStyles.bar}>
          <View style={[cardStyles.barFill, { width: `${pct}%` as unknown as number }, isFull && cardStyles.barFull]} />
        </View>
        <Text style={[cardStyles.capText, isFull && cardStyles.capFull]}>
          {room.member_count}/{room.max_capacity}{isFull ? ' · Penuh' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={[cardStyles.joinBtn, isFull && cardStyles.joinBtnFull, isJoining && cardStyles.joinBtnLoading]}
        onPress={onJoin}
        disabled={isJoining}
        activeOpacity={0.85}
      >
        {isJoining ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <Text style={cardStyles.joinBtnText}>
            {isFull ? 'Lihat Room' : 'Bergabung'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...Shadows.sm,
  },
  createBtnText: { color: Colors.textInverse, fontFamily: Fonts.sans.bold, fontSize: 13 },
  searchWrap: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  filterPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  filterPillText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  filterPillTextActive: { color: Colors.textInverse, fontWeight: '600' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyIcon: { fontSize: 28, color: Colors.indigo },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  createBigBtn: {
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  createBigBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 14 },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: TAB_SAFE_BOTTOM },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    gap: Spacing.xs,
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
  dotOpen: { backgroundColor: Colors.success },
  dotFull: { backgroundColor: Colors.error },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  subject: { fontSize: 14, color: Colors.textSecondary },
  meta: { fontSize: 12, color: Colors.textTertiary },
  capRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  bar: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.indigo, borderRadius: Radii.full },
  barFull: { backgroundColor: Colors.error },
  capText: { fontSize: 12, color: Colors.textTertiary, minWidth: 64, textAlign: 'right' },
  capFull: { color: Colors.error },
  joinBtn: {
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingVertical: 12,
    alignItems: 'center',
    ...Shadows.sm,
  },
  joinBtnFull: { backgroundColor: Colors.textTertiary },
  joinBtnLoading: { opacity: 0.7 },
  joinBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 14 },
});
