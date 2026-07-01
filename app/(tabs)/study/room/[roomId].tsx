// app/(tabs)/study/room/[roomId].tsx — Study Room detail + timer

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Alert, Platform,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getStudyRooms, getRoomMembers, leaveRoom,
  getTodaySessionInfo, startStudySession, endStudySession,
} from '../../../../services/studyRoomService';
import type { StudyRoom } from '../../../../services/studyRoomService';
import {
  getRoomMessages, sendRoomMessage, subscribeToRoomMessages,
  type RoomMessage,
} from '../../../../services/roomChatService';
import { supabase } from '../../../../lib/supabase';
import { Colors, Radii, Spacing, Shadows, Fonts, Gradients, TAB_SAFE_BOTTOM } from '../../../../constants/theme';
import ScreenGradient from '../../../../components/ui/ScreenGradient';
import Icon from '../../../../components/ui/Icon';

const FREE_LIMIT = 30;

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [limitMinutes, setLimitMinutes] = useState(FREE_LIMIT);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Group chat ──
  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  // Load history + subscribe to realtime (only for discussion rooms)
  useEffect(() => {
    if (!roomId || !room || room.mode !== 'discuss') return;
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const history = await getRoomMessages(roomId);
      setMessages(history);
      unsubscribe = subscribeToRoomMessages(roomId, (msg) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
    })();
    return () => { unsubscribe?.(); };
  }, [roomId, room?.mode]);

  const handleSendChat = useCallback(async () => {
    const trimmed = chatText.trim();
    if (!trimmed || isSendingChat || !roomId || !myId) return;
    setChatText('');
    setIsSendingChat(true);

    const optimistic: RoomMessage = {
      id: `opt-${Date.now()}`,
      room_id: roomId,
      sender_id: myId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendRoomMessage(roomId, trimmed);
    setIsSendingChat(false);
    if (result.message) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? result.message! : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  }, [chatText, isSendingChat, roomId, myId]);

  // Auto-scroll chat into view when a new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages.length]);

  const loadRoom = useCallback(async () => {
    const [rooms, memberList] = await Promise.all([
      getStudyRooms(),
      getRoomMembers(roomId),
    ]);
    const found = rooms.find((r) => r.id === roomId) ?? null;
    setRoom(found);
    setMembers(memberList);
    setIsLoading(false);
  }, [roomId]);

  const loadSession = useCallback(async () => {
    const info = await getTodaySessionInfo();
    setTodayMinutes(info.todayMinutes);
    setLimitMinutes(info.limitMinutes);
    if (info.isActive && info.sessionId) {
      setSessionId(info.sessionId);
      setIsTimerRunning(true);
      const elapsed = info.startedAt
        ? Math.floor((Date.now() - new Date(info.startedAt).getTime()) / 1000)
        : 0;
      setElapsedSeconds(elapsed);
    }
  }, []);

  useEffect(() => {
    loadRoom();
    loadSession();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => {
          const totalElapsedMin = Math.floor((s + 1) / 60) + todayMinutes;
          if (totalElapsedMin >= limitMinutes) {
            handleStopTimer();
            return s + 1;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimerRunning]);

  const handleStartTimer = async () => {
    if (todayMinutes >= limitMinutes) {
      if (limitMinutes === FREE_LIMIT) {
        Alert.alert(
          'Limit Harian Tercapai',
          `Kamu sudah belajar ${limitMinutes} menit hari ini.\nUpgrade ke Premium untuk waktu tak terbatas!`,
          [
            { text: 'Nanti', style: 'cancel' },
            { text: 'Upgrade Premium', onPress: () => router.push('/premium' as any) },
          ],
        );
      } else {
        Alert.alert('Luar biasa!', `Kamu sudah belajar ${limitMinutes} menit hari ini.`);
      }
      return;
    }
    const result = await startStudySession(roomId);
    if (result.error) { Alert.alert('Error', result.error); return; }
    setSessionId(result.sessionId ?? null);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  };

  const handleStopTimer = async () => {
    setIsTimerRunning(false);
    if (sessionId) {
      const { durationMinutes } = await endStudySession(sessionId);
      setTodayMinutes((m) => m + durationMinutes);
      setSessionId(null);
      setElapsedSeconds(0);
    }
  };

  // Always return to the Belajar (study) home — router.back() can land on the
  // wrong tab depending on how the room was opened.
  const goToStudyHome = useCallback(() => {
    router.replace('/(tabs)/study');
  }, [router]);

  const handleLeave = async () => {
    const doLeave = async () => {
      if (isTimerRunning) await handleStopTimer();
      await leaveRoom(roomId);
      goToStudyHome();
    };
    // Alert isn't supported on react-native-web → leave directly there
    if (Platform.OS === 'web') { await doLeave(); return; }
    Alert.alert('Keluar Room?', 'Kamu akan meninggalkan study room ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: doLeave },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Room tidak ditemukan.</Text>
          <TouchableOpacity onPress={goToStudyHome} style={styles.backBtnBig}>
            <Text style={styles.backBtnBigText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;
  const remainingMin = Math.max(0, limitMinutes - todayMinutes - elapsedMin);
  const progressPct = Math.min(((todayMinutes + elapsedMin) / limitMinutes) * 100, 100);
  const isDone = progressPct >= 100;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenGradient glowColor={Colors.indigoLight} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToStudyHome} style={styles.backBtn} activeOpacity={0.7} accessibilityLabel="Kembali ke Belajar" accessibilityRole="button">
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} weight={2.4} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
          <View style={[styles.modePill, room.mode === 'silent' && styles.modePillSilent]}>
            <Text style={[styles.modeText, room.mode === 'silent' && styles.modeTextSilent]}>
              {room.mode === 'silent' ? 'Silent' : 'Diskusi'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
          <Text style={styles.leaveBtnText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Room info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoSubject}>{room.subject}</Text>
          {room.university && <Text style={styles.infoMeta}>{room.university}</Text>}
          {room.faculty && <Text style={styles.infoMeta}>{room.faculty}</Text>}
          <Text style={styles.infoCapacity}>
            {room.member_count}/{room.max_capacity} anggota
          </Text>
        </View>

        {/* Timer card */}
        <View style={styles.timerCard}>
          <Text style={styles.timerTitle}>Timer Belajar</Text>

          {/* Clock */}
          <View style={styles.clockWrap}>
            <Text style={styles.clockText}>
              {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            </Text>
            {isTimerRunning && (
              <View style={styles.pulsingDot} />
            )}
          </View>

          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${progressPct}%` as unknown as number },
                isDone && styles.progressFillDone,
              ]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLeft}>
                {todayMinutes + elapsedMin} mnt hari ini
              </Text>
              <Text style={styles.progressRight}>
                {limitMinutes === 999 ? 'tanpa batas' : `${remainingMin} mnt tersisa`}
              </Text>
            </View>
          </View>

          {/* Premium upsell */}
          {limitMinutes === FREE_LIMIT && (
            <TouchableOpacity
              style={styles.upsellNote}
              onPress={() => router.push('/premium' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.upsellText}>
                Free: {FREE_LIMIT} mnt/hari
              </Text>
              <Text style={styles.upsellLink}>Upgrade Premium →</Text>
            </TouchableOpacity>
          )}

          {/* Timer button */}
          <TouchableOpacity
            style={[
              styles.timerBtn,
              isTimerRunning && styles.timerBtnStop,
              isDone && !isTimerRunning && styles.timerBtnDone,
            ]}
            onPress={isTimerRunning ? handleStopTimer : handleStartTimer}
            activeOpacity={0.85}
          >
            <Text style={styles.timerBtnText}>
              {isTimerRunning
                ? 'Selesai / Pause'
                : isDone
                ? 'Target Hari Ini Tercapai'
                : 'Mulai Belajar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Members */}
        <View style={styles.membersSection}>
          <Text style={styles.membersTitle}>Anggota · {members.length}</Text>
          <View style={styles.membersList}>
            {members.map((m: any) => (
              <View key={m.id} style={styles.memberCard}>
                {m.avatar_url ? (
                  <Image source={{ uri: m.avatar_url }} style={styles.memberAvatar} />
                ) : (
                  <View style={styles.memberAvatarFallback}>
                    <Text style={styles.memberInitial}>
                      {m.full_name?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {m.full_name ?? 'Anggota'}
                  </Text>
                  {m.major && (
                    <Text style={styles.memberMajor} numberOfLines={1}>{m.major}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Group chat — discussion rooms only */}
        {room.mode === 'discuss' ? (
          <View style={styles.chatSection}>
            <Text style={styles.membersTitle}>Obrolan Room</Text>
            <View style={styles.chatCard}>
              {messages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <Icon name="chat" size={26} color={Colors.indigo} weight={2} />
                  <Text style={styles.chatEmptyText}>
                    Belum ada obrolan. Sapa anggota lain duluan!
                  </Text>
                </View>
              ) : (
                <View style={styles.chatMessages}>
                  {messages.map((m) => {
                    const mine = m.sender_id === myId;
                    return (
                      <View
                        key={m.id}
                        style={[styles.chatRow, mine && styles.chatRowMine]}
                      >
                        {!mine && (
                          m.sender_avatar ? (
                            <Image source={{ uri: m.sender_avatar }} style={styles.chatAvatar} />
                          ) : (
                            <View style={styles.chatAvatarFallback}>
                              <Text style={styles.chatAvatarInitial}>
                                {m.sender_name?.[0]?.toUpperCase() ?? '?'}
                              </Text>
                            </View>
                          )
                        )}
                        <View style={[styles.chatBubble, mine ? styles.chatBubbleMine : styles.chatBubbleTheirs]}>
                          {!mine && (
                            <Text style={styles.chatSender} numberOfLines={1}>
                              {m.sender_name ?? 'Anggota'}
                            </Text>
                          )}
                          <Text style={[styles.chatText, mine && styles.chatTextMine]}>{m.content}</Text>
                          <Text style={[styles.chatTime, mine && styles.chatTimeMine]}>
                            {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Input */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ketik pesan ke room..."
                  placeholderTextColor={Colors.textTertiary}
                  value={chatText}
                  onChangeText={setChatText}
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  onPress={handleSendChat}
                  disabled={!chatText.trim() || isSendingChat}
                  activeOpacity={0.85}
                  accessibilityLabel="Kirim pesan ke room"
                  accessibilityRole="button"
                  style={(!chatText.trim() || isSendingChat) && styles.chatSendDisabled}
                >
                  <LinearGradient
                    colors={Gradients.teal}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chatSendBtn}
                  >
                    <Icon name="send" size={17} color="#fff" weight={2.2} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.silentNote}>
            <Icon name="lock" size={16} color={Colors.textTertiary} weight={2} />
            <Text style={styles.silentNoteText}>
              Mode Silent — fokus belajar tanpa obrolan.
            </Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  errorText: { fontSize: 15, color: Colors.textSecondary },
  backBtnBig: {
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backBtnBigText: { color: Colors.textInverse, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(253,251,247,0.55)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerInfo: { flex: 1, gap: 4 },
  roomName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  modePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.indigoLight,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modePillSilent: { backgroundColor: Colors.surfaceAlt },
  modeText: { fontSize: 11, fontWeight: '600', color: Colors.indigo },
  modeTextSilent: { color: Colors.textSecondary },
  leaveBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  leaveBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  scroll: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: TAB_SAFE_BOTTOM },

  // Info card
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    gap: 4,
  },
  infoSubject: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  infoMeta: { fontSize: 13, color: Colors.textSecondary },
  infoCapacity: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },

  // Timer card
  timerCard: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: Radii.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadows.md,
  },
  timerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clockWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.indigoLight,
    borderRadius: Radii.xl,
    paddingHorizontal: 40,
    paddingVertical: 24,
    width: '100%',
  },
  clockText: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.indigo,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  pulsingDot: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.success,
  },

  // Progress
  progressWrap: { width: '100%', gap: 6 },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
  },
  progressFillDone: { backgroundColor: Colors.success },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLeft: { fontSize: 12, color: Colors.textSecondary },
  progressRight: { fontSize: 12, color: Colors.textSecondary },

  // Upsell
  upsellNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.goldLight,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  upsellText: { fontSize: 12, color: Colors.gold },
  upsellLink: { fontSize: 12, fontWeight: '700', color: Colors.gold },

  // Timer button
  timerBtn: {
    width: '100%',
    backgroundColor: Colors.indigo,
    borderRadius: Radii.full,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadows.sm,
  },
  timerBtnStop: { backgroundColor: Colors.primary },
  timerBtnDone: { backgroundColor: Colors.textTertiary },
  timerBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 15 },

  // Members
  membersSection: { gap: Spacing.md },
  membersTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  membersList: { gap: Spacing.sm },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.indigoLight,
  },
  memberAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight,
    borderWidth: 1.5,
    borderColor: Colors.indigo + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { fontSize: 16, fontWeight: '700', color: Colors.indigo },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  memberMajor: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },

  // ── Group chat ──
  chatSection: { gap: Spacing.md },
  chatCard: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  chatEmpty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  chatEmptyText: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', maxWidth: 220 },
  chatMessages: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chatRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '100%' },
  chatRowMine: { justifyContent: 'flex-end' },
  chatAvatar: { width: 28, height: 28, borderRadius: 14 },
  chatAvatarFallback: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.indigoLight, alignItems: 'center', justifyContent: 'center',
  },
  chatAvatarInitial: { fontSize: 12, fontWeight: '700', color: Colors.indigo },
  chatBubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  chatBubbleTheirs: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  chatBubbleMine: { backgroundColor: Colors.indigo, borderBottomRightRadius: 4 },
  chatSender: { fontSize: 11, fontWeight: '700', color: Colors.indigo },
  chatText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 19 },
  chatTextMine: { color: '#fff' },
  chatTime: { fontSize: 10, color: Colors.textTertiary, alignSelf: 'flex-end' },
  chatTimeMine: { color: 'rgba(255,255,255,0.75)' },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.sm, marginTop: 4,
  },
  chatInput: {
    flex: 1, minHeight: 40, maxHeight: 110,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chatSendDisabled: { opacity: 0.45 },
  silentNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt, borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  silentNoteText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
});
