import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import type { PrayerPeriod } from '../theme/palettes';

export const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = (typeof PRAYERS)[number];
export type ReminderName = PrayerName | 'Sunrise';

const LAST_LOCATION_KEY = 'ummati_last_location';
// Mumbai, matching the fallback in useLocation
export const FALLBACK_COORDS = { latitude: 19.076, longitude: 72.8777 };

export async function saveLastLocation(latitude: number, longitude: number) {
  try {
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ latitude, longitude }));
  } catch {}
}

export async function loadLastLocation(): Promise<{ latitude: number; longitude: number }> {
  try {
    const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return FALLBACK_COORDS;
}

export function getPrayerTimes(latitude: number, longitude: number, date = new Date()) {
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Shafi;
  return new PrayerTimes(new Coordinates(latitude, longitude), date, params);
}

export function timeFor(times: PrayerTimes, name: ReminderName): Date {
  switch (name) {
    case 'Fajr': return times.fajr;
    case 'Sunrise': return times.sunrise;
    case 'Dhuhr': return times.dhuhr;
    case 'Asr': return times.asr;
    case 'Maghrib': return times.maghrib;
    case 'Isha': return times.isha;
  }
}

/** Which part of the day we're in, used to drive the adaptive theme. */
export function currentPeriod(times: PrayerTimes, now = new Date()): PrayerPeriod {
  if (now < times.fajr) return 'isha';
  if (now < times.sunrise) return 'fajr';
  if (now < times.asr) return 'day';
  if (now < times.maghrib) return 'asr';
  // Sunset glow lasts until Isha
  if (now < times.isha) return 'maghrib';
  return 'isha';
}

export interface NextPrayer {
  name: PrayerName;
  time: Date;
  previousTime: Date;
  isTomorrow: boolean;
}

export function getNextPrayer(latitude: number, longitude: number, now = new Date()): NextPrayer {
  const today = getPrayerTimes(latitude, longitude, now);
  const ordered = PRAYERS.map((name) => ({ name, time: timeFor(today, name) }));
  const idx = ordered.findIndex((p) => p.time > now);

  if (idx === -1) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      name: 'Fajr',
      time: getPrayerTimes(latitude, longitude, tomorrow).fajr,
      previousTime: today.isha,
      isTomorrow: true,
    };
  }
  if (idx === 0) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      name: 'Fajr',
      time: today.fajr,
      previousTime: getPrayerTimes(latitude, longitude, yesterday).isha,
      isTomorrow: false,
    };
  }
  return { ...ordered[idx], previousTime: ordered[idx - 1].time, isTomorrow: false };
}

export const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

export const localDateKey = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
