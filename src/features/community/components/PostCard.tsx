// One community post: author, category, text (collapsible), shared ayah/dua, reactions, comments, bookmark.
import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, Bookmark, Calendar, EyeOff, HelpCircle, MessageCircle, MessageSquare, MoreHorizontal, Users } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { Card, PressableScale, haptic, outline } from '../../../core/components/ui';
import type { Category, Post, ReactionKind } from '../api/types';
import { timeAgo } from '../utils/time';
import { AttachmentCard } from './AttachmentCard';
import { Avatar, RoleBadge } from './Avatar';
import { ReactionBar } from './ReactionBar';

const INK = '#1C1A17';
const LONG_POST = 280;

export const CATEGORY_META: Record<Category, { label: string; Icon: typeof MessageCircle; tint: string }> = {
  discuss: { label: 'Discuss', Icon: MessageCircle, tint: tints.green },
  ask: { label: 'Ask', Icon: HelpCircle, tint: tints.orange },
  event: { label: 'Events', Icon: Calendar, tint: tints.blue },
  group: { label: 'Group', Icon: Users, tint: tints.violet },
};

export interface PostCardProps {
  post: Post;
  now: number;
  onReact: (post: Post, kind: ReactionKind | null) => void;
  onBookmark: (post: Post) => void;
  onOpen?: (post: Post) => void;
  onAuthor?: (userId: string) => void;
  onMore: (post: Post) => void;
  /** Full text, no "Read more" (post detail screen) */
  expanded?: boolean;
}

export const PostCard = memo(function PostCard({ post, now, onReact, onBookmark, onOpen, onAuthor, onMore, expanded }: PostCardProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(!!expanded);
  const cat = CATEGORY_META[post.category] ?? CATEGORY_META.discuss;
  const long = !open && post.content.length > LONG_POST;

  return (
    <Card style={styles.card}>
      {post.is_hidden ? (
        <View style={[styles.hiddenNote, outline(colors, 1.5), { backgroundColor: colors.surfaceAlt }]}>
          <EyeOff color={colors.textMuted} size={14} />
          <Text style={[styles.hiddenText, { color: colors.textMuted }]}>Hidden after reports — only you can see this while it is reviewed.</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Pressable disabled={!post.user_id || !onAuthor} onPress={() => post.user_id && onAuthor?.(post.user_id)} style={styles.authorTap}>
          <Avatar name={post.author_name} color={post.avatar_color} size={42} />
          <View style={styles.meta}>
            <View style={styles.nameRow}>
              <Text style={[styles.author, { color: colors.text }]} numberOfLines={1}>{post.author_name}</Text>
              <RoleBadge role={post.author_role} />
            </View>
            <View style={styles.subRow}>
              <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(post.created_at, now)}</Text>
              <View style={[styles.catPill, { backgroundColor: cat.tint, borderColor: colors.ink }]}>
                <cat.Icon color={INK} size={10} strokeWidth={2.8} />
                <Text style={styles.catText}>{cat.label}</Text>
              </View>
              {post.category === 'ask' && post.answered ? (
                <View style={[styles.catPill, { backgroundColor: tints.gold, borderColor: colors.ink }]}>
                  <BadgeCheck color={INK} size={10} strokeWidth={2.8} />
                  <Text style={styles.catText}>Answered</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
        <Pressable hitSlop={10} style={styles.more} onPress={() => { haptic.light(); onMore(post); }}>
          <MoreHorizontal color={colors.textMuted} size={20} />
        </Pressable>
      </View>

      {post.group_name ? (
        <View style={[styles.groupPill, outline(colors, 1.5), { backgroundColor: tints.violet }]}>
          <Users color={INK} size={11} strokeWidth={2.6} />
          <Text style={styles.groupText} numberOfLines={1}>{post.group_name}</Text>
        </View>
      ) : null}

      <Pressable disabled={!onOpen} onPress={() => onOpen?.(post)}>
        <Text style={[styles.content, { color: colors.text }]}>
          {long ? `${post.content.slice(0, LONG_POST).trimEnd()}… ` : post.content}
          {long ? <Text onPress={() => setOpen(true)} style={[styles.readMore, { color: colors.primary }]}>Read more</Text> : null}
        </Text>
        {post.attachment ? <AttachmentCard attachment={post.attachment} compact={!expanded} /> : null}
      </Pressable>

      <View style={[styles.footer, { borderTopColor: colors.ink }]}>
        <ReactionBar reactions={post.reactions} total={post.reaction_total} mine={post.my_reaction} onReact={(k) => onReact(post, k)} />
        <View style={styles.flex} />
        <PressableScale disabled={!onOpen} onPress={() => onOpen?.(post)} style={styles.action}>
          <MessageSquare color={colors.textSecondary} size={19} />
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>{post.comment_count}</Text>
        </PressableScale>
        <PressableScale
          hapticOnPress={false}
          onPress={() => { haptic.light(); onBookmark(post); }}
          style={[styles.action, post.is_bookmarked ? [outline(colors), { backgroundColor: colors.accentSoft }] : styles.actionIdle]}
        >
          <Bookmark color={post.is_bookmarked ? colors.ink : colors.textSecondary} fill={post.is_bookmarked ? colors.accent : 'none'} size={19} />
        </PressableScale>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: 24, marginBottom: 16, padding: 16 },
  hiddenNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10, marginBottom: 12 },
  hiddenText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center' },
  authorTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  author: { fontSize: 15.5, fontWeight: '900', flexShrink: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  time: { fontSize: 12.5, fontWeight: '600' },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, height: 20, borderRadius: 10, borderWidth: 1.5 },
  catText: { color: INK, fontSize: 10.5, fontWeight: '900' },
  more: { padding: 6 },
  groupPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, marginTop: 12 },
  groupText: { color: INK, fontSize: 11.5, fontWeight: '900', maxWidth: 220 },
  content: { fontSize: 15.5, lineHeight: 23, marginTop: 12 },
  readMore: { fontWeight: '900' },
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 14, paddingTop: 10, borderTopWidth: brutal.borderThin },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 36, borderRadius: 18 },
  actionIdle: { borderWidth: brutal.borderThin, borderColor: 'transparent' },
  actionCount: { fontSize: 13.5, fontWeight: '800' },
});
