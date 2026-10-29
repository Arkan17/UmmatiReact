export type QadaPrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Witr';

export interface QadaState {
  counters: Record<QadaPrayerName, number>;
  initialTotals: Record<QadaPrayerName, number>;
  totalCompleted: number;
  lastUpdated: string; // ISO date string
}

export interface QadaPrayerMeta {
  name: QadaPrayerName;
  rakahs: number;
  description: string;
  tint: string;
}

export const QADA_PRAYERS: QadaPrayerMeta[] = [
  { name: 'Fajr', rakahs: 2, description: '2 Rakahs Fard', tint: '#A7F3D0' },
  { name: 'Dhuhr', rakahs: 4, description: '4 Rakahs Fard', tint: '#FEF08A' },
  { name: 'Asr', rakahs: 4, description: '4 Rakahs Fard', tint: '#FED7AA' },
  { name: 'Maghrib', rakahs: 3, description: '3 Rakahs Fard', tint: '#FBCFE8' },
  { name: 'Isha', rakahs: 4, description: '4 Rakahs Fard', tint: '#DDD6FE' },
  { name: 'Witr', rakahs: 3, description: '3 Rakahs Wajib', tint: '#BAE6FD' },
];

export const DEFAULT_QADA_STATE: QadaState = {
  counters: {
    Fajr: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0,
    Witr: 0,
  },
  initialTotals: {
    Fajr: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0,
    Witr: 0,
  },
  totalCompleted: 0,
  lastUpdated: new Date().toISOString(),
};
