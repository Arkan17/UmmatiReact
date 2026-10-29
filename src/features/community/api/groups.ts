import { currentUserId, supabase, unwrap } from './client';
import type { CommunityGroup } from './types';

export async function fetchGroups(): Promise<CommunityGroup[]> {
  return unwrap(await supabase.rpc('get_groups')) ?? [];
}

export async function fetchGroup(id: string): Promise<CommunityGroup | null> {
  return (await fetchGroups()).find((g) => g.id === id) ?? null;
}

export async function createGroup(input: { name: string; description?: string; tint: string; isPrivate: boolean }): Promise<string> {
  const uid = await currentUserId();
  return unwrap<{ id: string }>(await supabase.from('community_groups').insert({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    tint: input.tint,
    is_private: input.isPrivate,
    created_by: uid,
  }).select('id').single()).id;
}

export async function joinGroup(opts: { groupId?: string; code?: string }): Promise<string> {
  return unwrap(await supabase.rpc('join_group', { p_group: opts.groupId ?? null, p_code: opts.code ?? null })) as string;
}

export async function leaveGroup(groupId: string) {
  const uid = await currentUserId();
  unwrap(await supabase.from('group_members').delete().match({ group_id: groupId, user_id: uid }));
}

export async function deleteGroup(groupId: string) {
  unwrap(await supabase.from('community_groups').delete().eq('id', groupId));
}

export async function fetchGroupMembers(groupId: string): Promise<{ user_id: string; role: string; username: string; avatar_color: string | null }[]> {
  const rows = unwrap(await supabase.from('group_members').select('user_id, role, profiles(username, avatar_color)').eq('group_id', groupId));
  return (rows as any[] ?? []).map((m) => ({ user_id: m.user_id, role: m.role, username: m.profiles?.username ?? 'Member', avatar_color: m.profiles?.avatar_color ?? null }));
}
