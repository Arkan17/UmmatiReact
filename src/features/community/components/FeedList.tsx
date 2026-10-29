// Reusable, cursor-paged list of posts with pull-to-refresh, an offline cache, a live "new posts"
// pill, and all post actions (react, bookmark, delete, report, block, share).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, CloudOff, Flag, MessageCircle, Share2, Trash2, UserX } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalBox, BrutalPressable, haptic, outline } from '../../../core/components/ui';
import { PAGE_SIZE, deletePost, fetchFeed, setBookmark, setReaction, type FeedQuery } from '../api/feed';
import { blockUser } from '../api/moderation';
import { subscribeNewPosts } from '../api/notifications';
import type { Post, ReactionKind } from '../api/types';
import { useMyRole } from '../hooks/useCommunityGate';
import { useNow } from '../utils/time';
import { OptionsSheet } from './OptionsSheet';
import { PostCard } from './PostCard';
import { ReportSheet } from './ReportSheet';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Post actions shared by the feed and the post detail screen. `update` patches one post,
 * `remove` drops posts matching a predicate (after delete/report/block).
 */
export function usePostActions({ update, remove, onDeleted }: {
  update: (id: string, patch: Partial<Post>) => void;
  remove: (match: (p: Post) => boolean) => void;
  onDeleted?: (post: Post) => void;
}) {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const role = useMyRole();
  const inFlight = useRef(new Set<string>());
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [reportPost, setReportPost] = useState<Post | null>(null);

  const requireUser = () => {
    if (user) return true;
    navigation.navigate('Auth', { mode: 'signin' });
    return false;
  };

  // `post` is the item as currently rendered, so the optimistic math never uses stale state
  const onReact = useCallback(async (post: Post, kind: ReactionKind | null) => {
    if (!requireUser()) return;
    const key = `r:${post.id}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    const prev = post.my_reaction;
    const reactions = { ...post.reactions };
    if (prev) reactions[prev] = Math.max(0, (reactions[prev] ?? 1) - 1);
    if (kind) reactions[kind] = (reactions[kind] ?? 0) + 1;
    const total = Math.max(0, post.reaction_total + (kind ? 1 : 0) - (prev ? 1 : 0));
    update(post.id, { my_reaction: kind, reactions, reaction_total: total });
    try {
      await setReaction(post.id, kind);
    } catch (e: any) {
      update(post.id, { my_reaction: prev, reactions: post.reactions, reaction_total: post.reaction_total });
      Alert.alert('Could not react', e?.message ?? 'Please try again.');
    } finally {
      inFlight.current.delete(key);
    }
  }, [update]); // eslint-disable-line react-hooks/exhaustive-deps

  const onBookmark = useCallback(async (post: Post) => {
    if (!requireUser()) return;
    const key = `b:${post.id}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    const next = !post.is_bookmarked;
    update(post.id, { is_bookmarked: next });
    try {
      await setBookmark(post.id, next);
    } catch (e: any) {
      update(post.id, { is_bookmarked: post.is_bookmarked });
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      inFlight.current.delete(key);
    }
  }, [update]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMore = useCallback((post: Post) => setMenuPost(post), []);

  const confirmDelete = (post: Post) => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deletePost(post.id);
            haptic.success();
            remove((p) => p.id === post.id);
            onDeleted?.(post);
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const confirmBlock = (post: Post) => {
    if (!post.user_id) return;
    Alert.alert(`Block ${post.author_name}?`, "You won't see their posts, comments or duas. They won't be told.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          try {
            await blockUser(post.user_id!);
            haptic.success();
            remove((p) => p.user_id === post.user_id);
          } catch (e: any) {
            Alert.alert('Could not block', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const sharePost = (post: Post) => {
    const att = post.attachment ? `\n\n${post.attachment.arabic}\n“${post.attachment.translation}” — ${post.attachment.ref}` : '';
    Share.share({ message: `${post.content}${att}\n\n— ${post.author_name}, on Ummati` }).catch(() => {});
  };

  const mine = !!menuPost && !!user && menuPost.user_id === user.id;
  const sheets = (
    <>
      <OptionsSheet
        visible={!!menuPost}
        onClose={() => setMenuPost(null)}
        title="Post options"
        options={menuPost ? [
          { label: 'Share text', Icon: Share2, onPress: () => sharePost(menuPost) },
          { label: 'Report post', Icon: Flag, onPress: () => (requireUser() ? setReportPost(menuPost) : undefined), hidden: mine },
          { label: `Block ${menuPost.author_name}`, Icon: UserX, onPress: () => (requireUser() ? confirmBlock(menuPost) : undefined), hidden: mine || !menuPost.user_id },
          { label: 'Delete post', Icon: Trash2, destructive: true, onPress: () => confirmDelete(menuPost), hidden: !(mine || role === 'admin') },
        ] : []}
      />
      <ReportSheet
        visible={!!reportPost}
        onClose={() => setReportPost(null)}
        target={reportPost ? { type: 'post', id: reportPost.id } : null}
        authorId={reportPost?.user_id}
        authorName={reportPost?.author_name}
        onDone={(blocked) => {
          const p = reportPost;
          if (!p) return;
          remove((x) => x.id === p.id || (blocked && !!p.user_id && x.user_id === p.user_id));
        }}
      />
    </>
  );

  return { onReact, onBookmark, onMore, sheets };
}

export function FeedList({ query, header, cacheKey, bottomInset = 24, live, filter, emptyTitle, emptyText, listRef }: {
  query: Omit<FeedQuery, 'before'>;
  header?: React.ReactElement;
  /** AsyncStorage key to cache the first page (instant + offline display) */
  cacheKey?: string;
  bottomInset?: number;
  /** Show a "new posts" pill when someone else publishes to the main feed */
  live?: boolean;
  /** Extra client-side filter (e.g. answered / unanswered questions) */
  filter?: (p: Post) => boolean;
  emptyTitle?: string;
  emptyText?: string;
  listRef?: React.RefObject<FlatList<Post> | null>;
}) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const now = useNow();
  const insets = useSafeAreaInsets();
  const ownRef = useRef<FlatList<Post>>(null);
  const ref = listRef ?? ownRef;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const key = JSON.stringify(query);
  const queryRef = useRef(query);
  queryRef.current = query;
  const requestId = useRef(0);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    const id = ++requestId.current;
    if (mode === 'refresh') setRefreshing(true);
    try {
      const rows = await fetchFeed({ ...queryRef.current, limit: PAGE_SIZE });
      if (id !== requestId.current) return;
      setPosts(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setError(null);
      setOffline(false);
      setNewCount(0);
      if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(rows)).catch(() => {});
    } catch (e: any) {
      if (id !== requestId.current) return;
      setOffline(true);
      setError(e?.message ?? 'Could not load posts.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [cacheKey]);

  // New query: show the cached first page instantly, then fetch fresh
  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setHasMore(true);
    setError(null);
    (async () => {
      if (cacheKey) {
        try {
          const raw = await AsyncStorage.getItem(cacheKey);
          if (raw) {
            setPosts(JSON.parse(raw));
            setLoading(false);
          }
        } catch {}
      }
      load('initial');
    })();
  }, [key, cacheKey, load]);

  // Coming back from compose / post detail: refresh quietly so counts and new posts show
  const focusedOnce = useRef(false);
  useFocusEffect(useCallback(() => {
    if (focusedOnce.current) load('silent');
    focusedOnce.current = true;
  }, [load]));

  useEffect(() => {
    if (!live) return;
    return subscribeNewPosts((p) => {
      if (!p.group_id && p.user_id !== user?.id) setNewCount((c) => c + 1);
    });
  }, [live, user?.id]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading || offline || posts.length === 0) return;
    setLoadingMore(true);
    const id = requestId.current;
    try {
      const rows = await fetchFeed({ ...queryRef.current, before: posts[posts.length - 1].created_at, limit: PAGE_SIZE });
      if (id !== requestId.current) return;
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...rows.filter((r) => !seen.has(r.id))];
      });
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const update = useCallback((id: string, patch: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);
  const remove = useCallback((match: (p: Post) => boolean) => {
    setPosts((prev) => prev.filter((p) => !match(p)));
  }, []);
  const { onReact, onBookmark, onMore, sheets } = usePostActions({ update, remove });

  const onOpen = useCallback((p: Post) => navigation.navigate('PostDetail', { postId: p.id }), [navigation]);
  const onAuthor = useCallback((uid: string) => navigation.navigate('UserProfile', { userId: uid }), [navigation]);

  const shown = useMemo(() => (filter ? posts.filter(filter) : posts), [posts, filter]);

  const showNew = () => {
    haptic.select();
    ref.current?.scrollToOffset({ offset: 0, animated: true });
    load('refresh');
  };

  const listHeader = (
    <View>
      {header}
      {offline && posts.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.pad}>
          <View style={[styles.banner, outline(colors), { backgroundColor: colors.accentSoft }]}>
            <CloudOff color={colors.ink} size={16} strokeWidth={2.4} />
            <Text style={[styles.bannerText, { color: colors.ink }]}>You're offline — showing saved posts.</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );

  const empty = loading ? (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.muted, { color: colors.textSecondary }]}>Loading posts…</Text>
    </View>
  ) : error ? (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.center}>
      <BrutalBox fill={colors.accentSoft} radius={22} style={styles.emptyIcon}>
        <CloudOff color={colors.ink} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load posts</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{error}</Text>
      <BrutalPressable fill={colors.primary} style={styles.retry} onPress={() => { setLoading(true); load('initial'); }}>
        <Text style={[styles.retryText, { color: colors.onPrimary }]}>Try again</Text>
      </BrutalPressable>
    </Animated.View>
  ) : (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.center}>
      <BrutalBox fill={colors.primarySoft} radius={22} style={styles.emptyIcon}>
        <MessageCircle color={colors.ink} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyTitle ?? 'Nothing here yet'}</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{emptyText ?? 'Be the first to share something beneficial.'}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        ref={ref}
        data={shown}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={index < 8 ? FadeInDown.delay(index * 50).duration(350) : undefined} style={styles.pad}>
            <PostCard post={item} now={now} onReact={onReact} onBookmark={onBookmark} onOpen={onOpen} onAuthor={onAuthor} onMore={onMore} />
          </Animated.View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} />
            : !hasMore && shown.length > 4 ? <Text style={[styles.footerText, { color: colors.textMuted }]}>You're all caught up · Alhamdulillah</Text>
              : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={9}
      />
      {newCount > 0 ? (
        <Animated.View entering={FadeInUp.duration(250)} exiting={FadeOut} style={[styles.pillWrap, { top: insets.top + 10 }]} pointerEvents="box-none">
          <BrutalPressable fill={colors.primary} radius={20} style={styles.pill} onPress={showNew}>
            <ArrowUp color={colors.onPrimary} size={16} strokeWidth={2.8} />
            <Text style={[styles.pillText, { color: colors.onPrimary }]}>{newCount} new {newCount === 1 ? 'post' : 'posts'}</Text>
          </BrutalPressable>
        </Animated.View>
      ) : null}
      {sheets}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 18 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 12, marginBottom: 14 },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '800' },
  center: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30, gap: 10 },
  emptyIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '900', marginTop: 6 },
  muted: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retry: { height: 46, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  retryText: { fontSize: 15, fontWeight: '900' },
  footer: { marginVertical: 20 },
  footerText: { textAlign: 'center', fontSize: 12.5, fontWeight: '700', marginVertical: 18 },
  pillWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40 },
  pillText: { fontSize: 14, fontWeight: '900' },
});
