import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, BookOpen, ChevronRight, Play, SkipForward, AlertCircle } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface JuzItem {
  number: number;
  name: string;
  nameAr: string;
  description: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const JUZ_LIST: JuzItem[] = [
  { number: 1, name: 'Alif Lam Mim', nameAr: 'آلم', description: 'Starts at Al-Fatihah 1:1' },
  { number: 2, name: 'Sayaqul', nameAr: 'سيقول', description: 'Starts at Al-Baqarah 2:142' },
  { number: 3, name: 'Tilkal Rusul', nameAr: 'تلك الرسل', description: 'Starts at Al-Baqarah 2:253' },
  { number: 4, name: 'Lan Tanaloo', nameAr: 'لن تنالوا', description: 'Starts at Al-Imran 3:93' },
  { number: 5, name: 'Wal Muhsanat', nameAr: 'والمحصنات', description: 'Starts at An-Nisa 4:24' },
  { number: 6, name: 'La Yuhibbullah', nameAr: 'لا يحب الله', description: 'Starts at An-Nisa 4:148' },
  { number: 7, name: 'Wa Iza Samiu', nameAr: 'وإذا سمعوا', description: 'Starts at Al-Ma\'idah 5:82' },
  { number: 8, name: 'Wa Lau Annana', nameAr: 'ولو أننا', description: 'Starts at Al-An\'am 6:111' },
  { number: 9, name: 'Qal Al-Mala', nameAr: 'قال الملأ', description: 'Starts at Al-A\'raf 7:88' },
  { number: 10, name: 'Walamu', nameAr: 'واعلموا', description: 'Starts at Al-Anfal 8:41' },
  { number: 11, name: 'Yatazirun', nameAr: 'يعتذرون', description: 'Starts at At-Tawbah 9:93' },
  { number: 12, name: 'Wa Mamin Dabbah', nameAr: 'وما من دابة', description: 'Starts at Hud 11:6' },
  { number: 13, name: 'Wa Ma Ubarriu', nameAr: 'وما أبرئ', description: 'Starts at Yusuf 12:53' },
  { number: 14, name: 'Alif Lam Ra / Rubama', nameAr: 'ربما', description: 'Starts at Al-Hijr 15:1' },
  { number: 15, name: 'Subhanallazi', nameAr: 'سبحان الذي', description: 'Starts at Al-Isra 17:1' },
  { number: 16, name: 'Qal Alam', nameAr: 'قال ألم', description: 'Starts at Al-Kahf 18:75' },
  { number: 17, name: 'Aqtaraba', nameAr: 'اقترب', description: 'Starts at Al-Anbiya 21:1' },
  { number: 18, name: 'Qad Aflaha', nameAr: 'قد أفلح', description: 'Starts at Al-Mu\'minun 23:1' },
  { number: 19, name: 'Wa Qalallazina', nameAr: 'وقال الذين', description: 'Starts at Al-Furqan 25:21' },
  { number: 20, name: 'Aman Khalaqa', nameAr: 'أمن خلق', description: 'Starts at An-Naml 27:56' },
  { number: 21, name: 'Utlu Ma Oohiya', nameAr: 'اتل ما أوحي', description: 'Starts at Al-Ankabut 29:46' },
  { number: 22, name: 'Wa Man Yaqnut', nameAr: 'ومن يقنت', description: 'Starts at Al-Ahzab 33:31' },
  { number: 23, name: 'Wa Maliya', nameAr: 'وما لي', description: 'Starts at Yaseen 36:28' },
  { number: 24, name: 'Faman Azlam', nameAr: 'فمن أظلم', description: 'Starts at Az-Zumar 39:32' },
  { number: 25, name: 'Ilayhi Yuraddu', nameAr: 'إليه يرد', description: 'Starts at Fussilat 41:47' },
  { number: 26, name: 'Ha Meem', nameAr: 'حم', description: 'Starts at Al-Ahqaf 46:1' },
  { number: 27, name: 'Qala Fama Khatbukum', nameAr: 'قال فما خطبكم', description: 'Starts at Az-Zariyat 51:31' },
  { number: 28, name: 'Qad Samiallah', nameAr: 'قد سمع الله', description: 'Starts at Al-Mujadila 58:1' },
  { number: 29, name: 'Tabarakallazi', nameAr: 'تبارك الذي', description: 'Starts at Al-Mulk 67:1' },
  { number: 30, name: 'Amma Yatasa\'alun', nameAr: 'عم يتساءلون', description: 'Starts at An-Naba 78:1' }
];

const RubElHizb = ({ number, color }: { number: number; color: string }) => {
  const fontSize = number > 99 ? 9 : number > 9 ? 11 : 12;
  return (
    <View style={styles.starContainer}>
      <View style={[styles.starSquare, { borderColor: color }]} />
      <View style={[styles.starSquare, { borderColor: color, transform: [{ rotate: '45deg' }] }]} />
      <Text style={[styles.starText, { color, fontSize }]}>{number}</Text>
    </View>
  );
};

const JUZ_SURAHS: Record<number, number[]> = {
  1: [1, 2],
  2: [2],
  3: [2, 3],
  4: [3, 4],
  5: [4],
  6: [4, 5],
  7: [5, 6],
  8: [6, 7],
  9: [7, 8],
  10: [8, 9],
  11: [9, 10, 11],
  12: [11, 12],
  13: [12, 13, 14],
  14: [15, 16],
  15: [17, 18],
  16: [18, 19, 20],
  17: [21, 22],
  18: [23, 24, 25],
  19: [25, 26, 27],
  20: [27, 28, 29],
  21: [29, 30, 31, 32, 33],
  22: [33, 34, 35, 36],
  23: [36, 37, 38, 39],
  24: [39, 40, 41],
  25: [41, 42, 43, 44, 45],
  26: [46, 47, 48, 49, 50, 51],
  27: [51, 52, 53, 54, 55, 56, 57],
  28: [58, 59, 60, 61, 62, 63, 64, 65, 66],
  29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  30: Array.from({ length: 37 }, (_, i) => 78 + i),
};

export function SurahListScreen() {
  const navigation = useNavigation<NavigationProp>();
  useScreenTime('QuranIndex');
  
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [globalLastRead, setGlobalLastRead] = useState<any>(null);

  // Active Juz' state (defaults to Juz 1 active to match mockup)
  const [selectedJuzNumber, setSelectedJuzNumber] = useState<number | null>(1);



  const loadSurahList = async (forceRefresh = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cached = await AsyncStorage.getItem('ummati_cached_surah_list');
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        setSurahs(parsed);
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const json = await response.json();

      if (json.code === 200 && json.data) {
        setSurahs(json.data);
        await AsyncStorage.setItem('ummati_cached_surah_list', JSON.stringify(json.data));
      } else {
        setErrorMsg('Invalid API response structure.');
      }
    } catch (e: any) {
      console.warn('Error fetching Surahs:', e);
      setErrorMsg('Failed to connect to Quran API. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalLastRead = async () => {
    try {
      const saved = await AsyncStorage.getItem('ummati_global_last_read');
      if (saved) {
        setGlobalLastRead(JSON.parse(saved));
      } else {
        setGlobalLastRead(null);
      }
    } catch (e) {
      console.warn('Failed to load global last read:', e);
    }
  };

  useEffect(() => {
    loadSurahList();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGlobalLastRead();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Filter display list on-the-fly
  const displayedSurahs = surahs.filter((s) => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery;

    if (!matchesSearch) return false;

    if (selectedJuzNumber !== null) {
      const allowedSurahs = JUZ_SURAHS[selectedJuzNumber] || [];
      return allowedSurahs.includes(s.number);
    }

    return true;
  });

  const navigateToQuran = (params: any) => {
    navigation.navigate('QuranReading', params);
  };

  const startQuranFromBeginning = () => {
    navigateToQuran({
      surahNumber: 1,
      surahName: 'Al-Fatihah',
      translationName: 'The Opening',
    });
  };

  const resumeGlobalReading = () => {
    if (globalLastRead) {
      if (globalLastRead.readingType === 'juz') {
        navigateToQuran({
          juzNumber: globalLastRead.juzNumber,
          juzName: globalLastRead.juzName,
        });
      } else {
        navigateToQuran({
          surahNumber: globalLastRead.surahNumber,
          surahName: globalLastRead.surahName,
          translationName: globalLastRead.translationName,
        });
      }
    }
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quran</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color="#94A3B8" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Surah or Verse"
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Continue Reading Card */}
        <View style={styles.continueReadingCard}>
          <View style={styles.continueReadingLeft}>
            <Text style={styles.continueReadingLabel}>Continue Reading</Text>
            <Text style={styles.continueReadingTitle}>
              {globalLastRead
                ? (globalLastRead.readingType === 'juz'
                    ? `Para ${globalLastRead.juzNumber}`
                    : `Surah ${globalLastRead.surahName}`)
                : 'Surah Al-Kahf'}
            </Text>
            <Text style={styles.continueReadingSubtitle}>
              {globalLastRead ? `Last read: Verse ${globalLastRead.ayahNumber}` : 'Last read: Verse 24'}
            </Text>
            <TouchableOpacity 
              style={styles.resumeButton} 
              activeOpacity={0.85}
              onPress={globalLastRead ? resumeGlobalReading : startQuranFromBeginning}
            >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={require('../../../assets/images/verse_quran.png')}
            style={styles.continueReadingImage}
            resizeMode="contain"
          />
        </View>

        {/* Juz' Index Horizontal Slider */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Juz' Index</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedJuzNumber(null)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.juzSliderContainer}
        >
          {JUZ_LIST.map((item) => {
            const isActive = item.number === selectedJuzNumber;
            return (
              <TouchableOpacity
                key={item.number}
                style={[
                  styles.juzCard,
                  isActive ? styles.juzCardActive : styles.juzCardInactive
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setSelectedJuzNumber((prev) => (prev === item.number ? null : item.number))
                }
              >
                <Text style={[
                  styles.juzCardText,
                  isActive ? styles.juzCardTextActive : styles.juzCardTextInactive
                ]}>
                  Juz' {item.number}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Complete Para Shortcut Banner */}
        {selectedJuzNumber !== null && (
          <TouchableOpacity
            style={styles.openCompleteParaCard}
            activeOpacity={0.9}
            onPress={() => {
              const item = JUZ_LIST.find((j) => j.number === selectedJuzNumber);
              if (item) {
                navigateToQuran({
                  juzNumber: item.number,
                  juzName: item.name,
                });
              }
            }}
          >
            <View style={styles.openParaLeft}>
              <Text style={styles.openParaTitle}>📖 Open Complete Para {selectedJuzNumber}</Text>
              <Text style={styles.openParaSubtitle}>
                {JUZ_LIST.find((j) => j.number === selectedJuzNumber)?.name} • {JUZ_LIST.find((j) => j.number === selectedJuzNumber)?.description}
              </Text>
            </View>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        )}

        {/* Surahs List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Surahs</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setSelectedJuzNumber(null); setSearchQuery(''); }}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0E9F6E" />
            <Text style={styles.loadingText}>Loading Quran Index...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.centerContainer}>
            <AlertCircle color={Theme.colors.error} size={40} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <View style={styles.surahListContainer}>
            {displayedSurahs.map((item) => (
              <TouchableOpacity
                key={item.number}
                style={styles.surahRow}
                onPress={() =>
                  navigateToQuran({
                    surahNumber: item.number,
                    surahName: item.englishName,
                    translationName: item.englishNameTranslation,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.surahRowLeft}>
                  <RubElHizb number={item.number} color="#0E9F6E" />
                  <View style={styles.surahNameColumn}>
                    <Text style={styles.surahEnglishName}>{item.englishName}</Text>
                    <Text style={styles.surahTranslationName}>{item.englishNameTranslation}</Text>
                  </View>
                </View>
                <View style={styles.surahRowRight}>
                  <Text style={styles.surahVersesCount}>{item.numberOfAyahs} Verses</Text>
                  <ChevronRight color="#94A3B8" size={16} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Sticky Bottom Mini Player */}
      <View style={styles.miniPlayerContainer}>
        <View style={styles.miniPlayerLeft}>
          <View style={styles.miniPlayerIconCircle}>
            <BookOpen color="#0E9F6E" size={16} />
          </View>
          <View style={styles.miniPlayerTitleBox}>
            <Text style={styles.miniPlayerTitle}>
              {globalLastRead ? `Surah ${globalLastRead.surahName}` : 'Surah Al-Kahf'}
            </Text>
            <Text style={styles.miniPlayerSubtitle}>
              {globalLastRead ? `Ayah ${globalLastRead.ayahNumber}` : 'Ayah 24'}
            </Text>
          </View>
        </View>
        <View style={styles.miniPlayerRight}>
          <TouchableOpacity style={styles.playButton} activeOpacity={0.8}>
            <Play color="#0E9F6E" size={14} fill="#0E9F6E" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} activeOpacity={0.8}>
            <SkipForward color="#0F172A" size={18} fill="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 155, // Extra space to prevent overlap with the sticky mini player
  },
  continueReadingCard: {
    backgroundColor: '#F1FDFB', // Soft green card
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderColor: '#E2F7F5',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  continueReadingLeft: {
    flex: 1.2,
    zIndex: 1,
  },
  continueReadingLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  continueReadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 6,
  },
  continueReadingSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  resumeButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  continueReadingImage: {
    position: 'absolute',
    right: -15,
    bottom: -15,
    width: 130,
    height: 130,
    zIndex: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    color: '#0E9F6E',
    fontWeight: 'bold',
  },
  juzSliderContainer: {
    paddingBottom: 6,
    marginBottom: 24,
    gap: 8,
  },
  juzCard: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  juzCardActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#0E9F6E',
  },
  juzCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  openCompleteParaCard: {
    backgroundColor: '#0E9F6E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  openParaLeft: {
    flex: 1,
  },
  openParaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  openParaSubtitle: {
    color: '#E6F4EA',
    fontSize: 11,
    marginTop: 4,
  },
  juzCardText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  juzCardTextActive: {
    color: '#0E9F6E',
  },
  juzCardTextInactive: {
    color: '#64748B',
  },
  surahListContainer: {
    gap: 12,
  },
  surahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  surahRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surahNameColumn: {
    marginLeft: 4,
    justifyContent: 'center',
  },
  surahEnglishName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  surahTranslationName: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  surahRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surahVersesCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  starContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  starSquare: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderWidth: 1.5,
    borderRadius: 5,
  },
  starText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 82, // Sits exactly above bottom tab bar container (height 75)
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: '#FFFBEB', // Soft warm gold background matching mockup Screen 3
    borderRadius: 16,
    borderColor: '#FEF3C7',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  miniPlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniPlayerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayerTitleBox: {
    justifyContent: 'center',
  },
  miniPlayerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  miniPlayerSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  miniPlayerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
