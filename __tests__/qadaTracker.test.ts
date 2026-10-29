import {
  calculateCompletionStats,
  completePrayer,
  addMissedPrayer,
  setCounterExact,
  logFullDayCompleted,
  estimateMissedDays,
  applyEstimatedDaysToAll,
} from '../src/features/qada/utils/qadaStorage';
import { DEFAULT_QADA_STATE, QadaState } from '../src/features/qada/types';

jest.mock('../src/core/services/progress', () => ({
  awardXp: jest.fn(),
  incrementActivity: jest.fn(),
}));

describe('Qada Missed Prayers Math & Operations', () => {
  it('correctly calculates remaining, completed, and percentage stats', () => {
    const testState: QadaState = {
      counters: { Fajr: 5, Dhuhr: 5, Asr: 5, Maghrib: 5, Isha: 5, Witr: 5 },
      initialTotals: { Fajr: 10, Dhuhr: 10, Asr: 10, Maghrib: 10, Isha: 10, Witr: 10 },
      totalCompleted: 30,
      lastUpdated: new Date().toISOString(),
    };

    const stats = calculateCompletionStats(testState);
    expect(stats.remaining).toBe(30);
    expect(stats.initial).toBe(60);
    expect(stats.completed).toBe(30);
    expect(stats.percent).toBe(50);
  });

  it('decrements prayer counter and increments completed count on completePrayer', async () => {
    const startState: QadaState = {
      ...DEFAULT_QADA_STATE,
      counters: { ...DEFAULT_QADA_STATE.counters, Fajr: 10 },
      initialTotals: { ...DEFAULT_QADA_STATE.initialTotals, Fajr: 10 },
      totalCompleted: 0,
    };

    const updated = await completePrayer(startState, 'Fajr');
    expect(updated.counters.Fajr).toBe(9);
    expect(updated.totalCompleted).toBe(1);
  });

  it('does not decrement below 0 when completing prayer with 0 remaining', async () => {
    const startState: QadaState = {
      ...DEFAULT_QADA_STATE,
      counters: { ...DEFAULT_QADA_STATE.counters, Fajr: 0 },
    };

    const updated = await completePrayer(startState, 'Fajr');
    expect(updated.counters.Fajr).toBe(0);
  });

  it('increments counter on addMissedPrayer', async () => {
    const startState = { ...DEFAULT_QADA_STATE };
    const updated = await addMissedPrayer(startState, 'Asr');
    expect(updated.counters.Asr).toBe(1);
    expect(updated.initialTotals.Asr).toBe(1);
  });

  it('decrements all 6 prayers on logFullDayCompleted', async () => {
    const startState: QadaState = {
      counters: { Fajr: 2, Dhuhr: 2, Asr: 2, Maghrib: 2, Isha: 2, Witr: 2 },
      initialTotals: { Fajr: 2, Dhuhr: 2, Asr: 2, Maghrib: 2, Isha: 2, Witr: 2 },
      totalCompleted: 0,
      lastUpdated: new Date().toISOString(),
    };

    const updated = await logFullDayCompleted(startState);
    expect(updated.counters.Fajr).toBe(1);
    expect(updated.counters.Dhuhr).toBe(1);
    expect(updated.counters.Asr).toBe(1);
    expect(updated.counters.Maghrib).toBe(1);
    expect(updated.counters.Isha).toBe(1);
    expect(updated.counters.Witr).toBe(1);
    expect(updated.totalCompleted).toBe(6);
  });

  it('accurately estimates missed days from years, months, and days', () => {
    const oneYearDays = estimateMissedDays(1, 0, 0);
    expect(oneYearDays).toBe(365);

    const complexDays = estimateMissedDays(2, 6, 15);
    // 2 * 365.25 + 6 * 30.4 + 15 = 730.5 + 182.4 + 15 = 927.9 -> 928
    expect(complexDays).toBe(928);
  });

  it('applies estimated days to all 6 prayer counters', async () => {
    const startState = { ...DEFAULT_QADA_STATE };
    const updated = await applyEstimatedDaysToAll(startState, 100);

    expect(updated.counters.Fajr).toBe(100);
    expect(updated.counters.Dhuhr).toBe(100);
    expect(updated.counters.Asr).toBe(100);
    expect(updated.counters.Maghrib).toBe(100);
    expect(updated.counters.Isha).toBe(100);
    expect(updated.counters.Witr).toBe(100);
  });

  it('sets exact counter value', async () => {
    const startState = { ...DEFAULT_QADA_STATE };
    const updated = await setCounterExact(startState, 'Isha', 45);
    expect(updated.counters.Isha).toBe(45);
    expect(updated.initialTotals.Isha).toBe(45);
  });
});
