import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes, localDateKey } from '../../../core/prayer/prayerTimes';
import { awardXp, incrementActivity } from '../../../core/services/progress';
import { isRamadan, isWhiteDay, toHijri } from '../../../core/utils/hijri';
import { DEFAULT_FASTING_STATE, FastLogEntry, FastType, FastingState } from '../types';

const FASTING_STORAGE_KEY = 'ummati_fasting_state_v1';

export function getRecommendedFastType(date = new Date()): FastType {
  const hijri = toHijri(date);

  if (isRamadan(hijri)) return 'ramadan';
  if (hijri.month === 12 && hijri.day === 9) return 'arafah';
  if (hijri.month === 1 && hijri.day === 10) return 'ashura';
  if (isWhiteDay(hijri)) return 'white_day';

  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, 4 = Thu
  if (dayOfWeek === 1 || dayOfWeek === 4) return 'monday_thursday';

  if (hijri.month === 10 && hijri.day >= 2 && hijri.day <= 30) return 'shawwal';

  return 'nafl';
}

export async function loadFastingState(): Promise<FastingState> {
  try {
    const raw = await AsyncStorage.getItem(FASTING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_FASTING_STATE,
        ...parsed,
        logs: { ...parsed.logs },
      };
    }
  } catch (e) {
    console.warn('Failed to load fasting state:', e);
  }
  return DEFAULT_FASTING_STATE;
}

export async function saveFastingState(state: FastingState): Promise<void> {
  try {
    await AsyncStorage.setItem(FASTING_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save fasting state:', e);
  }
}

export function calculateFastingStreak(logs: Record<string, FastLogEntry>, referenceDate = new Date()): number {
  let streak = 0;
  const cursor = new Date(referenceDate);

  // Check today first, if not fasted today, check if yesterday was fasted to maintain streak
  const todayKey = localDateKey(cursor);
  if (logs[todayKey]?.completed) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // If today is not completed yet, start check from yesterday
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = localDateKey(cursor);
    if (logs[key]?.completed) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function toggleFastForDate(
  state: FastingState,
  date = new Date(),
  customType?: FastType,
): Promise<FastingState> {
  const dateKey = localDateKey(date);
  const existing = state.logs[dateKey];
  const willBeCompleted = !existing?.completed;

  const type = customType || existing?.type || getRecommendedFastType(date);

  const updatedLogs: Record<string, FastLogEntry> = {
    ...state.logs,
    [dateKey]: {
      dateKey,
      type,
      completed: willBeCompleted,
    },
  };

  const currentStreak = calculateFastingStreak(updatedLogs, new Date());
  const bestStreak = Math.max(state.bestStreak || 0, currentStreak);

  const updatedState: FastingState = {
    logs: updatedLogs,
    currentStreak,
    bestStreak,
  };

  await saveFastingState(updatedState);

  if (willBeCompleted) {
    awardXp(20, 'fast_completed');
    incrementActivity('fasting', { count: 1 });
  }

  return updatedState;
}

export interface FastingTimesInfo {
  suhoorEnd: Date; // Fajr
  iftarStart: Date; // Maghrib
  isFastingWindow: boolean;
  totalFastingDurationMs: number;
  remainingMs: number;
  progressRatio: number; // 0 to 1 during the fast
}

export function getSuhoorIftarTimes(latitude: number, longitude: number, now = new Date()): FastingTimesInfo {
  const times = getPrayerTimes(latitude, longitude, now);
  const suhoorEnd = times.fajr;
  const iftarStart = times.maghrib;

  const nowMs = now.getTime();
  const suhoorMs = suhoorEnd.getTime();
  const iftarMs = iftarStart.getTime();

  const isFastingWindow = nowMs >= suhoorMs && nowMs < iftarMs;
  const totalFastingDurationMs = Math.max(1, iftarMs - suhoorMs);

  let remainingMs = 0;
  let progressRatio = 0;

  if (nowMs < suhoorMs) {
    // Before Fajr: countdown to Suhoor end
    remainingMs = suhoorMs - nowMs;
    progressRatio = 0;
  } else if (isFastingWindow) {
    // During Fast: countdown to Iftar
    remainingMs = iftarMs - nowMs;
    const elapsed = nowMs - suhoorMs;
    progressRatio = Math.min(1, Math.max(0, elapsed / totalFastingDurationMs));
  } else {
    // After Iftar: countdown to tomorrow's Suhoor
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = getPrayerTimes(latitude, longitude, tomorrow);
    remainingMs = Math.max(0, tomorrowTimes.fajr.getTime() - nowMs);
    progressRatio = 1;
  }

  return {
    suhoorEnd,
    iftarStart,
    isFastingWindow,
    totalFastingDurationMs,
    remainingMs,
    progressRatio,
  };
}
