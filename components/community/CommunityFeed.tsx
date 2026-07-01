// components/community/CommunityFeed.tsx
// Feed komunitas ala Twitter — compose box + daftar post + like.
// Dipakai sebagai tab ketiga di layar Belajar (study/index).

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TextInput,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';
import {
  getPosts, createPost, toggleLike, deletePost, getTodayPostCount,
  subscribeToPosts, FREE_DAILY_POST_LIMIT, type CommunityPost,
} from '../../services/communityService';
import { Colors, Radii, Spacing, Shadows, Fonts, TAB_SAFE_BOTTOM } from '../../constants/theme';
import Icon from '../ui/Icon';
import { ListSkeleton } from '../ui/Skeleton';
import { FadeInView } from '../ui/PressableScale';

export default function CommunityFeed() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const isPremium = profile?.is_premium ?? false;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true); else setIsLoading(true);
    const [data, count] = await Promise.all([getPosts(), getTodayPostCount()]);
    setPosts(data);
    setTodayCount(count);
    if (refresh) setIsRefreshing(false); else setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsub = subscribeToPosts(() => load(true));
    return () => unsub();
  }, []);

  const remaining = Math.max(0, FREE_DAILY_POST_LIMIT - todayCount);
  const limitReached = !isPremium && remaining <= 0;

  const handlePost = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isPosting) return;
    setError(null);
    setIsPosting(true);
    const res = await createPost(trimmed);
    setIsPosting(false);

    if (res.limitReached) {
      setError(res.error ?? 'Batas harian tercapai.');
      return;
    }
    if (res.error) {
      setError('Gagal memposting. Coba lagi sebentar ya.');
      return;
    }
    if (res.post) {
      setText('');
      setPosts((prev) => [res.post!, ...prev]);
      setTodayCount((c) => c + 1);
    }
  }, [text, isPosting]);

  const handleToggleLike = useCallback(async (post: CommunityPost) => {
    // optimistic
    setPosts((prev) => prev.map((p) =>
      p.id === post.id
        ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) }
        : p,
    ));
    const res = await toggleLike(post.id, post.liked_by_me);
    if (res.error) {
      // rollback
      setPosts((prev) => prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: post.liked_by_me, like_count: post.like_count }
          : p,
      ));
    }
  }, []);

  const handleDelete = useCallback(async (post: CommunityPost) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (!window.confirm('Hapus postingan ini?')) return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    await deletePost(post.id);
    setTodayCount((c) => Math.max(0, c - 1));
  }, []);

  const composer = (
    <View style={styles.composer}>
      <View style={styles.composerTop}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.composerAvatar} />
        ) : (
          <View style={styles.composerAvatarFallback}>
            <Text style={styles.composerAvatarInitial}>
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <TextInput
          style={styles.composerInput}
          placeholder="Bagikan sesuatu ke komunitas..."
          placeholderTextColor={Colors.textTertiary}
          value={text}
          onChangeText={(t) => { setText(t); if (error) setError(null); }}
          multiline
          maxLength={500}
          editable={!limitReached}
        />
      </View>

      <View style={styles.composerBottom}>
        <Text style={styles.quotaText}>
          {isPremium
            ? `${text.length}/500`
            : `${remaining}/${FREE_DAILY_POST_LIMIT} postingan tersisa hari ini`}
        </Text>
        {limitReached ? (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/premium' as any)}
            activeOpacity={0.85}
            accessibilityLabel="Upgrade Premium"
            accessibilityRole="button"
          >
            <Icon name="crown" size={13} color="#fff" fill="#fff" />
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.postBtn, (!text.trim() || isPosting) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!text.trim() || isPosting}
            activeOpacity={0.85}
            accessibilityLabel="Kirim postingan"
            accessibilityRole="button"
          >
            <Icon name="send" size={14} color="#fff" weight={2.2} />
            <Text style={styles.postBtnText}>Posting</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {composer}
        <ListSkeleton count={4} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={composer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={Colors.indigo} />
      }
      renderItem={({ item, index }) => (
        <FadeInView triggerKey={item.id} delay={Math.min(index * 30, 180)}>
          <PostCard
            post={item}
            onLike={() => handleToggleLike(item)}
            onDelete={() => handleDelete(item)}
            onOpenProfile={() =>
              !item.is_mine && router.push({ pathname: '/u/[userId]', params: { userId: item.author_id } })
            }
          />
        </FadeInView>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="chat" size={28} color={Colors.indigo} weight={2} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada postingan</Text>
          <Text style={styles.emptyDesc}>Jadilah yang pertama berbagi di komunitas!</Text>
        </View>
      }
    />
  );
}

function PostCard({
  post, onLike, onDelete, onOpenProfile,
}: {
  post: CommunityPost;
  onLike: () => void;
  onDelete: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View style={card.card}>
      <View style={card.header}>
        <TouchableOpacity style={card.authorRow} onPress={onOpenProfile} activeOpacity={0.7}>
          {post.author_avatar ? (
            <Image source={{ uri: post.author_avatar }} style={card.avatar} />
          ) : (
            <View style={card.avatarFallback}>
              <Text style={card.avatarInitial}>{post.author_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View style={card.authorText}>
            <Text style={card.authorName} numberOfLines={1}>{post.author_name ?? 'Anggota'}</Text>
            <Text style={card.meta} numberOfLines={1}>
              {[post.author_university, timeAgo(post.created_at)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </TouchableOpacity>
        {post.is_mine && (
          <TouchableOpacity
            onPress={onDelete}
            style={card.deleteBtn}
            activeOpacity={0.7}
            accessibilityLabel="Hapus postingan"
            accessibilityRole="button"
          >
            <Icon name="close" size={16} color={Colors.textTertiary} weight={2.2} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={card.content}>{post.content}</Text>

      <TouchableOpacity
        style={card.likeRow}
        onPress={onLike}
        activeOpacity={0.7}
        accessibilityLabel={post.liked_by_me ? 'Batalkan suka' : 'Suka postingan'}
        accessibilityRole="button"
      >
        <Icon
          name={post.liked_by_me ? 'heartFill' : 'heart'}
          size={18}
          color={post.liked_by_me ? Colors.primary : Colors.textTertiary}
          weight={2}
        />
        {post.like_count > 0 && (
          <Text style={[card.likeCount, post.liked_by_me && { color: Colors.primary }]}>
            {post.like_count}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'baru';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}j`;
  if (d < 7) return `${d}h`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: TAB_SAFE_BOTTOM },
  composer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  composerTop: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  composerAvatar: { width: 38, height: 38, borderRadius: Radii.full },
  composerAvatarFallback: {
    width: 38, height: 38, borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight, alignItems: 'center', justifyContent: 'center',
  },
  composerAvatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.indigo },
  composerInput: {
    flex: 1, minHeight: 40, maxHeight: 120, paddingTop: 8,
    fontSize: 14, color: Colors.textPrimary, fontFamily: Fonts.sans.regular,
  },
  composerBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quotaText: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.sans.medium },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.indigo, borderRadius: Radii.full,
    paddingHorizontal: 16, paddingVertical: 8, ...Shadows.sm,
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: '#fff', fontSize: 13, fontFamily: Fonts.sans.bold },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold, borderRadius: Radii.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  upgradeBtnText: { color: '#fff', fontSize: 13, fontFamily: Fonts.sans.bold },
  errorBanner: {
    backgroundColor: 'rgba(226,84,91,0.1)', borderWidth: 1, borderColor: 'rgba(226,84,91,0.32)',
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: 9,
  },
  errorBannerText: { fontSize: 12.5, color: Colors.error, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: Radii.full, backgroundColor: Colors.indigoLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

const card = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: Radii.full, borderWidth: 1.5, borderColor: Colors.indigoLight },
  avatarFallback: {
    width: 40, height: 40, borderRadius: Radii.full,
    backgroundColor: Colors.indigoLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.indigo },
  authorText: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: 11.5, color: Colors.textTertiary, marginTop: 1 },
  deleteBtn: { padding: 4 },
  content: { fontSize: 14.5, color: Colors.textPrimary, lineHeight: 21, fontFamily: Fonts.sans.regular },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 2 },
  likeCount: { fontSize: 13, color: Colors.textTertiary, fontFamily: Fonts.sans.semibold },
});
