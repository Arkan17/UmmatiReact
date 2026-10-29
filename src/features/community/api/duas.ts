import { currentUserId, supabase, unwrap } from './client';
import type { DuaRequest } from './types';

export async function fetchDuas(opts: { before?: string | null; mine?: boolean; limit?: number } = {}): Promise<DuaRequest[]> {
  return unwrap(await supabase.rpc('get_duas', { p_before: opts.before ?? null, p_limit: opts.limit ?? 20, p_mine: opts.mine ?? false })) ?? [];
}

export async function createDua(content: string, isAnonymous: boolean) {
  const uid = await currentUserId();
  unwrap(await supabase.from('dua_requests').insert({ user_id: uid, content: content.trim(), is_anonymous: isAnonymous }));
}

export async function deleteDua(id: string) {
  unwrap(await supabase.from('dua_requests').delete().eq('id', id));
}

/** Owner marks their dua as answered (Alhamdulillah) or un-marks it. */
export async function markDuaAnswered(id: string, answered: boolean) {
  unwrap(await supabase.from('dua_requests').update({ answered_at: answered ? new Date().toISOString() : null }).eq('id', id));
}

export async function setAmeen(id: string, on: boolean) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Please sign in first.');
  if (on) unwrap(await supabase.from('dua_ameens').upsert({ request_id: id, user_id: uid }, { onConflict: 'request_id,user_id' }));
  else unwrap(await supabase.from('dua_ameens').delete().match({ request_id: id, user_id: uid }));
}
