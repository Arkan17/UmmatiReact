import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

export interface JamatTimings {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string;
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  /** True when the Jamat times are calculated, not entered by the user */
  isEstimated: boolean;
  timings: JamatTimings;
}

export type TravelMode = 'car' | 'bike' | 'walk';

export interface RouteInfo {
  /** metres */
  distance: number;
  /** seconds */
  duration: number;
  /** [lat, lng] pairs, ready for Leaflet */
  path: [number, number][];
}

// Public Overpass mirrors. They go down or get slow regularly, so requests are hedged across them.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const MIRROR_STAGGER_MS = 3500;
const SEARCH_TIMEOUT_MS = 45000;

const OSRM_PROFILES: Record<TravelMode, string> = {
  car: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
  walk: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
};

const CACHE_KEY = 'ummati_mosques_cache_v2';
const SAVED_KEY = 'ummati_saved_mosques';
const timingsKey = (id: string) => `ummati_jamat_times_${id}`;

/** Great-circle distance in metres. */
export const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);

export const formatDuration = (sec: number) => {
  const min = Math.max(1, Math.round(sec / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
};

/** Rough walking time from straight-line distance (roads are ~30% longer, 4.8 km/h pace). */
export const estimateWalkSeconds = (m: number) => (m * 1.3) / (4800 / 3600);

// Jamat estimate: MWL Hanafi start time + a typical congregation offset
export const estimateJamatTimes = (lat: number, lng: number): JamatTimings => {
  const pt = new PrayerTimes(new Coordinates(lat, lng), new Date(), (() => {
    const p = CalculationMethod.MuslimWorldLeague();
    p.madhab = Madhab.Hanafi;
    return p;
  })());
  const fmt = (d: Date | null | undefined, offset: number) => {
    if (!d) return '--:--';
    const t = new Date(d.getTime() + offset * 60000);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  };
  return {
    fajr: fmt(pt.fajr, 15),
    dhuhr: fmt(pt.dhuhr, 15),
    asr: fmt(pt.asr, 15),
    maghrib: fmt(pt.maghrib, 7),
    isha: fmt(pt.isha, 15),
    jummah: '13:30',
  };
};

/** Next Jamat today (or Fajr tomorrow) as { key, time }. */
export const nextJamat = (t: JamatTimings) => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const order: (keyof JamatTimings)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const key of order) {
    const [h, m] = t[key].split(':').map(Number);
    if (!isNaN(h) && !isNaN(m) && h * 60 + m > nowMin) return { key, time: t[key] };
  }
  return { key: 'fajr' as const, time: t.fajr };
};

/**
 * Fires the request at the first mirror, then (if it hasn't answered yet) the next one every few
 * seconds. The first successful response wins and the rest are aborted.
 */
async function hedgedOverpass(query: string): Promise<any> {
  const controllers: AbortController[] = [];
  const body = `data=${encodeURIComponent(query)}`;
  return new Promise((resolve, reject) => {
    let settled = false;
    let started = 0;
    let failures = 0;
    let stagger: ReturnType<typeof setInterval> | undefined;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearInterval(stagger);
      clearTimeout(deadline);
      controllers.forEach((c) => c.abort());
      fn();
    };
    const deadline = setTimeout(() => finish(() => reject(new Error('timeout'))), SEARCH_TIMEOUT_MS);

    const launchNext = async () => {
      if (settled || started >= OVERPASS_MIRRORS.length) return;
      const url = OVERPASS_MIRRORS[started++];
      const ctrl = new AbortController();
      controllers.push(ctrl);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'UmmatiApp/1.0' },
          body,
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        finish(() => resolve(json));
      } catch {
        failures += 1;
        if (failures === OVERPASS_MIRRORS.length) finish(() => reject(new Error('all mirrors failed')));
        else launchNext(); // a fast failure shouldn't wait for the stagger
      }
    };

    launchNext();
    stagger = setInterval(launchNext, MIRROR_STAGGER_MS);
  });
}

