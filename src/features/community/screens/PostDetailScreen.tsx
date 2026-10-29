// A single post with its comments. Scholar answers on "Ask" posts are pinned and highlighted.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BadgeCheck, EyeOff, Flag, MessageSquare, Send, Trash2, UserX } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, PressableScale, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { addComment, deleteComment, fetchComments, fetchPost } from '../api/feed';
import { blockUser } from '../api/moderation';
import type { Comment, Post } from '../api/types';
import { Avatar, RoleBadge } from '../components/Avatar';
import { usePostActions } from '../components/FeedList';
import { OptionsSheet } from '../components/OptionsSheet';
import { PostCard } from '../components/PostCard';
import { ReportSheet } from '../components/ReportSheet';
import { useCommunityGate, useMyRole } from '../hooks/useCommunityGate';
import { checkContent } from '../utils/contentFilter';
import { timeAgo, useNow } from '../utils/time';

const INK = '#1C1A17';

export function PostDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostDetail'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const role = useMyRole();
  const gate = useCommunityGate();
  const now = useNow();
  const { postId } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menuComment, setMenuComment] = useState<Comment | null>(null);
  const [reportComment, setReportComment] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([fetchPost(postId), fetchComments(postId)]);
      setPost(p);
      setMissing(!p);
      setComments(c);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load this post.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback((id: string, patch: Partial<Post>) => {
    setPost((p) => (p && p.id === id ? { ...p, ...patch } : p));
  }, []);
  const remove = useCallback((match: (p: Post) => boolean) => {
    setPost((p) => {
      if (p && match(p)) {
        setTimeout(() => navigation.goBack(), 0);
        return null;
      }
      return p;
    });
  }, [navigation]);
  const actions = usePostActions({ update, remove });

  const send = async () => {
    const check = checkContent(text, { min: 1, max: 1000 });
    if (!check.ok) {
      Alert.alert('Please check your comment', check.reason);
      return;
    }
    if (!(await gate.ensureCanPost())) return;
    setSending(true);
    try {
      await addComment(postId, text, user?.username ?? 'Member');
      haptic.success();
      setText('');
      const c = await fetchComments(postId);
      setComments(c);
      setPost((p) => (p ? { ...p, comment_count: c.length } : p));
    } catch (e: any) {
      Alert.alert('Could not comment', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const removeComment = (c: Comment) => {
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteComment(c.id);
            setComments((prev) => prev.filter((x) => x.id !== c.id));
            setPost((p) => (p ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const blockCommenter = (c: Comment) => {
    if (!c.user_id) return;
    Alert.alert(`Block ${c.author_name}?`, "You won't see their posts or comments.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          try {
            await blockUser(c.user_id!);
            setComments((prev) => prev.filter((x) => x.user_id !== c.user_id));
          } catch (e: any) {
            Alert.alert('Could not block', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const mineComment = !!menuComment && !!user && menuComment.user_id === user.id;

  const renderComment = ({ item, index }: { item: Comment; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 300)).duration(300)} style={styles.pad}>
      <Pressable onLongPress={() => { haptic.select(); setMenuComment(item); }} delayLongPress={300}>
        <View style={styles.comment}>
          <Pressable disabled={!item.user_id} onPress={() => item.user_id && navigation.navigate('UserProfile', { userId: item.user_id })}>
            <Avatar name={item.author_name} color={item.avatar_color} size={34} />
          </Pressable>
          <BrutalBox
            fill={item.is_answer ? colors.accentSoft : colors.surface}
            radius={16}
            offset={item.is_answer ? 3 : 0}
            borderWidth={2}
            style={styles.bubble}
          >
            {item.is_answer ? (
              <View style={[styles.answerTag, outline(colors, 1.5), { backgroundColor: tints.gold }]}>
                <BadgeCheck color={INK} size={12} strokeWidth={2.8} />
                <Text style={styles.answerTagText}>SCHOLAR ANSWER</Text>
              </View>
            ) : null}
            <View style={styles.commentHead}>
              <Text style={[styles.commentAuthor, { color: colors.text }]} numberOfLines={1}>{item.author_name}</Text>
              <RoleBadge role={item.author_role} />
              <Text style={[styles.commentTime, { color: colors.textMuted }]}>{timeAgo(item.created_at, now)}</Text>
            </View>
            <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
          </BrutalBox>
        </View>
      </Pressable>
    </Animated.View>
  );

  const body = loading ? (
    <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  ) : missing || (error && !post) ? (
    <View style={styles.center}>
      <BrutalBox fill={colors.surfaceAlt} radius={22} style={styles.emptyIcon}>
        <EyeOff color={colors.ink} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{missing ? 'Post not available' : "Couldn't load post"}</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>
        {missing ? 'It may have been deleted, hidden after reports, or is in a private group.' : error}
      </Text>
      <BrutalPressable fill={colors.primary} style={styles.retry} onPress={() => (missing ? navigation.goBack() : (setLoading(true), load()))}>
        <Text style={[styles.retryText, { color: colors.onPrimary }]}>{missing ? 'Go back' : 'Try again'}</Text>
      </BrutalPressable>
    </View>
  ) : post ? (
    <FlatList
      data={comments}
      keyExtractor={(c) => c.id}
      renderItem={renderComment}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.pad}>
          <PostCard
            post={post}
            now={now}
            expanded
            onReact={actions.onReact}
            onBookmark={actions.onBookmark}
            onMore={actions.onMore}
            onAuthor={(uid) => navigation.navigate('UserProfile', { userId: uid })}
          />
          <Text style={[styles.section, { color: colors.text }]}>
            {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
          </Text>
          {post.category === 'ask' && !post.answered ? (
            <Text style={[styles.muted, styles.awaiting, { color: colors.textMuted }]}>Awaiting a scholar's answer, insha'Allah.</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.noComments}>
          <MessageSquare color={colors.textMuted} size={26} />
          <Text style={[styles.muted, { color: colors.textMuted }]}>No replies yet. Say something kind!</Text>
        </View>
      }
    />
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={post?.category === 'ask' ? 'Question' : 'Post'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {body}
        {post ? (
          <View style={[styles.inputRow, { borderTopColor: colors.ink, backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              style={[styles.input, outline(colors), { backgroundColor: colors.background, color: colors.text }]}
              placeholder={post.category === 'ask' && role === 'scholar' ? 'Write your answer…' : 'Write a reply…'}
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              maxLength={1000}
              multiline
            />
            <PressableScale
              onPress={send}
              disabled={!text.trim() || sending}
              style={[styles.send, outline(colors), { backgroundColor: text.trim() ? colors.primary : colors.surfaceAlt }]}
            >
              {sending ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Send color={text.trim() ? colors.onPrimary : colors.textMuted} size={18} strokeWidth={2.5} />}
            </PressableScale>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {actions.sheets}
      <OptionsSheet
        visible={!!menuComment}
        onClose={() => setMenuComment(null)}
        title="Reply options"
        options={menuComment ? [
          { label: 'Report reply', Icon: Flag, onPress: () => setReportComment(menuComment), hidden: mineComment },
          { label: `Block ${menuComment.author_name}`, Icon: UserX, onPress: () => blockCommenter(menuComment), hidden: mineComment || !menuComment.user_id },
          { label: 'Delete reply', Icon: Trash2, destructive: true, onPress: () => removeComment(menuComment), hidden: !(mineComment || role === 'admin') },
        ] : []}
      />
      <ReportSheet
        visible={!!reportComment}
        onClose={() => setReportComment(null)}
        target={reportComment ? { type: 'comment', id: reportComment.id } : null}
        authorId={reportComment?.user_id}
        authorName={reportComment?.author_name}
        onDone={(blocked) => {
          const c = reportComment;
          if (!c) return;
          setComments((prev) => prev.filter((x) => x.id !== c.id && !(blocked && x.user_id === c.user_id)));
        }}
      />
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 18 },
  list: { paddingTop: 18, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 },
  emptyIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '900', marginTop: 6 },
  muted: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  awaiting: { textAlign: 'left', marginBottom: 10 },
  retry: { height: 46, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  retryText: { fontSize: 15, fontWeight: '900' },
  section: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  noComments: { alignItems: 'center', gap: 8, paddingVertical: 30 },
  comment: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  bubble: { flex: 1, padding: 12 },
  answerTag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, marginBottom: 8 },
  answerTagText: { color: INK, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '900', flexShrink: 1 },
  commentTime: { fontSize: 11.5, marginLeft: 'auto' },
  commentText: { fontSize: 14.5, lineHeight: 21, marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 2 },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 15 },
  send: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
