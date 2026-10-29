import {
  calculateFastingStreak,
  getRecommendedFastType,
  getSuhoorIftarTimes,
  toggleFastForDate,
} from '../src/features/fasting/utils/fastingStorage';
import { DEFAULT_FASTING_STATE, FastLogEntry, FastingState } from '../src/features/fasting/types';

jest.mock('../src/core/services/progress', () => ({
  awardXp: jest.fn(),
  incrementActivity: jest.fn(),
}));

describe('Fasting & Suhoor/Iftar Hub Operations', () => {
  it('detects Monday and Thursday as Sunnah fasts', () => {
    // 2026-10-19 was a Monday (7th Jumada al-Ula, not a White day)
    const monday = new Date(2026, 9, 19);
    expect(getRecommendedFastType(monday)).toBe('monday_thursday');

    // 2026-10-22 was a Thursday (10th Jumada al-Ula, not a White day)
    const thursday = new Date(2026, 9, 22);
    expect(getRecommendedFastType(thursday)).toBe('monday_thursday');
  });

  it('calculates consecutive fasting streaks accurately', () => {
    const today = new Date(2026, 9, 29);

    const logs: Record<string, FastLogEntry> = {
      '2026-10-29': { dateKey: '2026-10-29', type: 'monday_thursday', completed: true },
      '2026-10-28': { dateKey: '2026-10-28', type: 'nafl', completed: true },
      '2026-10-27': { dateKey: '2026-10-27', type: 'nafl', completed: true },
    };

    const streak = calculateFastingStreak(logs, today);
    expect(streak).toBe(3);
  });

  it('maintains streak from yesterday if today is not yet finished', () => {
    const today = new Date(2026, 9, 29);

    const logs: Record<string, FastLogEntry> = {
      '2026-10-28': { dateKey: '2026-10-28', type: 'nafl', completed: true },
      '2026-10-27': { dateKey: '2026-10-27', type: 'nafl', completed: true },
    };

    const streak = calculateFastingStreak(logs, today);
    expect(streak).toBe(2);
  });

  it('computes Suhoor and Iftar times with accurate fasting window', () => {
    const lat = 19.076;
    const lng = 72.8777;
    const noon = new Date(2026, 9, 29, 12, 0, 0);

    const info = getSuhoorIftarTimes(lat, lng, noon);
    expect(info.suhoorEnd).toBeDefined();
    expect(info.iftarStart).toBeDefined();
    expect(info.isFastingWindow).toBe(true);
    expect(info.progressRatio).toBeGreaterThan(0);
    expect(info.progressRatio).toBeLessThan(1);
  });

  it('toggles fast completion state and updates streaks', async () => {
    const startState: FastingState = { ...DEFAULT_FASTING_STATE };
    const date = new Date(2026, 9, 29);

    const updated = await toggleFastForDate(startState, date, 'monday_thursday');
    expect(updated.logs['2026-10-29']).toBeDefined();
    expect(updated.logs['2026-10-29'].completed).toBe(true);
    expect(updated.logs['2026-10-29'].type).toBe('monday_thursday');
    expect(updated.currentStreak).toBe(1);

    // Toggle off
    const toggledOff = await toggleFastForDate(updated, date);
    expect(toggledOff.logs['2026-10-29'].completed).toBe(false);
  });
});
