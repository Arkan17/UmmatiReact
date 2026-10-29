// Single source of truth for XP, streaks and daily activity logs, backed by Supabase.
// Screens call these helpers instead of touching storage directly; subscribers
// (e.g. the Home header) are notified so XP updates everywhere at once.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/SupabaseClient';
import { localDateKey, PrayerName, PRAYERS } from '../prayer/prayerTimes';

export interface Progress {
  total_xp: number;
  streak_count: number;
  best_streak: number;
  khatam_count: number;
  ayahs_read: number;
  daily_quran_goal: number;
  last_read_surah: number | null;
  last_read_ayah: number | null;
}

export const EMPTY_PROGRESS: Progress = {
  total_xp: 0,
  streak_count: 0,
  best_streak: 0,
  khatam_count: 0,
  ayahs_read: 0,
  daily_quran_goal: 10,
  last_read_surah: null,
  last_read_ayah: null,
};

export const XP_PER_LEVEL = 500;
export const levelFor = (xp: number) => ({
  level: Math.floor(xp / XP_PER_LEVEL) + 1,
  intoLevel: xp % XP_PER_LEVEL,
  progress: (xp % XP_PER_LEVEL) / XP_PER_LEVEL,
});

type Listener = (p: Progress) => void;
const listeners = new Set<Listener>();
let cached: Progress = EMPTY_PROGRESS;

export const subscribeProgress = (fn: Listener) => {
  listeners.add(fn);
  fn(cached);
  return () => { listeners.delete(fn); };
};

const publish = (p: Partial<Progress> | null | undefined) => {
  if (!p) return;
  cached = { ...cached, ...p };
  listeners.forEach((fn) => fn(cached));
};

const currentUserId = async () => (await supabase.auth.getSession()).data.session?.user.id ?? null;

export async function fetchProgress(): Promise<Progress> {
  const uid = await currentUserId();
  if (!uid) return EMPTY_PROGRESS;
  const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', uid).maybeSingle();
  if (error) console.warn('[progress] fetch failed:', error.message);
  publish(data ?? EMPTY_PROGRESS);
  return cached;
}

/** Award XP via the server-side RPC (which also maintains the daily streak and caps abuse). */
export async function awardXp(amount: number, source: string): Promise<Progress> {
  if (amount <= 0) return cached;
  // Optimistic update so the UI responds instantly
  publish({ total_xp: cached.total_xp + amount });
  const { data, error } = await supabase.rpc('award_xp', {
    p_amount: Math.round(amount),
    p_source: source,
    p_today: localDateKey(),
  });
  if (error) {
    console.warn('[progress] award_xp failed:', error.message);
    return fetchProgress();
  }
  publish(data as Progress);
  return cached;
}

// ---------- Daily activities (one row per user/type/day) ----------
// Local-first: every write lands in AsyncStorage immediately and is synced to Supabase in the
// background. Reads merge local + server, so a failed/offline sync never makes a logged prayer
// (or tasbih count) disappear, and the next successful read pushes the missing data up.

type Details = Record<string, any>;

const localKey = async (type: string, date: string) => `ummati_activity_${(await currentUserId()) ?? 'local'}_${type}_${date}`;

async function readLocal<T>(type: string, date: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(await localKey(type, date));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeLocal(type: string, date: string, details: Details) {
  try {
    await AsyncStorage.setItem(await localKey(type, date), JSON.stringify(details));
  } catch (e) {
    console.warn(`[progress] local save ${type} failed:`, e);
  }
}

/** Resolve to null instead of hanging when the network is slow or offline. */
const withTimeout = <T,>(p: Promise<T>, ms = 4000): Promise<T | null> =>
  Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), ms))]);

/** Union of two activity rows: true wins for flags, the larger value wins for counters. */
function mergeDetails(a: Details, b: Details): Details {
  const out: Details = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    if (typeof v === 'boolean' || typeof cur === 'boolean') out[k] = !!cur || !!v;
    else if (typeof v === 'number' && typeof cur === 'number') out[k] = Math.max(cur, v);
    else if (cur === undefined) out[k] = v;
  }
  return out;
}

const sameDetails = (a: Details | null, b: Details | null) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

async function pushRemote(type: string, date: string, details: Details) {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await supabase
      .from('user_activities')
      .upsert(
        { user_id: uid, activity_type: type, activity_date: date, details },
        { onConflict: 'user_id,activity_type,activity_date' },
      );
    if (error) console.warn(`[progress] sync ${type} failed:`, error.message);
  } catch (e) {
    console.warn(`[progress] sync ${type} failed:`, e);
  }
}

