import { channelName, currentUserId, supabase, unwrap } from './client';
import type { CommunityNotification } from './types';

export async function fetchNotifications(limit = 50): Promise<CommunityNotification[]> {
  return unwrap(await supabase.from('community_notifications').select('*').order('created_at', { ascending: false }).limit(limit)) ?? [];
}

export async function unreadCount(): Promise<number> {
  const { count } = await supabase.from('community_notifications').select('id', { count: 'exact', head: true }).eq('is_read', false);
  return count ?? 0;
}

export async function markAllRead() {
  const uid = await currentUserId();
  if (!uid) return;
  unwrap(await supabase.from('community_notifications').update({ is_read: true }).eq('user_id', uid).eq('is_read', false));
}

export async function clearNotifications() {
  const uid = await currentUserId();
  if (!uid) return;
  unwrap(await supabase.from('community_notifications').delete().eq('user_id', uid));
}

/** Calls back for every new notification addressed to me. Returns an unsubscribe function. */
export function subscribeNotifications(userId: string, onNew: (n: CommunityNotification) => void) {
  const channel = supabase
    .channel(channelName(`notifications-${userId}`))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNew(payload.new as CommunityNotification))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Calls back when anyone publishes a new post (for the "new posts" pill). */
export function subscribeNewPosts(onNew: (post: { id: string; user_id: string | null; group_id: string | null }) => void) {
  const channel = supabase
    .channel(channelName('posts-feed'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => onNew(payload.new as any))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
