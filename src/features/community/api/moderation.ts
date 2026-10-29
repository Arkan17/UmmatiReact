import { currentUserId, supabase, unwrap } from './client';
import type { OpenReport, PublicProfile, ReportReason, ReportTarget } from './types';

export async function reportContent(type: ReportTarget, id: string, reason: ReportReason, details?: string) {
  const uid = await currentUserId();
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, target_type: type, target_id: id, reason, details: details?.trim() || null });
  // Reporting twice is fine: the first report still stands
  if (error && !/duplicate key/i.test(error.message)) unwrap({ data: null, error });
}

export async function blockUser(userId: string) {
  const uid = await currentUserId();
  unwrap(await supabase.from('blocks').upsert({ blocker_id: uid, blocked_id: userId }, { onConflict: 'blocker_id,blocked_id' }));
}

export async function unblockUser(userId: string) {
  const uid = await currentUserId();
  unwrap(await supabase.from('blocks').delete().match({ blocker_id: uid, blocked_id: userId }));
}

export async function fetchBlockedUsers(): Promise<{ user_id: string; username: string }[]> {
  const rows = unwrap(await supabase.from('blocks').select('blocked_id, profiles!blocks_blocked_id_fkey(username)'));
  return (rows as any[] ?? []).map((r) => ({ user_id: r.blocked_id, username: r.profiles?.username ?? 'User' }));
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const rows: PublicProfile[] = unwrap(await supabase.rpc('get_public_profile', { p_user: userId })) ?? [];
  return rows[0] ?? null;
}

export async function fetchMyRole(): Promise<{ role: string; acceptedGuidelines: boolean }> {
  const uid = await currentUserId();
  if (!uid) return { role: 'member', acceptedGuidelines: false };
  const { data } = await supabase.from('profiles').select('role, accepted_guidelines_at').eq('id', uid).maybeSingle();
  return { role: data?.role ?? 'member', acceptedGuidelines: !!data?.accepted_guidelines_at };
}

export async function acceptGuidelines() {
  unwrap(await supabase.rpc('accept_guidelines'));
}

export async function fetchOpenReports(): Promise<OpenReport[]> {
  return unwrap(await supabase.rpc('get_open_reports')) ?? [];
}

export async function moderate(type: ReportTarget, id: string, action: 'hide' | 'restore' | 'delete' | 'dismiss') {
  unwrap(await supabase.rpc('moderate_content', { p_type: type, p_id: id, p_action: action }));
}
