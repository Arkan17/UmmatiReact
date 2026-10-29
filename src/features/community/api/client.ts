// Small helpers shared by the community API modules.
import { supabase } from '../../../core/config/SupabaseClient';

export { supabase };

/** Turns Postgres/Supabase errors into short messages a user can read. */
export const friendly = (e: unknown): string => {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/network request failed|fetch failed/i.test(msg)) return 'No internet connection. Please try again.';
  if (/not authenticated|JWT/i.test(msg)) return 'Please sign in first.';
  if (/row-level security/i.test(msg)) return 'You are not allowed to do that.';
  if (/check constraint/i.test(msg)) return 'That text is too long or not allowed.';
  return msg.replace(/^.*?ERROR:\s*/, '');
};

/** Unwraps a Supabase response, throwing a readable Error on failure. */
export function unwrap<T = any>({ data, error }: { data: unknown; error: { message: string } | null }): T {
  if (error) throw new Error(friendly(error));
  return data as T;
}

export const currentUserId = async () => (await supabase.auth.getSession()).data.session?.user.id ?? null;

let channelSeq = 0;
/**
 * Unique realtime channel name. supabase.channel(name) returns the EXISTING channel when the name is
 * already in use, and adding listeners to an already-subscribed channel throws
 * "cannot add postgres_changes callbacks ... after subscribe()". Several screens listen to the same
 * table at once, so every subscription gets its own channel.
 */
export const channelName = (base: string) => `${base}-${++channelSeq}-${Date.now().toString(36)}`;
