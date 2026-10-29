import AsyncStorage from '@react-native-async-storage/async-storage';
import { awardXp, incrementActivity } from '../../../core/services/progress';
import { DEFAULT_QADA_STATE, QadaPrayerName, QadaState } from '../types';

const QADA_STORAGE_KEY = 'ummati_qada_state_v1';

export async function loadQadaState(): Promise<QadaState> {
  try {
    const raw = await AsyncStorage.getItem(QADA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_QADA_STATE,
        ...parsed,
        counters: { ...DEFAULT_QADA_STATE.counters, ...parsed.counters },
        initialTotals: { ...DEFAULT_QADA_STATE.initialTotals, ...parsed.initialTotals },
      };
    }
  } catch (e) {
    console.warn('Failed to load Qada state:', e);
  }
  return DEFAULT_QADA_STATE;
}

export async function saveQadaState(state: QadaState): Promise<void> {
  try {
    const updated = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(QADA_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save Qada state:', e);
  }
}

export function calculateCompletionStats(state: QadaState) {
  const prayers: QadaPrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];
  const remaining = prayers.reduce((sum, p) => sum + (state.counters[p] || 0), 0);
  const initial = prayers.reduce((sum, p) => sum + (state.initialTotals[p] || 0), 0);
  const completed = Math.max(0, initial - remaining);
  const percent = initial > 0 ? Math.min(100, Math.round((completed / initial) * 100)) : 0;

  return {
    remaining,
    initial,
    completed: Math.max(completed, state.totalCompleted || 0),
    percent,
  };
}

export function estimateMissedDays(years: number, months = 0, days = 0): number {
  const totalDays = Math.round(years * 365.25 + months * 30.4 + days);
  return Math.max(0, totalDays);
}

export async function completePrayer(state: QadaState, prayer: QadaPrayerName): Promise<QadaState> {
  const current = state.counters[prayer] || 0;
  if (current <= 0) return state;

  const nextCount = Math.max(0, current - 1);
  const updated: QadaState = {
    ...state,
    counters: {
      ...state.counters,
      [prayer]: nextCount,
    },
    totalCompleted: (state.totalCompleted || 0) + 1,
    lastUpdated: new Date().toISOString(),
  };

  await saveQadaState(updated);
  awardXp(5, 'qada_prayer');
  incrementActivity('prayer', { count: 1 });
  return updated;
}

export async function addMissedPrayer(state: QadaState, prayer: QadaPrayerName): Promise<QadaState> {
  const current = state.counters[prayer] || 0;
  const initial = state.initialTotals[prayer] || 0;

  const updated: QadaState = {
    ...state,
    counters: {
      ...state.counters,
      [prayer]: current + 1,
    },
    initialTotals: {
      ...state.initialTotals,
      [prayer]: Math.max(initial, current + 1),
    },
    lastUpdated: new Date().toISOString(),
  };

  await saveQadaState(updated);
  return updated;
}

export async function setCounterExact(
  state: QadaState,
  prayer: QadaPrayerName,
  exactValue: number,
): Promise<QadaState> {
  const value = Math.max(0, Math.round(exactValue));
  const currentInitial = state.initialTotals[prayer] || 0;

  const updated: QadaState = {
    ...state,
    counters: {
      ...state.counters,
      [prayer]: value,
    },
    initialTotals: {
      ...state.initialTotals,
      [prayer]: Math.max(currentInitial, value),
    },
    lastUpdated: new Date().toISOString(),
  };

  await saveQadaState(updated);
  return updated;
}

export async function logFullDayCompleted(state: QadaState): Promise<QadaState> {
  const prayers: QadaPrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];
  const newCounters = { ...state.counters };
  let prayersDecremented = 0;

  for (const p of prayers) {
    if (newCounters[p] > 0) {
      newCounters[p] -= 1;
      prayersDecremented++;
    }
  }

  if (prayersDecremented === 0) return state;

  const updated: QadaState = {
    ...state,
    counters: newCounters,
    totalCompleted: (state.totalCompleted || 0) + prayersDecremented,
    lastUpdated: new Date().toISOString(),
  };

  await saveQadaState(updated);
  awardXp(prayersDecremented * 5, 'qada_full_day');
  incrementActivity('prayer', { count: prayersDecremented });
  return updated;
}

export async function applyEstimatedDaysToAll(
  state: QadaState,
  days: number,
): Promise<QadaState> {
  const rounded = Math.max(0, Math.round(days));
  const prayers: QadaPrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];

  const newCounters = { ...state.counters };
  const newInitials = { ...state.initialTotals };

  for (const p of prayers) {
    newCounters[p] = rounded;
    newInitials[p] = rounded;
  }

  const updated: QadaState = {
    ...state,
    counters: newCounters,
    initialTotals: newInitials,
    lastUpdated: new Date().toISOString(),
  };

  await saveQadaState(updated);
  return updated;
}
