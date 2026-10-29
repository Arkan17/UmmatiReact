export interface OfflineSurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface OfflineAyah {
  number: number;
  numberInSurah: number;
  textAr: string;
  textEn: string;
  surahNumber?: number;
  surahName?: string;
}

export const OFFLINE_SURAH_LIST: OfflineSurahMeta[] = [
  { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Fatihah', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqarah', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
  { number: 3, name: 'سُورَةُ آلِ عِمۡرَانَ', englishName: 'Aal-e-Imran', englishNameTranslation: 'The Family of Imran', numberOfAyahs: 200, revelationType: 'Medinan' },
  { number: 4, name: 'سُورَةُ النِّسَاءِ', englishName: 'An-Nisa', englishNameTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan' },
  { number: 5, name: 'سُورَةُ المَائِدَةِ', englishName: 'Al-Ma\'idah', englishNameTranslation: 'The Table Spread', numberOfAyahs: 120, revelationType: 'Medinan' },
  { number: 6, name: 'سُورَةُ الأَنۡعَامِ', englishName: 'Al-An\'am', englishNameTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan' },
  { number: 7, name: 'سُورَةُ الأَعۡرَافِ', englishName: 'Al-A\'raf', englishNameTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan' },
  { number: 8, name: 'سُورَةُ الأَنفَالِ', englishName: 'Al-Anfal', englishNameTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan' },
  { number: 9, name: 'سُورَةُ التَّوۡبَةِ', englishName: 'At-Tawbah', englishNameTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan' },
  { number: 10, name: 'سُورَةُ يُونُسَ', englishName: 'Yunus', englishNameTranslation: 'Jonah', numberOfAyahs: 109, revelationType: 'Meccan' },
  { number: 11, name: 'سُورَةُ هُودٍ', englishName: 'Hud', englishNameTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan' },
  { number: 12, name: 'سُورَةُ يُوسُفَ', englishName: 'Yusuf', englishNameTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 13, name: 'سُورَةُ الرَّعۡدِ', englishName: 'Ar-Ra\'d', englishNameTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan' },
  { number: 14, name: 'سُورَةُ إِبۡرَاهِيمَ', englishName: 'Ibrahim', englishNameTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 15, name: 'سُورَةُ الحِجۡرِ', englishName: 'Al-Hijr', englishNameTranslation: 'The Rocky Tract', numberOfAyahs: 99, revelationType: 'Meccan' },
  { number: 16, name: 'سُورَةُ النَّحۡلِ', englishName: 'An-Nahl', englishNameTranslation: 'The Bees', numberOfAyahs: 128, revelationType: 'Meccan' },
  { number: 17, name: 'سُورَةُ الإِسۡرَاءِ', englishName: 'Al-Isra', englishNameTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 18, name: 'سُورَةُ الكَهۡفِ', englishName: 'Al-Kahf', englishNameTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan' },
  { number: 19, name: 'سُورَةُ مَرۡيَمَ', englishName: 'Maryam', englishNameTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan' },
  { number: 20, name: 'سُورَةُ طه', englishName: 'Taha', englishNameTranslation: 'Ta-Ha', numberOfAyahs: 135, revelationType: 'Meccan' },
  { number: 21, name: 'سُورَةُ الأَنبِيَاءِ', englishName: 'Al-Anbiya', englishNameTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan' },
  { number: 22, name: 'سُورَةُ الحَجِّ', englishName: 'Al-Hajj', englishNameTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 23, name: 'سُورَةُ المُؤۡمِنُونَ', englishName: 'Al-Mu\'minun', englishNameTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan' },
  { number: 24, name: 'سُورَةُ النُّورِ', englishName: 'An-Nur', englishNameTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan' },
  { number: 25, name: 'سُورَةُ الفُرۡقَانِ', englishName: 'Al-Furqan', englishNameTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan' },
  { number: 26, name: 'سُورَةُ الشُّعَرَاءِ', englishName: 'Ash-Shu\'ara', englishNameTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan' },
  { number: 27, name: 'سُورَةُ النَّمۡلِ', englishName: 'An-Naml', englishNameTranslation: 'The Ants', numberOfAyahs: 93, revelationType: 'Meccan' },
  { number: 28, name: 'سُورَةُ القَصَصِ', englishName: 'Al-Qasas', englishNameTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 29, name: 'سُورَةُ العَنكَبُوتِ', englishName: 'Al-Ankabut', englishNameTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan' },
  { number: 30, name: 'سُورَةُ الرُّومِ', englishName: 'Ar-Rum', englishNameTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 31, name: 'سُورَةُ لُقۡمَانَ', englishName: 'Luqman', englishNameTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan' },
  { number: 32, name: 'سُورَةُ السَّجۡدَةِ', englishName: 'As-Sajdah', englishNameTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 33, name: 'سُورَةُ الأَحۡزَابِ', englishName: 'Al-Ahzab', englishNameTranslation: 'The Combined Forces', numberOfAyahs: 73, revelationType: 'Medinan' },
  { number: 34, name: 'سُورَةُ سَبَإٍ', englishName: 'Saba', englishNameTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 35, name: 'سُورَةُ فَاطِرٍ', englishName: 'Fatir', englishNameTranslation: 'The Originator', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 36, name: 'سُورَةُ يسٓ', englishName: 'Ya-Sin', englishNameTranslation: 'Ya-Sin', numberOfAyahs: 83, revelationType: 'Meccan' },
  { number: 37, name: 'سُورَةُ الصَّافَّاتِ', englishName: 'As-Saffat', englishNameTranslation: 'Those who set the Ranks', numberOfAyahs: 182, revelationType: 'Meccan' },
  { number: 38, name: 'سُورَةُ صٓ', englishName: 'Sad', englishNameTranslation: 'Sad', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 39, name: 'سُورَةُ الزُّمَرِ', englishName: 'Az-Zumar', englishNameTranslation: 'The Crowds', numberOfAyahs: 75, revelationType: 'Meccan' },
  { number: 40, name: 'سُورَةُ غَافِرٍ', englishName: 'Ghafir', englishNameTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan' },
  { number: 41, name: 'سُورَةُ فُصِّلَتۡ', englishName: 'Fussilat', englishNameTranslation: 'Explained in Detail', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 42, name: 'سُورَةُ الشُّورَىٰ', englishName: 'Ash-Shura', englishNameTranslation: 'The Consultation', numberOfAyahs: 53, revelationType: 'Meccan' },
  { number: 43, name: 'سُورَةُ الزُّخۡرُفِ', englishName: 'Az-Zukhruf', englishNameTranslation: 'The Ornaments of Gold', numberOfAyahs: 89, revelationType: 'Meccan' },
  { number: 44, name: 'سُورَةُ الدُّخَانِ', englishName: 'Ad-Dukhan', englishNameTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan' },
  { number: 45, name: 'سُورَةُ الجَاثِيَةِ', englishName: 'Al-Jathiyah', englishNameTranslation: 'The Crouching', numberOfAyahs: 37, revelationType: 'Meccan' },
  { number: 46, name: 'سُورَةُ الأَحۡقَافِ', englishName: 'Al-Ahqaf', englishNameTranslation: 'The Wind-Curved Sandhills', numberOfAyahs: 35, revelationType: 'Meccan' },
  { number: 47, name: 'سُورَةُ مُحَمَّدٍ', englishName: 'Muhammad', englishNameTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan' },
  { number: 48, name: 'سُورَةُ الفَتۡحِ', englishName: 'Al-Fath', englishNameTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 49, name: 'سُورَةُ الحُجُرَاتِ', englishName: 'Al-Hujurat', englishNameTranslation: 'The Rooms', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 50, name: 'سُورَةُ قٓ', englishName: 'Qaf', englishNameTranslation: 'Qaf', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 51, name: 'سُورَةُ الذَّارِيَاتِ', englishName: 'Adh-Dhariyat', englishNameTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 52, name: 'سُورَةُ الطُّورِ', englishName: 'At-Tur', englishNameTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan' },
  { number: 53, name: 'سُورَةُ النَّجۡمِ', englishName: 'An-Najm', englishNameTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan' },
  { number: 54, name: 'سُورَةُ القَمَرِ', englishName: 'Al-Qamar', englishNameTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan' },
  { number: 55, name: 'سُورَةُ الرَّحۡمَٰن', englishName: 'Ar-Rahman', englishNameTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 56, name: 'سُورَةُ الوَاقِعَةِ', englishName: 'Al-Waqi\'ah', englishNameTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan' },
  { number: 57, name: 'سُورَةُ الحَدِيدِ', englishName: 'Al-Hadid', englishNameTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 58, name: 'سُورَةُ المُجَادلَةِ', englishName: 'Al-Mujadila', englishNameTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan' },
  { number: 59, name: 'سُورَةُ الحَشۡرِ', englishName: 'Al-Hashr', englishNameTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan' },
  { number: 60, name: 'سُورَةُ المُمۡتَحنَةِ', englishName: 'Al-Mumtahanah', englishNameTranslation: 'She that is to be examined', numberOfAyahs: 13, revelationType: 'Medinan' },
  { number: 61, name: 'سُورَةُ الصَّفِّ', englishName: 'As-Saff', englishNameTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan' },
  { number: 62, name: 'سُورَةُ الجُمُعَةِ', englishName: 'Al-Jumu\'ah', englishNameTranslation: 'Friday', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 63, name: 'سُورَةُ المُنَافِقُونَ', englishName: 'Al-Munafiqun', englishNameTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 64, name: 'سُورَةُ التَّغَابُنِ', englishName: 'At-Taghabun', englishNameTranslation: 'Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 65, name: 'سُورَةُ الطَّلَاقِ', englishName: 'At-Talaq', englishNameTranslation: 'Divorce', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 66, name: 'سُورَةُ التَّحۡرِيمِ', englishName: 'At-Tahrim', englishNameTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 67, name: 'سُورَةُ المُلۡكِ', englishName: 'Al-Mulk', englishNameTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 68, name: 'سُورَةُ القَلَمِ', englishName: 'Al-Qalam', englishNameTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 69, name: 'سُورَةُ الحَاقَّةِ', englishName: 'Al-Haqqah', englishNameTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 70, name: 'سُورَةُ المَعَارِجِ', englishName: 'Al-Ma\'arij', englishNameTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan' },
  { number: 71, name: 'سُورَةُ نُوحٍ', englishName: 'Nuh', englishNameTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 72, name: 'سُورَةُ الجِنِّ', englishName: 'Al-Jinn', englishNameTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 73, name: 'سُورَةُ المُزَّمِّلِ', englishName: 'Al-Muzzammil', englishNameTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 74, name: 'سُورَةُ المُدَّثِّرِ', englishName: 'Al-Muddaththir', englishNameTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan' },
  { number: 75, name: 'سُورَةُ القِيَامَةِ', englishName: 'Al-Qiyamah', englishNameTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 76, name: 'سُورَةُ الإِنسَانِ', englishName: 'Al-Insan', englishNameTranslation: 'Man', numberOfAyahs: 31, revelationType: 'Medinan' },
  { number: 77, name: 'سُورَةُ المُرۡسَلَاتِ', englishName: 'Al-Mursalat', englishNameTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan' },
  { number: 78, name: 'سُورَةُ النَّبَإِ', englishName: 'An-Naba', englishNameTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 79, name: 'سُورَةُ النَّازِعَاتِ', englishName: 'An-Nazi\'at', englishNameTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan' },
  { number: 80, name: 'سُورَةُ عَبَسَ', englishName: 'Abasa', englishNameTranslation: 'He frowned', numberOfAyahs: 42, revelationType: 'Meccan' },
  { number: 81, name: 'سُورَةُ التَّكۡوِيرِ', englishName: 'At-Takwir', englishNameTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan' },
  { number: 82, name: 'سُورَةُ الانفِطَارِ', englishName: 'Al-Infitar', englishNameTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 83, name: 'سُورَةُ المُطَفِّفِينَ', englishName: 'Al-Mutaffifin', englishNameTranslation: 'Defrauding', numberOfAyahs: 36, revelationType: 'Meccan' },
  { number: 84, name: 'سُورَةُ الانشِقَاقِ', englishName: 'Al-Inshiqaq', englishNameTranslation: 'The Splitting Open', numberOfAyahs: 25, revelationType: 'Meccan' },
  { number: 85, name: 'سُورَةُ البُرُوجِ', englishName: 'Al-Buruj', englishNameTranslation: 'The Mansions of the Stars', numberOfAyahs: 22, revelationType: 'Meccan' },
  { number: 86, name: 'سُورَةُ الطَّارِقِ', englishName: 'At-Tariq', englishNameTranslation: 'The Morning Star', numberOfAyahs: 17, revelationType: 'Meccan' },
  { number: 87, name: 'سُورَةُ الأَعۡلَىٰ', englishName: 'Al-A\'la', englishNameTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 88, name: 'سُورَةُ الغَاشِيَةِ', englishName: 'Al-Ghashiyah', englishNameTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan' },
  { number: 89, name: 'سُورَةُ الفَجۡرِ', englishName: 'Al-Fajr', englishNameTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 90, name: 'سُورَةُ البَلَدِ', englishName: 'Al-Balad', englishNameTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 91, name: 'سُورَةُ الشَّمۡسِ', englishName: 'Ash-Shams', englishNameTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan' },
  { number: 92, name: 'سُورَةُ اللَّيۡلِ', englishName: 'Al-Layl', englishNameTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan' },
  { number: 93, name: 'سُورَةُ الضُّحَىٰ', englishName: 'Ad-Duhaa', englishNameTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 94, name: 'سُورَةُ الشَّرۡحِ', englishName: 'Ash-Sharh', englishNameTranslation: 'The Relief', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 95, name: 'سُورَةُ التِّينِ', englishName: 'At-Tin', englishNameTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 96, name: 'سُورَةُ العَلَقِ', englishName: 'Al-Alaq', englishNameTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 97, name: 'سُورَةُ القَدۡرِ', englishName: 'Al-Qadr', englishNameTranslation: 'The Power', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 98, name: 'سُورَةُ البَيِّنَةِ', englishName: 'Al-Bayyinah', englishNameTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 99, name: 'سُورَةُ الزَّلۡزَلَةِ', englishName: 'Az-Zalzalah', englishNameTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 100, name: 'سُورَةُ العَادِيَاتِ', englishName: 'Al-Adiyat', englishNameTranslation: 'The Courser', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 101, name: 'سُورَةُ القَارِعَةِ', englishName: 'Al-Qari\'ah', englishNameTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 102, name: 'سُورَةُ التَّكَاثُرِ', englishName: 'At-Takathur', englishNameTranslation: 'The Rivalry in World Increase', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 103, name: 'سُورَةُ العَصۡرِ', englishName: 'Al-Asr', englishNameTranslation: 'The Declining Day', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 104, name: 'سُورَةُ الهُمَزَةِ', englishName: 'Al-Humazah', englishNameTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan' },
  { number: 105, name: 'سُورَةُ الفِيلِ', englishName: 'Al-Fil', englishNameTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 106, name: 'سُورَةُ قُرَيۡشٍ', englishName: 'Quraysh', englishNameTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 107, name: 'سُورَةُ المَاعُونِ', englishName: 'Al-Ma\'un', englishNameTranslation: 'The Small Kindness', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 108, name: 'سُورَةُ الكَوۡثَرِ', englishName: 'Al-Kawthar', englishNameTranslation: 'Abundance', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 109, name: 'سُورَةُ الكَافِرُونَ', englishName: 'Al-Kafirun', englishNameTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan' },
  { number: 110, name: 'سُورَةُ النَّصۡرِ', englishName: 'An-Nasr', englishNameTranslation: 'The Divine Support', numberOfAyahs: 3, revelationType: 'Medinan' },
  { number: 111, name: 'سُورَةُ المَسَدِ', englishName: 'Al-Masad', englishNameTranslation: 'The Palm Fiber', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 112, name: 'سُورَةُ الإِخۡلَاصِ', englishName: 'Al-Ikhlas', englishNameTranslation: 'The Sincerity', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 113, name: 'سُورَةُ الفَلَقِ', englishName: 'Al-Falaq', englishNameTranslation: 'The Daybreak', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 114, name: 'سُورَةُ النَّاسِ', englishName: 'An-Nas', englishNameTranslation: 'Mankind', numberOfAyahs: 6, revelationType: 'Meccan' },
];

export interface BundledSurahData {
  surahNumber: number;
  name: string;
  englishName: string;
  translationName: string;
  ayahs: OfflineAyah[];
}

export const BUNDLED_OFFLINE_SURAHS: Record<number, BundledSurahData> = {
  // Surah 1: Al-Fatihah
  1: {
    surahNumber: 1,
    name: 'سُورَةُ ٱلْفَاتِحَةِ',
    englishName: 'Al-Fatihah',
    translationName: 'The Opening',
    ayahs: [
      { number: 1, numberInSurah: 1, textAr: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', textEn: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
      { number: 2, numberInSurah: 2, textAr: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', textEn: '[All] praise is [due] to Allah, Lord of the worlds -' },
      { number: 3, numberInSurah: 3, textAr: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', textEn: 'The Entirely Merciful, the Especially Merciful,' },
      { number: 4, numberInSurah: 4, textAr: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', textEn: 'Sovereign of the Day of Recompense.' },
      { number: 5, numberInSurah: 5, textAr: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', textEn: 'It is You we worship and You we ask for help.' },
      { number: 6, numberInSurah: 6, textAr: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', textEn: 'Guide us to the straight path -' },
      { number: 7, numberInSurah: 7, textAr: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', textEn: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.' },
    ],
  },

  // Surah 108: Al-Kawthar
  108: {
    surahNumber: 108,
    name: 'سُورَةُ الكَوۡثَرِ',
    englishName: 'Al-Kawthar',
    translationName: 'Abundance',
    ayahs: [
      { number: 6205, numberInSurah: 1, textAr: 'إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ', textEn: 'Indeed, We have granted you, [O Muhammad], al-Kawthar.' },
      { number: 6206, numberInSurah: 2, textAr: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ', textEn: 'So pray to your Lord and sacrifice [to Him alone].' },
      { number: 6207, numberInSurah: 3, textAr: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ', textEn: 'Indeed, your enemy is the one cut off.' },
    ],
  },

  // Surah 109: Al-Kafirun
  109: {
    surahNumber: 109,
    name: 'سُورَةُ الكَافِرُونَ',
    englishName: 'Al-Kafirun',
    translationName: 'The Disbelievers',
    ayahs: [
      { number: 6208, numberInSurah: 1, textAr: 'قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ', textEn: 'Say, "O disbelievers,' },
      { number: 6209, numberInSurah: 2, textAr: 'لَآ أَعْبُدُ مَا تَعْبُدُونَ', textEn: 'I do not worship what you worship.' },
      { number: 6210, numberInSurah: 3, textAr: 'وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ', textEn: 'Nor are you worshippers of what I worship.' },
      { number: 6211, numberInSurah: 4, textAr: 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ', textEn: 'Nor will I be a worshipper of what you worship.' },
      { number: 6212, numberInSurah: 5, textAr: 'وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ', textEn: 'Nor will you be worshippers of what I worship.' },
      { number: 6213, numberInSurah: 6, textAr: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ', textEn: 'For you is your religion, and for me is my religion."' },
    ],
  },

  // Surah 110: An-Nasr
  110: {
    surahNumber: 110,
    name: 'سُورَةُ النَّصۡرِ',
    englishName: 'An-Nasr',
    translationName: 'The Divine Support',
    ayahs: [
      { number: 6214, numberInSurah: 1, textAr: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ', textEn: 'When the victory of Allah has come and the conquest,' },
      { number: 6215, numberInSurah: 2, textAr: 'وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا', textEn: 'And you see the people entering into the religion of Allah in multitudes,' },
      { number: 6216, numberInSurah: 3, textAr: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ ۚ إِنَّهُۥ كَانَ تَوَّابًۢا', textEn: 'Then exalt [Him] with praise of your Lord and ask forgiveness of Him. Indeed, He is ever Accepting of repentance.' },
    ],
  },

  // Surah 111: Al-Masad
  111: {
    surahNumber: 111,
    name: 'سُورَةُ المَسَدِ',
    englishName: 'Al-Masad',
    translationName: 'The Palm Fiber',
    ayahs: [
      { number: 6217, numberInSurah: 1, textAr: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', textEn: 'May the hands of Abu Lahab be ruined, and ruined is he.' },
      { number: 6218, numberInSurah: 2, textAr: 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', textEn: 'His wealth will not avail him or that which he gained.' },
      { number: 6219, numberInSurah: 3, textAr: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', textEn: 'He will [enter to] burn in a Fire of [blazing] flame' },
      { number: 6220, numberInSurah: 4, textAr: 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ', textEn: 'And his wife [as well] - the carrier of firewood.' },
      { number: 6221, numberInSurah: 5, textAr: 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍۭ', textEn: 'Around her neck is a rope of [twisted] fiber.' },
    ],
  },

  // Surah 112: Al-Ikhlas
  112: {
    surahNumber: 112,
    name: 'سُورَةُ الإِخۡلَاصِ',
    englishName: 'Al-Ikhlas',
    translationName: 'The Sincerity',
    ayahs: [
      { number: 6222, numberInSurah: 1, textAr: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', textEn: 'Say, "He is Allah, [who is] One,' },
      { number: 6223, numberInSurah: 2, textAr: 'ٱللَّهُ ٱلصَّمَدُ', textEn: 'Allah, the Eternal Refuge.' },
      { number: 6224, numberInSurah: 3, textAr: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', textEn: 'He neither begets nor is born,' },
      { number: 6225, numberInSurah: 4, textAr: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', textEn: 'Nor is there to Him any equivalent."' },
    ],
  },

  // Surah 113: Al-Falaq
  113: {
    surahNumber: 113,
    name: 'سُورَةُ الفَلَقِ',
    englishName: 'Al-Falaq',
    translationName: 'The Daybreak',
    ayahs: [
      { number: 6226, numberInSurah: 1, textAr: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', textEn: 'Say, "I seek refuge in the Lord of daybreak' },
      { number: 6227, numberInSurah: 2, textAr: 'مِن شَرِّ مَا خَلَقَ', textEn: 'From the evil of that which He created' },
      { number: 6228, numberInSurah: 3, textAr: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', textEn: 'And from the evil of darkness when it settles' },
      { number: 6229, numberInSurah: 4, textAr: 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِي ٱلْعُقَدِ', textEn: 'And from the evil of the blowers in knots' },
      { number: 6230, numberInSurah: 5, textAr: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', textEn: 'And from the evil of an envier when he envies."' },
    ],
  },

  // Surah 114: An-Nas
  114: {
    surahNumber: 114,
    name: 'سُورَةُ النَّاسِ',
    englishName: 'An-Nas',
    translationName: 'Mankind',
    ayahs: [
      { number: 6231, numberInSurah: 1, textAr: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', textEn: 'Say, "I seek refuge in the Lord of mankind,' },
      { number: 6232, numberInSurah: 2, textAr: 'مَلِكِ ٱلنَّاسِ', textEn: 'The Sovereign of mankind,' },
      { number: 6233, numberInSurah: 3, textAr: 'إِلَٰهِ ٱلنَّاسِ', textEn: 'The God of mankind,' },
      { number: 6234, numberInSurah: 4, textAr: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', textEn: 'From the evil of the retreating whisperer -' },
      { number: 6235, numberInSurah: 5, textAr: 'ٱلَّذِي يُوَسْوِسُ فِي صُدُورِ ٱلنَّاسِ', textEn: 'Who whispers into the breasts of mankind -' },
      { number: 6236, numberInSurah: 6, textAr: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', textEn: 'From among the jinn and mankind."' },
    ],
  },

  // Surah 67: Al-Mulk (first 10 verses offline bundled)
  67: {
    surahNumber: 67,
    name: 'سُورَةُ المُلۡكِ',
    englishName: 'Al-Mulk',
    translationName: 'The Sovereignty',
    ayahs: [
      { number: 5242, numberInSurah: 1, textAr: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ', textEn: 'Blessed is He in whose hand is dominion, and He is over all things competent -' },
      { number: 5243, numberInSurah: 2, textAr: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ', textEn: '[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -' },
      { number: 5244, numberInSurah: 3, textAr: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍ ۖ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ', textEn: '[And] who created seven heavens in layers. You do not see in the creation of the Most Merciful any inconsistency. So return [your] vision [to the sky]; do you see any breaks?' },
      { number: 5245, numberInSurah: 4, textAr: 'ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ', textEn: 'Then return [your] vision twice again. [Your] vision will return to you humbled while it is fatigued.' },
      { number: 5246, numberInSurah: 5, textAr: 'وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا رُجُومًا لِّلشَّيَٰطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ', textEn: 'And We have certainly beautified the nearest heaven with stars and have made [from] them missiles for the devils and have prepared for them the punishment of the Blaze.' },
      { number: 5247, numberInSurah: 6, textAr: 'وَلِلَّذِينَ كَفَرُوا۟ بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ ٱلْمَصِيرُ', textEn: 'And for those who disbelieved in their Lord is the punishment of Hell, and wretched is the destination.' },
      { number: 5248, numberInSurah: 7, textAr: 'إِذَآ أُلْقُوا۟ فِيهَا سَمِعُوا۟ لَهَا شَهِيقًا وَهِىَ تَفُورُ', textEn: 'When they are thrown into it, they hear from it a dreadful inhaling while it boils up.' },
      { number: 5249, numberInSurah: 8, textAr: 'تَكَادُ تَمَيَّزُ مِنَ ٱلْغَيْظِ ۖ كُلَّمَآ أُلْقِىَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَآ أَلَمْ يَأْتِكُمْ نَذِيرٌ', textEn: 'It almost bursts with rage. Every time a company is thrown into it, its keepers ask them, "Did there not come to you a warner?"' },
      { number: 5250, numberInSurah: 9, textAr: 'قَالُوا۟ بَلَىٰ قَدْ جَآءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ ٱللَّهُ مِن شَىْءٍ إِنْ أَنتُمْ إِلَّا فِى ضَلَٰلٍ كَبِيرٍ', textEn: 'They will say," Yes, a warner had come to us, but we denied and said, \'Allah has not sent down anything. You are not but in great error.\'"' },
      { number: 5251, numberInSurah: 10, textAr: 'وَقَالُوا۟ لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِىٓ أَصْحَٰبِ ٱلسَّعِيرِ', textEn: 'And they will say, "If only we had been listening or reasoning, we would not be among the companions of the Blaze."' },
    ],
  },
};
