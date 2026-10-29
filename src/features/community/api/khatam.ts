import { currentUserId, supabase, unwrap } from './client';
import type { KhatamGroup } from './types';

const SELECT = 'id, name, invite_code, created_by, target_date, completed_at, created_at, khatam_juz(juz, user_id, completed), khatam_members(user_id, profiles(username, avatar_color))';

const shape = (g: any): KhatamGroup => ({
  id: g.id,
  name: g.name,
  invite_code: g.invite_code,
  created_by: g.created_by,
  target_date: g.target_date,
  completed_at: g.completed_at,
  created_at: g.created_at,
  juz: [...(g.khatam_juz ?? [])].sort((a: any, b: any) => a.juz - b.juz),
  members: (g.khatam_members ?? []).map((m: any) => ({
    user_id: m.user_id,
    username: m.profiles?.username ?? 'Member',
    avatar_color: m.profiles?.avatar_color ?? null,
  })),
});

/** Groups I belong to (RLS only returns my groups). */
export async function fetchMyKhatams(): Promise<KhatamGroup[]> {
  const rows = unwrap(await supabase.from('khatam_groups').select(SELECT).order('created_at', { ascending: false }));
  return (rows as any[] ?? []).map(shape);
}

export async function fetchKhatam(id: string): Promise<KhatamGroup | null> {
  const row = unwrap(await supabase.from('khatam_groups').select(SELECT).eq('id', id).maybeSingle());
  return row ? shape(row) : null;
}

export async function createKhatam(name: string, targetDate: string | null): Promise<string> {
  const uid = await currentUserId();
  return unwrap<{ id: string }>(await supabase.from('khatam_groups').insert({ name: name.trim(), created_by: uid, target_date: targetDate }).select('id').single()).id;
}

export async function joinKhatam(code: string): Promise<string> {
  return unwrap(await supabase.rpc('join_khatam', { p_code: code })) as string;
}

export async function leaveKhatam(groupId: string) {
  const uid = await currentUserId();
  // Release my unfinished Juz so others can pick them up
  await supabase.from('khatam_juz').update({ user_id: null }).match({ group_id: groupId, user_id: uid, completed: false });
  unwrap(await supabase.from('khatam_members').delete().match({ group_id: groupId, user_id: uid }));
}

export async function deleteKhatam(groupId: string) {
  unwrap(await supabase.from('khatam_groups').delete().eq('id', groupId));
}

/** Claim (mine = true) or release a Juz. */
export async function claimJuz(groupId: string, juz: number, mine: boolean) {
  const uid = await currentUserId();
  unwrap(await supabase.from('khatam_juz').update({ user_id: mine ? uid : null, completed: false, updated_at: new Date().toISOString() }).match({ group_id: groupId, juz }));
}

export async function completeJuz(groupId: string, juz: number, completed: boolean) {
  unwrap(await supabase.from('khatam_juz').update({ completed, updated_at: new Date().toISOString() }).match({ group_id: groupId, juz }));
}
