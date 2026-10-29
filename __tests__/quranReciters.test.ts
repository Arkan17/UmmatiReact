import {
  QURAN_RECITERS,
  DEFAULT_RECITER,
  DEFAULT_RECITER_ID,
  getReciterById,
  buildAyahAudioUrl,
} from '../src/features/quran/data/reciters';

describe('Quran Reciters and Audio Helpers', () => {
  it('contains at least 8 authentic reciters', () => {
    expect(QURAN_RECITERS.length).toBeGreaterThanOrEqual(8);
  });

  it('verifies every reciter has required non-empty metadata', () => {
    QURAN_RECITERS.forEach(reciter => {
      expect(reciter.id).toBeTruthy();
      expect(reciter.name).toBeTruthy();
      expect(reciter.subname).toBeTruthy();
      expect(reciter.arabicName).toBeTruthy();
      expect(reciter.folder).toBeTruthy();
      expect(['Murattal', 'Mujawwad']).toContain(reciter.style);
      expect(reciter.bitrate).toMatch(/\d+\s*kbps/i);
    });
  });

  it('has Sheikh Mishary Alafasy as default reciter', () => {
    expect(DEFAULT_RECITER_ID).toBe('alafasy');
    expect(DEFAULT_RECITER.id).toBe('alafasy');
    expect(DEFAULT_RECITER.folder).toBe('Alafasy_128kbps');
  });

  it('retrieves reciter by valid ID correctly', () => {
    const sudais = getReciterById('sudais');
    expect(sudais.name).toBe('Abdur-Rahman As-Sudais');
    expect(sudais.folder).toBe('Abdurrahmaan_As-Sudais_192kbps');

    const abdulBasit = getReciterById('abdul_basit_murattal');
    expect(abdulBasit.name).toBe('Abdul Basit (Murattal)');
    expect(abdulBasit.folder).toBe('Abdul_Basit_Murattal_192kbps');

    const husary = getReciterById('husary');
    expect(husary.name).toBe('Mahmoud Khalil Al-Husary');
    expect(husary.folder).toBe('Husary_128kbps');
  });

  it('safely falls back to default reciter when ID is invalid or missing', () => {
    expect(getReciterById(null).id).toBe(DEFAULT_RECITER_ID);
    expect(getReciterById(undefined).id).toBe(DEFAULT_RECITER_ID);
    expect(getReciterById('unknown_reciter_xyz').id).toBe(DEFAULT_RECITER_ID);
  });

  it('generates properly padded 3-digit surah and ayah audio URLs for Arabic recitation', () => {
    // Al-Fatihah 1:1
    const url1 = buildAyahAudioUrl(1, 1, 'Alafasy_128kbps', 'ar');
    expect(url1).toBe('https://everyayah.com/data/Alafasy_128kbps/001001.mp3');

    // Ayat al-Kursi (Al-Baqarah 2:255)
    const url2 = buildAyahAudioUrl(2, 255, 'Abdurrahmaan_As-Sudais_192kbps', 'ar');
    expect(url2).toBe('https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/002255.mp3');

    // An-Nas 114:6
    const url3 = buildAyahAudioUrl(114, 6, 'Minshawy_Murattal_128kbps', 'ar');
    expect(url3).toBe('https://everyayah.com/data/Minshawy_Murattal_128kbps/114006.mp3');
  });

  it('generates translation audio URL when mode is hindi', () => {
    const urlHindi = buildAyahAudioUrl(1, 1, 'Alafasy_128kbps', 'hi');
    expect(urlHindi).toBe(
      'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/001001.mp3'
    );
  });
});
