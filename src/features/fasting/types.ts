export type FastType =
  | 'ramadan'
  | 'white_day'
  | 'monday_thursday'
  | 'ashura'
  | 'arafah'
  | 'shawwal'
  | 'qada'
  | 'nafl';

export interface FastLogEntry {
  dateKey: string; // YYYY-MM-DD
  type: FastType;
  completed: boolean;
  notes?: string;
}

export interface FastingState {
  logs: Record<string, FastLogEntry>; // key: YYYY-MM-DD
  currentStreak: number;
  bestStreak: number;
}

export const DEFAULT_FASTING_STATE: FastingState = {
  logs: {},
  currentStreak: 0,
  bestStreak: 0,
};

export const FAST_TYPE_LABELS: Record<FastType, { label: string; badge: string; tint: string }> = {
  ramadan: { label: 'Ramadan Fast', badge: '🌙 Fard', tint: '#A7F3D0' },
  white_day: { label: 'White Day (Ayyam al-Bid)', badge: '⭐ Sunnah', tint: '#BAE6FD' },
  monday_thursday: { label: 'Sunnah Monday / Thursday', badge: '🌱 Sunnah', tint: '#DDD6FE' },
  arafah: { label: 'Day of Arafah', badge: '✨ Highly Blessed', tint: '#FEF08A' },
  ashura: { label: 'Day of Ashura', badge: '🤲 Sunnah', tint: '#FED7AA' },
  shawwal: { label: '6 Days of Shawwal', badge: '🎁 Sunnah', tint: '#FBCFE8' },
  qada: { label: 'Qada (Made up Fast)', badge: '📝 Wajib', tint: '#E0E7FF' },
  nafl: { label: 'Voluntary (Nafl) Fast', badge: '🤍 Voluntary', tint: '#F3F4F6' },
};
