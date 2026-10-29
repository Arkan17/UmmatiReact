import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OFFLINE_SURAH_LIST,
  BUNDLED_OFFLINE_SURAHS,
  type OfflineSurahMeta,
  type OfflineAyah,
  type BundledSurahData,
} from '../data/offlineSurahs';

/**
 * Cache key generator for Surahs.
 */
export function getSurahCacheKey(surahNumber: number, lang = 'english'): string {
  return `ummati_cached_surah_${surahNumber}_${lang}`;
}

/**
 * Cache key generator for Juz.
 */
export function getJuzCacheKey(juzNumber: number, lang = 'english'): string {
  return `ummati_cached_juz_${juzNumber}_${lang}`;
}

/**
 * Returns the bundled metadata for all 114 Surahs.
 */
export function getOfflineSurahList(): OfflineSurahMeta[] {
  return OFFLINE_SURAH_LIST;
}

/**
 * Returns bundled verses for frequently recited Surahs (Al-Fatihah, Al-Mulk, Al-Ikhlas, etc.).
 */
export function getBundledSurah(surahNumber: number): BundledSurahData | null {
  return BUNDLED_OFFLINE_SURAHS[surahNumber] || null;
}

/**
 * Retrieves a previously cached Surah from AsyncStorage.
 */
export async function getCachedSurah(
  surahNumber: number,
  lang = 'english'
): Promise<OfflineAyah[] | null> {
  try {
    const raw = await AsyncStorage.getItem(getSurahCacheKey(surahNumber, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn('Failed to read cached surah from storage:', error);
    return null;
  }
}

/**
 * Caches a Surah into persistent AsyncStorage.
 */
export async function saveCachedSurah(
  surahNumber: number,
  lang: string,
  ayahs: OfflineAyah[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(getSurahCacheKey(surahNumber, lang), JSON.stringify(ayahs));
  } catch (error) {
    console.warn('Failed to cache surah to storage:', error);
  }
}

/**
 * Attempts to load Surah from local cache first, then falls back to bundled offline data.
 */
export async function getSurahWithOfflineFallback(
  surahNumber: number,
  lang = 'english'
): Promise<{
  ayahs: OfflineAyah[];
  isOfflineFallback: boolean;
  surahName?: string;
  translationName?: string;
} | null> {
  // 1. Check AsyncStorage cache
  const cached = await getCachedSurah(surahNumber, lang);
  if (cached && cached.length > 0) {
    return {
      ayahs: cached,
      isOfflineFallback: false,
    };
  }

  // 2. Check bundled offline dataset
  const bundled = getBundledSurah(surahNumber);
  if (bundled && bundled.ayahs.length > 0) {
    return {
      ayahs: bundled.ayahs,
      isOfflineFallback: true,
      surahName: bundled.englishName,
      translationName: bundled.translationName,
    };
  }

  return null;
}

/**
 * Checks whether a given Surah is ready for offline reading (either cached or bundled).
 */
export async function isSurahAvailableOffline(
  surahNumber: number,
  lang = 'english'
): Promise<boolean> {
  if (BUNDLED_OFFLINE_SURAHS[surahNumber] !== undefined) {
    return true;
  }
  const cached = await getCachedSurah(surahNumber, lang);
  return cached !== null && cached.length > 0;
}
