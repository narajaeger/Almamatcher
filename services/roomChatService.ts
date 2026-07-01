// services/roomChatService.ts
// Group chat untuk Study Rooms — kirim / ambil / realtime subscribe.
// Tabel: room_messages (lihat supabase/migrations/20260623_room_messages.sql)

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // di-join dari profiles (untuk tampilan)
  sender_name?: string | null;
  sender_avatar?: string | null;
}

/**
 * Ambil riwayat pesan sebuah room (urut lama → baru), lengkap dengan
 * nama & avatar pengirim.
 */
export async function getRoomMessages(roomId: string, limit = 100): Promise<RoomMessage[]> {
  const { data, error } = await supabase
    .from('room_messages')
    .select('id, room_id, sender_id, content, created_at')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  const senderIds = Array.from(new Set(data.map((m: any) => m.sender_id as string)));
  let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds);
    (profiles ?? []).forEach((p: any) => {
      profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    });
  }

  return data.map((m: any) => ({
    ...m,
    sender_name: profileMap[m.sender_id]?.full_name ?? null,
    sender_avatar: profileMap[m.sender_id]?.avatar_url ?? null,
  })) as RoomMessage[];
}

/**
 * Kirim pesan ke room. Mengembalikan pesan yang tersimpan (tanpa data profil —
 * UI sudah tahu siapa pengirimnya karena ini user saat ini).
 */
export async function sendRoomMessage(
  roomId: string,
  content: string,
): Promise<{ message?: RoomMessage; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const trimmed = content.trim();
  if (!trimmed) return { error: 'Pesan kosong' };

  const { data, error } = await supabase
    .from('room_messages')
    .insert({ room_id: roomId, sender_id: user.id, content: trimmed })
    .select('id, room_id, sender_id, content, created_at')
    .single();

  if (error) return { error: error.message };
  return { message: data as RoomMessage };
}

/**
 * Berlangganan pesan baru di sebuah room secara realtime.
 * Callback menerima pesan mentah (tanpa profil) — UI dapat melengkapi sendiri.
 */
export function subscribeToRoomMessages(
  roomId: string,
  onNewMessage: (msg: RoomMessage) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`room-chat:${roomId}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
      (payload) => { onNewMessage(payload.new as RoomMessage); },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