const buildAddress = (tags: Record<string, string>) => {
  const parts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.join(', ') || tags['addr:full'] || '';
};

async function attachTimings(base: Omit<Mosque, 'isEstimated' | 'timings'>): Promise<Mosque> {
  try {
    const stored = await AsyncStorage.getItem(timingsKey(base.id));
    if (stored) return { ...base, timings: JSON.parse(stored), isEstimated: false };
  } catch {}
  return { ...base, timings: estimateJamatTimes(base.latitude, base.longitude), isEstimated: true };
}

async function queryOverpass(lat: number, lng: number, radius: number) {
  const query = `[out:json][timeout:25];nwr(around:${radius},${lat},${lng})["amenity"="place_of_worship"]["religion"="muslim"];out center tags;`;
  const json = await hedgedOverpass(query);
  const out: Omit<Mosque, 'isEstimated' | 'timings'>[] = [];
  for (const el of json?.elements ?? []) {
    const la = el.lat ?? el.center?.lat;
    const lo = el.lon ?? el.center?.lon;
    if (typeof la !== 'number' || typeof lo !== 'number') continue;
    const tags = el.tags ?? {};
    const name = tags['name:en'] || tags.name || 'Masjid';
    // The same masjid is often mapped as both a point and a building outline
    if (out.some((m) => m.name === name && distanceMeters(m.latitude, m.longitude, la, lo) < 80)) continue;
    out.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      address: buildAddress(tags),
      latitude: la,
      longitude: lo,
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website'],
    });
  }
  return out;
}

export interface MosqueSearchResult {
  mosques: Mosque[];
  radius: number;
  /** Set when the network failed and these came from the cache */
  fromCache?: boolean;
}

/** Nearby mosques, widening the search if the area is sparse. Falls back to the last cached result. */
export async function fetchNearbyMosques(lat: number, lng: number): Promise<MosqueSearchResult> {
  try {
    let radius = 5000;
    let raw = await queryOverpass(lat, lng, radius);
    if (raw.length < 5) {
      radius = 15000;
      raw = await queryOverpass(lat, lng, radius);
    }
    const mosques = await Promise.all(raw.map(attachTimings));
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng, radius, mosques: raw })).catch(() => {});
    return { mosques, radius };
  } catch (e) {
    const cached = await getCachedMosques(lat, lng, true);
    if (cached) return { ...cached, fromCache: true };
    throw e;
  }
}

/** Last search result, if it was made near this spot (or anywhere when `anyPlace`). */
export async function getCachedMosques(lat: number, lng: number, anyPlace = false): Promise<MosqueSearchResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!anyPlace && distanceMeters(lat, lng, c.lat, c.lng) > 2000) return null;
    return { mosques: await Promise.all(c.mosques.map(attachTimings)), radius: c.radius };
  } catch {
    return null;
  }
}

export async function saveJamatTimes(id: string, timings: JamatTimings) {
  await AsyncStorage.setItem(timingsKey(id), JSON.stringify(timings));
}

export async function loadSavedIds(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(SAVED_KEY)) || '[]');
  } catch {
    return [];
  }
}

export async function storeSavedIds(ids: string[]) {
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

/** Real road route from OSRM (open data, no API key). Durations assume no traffic. */
export async function fetchRoute(mode: TravelMode, from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): Promise<RouteInfo | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const url = `${OSRM_PROFILES[mode]}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'UmmatiApp/1.0' } });
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.routes?.[0];
    if (!r) return null;
    return {
      distance: r.distance,
      duration: r.duration,
      path: r.geometry.coordinates.map(([lo, la]: [number, number]) => [la, lo]),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const mapsUrl = (m: Pick<Mosque, 'latitude' | 'longitude'>) =>
  `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`;

export const directionsUrl = (m: Pick<Mosque, 'latitude' | 'longitude'>, mode: TravelMode) =>
  `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}&travelmode=${mode === 'car' ? 'driving' : mode === 'bike' ? 'bicycling' : 'walking'}`;
