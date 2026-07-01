// services/chatService.ts
// Kirim & terima pesan, ambil daftar percakapan.
//
// A "match" chat and a "study buddy" chat with the SAME person are now two
// separate rooms. We encode the kind into the match_key:
//   match room : "<idA>:<idB>"
//   buddy room : "<idA>:<idB>:buddy"
// so their message histories never collide.

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ChatKind = 'match' | 'buddy';

export interface Message {
  id: string;
  match_key: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  matchKey: string;
  kind: ChatKind;
  otherUserId: string;
  otherName: string;
  otherAvatar: string | null;
  otherUniversity: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isLastMine: boolean;
}

export function makeMatchKey(userId1: string, userId2: string, kind: ChatKind = 'match'): string {
  const base = [userId1, userId2].sort().join(':');
  return kind === 'buddy' ? `${base}:buddy` : base;
}

// Is there a mutual romantic match between the two users?
async function hasMutualMatch(myId: string, otherId: string): Promise<boolean> {
  const { data } = await supabase
    .from('matches_view')
    .select('matched_with_id')
    .eq('user_id', myId)
    .eq('matched_with_id', otherId)
    .maybeSingle();
  return !!data;
}

// Is there a mutual study-buddy relationship (both requests exist)?
async function hasMutualBuddy(myId: string, otherId: string): Promise<boolean> {
  const [{ data: a }, { data: b }] = await Promise.all([
    supabase.from('buddy_requests').select('id').eq('from_user_id', myId).eq('to_user_id', otherId).maybeSingle(),
    supabase.from('buddy_requests').select('id').eq('from_user_id', otherId).eq('to_user_id', myId).maybeSingle(),
  ]);
  return !!a && !!b;
}

export async function sendMessage(
  receiverId: string,
  content: string,
  kind: ChatKind = 'match',
): Promise<{ message?: Message; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Client-side guard (the DB trigger check_match_before_message is the hard
  // enforcement). A buddy chat needs a mutual buddy link; a match chat needs a
  // mutual match.
  const allowed = kind === 'buddy'
    ? await hasMutualBuddy(user.id, receiverId)
    : await hasMutualMatch(user.id, receiverId);
  if (!allowed) {
    return { error: kind === 'buddy' ? 'Not study buddies with this user' : 'Not matched with this user' };
  }

  const match_key = makeMatchKey(user.id, receiverId, kind);
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_key, sender_id: user.id, receiver_id: receiverId, content: content.trim() })
    .select()
    .single();

  if (error) return { error: error.message };
  return { message: data as Message };
}

export async function getMessages(otherUserId: string, kind: ChatKind = 'match'): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const match_key = makeMatchKey(user.id, otherUserId, kind);
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('match_key', match_key)
    .order('created_at', { ascending: true });

  return (data as Message[]) ?? [];
}

export async function markAsRead(otherUserId: string, kind: ChatKind = 'match'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const match_key = makeMatchKey(user.id, otherUserId, kind);
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_key', match_key)
    .eq('receiver_id', user.id)
    .is('read_at', null);
}

// Build a single conversation entry for a given partner + kind.
async function buildConversation(
  myId: string,
  otherId: string,
  kind: ChatKind,
  profile: any,
  fallbackTime: string,
): Promise<Conversation> {
  const match_key = makeMatchKey(myId, otherId, kind);

  const { data: lastMsgArr } = await supabase
    .from('messages')
    .select('content, created_at, sender_id, read_at')
    .eq('match_key', match_key)
    .order('created_at', { ascending: false })
    .limit(1);
  const lastMsg = lastMsgArr?.[0];

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('match_key', match_key)
    .eq('receiver_id', myId)
    .is('read_at', null);

  return {
    matchKey: match_key,
    kind,
    otherUserId: otherId,
    otherName: profile?.full_name ?? 'Unknown',
    otherAvatar: profile?.avatar_url ?? null,
    otherUniversity: profile?.university ?? null,
    lastMessage: lastMsg?.content ?? (kind === 'buddy' ? 'Sapa teman belajarmu! 📚' : 'Mulai percakapan! 👋'),
    lastMessageAt: lastMsg?.created_at ?? fallbackTime,
    unreadCount: count ?? 0,
    isLastMine: lastMsg?.sender_id === myId,
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1) Mutual romantic matches → match chats
  const { data: matchRows } = await supabase
    .from('matches_view')
    .select('matched_with_id, matched_at')
    .eq('user_id', user.id);

  const matchTargets = (matchRows ?? []).map((r: any) => ({
    id: r.matched_with_id as string, kind: 'match' as ChatKind, at: r.matched_at as string,
  }));

  // 2) Mutual study buddies → buddy chats
  const [{ data: outRows }, { data: inRows }] = await Promise.all([
    supabase.from('buddy_requests').select('to_user_id, created_at').eq('from_user_id', user.id),
    supabase.from('buddy_requests').select('from_user_id').eq('to_user_id', user.id),
  ]);
  const outSet = new Set((outRows ?? []).map((r: any) => r.to_user_id as string));
  const inSet = new Set((inRows ?? []).map((r: any) => r.from_user_id as string));
  const outAt: Record<string, string> = {};
  (outRows ?? []).forEach((r: any) => { outAt[r.to_user_id] = r.created_at; });

  const buddyTargets = [...outSet]
    .filter((id) => inSet.has(id))
    .map((id) => ({ id, kind: 'buddy' as ChatKind, at: outAt[id] ?? new Date(0).toISOString() }));

  const targets = [...matchTargets, ...buddyTargets];
  if (targets.length === 0) return [];

  // Fetch all needed profiles once
  const uniqueIds = [...new Set(targets.map((t) => t.id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university')
    .in('id', uniqueIds);
  const profileMap: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

  const conversations = await Promise.all(
    targets.map((t) => buildConversation(user.id, t.id, t.kind, profileMap[t.id], t.at)),
  );

  return conversations.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export function subscribeToMessages(
  myId: string,
  otherUserId: string,
  onNewMessage: (msg: Message) => void,
  kind: ChatKind = 'match',
): () => void {
  const match_key = makeMatchKey(myId, otherUserId, kind);

  const channel: RealtimeChannel = supabase
    .channel(`chat:${match_key}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_key=eq.${match_key}` },
      (payload) => { onNewMessage(payload.new as Message); },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
