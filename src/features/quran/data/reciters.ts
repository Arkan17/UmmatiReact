export interface Reciter {
  id: string;
  name: string;
  subname: string;
  arabicName: string;
  folder: string;
  style: 'Murattal' | 'Mujawwad';
  bitrate: string;
}

export const QURAN_RECITERS: Reciter[] = [
  {
    id: 'alafasy',
    name: 'Mishary Rashid Alafasy',
    subname: 'Kuwait • Murattal',
    arabicName: 'مشاري راشد العفاسي',
    folder: 'Alafasy_128kbps',
    style: 'Murattal',
    bitrate: '128 kbps',
  },
  {
    id: 'abdul_basit_murattal',
    name: 'Abdul Basit (Murattal)',
    subname: 'Egypt • Clear & Measured',
    arabicName: 'عبد الباسط عبد الصمد',
    folder: 'Abdul_Basit_Murattal_192kbps',
    style: 'Murattal',
    bitrate: '192 kbps',
  },
  {
    id: 'abdul_basit_mujawwad',
    name: 'Abdul Basit (Mujawwad)',
    subname: 'Egypt • Melodic & Resonant',
    arabicName: 'عبد الباسط عبد الصمد - مجود',
    folder: 'Abdul_Basit_Mujawwad_128kbps',
    style: 'Mujawwad',
    bitrate: '128 kbps',
  },
  {
    id: 'sudais',
    name: 'Abdur-Rahman As-Sudais',
    subname: 'Imam of Masjid al-Haram, Makkah',
    arabicName: 'عبد الرحمن السديس',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
    style: 'Murattal',
    bitrate: '192 kbps',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    subname: 'Egypt • Master of Tajweed',
    arabicName: 'محمود خليل الحصري',
    folder: 'Husary_128kbps',
    style: 'Murattal',
    bitrate: '128 kbps',
  },
  {
    id: 'minshawi_murattal',
    name: 'Mohamed Siddiq Al-Minshawi',
    subname: 'Egypt • Heart-soothing Murattal',
    arabicName: 'محمد صديق المنشاوي',
    folder: 'Minshawy_Murattal_128kbps',
    style: 'Murattal',
    bitrate: '128 kbps',
  },
  {
    id: 'minshawi_mujawwad',
    name: 'Mohamed Siddiq Al-Minshawi (Mujawwad)',
    subname: 'Egypt • Emotional Mujawwad',
    arabicName: 'محمد صديق المنشاوي - مجود',
    folder: 'Minshawy_Mujawwad_192kbps',
    style: 'Mujawwad',
    bitrate: '192 kbps',
  },
  {
    id: 'muaiqly',
    name: 'Maher Al-Muaiqly',
    subname: 'Imam of Masjid al-Haram, Makkah',
    arabicName: 'ماهر المعيقلي',
    folder: 'MaherAlMuaiqly128kbps',
    style: 'Murattal',
    bitrate: '128 kbps',
  },
  {
    id: 'shatri',
    name: 'Abu Bakr Al-Shatri',
    subname: 'Saudi Arabia • Deep & Calm',
    arabicName: 'أبو بكر الشاطري',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
    style: 'Murattal',
    bitrate: '128 kbps',
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    subname: 'Saudi Arabia • Fluent Murattal',
    arabicName: 'سعد الغامدي',
    folder: 'Ghamadi_40kbps',
    style: 'Murattal',
    bitrate: '40 kbps',
  },
];

export const DEFAULT_RECITER_ID = 'alafasy';
export const DEFAULT_RECITER = QURAN_RECITERS[0];

export function getReciterById(id?: string | null): Reciter {
  if (!id) return DEFAULT_RECITER;
  const found = QURAN_RECITERS.find(r => r.id === id);
  return found || DEFAULT_RECITER;
}

export function buildAyahAudioUrl(
  surahNumber: number,
  ayahNumberInSurah: number,
  reciterFolder: string,
  mode: 'ar' | 'hi' = 'ar'
): string {
  const sNum = surahNumber.toString().padStart(3, '0');
  const aNum = ayahNumberInSurah.toString().padStart(3, '0');
  if (mode === 'hi') {
    return `https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/${sNum}${aNum}.mp3`;
  }
  return `https://everyayah.com/data/${reciterFolder}/${sNum}${aNum}.mp3`;
}
