// app/(tabs)/chat/index.tsx — Chat list

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, Image, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getConversations, type Conversation } from '../../../services/chatService';
import { Colors, Radii, Spacing, Shadows, Fonts, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import Icon from '../../../components/ui/Icon';
import { ListSkeleton } from '../../../components/ui/Skeleton';
import { FadeInView } from '../../../components/ui/PressableScale';

type ChatTab = 'match' | 'buddy';

export default function ChatListScreen() {
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<ChatTab>('match');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    const data = await getConversations();
    setConvos(data);
    if (refresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`chat-list-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openChat = (convo: Conversation) => {
    router.push({
      pathname: '/(tabs)/chat/[matchId]',
      params: {
        matchId: convo.otherUserId,
        name: convo.otherName,
        avatar: convo.otherAvatar ?? '',
        kind: convo.kind,
      },
    });
  };

  const matchConvos = convos.filter((c) => c.kind === 'match');
  const buddyConvos = convos.filter((c) => c.kind === 'buddy');
  const shown = activeTab === 'buddy' ? buddyConvos : matchConvos;
  const tint = activeTab === 'buddy' ? Colors.indigo : Colors.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={activeTab === 'buddy' ? Colors.indigoLight : Colors.primaryLight} />
      <View style={styles.header}>
        <Text style={styles.title}>Pesan</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabBtn label="Match" count={matchConvos.length} active={activeTab === 'match'} tint={Colors.primary} onPress={() => setActiveTab('match')} />
        <TabBtn label="Study Buddy" count={buddyConvos.length} active={activeTab === 'buddy'} tint={Colors.indigo} onPress={() => setActiveTab('buddy')} />
      </View>

      {isLoading ? (
        <ListSkeleton count={6} />
      ) : shown.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.matchKey}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={tint} />
          }
          renderItem={({ item, index }) => (
            <FadeInView triggerKey={item.matchKey} delay={Math.min(index * 40, 240)}>
              <ConvoRow convo={item} onPress={() => openChat(item)} />
            </FadeInView>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TabBtn({
  label, count, active, tint, onPress,
}: { label: string; count: number; active: boolean; tint: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && { borderBottomColor: tint }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, active && { color: tint, fontFamily: Fonts.sans.bold }]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.tabCount, active && { backgroundColor: tint + '22' }]}>
          <Text style={[styles.tabCountText, active && { color: tint }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ConvoRow({ convo, onPress }: { convo: Conversation; onPress: () => void }) {
  const hasUnread = convo.unreadCount > 0;

  return (
    <TouchableOpacity
      style={rowStyles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Buka percakapan dengan ${convo.otherName}${hasUnread ? `, ${convo.unreadCount} pesan belum dibaca` : ''}`}
    >
      <View style={rowStyles.avatarBox}>
        {convo.otherAvatar ? (
          <Image source={{ uri: convo.otherAvatar }} style={rowStyles.avatar} />
        ) : (
          <View style={rowStyles.avatarFallback}>
            <Text style={rowStyles.avatarInitial}>
              {(convo.otherName?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        )}
        {hasUnread && <View style={rowStyles.onlineDot} />}
      </View>

      <View style={rowStyles.textBox}>
        <View style={rowStyles.topRow}>
          <Text style={[rowStyles.name, hasUnread && rowStyles.nameBold]} numberOfLines={1}>
            {convo.otherName}
          </Text>
          <Text style={rowStyles.time}>{formatTimeAgo(convo.lastMessageAt)}</Text>
        </View>
        <View style={rowStyles.bottomRow}>
          <Text
            style={[rowStyles.preview, hasUnread && rowStyles.previewBold]}
            numberOfLines={1}
          >
            {convo.isLastMine ? 'Kamu: ' : ''}{convo.lastMessage}
          </Text>
          {hasUnread && (
            <View style={rowStyles.badge}>
              <Text style={rowStyles.badgeText}>{convo.unreadCount > 9 ? '9+' : convo.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab }: { tab: ChatTab }) {
  const isBuddy = tab === 'buddy';
  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconWrap, isBuddy && { backgroundColor: Colors.indigoLight }]}>
        <Icon name={isBuddy ? 'book' : 'mail'} size={28} color={isBuddy ? Colors.indigo : Colors.primary} weight={2} />
      </View>
      <Text style={emptyStyles.title}>{isBuddy ? 'Belum ada chat study buddy' : 'Belum ada percakapan'}</Text>
      <Text style={emptyStyles.desc}>
        {isBuddy
          ? 'Tambah teman belajar dari tab Belajar untuk mulai ngobrol bareng.'
          : 'Match dengan seseorang dulu, lalu mulai ngobrol dari tab Match.'}
      </Text>
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'baru';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}j`;
  if (days < 7) return `${days}h`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(253,251,247,0.55)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(253,251,247,0.55)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontFamily: Fonts.sans.semibold, color: Colors.textTertiary },
  tabCount: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountText: { fontSize: 11, fontFamily: Fonts.sans.bold, color: Colors.textTertiary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: TAB_SAFE_BOTTOM },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Shadows.sm,
  },
  avatarBox: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  textBox: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameBold: {
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: Colors.textTertiary,
    marginRight: Spacing.sm,
  },
  previewBold: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
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
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 28,
    color: Colors.textTertiary,
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
