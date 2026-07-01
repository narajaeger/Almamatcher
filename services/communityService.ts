// services/communityService.ts
// Community feed (ala Twitter) untuk tab Belajar.
// Non-premium: maksimal 5 post per hari.

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const FREE_DAILY_POST_LIMIT = 5;

export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  author_name: string | null;
  author_avatar: string | null;
  author_university: string | null;
  is_mine: boolean;
}

/** Ambil feed terbaru lengkap dengan profil penulis, jumlah like, dan status like saya. */
export async function getPosts(limit = 50): Promise<CommunityPost[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from('community_posts_with_counts')
    .select('id, author_id, content, created_at, like_count')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !rows) return [];

  const authorIds = Array.from(new Set(rows.map((r: any) => r.author_id as string)));
  const profileMap: Record<string, any> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, university')
      .in('id', authorIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  // Pesan yang saya like
  let likedSet = new Set<string>();
  if (user && rows.length > 0) {
    const postIds = rows.map((r: any) => r.id as string);
    const { data: myLikes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);
    likedSet = new Set((myLikes ?? []).map((l: any) => l.post_id as string));
  }

  return rows.map((r: any) => ({
    id: r.id,
    author_id: r.author_id,
    content: r.content,
    created_at: r.created_at,
    like_count: r.like_count ?? 0,
    liked_by_me: likedSet.has(r.id),
    author_name: profileMap[r.author_id]?.full_name ?? null,
    author_avatar: profileMap[r.author_id]?.avatar_url ?? null,
    author_university: profileMap[r.author_id]?.university ?? null,
    is_mine: !!user && r.author_id === user.id,
  }));
}

/** Berapa post yang sudah dibuat user hari ini. */
export async function getTodayPostCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('community_posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .gte('created_at', startOfDay.toISOString());
  return count ?? 0;
}

/**
 * Buat post baru. Menerapkan limit harian untuk non-premium.
 * Mengembalikan { limitReached: true } bila kuota habis.
 */
export async function createPost(
  content: string,
): Promise<{ post?: CommunityPost; error?: string; limitReached?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const trimmed = content.trim();
  if (!trimmed) return { error: 'Postingan kosong' };
  if (trimmed.length > 500) return { error: 'Maksimal 500 karakter' };

  // Cek status premium + limit harian
  const { data: prof } = await supabase
    .from('profiles')
    .select('is_premium, full_name, avatar_url, university')
    .eq('id', user.id)
    .single();

  if (!prof?.is_premium) {
    const todayCount = await getTodayPostCount();
    if (todayCount >= FREE_DAILY_POST_LIMIT) {
      return { limitReached: true, error: `Batas ${FREE_DAILY_POST_LIMIT} postingan per hari tercapai. Upgrade Premium untuk tanpa batas.` };
    }
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert({ author_id: user.id, content: trimmed })
    .select('id, author_id, content, created_at')
    .single();

  if (error) return { error: error.message };

  return {
    post: {
      id: data.id,
      author_id: data.author_id,
      content: data.content,
      created_at: data.created_at,
      like_count: 0,
      liked_by_me: false,
      author_name: prof?.full_name ?? null,
      author_avatar: prof?.avatar_url ?? null,
      author_university: prof?.university ?? null,
      is_mine: true,
    },
  };
}

/** Toggle like. `currentlyLiked` = status sebelum di-tap. */
export async function toggleLike(
  postId: string,
  currentlyLiked: boolean,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (currentlyLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });
    if (error && error.code !== '23505') return { error: error.message };
  }
  return {};
}

/** Hapus post milik sendiri. */
export async function deletePost(postId: string): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id);
  if (error) return { error: error.message };
  return {};
}

/** Berlangganan post baru secara realtime. */
export function subscribeToPosts(onNewPost: (postId: string) => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`community:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'community_posts' },
      (payload) => { onNewPost((payload.new as any).id as string); },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