export async function getActivity<T = Record<string, any>>(type: string, date = localDateKey()): Promise<T | null> {
  const local = await readLocal<Details>(type, date);
  const uid = await currentUserId();
  if (!uid) return local as T | null;
  const res = await withTimeout(
    Promise.resolve(
      supabase
        .from('user_activities')
        .select('details')
        .eq('user_id', uid)
        .eq('activity_type', type)
        .eq('activity_date', date)
        .maybeSingle(),
    ),
  );
  const remote = (res?.data?.details as Details | undefined) ?? null;
  if (!remote) {
    if (res && !res.error && local) pushRemote(type, date, local); // server has nothing yet: upload
    return local as T | null;
  }
  const merged = mergeDetails(local ?? {}, remote);
  if (!sameDetails(merged, local)) await writeLocal(type, date, merged);
  if (!sameDetails(merged, remote)) pushRemote(type, date, merged);
  return merged as T;
}

export async function getActivitiesInRange(type: string, from: string, to: string) {
  const dates: string[] = [];
  for (const d = new Date(`${from}T00:00:00`); localDateKey(d) <= to; d.setDate(d.getDate() + 1)) dates.push(localDateKey(d));
  const locals = await Promise.all(dates.map((d) => readLocal<Details>(type, d)));
  const byDate = new Map<string, Details>();
  dates.forEach((d, i) => { if (locals[i]) byDate.set(d, locals[i]!); });

  const uid = await currentUserId();
  if (uid) {
    const res = await withTimeout(
      Promise.resolve(
        supabase
          .from('user_activities')
          .select('activity_date, details')
          .eq('user_id', uid)
          .eq('activity_type', type)
          .gte('activity_date', from)
          .lte('activity_date', to),
      ),
    );
    for (const row of (res?.data ?? []) as { activity_date: string; details: Details }[]) {
      byDate.set(row.activity_date, mergeDetails(byDate.get(row.activity_date) ?? {}, row.details ?? {}));
    }
  }
  return dates.filter((d) => byDate.has(d)).map((d) => ({ activity_date: d, details: byDate.get(d)! }));
}

/** Saves locally right away; the server copy is updated in the background. */
export async function setActivity(type: string, details: Record<string, any>, date = localDateKey()) {
  await writeLocal(type, date, details);
  pushRemote(type, date, details);
}

/** Merge numeric counters into today's activity row, e.g. { count: 33 }. */
export async function incrementActivity(type: string, deltas: Record<string, number> = { count: 1 }) {
  const existing = (await getActivity<Record<string, number>>(type)) ?? {};
  const merged = { ...existing };
  for (const [k, v] of Object.entries(deltas ?? {})) merged[k] = (merged[k] ?? 0) + v;
  await setActivity(type, merged);
  return merged;
}

// ---------- Prayer tracker ----------

export type PrayerLog = Record<PrayerName, boolean>;
export const EMPTY_PRAYER_LOG: PrayerLog = { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false };

export async function getPrayerLog(date = localDateKey()): Promise<PrayerLog> {
  return { ...EMPTY_PRAYER_LOG, ...((await getActivity<PrayerLog>('prayer', date)) ?? {}) };
}

export async function logPrayer(name: PrayerName, current: PrayerLog): Promise<PrayerLog> {
  // Merge with what's stored so a stale screen (Home vs Prayer Times) can't un-mark other prayers
  const stored = (await readLocal<PrayerLog>('prayer', localDateKey())) ?? EMPTY_PRAYER_LOG;
  const alreadyDone = stored[name];
  const updated = { ...EMPTY_PRAYER_LOG, ...stored, ...Object.fromEntries(PRAYERS.filter((p) => current[p]).map((p) => [p, true])), [name]: true } as PrayerLog;
  await setActivity('prayer', updated);
  if (!alreadyDone) {
    const allDone = PRAYERS.every((p) => updated[p]);
    // 10 XP per prayer, plus a 25 XP bonus for completing all five (XP sync runs in the background)
    awardXp(allDone ? 35 : 10, allDone ? 'prayer_all' : 'prayer').catch(() => {});
  }
  return updated;
}

/** Last N days of prayer logs, oldest first, for the weekly tracker. */
export async function getPrayerHistory(days = 7) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const rows = await getActivitiesInRange('prayer', localDateKey(from), localDateKey(to));
  const byDate = new Map(rows.map((r: any) => [r.activity_date, r.details as PrayerLog]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = localDateKey(d);
    const log = { ...EMPTY_PRAYER_LOG, ...(byDate.get(key) ?? {}) };
    return { date: d, key, log, count: PRAYERS.filter((p) => log[p]).length };
  });
}

// ---------- Quran position ----------

export async function saveLastRead(surah: number, ayah: number) {
  const uid = await currentUserId();
  if (!uid) return;
  publish({ last_read_surah: surah, last_read_ayah: ayah });
  await supabase
    .from('user_progress')
    .update({ last_read_surah: surah, last_read_ayah: ayah, last_read_timestamp: new Date().toISOString() })
    .eq('user_id', uid);
}
