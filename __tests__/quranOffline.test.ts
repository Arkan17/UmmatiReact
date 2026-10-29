import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOfflineSurahList,
  getBundledSurah,
  getCachedSurah,
  saveCachedSurah,
  getSurahWithOfflineFallback,
  isSurahAvailableOffline,
  getSurahCacheKey,
} from '../src/features/quran/utils/quranOffline';

describe('Quran Offline Fallback and Caching', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('contains complete metadata for all 114 Surahs', () => {
    const list = getOfflineSurahList();
    expect(list.length).toBe(114);

    // Verify consecutive numbering 1 to 114
    list.forEach((s, idx) => {
      expect(s.number).toBe(idx + 1);
      expect(s.englishName).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.numberOfAyahs).toBeGreaterThan(0);
      expect(['Meccan', 'Medinan']).toContain(s.revelationType);
    });
  });

  it('provides complete bundled verses for Al-Fatihah (Surah 1)', () => {
    const fatihah = getBundledSurah(1);
    expect(fatihah).not.toBeNull();
    expect(fatihah?.ayahs.length).toBe(7);
    expect(fatihah?.ayahs[0].textAr).toContain('بِسْمِ ٱللَّهِ');
    expect(fatihah?.ayahs[6].textEn).toContain('astray');
  });

  it('provides bundled verses for the 3 Quls (112, 113, 114)', () => {
    const ikhlas = getBundledSurah(112);
    expect(ikhlas?.ayahs.length).toBe(4);

    const falaq = getBundledSurah(113);
    expect(falaq?.ayahs.length).toBe(5);

    const nas = getBundledSurah(114);
    expect(nas?.ayahs.length).toBe(6);
  });

  it('returns null for an unbundled Surah when offline', () => {
    const unbundled = getBundledSurah(2); // Al-Baqarah is not bundled by default
    expect(unbundled).toBeNull();
  });

  it('caches and loads Surah verses to/from AsyncStorage', async () => {
    const mockAyahs = [
      { number: 1, numberInSurah: 1, textAr: 'آية تجريبية', textEn: 'Test verse' },
    ];
    await saveCachedSurah(55, 'english', mockAyahs as any);

    const cached = await getCachedSurah(55, 'english');
    expect(cached).toEqual(mockAyahs);

    const isAvailable = await isSurahAvailableOffline(55, 'english');
    expect(isAvailable).toBe(true);
  });

  it('falls back to bundled data with isOfflineFallback: true when cache is empty', async () => {
    const result = await getSurahWithOfflineFallback(1, 'english');
    expect(result).not.toBeNull();
    expect(result?.isOfflineFallback).toBe(true);
    expect(result?.ayahs.length).toBe(7);
    expect(result?.surahName).toBe('Al-Fatihah');
  });

  it('prioritizes cached data over bundled data if available', async () => {
    const customFatihah = [
      { number: 1, numberInSurah: 1, textAr: 'مخصص', textEn: 'Custom Fatihah' },
    ];
    await saveCachedSurah(1, 'english', customFatihah as any);

    const result = await getSurahWithOfflineFallback(1, 'english');
    expect(result?.isOfflineFallback).toBe(false);
    expect(result?.ayahs).toEqual(customFatihah);
  });

  it('recognizes bundled Surahs as immediately available offline', async () => {
    expect(await isSurahAvailableOffline(1)).toBe(true);
    expect(await isSurahAvailableOffline(112)).toBe(true);
    expect(await isSurahAvailableOffline(114)).toBe(true);
    expect(await isSurahAvailableOffline(2)).toBe(false);
  });

  it('generates consistent cache keys', () => {
    expect(getSurahCacheKey(1, 'english')).toBe('ummati_cached_surah_1_english');
    expect(getSurahCacheKey(36, 'hindi')).toBe('ummati_cached_surah_36_hindi');
  });
});
