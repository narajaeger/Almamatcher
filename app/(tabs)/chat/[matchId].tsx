// app/(tabs)/chat/[matchId].tsx
// Layar chat 1-on-1 dengan real-time Supabase Realtime

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToMessages,
  type Message,
  type ChatKind,
} from '../../../services/chatService';
import { unmatchUser } from '../../../services/matchService';
import { blockUser, reportUser, REPORT_REASON_LABELS, type ReportReason } from '../../../services/blockService';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radii, Spacing, Fonts, Gradients, TAB_SAFE_BOTTOM } from '../../../constants/theme';
import ScreenGradient from '../../../components/ui/ScreenGradient';
import Icon from '../../../components/ui/Icon';
import { ConfirmDialog, ActionMenu, type ActionMenuItem } from '../../../components/ui/ConfirmDialog';

export default function ChatScreen() {
  const router = useRouter();
  const { matchId, name, avatar, kind } = useLocalSearchParams<{
    matchId: string;
    name: string;
    avatar: string;
    kind?: string;
  }>();
  const isBuddy = kind === 'buddy';
  const chatKind: ChatKind = isBuddy ? 'buddy' : 'match';
  const accent = isBuddy ? Colors.indigo : Colors.primary;

  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  // Menu + confirmation modals (Alert/ActionSheet don't render on web)
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [confirmKind, setConfirmKind] = useState<'unmatch' | 'block' | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  // Load messages + subscribe to new ones
  useEffect(() => {
    if (!myId || !matchId) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      setIsLoading(true);
      const data = await getMessages(matchId, chatKind);
      setMessages(data);
      setIsLoading(false);

      // Mark incoming as read
      markAsRead(matchId, chatKind);

      // Real-time subscription
      unsubscribe = subscribeToMessages(myId, matchId, (newMsg) => {
        setMessages((prev) => {
          // Avoid duplicate if we already optimistically added it
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id !== myId) {
          markAsRead(matchId, chatKind);
        }
      }, chatKind);
    })();

    return () => { unsubscribe?.(); };
  }, [myId, matchId]);

  // Typing indicator — broadcast channel
  useEffect(() => {
    if (!myId || !matchId) return;
    const channel = supabase
      .channel(`typing:${[myId, matchId].sort().join(':')}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId !== myId) {
          setIsOtherTyping(true);
          // Auto-clear after 3s if no new event
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [myId, matchId]);

  // Broadcast typing event when user types
  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (typingChannelRef.current && myId) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: myId },
      });
    }
  }, [myId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || !matchId || !myId) return;

    setText('');
    setIsSending(true);

    // Optimistic UI — add locally before server confirms
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      match_key: '',
      sender_id: myId,
      receiver_id: matchId,
      content: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessage(matchId, trimmed, chatKind);
    setIsSending(false);

    if (result.message) {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? result.message! : m)),
      );
    } else {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      // Could show a toast here
    }
  }, [text, isSending, matchId, myId]);

  // Always return to the chat list (router.back would land on whatever screen
  // opened the chat — e.g. the Love tab — which was the reported bug).
  const handleBack = useCallback(() => {
    router.replace('/(tabs)/chat');
  }, [router]);

  const handleViewProfile = useCallback(() => {
    if (!matchId) return;
    router.push({
      pathname: '/u/[userId]',
      params: { userId: matchId, fromChat: '1' },
    });
  }, [matchId]);

  const doUnmatch = useCallback(async () => {
    if (!matchId) return;
    setBusy(true);
    await unmatchUser(matchId);
    setBusy(false);
    setConfirmKind(null);
    router.replace('/(tabs)/chat');
  }, [matchId, router]);

  const doBlock = useCallback(async () => {
    if (!matchId) return;
    setBusy(true);
    await blockUser(matchId);
    await unmatchUser(matchId);
    setBusy(false);
    setConfirmKind(null);
    router.replace('/(tabs)/chat');
  }, [matchId, router]);

  const handleReportReason = useCallback(async (reason: ReportReason) => {
    if (!matchId) return;
    setReportVisible(false);
    await reportUser(matchId, reason);
    await blockUser(matchId); // also block after report
    router.replace('/(tabs)/chat');
  }, [matchId, router]);

  const menuItems: ActionMenuItem[] = [
    { label: 'Lihat Profil', icon: <Icon name="user" size={18} color={Colors.textSecondary} weight={2} />, onPress: handleViewProfile },
    { label: 'Unmatch', icon: <Icon name="close" size={18} color={Colors.textSecondary} weight={2.2} />, onPress: () => setConfirmKind('unmatch') },
    { label: 'Blokir', icon: <Icon name="ban" size={18} color={Colors.error} weight={2} />, destructive: true, onPress: () => setConfirmKind('block') },
    { label: 'Laporkan', icon: <Icon name="bell" size={18} color={Colors.error} weight={2} />, destructive: true, onPress: () => setReportVisible(true) },
  ];

  const reportItems: ActionMenuItem[] = (Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][])
    .map(([value, label]) => ({ label, onPress: () => handleReportReason(value) }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={isBuddy ? Colors.indigoLight : Colors.primaryLight} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Icon name="chevronLeft" size={24} color={Colors.textPrimary} weight={2.4} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={handleViewProfile}
          activeOpacity={0.7}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={[styles.headerAvatar, { borderColor: isBuddy ? Colors.indigo + '99' : Colors.primaryMid }]} />
          ) : (
            <View style={[styles.headerAvatarFallback, isBuddy && { backgroundColor: Colors.indigoLight }]}>
              <Text style={[styles.headerAvatarInitial, { color: accent }]}>
                {name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{name}</Text>
            <View style={styles.headerSubRow}>
              <Icon name={isBuddy ? 'book' : 'heartFill'} size={11} color={accent} />
              <Text style={[styles.headerSub, { color: accent }]}>
                {isBuddy ? 'Teman belajar' : 'Match kamu'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Opsi lainnya"
          accessibilityRole="button"
        >
          <Icon name="more" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Options menu + confirmations */}
      <ActionMenu
        visible={menuVisible}
        title={name ?? 'Opsi'}
        items={menuItems}
        onClose={() => setMenuVisible(false)}
      />
      <ActionMenu
        visible={reportVisible}
        title="Laporkan — pilih alasan"
        items={reportItems}
        onClose={() => setReportVisible(false)}
      />
      <ConfirmDialog
        visible={confirmKind === 'unmatch'}
        title="Unmatch?"
        message={`Kamu yakin ingin unmatch dengan ${name ?? 'pengguna ini'}? Semua pesan akan hilang.`}
        confirmLabel="Unmatch"
        destructive
        loading={busy}
        onConfirm={doUnmatch}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmDialog
        visible={confirmKind === 'block'}
        title="Blokir Pengguna?"
        message={`${name ?? 'Pengguna ini'} tidak akan bisa menghubungi kamu dan tidak akan muncul di pencarian.`}
        confirmLabel="Blokir"
        destructive
        loading={busy}
        onConfirm={doBlock}
        onCancel={() => setConfirmKind(null)}
      />

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item, index }) => (
              <Bubble
                msg={item}
                isMine={item.sender_id === myId}
                showDate={
                  index === 0 ||
                  !isSameDay(messages[index - 1].created_at, item.created_at)
                }
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  Belum ada pesan. Mulai dulu! 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>sedang mengetik</Text>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ketik pesan..."
            placeholderTextColor={Colors.textTertiary}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || isSending}
            activeOpacity={0.85}
            accessibilityLabel="Kirim pesan"
            accessibilityRole="button"
            style={(!text.trim() || isSending) && styles.sendBtnDisabled}
          >
            <LinearGradient colors={isBuddy ? Gradients.teal : Gradients.coral} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
              <Icon name="send" size={18} color="#fff" weight={2.2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---- Sub-components ----

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function Bubble({ msg, isMine, showDate }: { msg: Message; isMine: boolean; showDate: boolean }) {
  const time = new Date(msg.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });
  const dateLabel = new Date(msg.created_at).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
      {showDate && (
        <View style={bubbleStyles.dateSep}>
          <Text style={bubbleStyles.dateText}>{dateLabel}</Text>
        </View>
      )}
      <View style={[bubbleStyles.row, isMine && bubbleStyles.rowMine]}>
        <View style={[bubbleStyles.bubble, isMine ? bubbleStyles.bubbleMine : bubbleStyles.bubbleTheirs]}>
          <Text style={[bubbleStyles.text, isMine && bubbleStyles.textMine]}>
            {msg.content}
          </Text>
          <Text style={[bubbleStyles.time, isMine && bubbleStyles.timeMine]}>
            {time}{isMine && (msg.read_at ? ' ✓✓' : ' ✓')}
          </Text>
        </View>
      </View>
    </>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(253,251,247,0.55)',
    gap: Spacing.sm,
  },
  backBtn: { padding: 6, width: 38, alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primaryMid },
  headerAvatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarInitial: { fontSize: 16, fontFamily: Fonts.sans.extrabold, color: Colors.primary },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: Fonts.sans.bold, color: Colors.textPrimary },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  headerSub: { fontSize: 12, color: Colors.secondary, fontFamily: Fonts.sans.medium },
  menuBtn: { padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textTertiary, fontSize: 14, fontFamily: Fonts.sans.regular },
  messageList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    marginBottom: TAB_SAFE_BOTTOM, // lift above floating tab bar
    gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(253,251,247,0.55)',
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: 11,
    fontSize: 15, fontFamily: Fonts.sans.regular, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  typingRow: { paddingHorizontal: Spacing.lg, paddingBottom: 4 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceAlt, borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
  },
  typingText: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.sans.regular, fontStyle: 'italic' },
  typingDots: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.textTertiary },
  dot1: {}, dot2: { opacity: 0.6 }, dot3: { opacity: 0.3 },
});

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 2 },
  rowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '76%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, gap: 2,
  },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 5 },
  bubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  text: { fontSize: 15, color: Colors.textPrimary, fontFamily: Fonts.sans.regular, lineHeight: 20 },
  textMine: { color: '#fff' },
  time: { fontSize: 10.5, color: Colors.textTertiary, fontFamily: Fonts.sans.regular, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  dateSep: { alignItems: 'center', marginVertical: 12 },
  dateText: {
    fontSize: 12, color: Colors.textSecondary, fontFamily: Fonts.sans.medium,
    backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    overflow: 'hidden',
  },
});
