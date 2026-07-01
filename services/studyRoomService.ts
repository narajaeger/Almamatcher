// services/studyRoomService.ts
// CRUD untuk Study Rooms + timer belajar

import { supabase } from '../lib/supabase';
import { buildEduOrFilter } from '../constants/eduData';

export interface StudyRoom {
  id: string;
  creator_id: string;
  name: string;
  subject: string;
  university: string | null;
  faculty: string | null;
  mode: 'silent' | 'discuss';
  max_capacity: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export interface StudyRoomFilters {
  university: string;
  subject: string;
  mode: 'silent' | 'discuss' | 'all';
}

export const DEFAULT_ROOM_FILTERS: StudyRoomFilters = {
  university: '',
  subject: '',
  mode: 'all',
};

export async function getStudyRooms(
  filters: StudyRoomFilters = DEFAULT_ROOM_FILTERS,
): Promise<StudyRoom[]> {
  let query = supabase
    .from('study_rooms_with_count')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filters.university.trim()) {
    const orFilter = buildEduOrFilter('university', filters.university);
    if (orFilter) query = query.or(orFilter);
  }
  if (filters.subject.trim()) {
    query = query.ilike('subject', `%${filters.subject.trim()}%`);
  }
  if (filters.mode !== 'all') {
    query = query.eq('mode', filters.mode);
  }

  const { data } = await query;
  return (data as StudyRoom[]) ?? [];
}

export async function createRoom(params: {
  name: string;
  subject: string;
  university?: string;
  faculty?: string;
  mode: 'silent' | 'discuss';
  max_capacity: number;
}): Promise<{ room?: StudyRoom; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('study_rooms')
    .insert({ ...params, creator_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('study_room_members').insert({ room_id: data.id, user_id: user.id });

  return { room: { ...data, member_count: 1 } as StudyRoom };
}

export async function joinRoom(roomId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: room } = await supabase
    .from('study_rooms_with_count')
    .select('max_capacity, member_count')
    .eq('id', roomId)
    .single();

  if (room && room.member_count >= room.max_capacity) {
    return { error: 'Room sudah penuh!' };
  }

  const { error } = await supabase
    .from('study_room_members')
    .insert({ room_id: roomId, user_id: user.id });

  if (error && error.code !== '23505') return { error: error.message };
  return {};
}

export async function leaveRoom(roomId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('study_room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', user.id);
}

export async function isRoomMember(roomId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('study_room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}

export async function getMyRooms(): Promise<StudyRoom[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberRows } = await supabase
    .from('study_room_members')
    .select('room_id')
    .eq('user_id', user.id);

  if (!memberRows || memberRows.length === 0) return [];

  const roomIds = memberRows.map((r: any) => r.room_id as string);
  const { data } = await supabase
    .from('study_rooms_with_count')
    .select('*')
    .in('id', roomIds)
    .eq('is_active', true);

  return (data as StudyRoom[]) ?? [];
}

export async function getRoomMembers(roomId: string): Promise<{
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
}[]> {
  const { data: memberRows } = await supabase
    .from('study_room_members')
    .select('user_id')
    .eq('room_id', roomId);

  if (!memberRows || memberRows.length === 0) return [];

  const userIds = memberRows.map((r: any) => r.user_id as string);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, university, major')
    .in('id', userIds);

  return (profiles ?? []) as {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
    major: string | null;
  }[];
}

// ---- Timer / Session tracking ----

export interface StudySessionInfo {
  sessionId: string | null;
  todayMinutes: number;
  isActive: boolean;
  startedAt: string | null;
}

const FREE_DAILY_LIMIT = 30;

export async function getTodaySessionInfo(): Promise<StudySessionInfo & { limitMinutes: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { sessionId: null, todayMinutes: 0, isActive: false, startedAt: null, limitMinutes: FREE_DAILY_LIMIT };
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();
  const limitMinutes = prof?.is_premium ? 999 : FREE_DAILY_LIMIT;

  const { data: activeSession } = await supabase
    .from('study_sessions')
    .select('id, started_at')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const { data: todaySessions } = await supabase
    .from('study_sessions')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .eq('session_date', today)
    .not('ended_at', 'is', null);

  const todayMinutes = (todaySessions ?? []).reduce(
    (sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0,
  );

  return {
    sessionId: activeSession?.id ?? null,
    todayMinutes,
    isActive: !!activeSession,
    startedAt: activeSession?.started_at ?? null,
    limitMinutes,
  };
}

export async function startStudySession(roomId?: string): Promise<{ sessionId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: active } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (active) return { sessionId: active.id };

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: user.id, room_id: roomId ?? null, session_date: today })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { sessionId: data.id };
}

export async function endStudySession(sessionId: string): Promise<{ durationMinutes: number }> {
  const { data: session } = await supabase
    .from('study_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();

  if (!session) return { durationMinutes: 0 };

  const durationMs = Date.now() - new Date(session.started_at).getTime();
  const durationMinutes = Math.ceil(durationMs / 60000);

  await supabase
    .from('study_sessions')
    .update({ ended_at: new Date().toISOString(), duration_minutes: durationMinutes })
    .eq('id', sessionId);

  return { durationMinutes };
}
