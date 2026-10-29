import { supabase, unwrap } from './client';
import type { Challenge } from './types';

export async function fetchChallenges(): Promise<Challenge[]> {
  return unwrap(await supabase.rpc('get_challenges')) ?? [];
}

/** Join with amount 0, or add progress. XP is awarded server-side when the goal is reached. */
export async function logChallenge(id: string, amount: number): Promise<{ progress: number; completed_at: string | null }> {
  return unwrap(await supabase.rpc('log_challenge', { p_challenge: id, p_amount: amount }));
}
