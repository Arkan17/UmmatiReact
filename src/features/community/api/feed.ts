import { currentUserId, supabase, unwrap } from './client';
import type { Attachment, Category, Comment, Post, ReactionKind } from './types';

export const PAGE_SIZE = 20;

export interface FeedQuery {
  category?: Category | null;
  groupId?: string | null;
  authorId?: string | null;
  saved?: boolean;
  /** created_at of the last loaded post (for infinite scroll) */
  before?: string | null;
  limit?: number;
}

export async function fetchFeed(q: FeedQuery = {}): Promise<Post[]> {
  return unwrap(await supabase.rpc('get_feed', {
    p_category: q.category ?? null,
    p_group: q.groupId ?? null,
    p_author: q.authorId ?? null,
    p_saved: q.saved ?? false,
    p_before: q.before ?? null,
    p_limit: q.limit ?? PAGE_SIZE,
  })) ?? [];
}

export async function fetchPost(id: string): Promise<Post | null> {
  const rows: Post[] = unwrap(await supabase.rpc('get_feed', { p_post: id, p_limit: 1 })) ?? [];
  return rows[0] ?? null;
}

export async function createPost(input: {
  content: string;
  category: Category;
  authorName: string;
  avatarColor?: string | null;
  attachment?: Attachment | null;
  groupId?: string | null;
}): Promise<string> {
  const uid = await currentUserId();
  return unwrap<{ id: string }>(await supabase.from('posts').insert({
    user_id: uid,
    author_name: input.authorName,
    avatar_text: input.authorName.slice(0, 2).toUpperCase(),
    avatar_color: input.avatarColor ?? null,
    content: input.content.trim(),
    category: input.category,
    attachment: input.attachment ?? null,
    group_id: input.groupId ?? null,
  }).select('id').single()).id;
}

export async function deletePost(id: string) {
  unwrap(await supabase.from('posts').delete().eq('id', id));
}

/** Set, change or (kind = null) remove my reaction on a post. */
export async function setReaction(postId: string, kind: ReactionKind | null) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Please sign in first.');
  if (kind === null) {
    unwrap(await supabase.from('likes').delete().match({ post_id: postId, user_id: uid }));
  } else {
    unwrap(await supabase.from('likes').upsert({ post_id: postId, user_id: uid, kind }, { onConflict: 'post_id,user_id' }));
  }
}

export async function setBookmark(postId: string, saved: boolean) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Please sign in first.');
  if (saved) unwrap(await supabase.from('bookmarks').upsert({ post_id: postId, user_id: uid }, { onConflict: 'post_id,user_id' }));
  else unwrap(await supabase.from('bookmarks').delete().match({ post_id: postId, user_id: uid }));
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  return unwrap(await supabase.rpc('get_comments', { p_post: postId })) ?? [];
}

export async function addComment(postId: string, content: string, authorName: string) {
  const uid = await currentUserId();
  unwrap(await supabase.from('comments').insert({ post_id: postId, user_id: uid, author_name: authorName, content: content.trim() }));
}

export async function deleteComment(id: string) {
  unwrap(await supabase.from('comments').delete().eq('id', id));
}
