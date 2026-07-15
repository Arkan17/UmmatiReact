import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, BookOpen, AlertCircle, RefreshCw, BookmarkCheck } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
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

export function SurahListScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [filteredJuz, setFilteredJuz] = useState<JuzItem[]>(JUZ_LIST);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [globalLastRead, setGlobalLastRead] = useState<any>(null);

  const loadSurahList = async (forceRefresh = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cached = await AsyncStorage.getItem('ummati_cached_surah_list');
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        setSurahs(parsed);
        setFilteredSurahs(parsed);
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const json = await response.json();

      if (json.code === 200 && json.data) {
        setSurahs(json.data);
        setFilteredSurahs(json.data);
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
    const lowerText = text.toLowerCase();

    if (activeTab === 'surah') {
      if (!text.trim()) {
        setFilteredSurahs(surahs);
        return;
      }
      const filtered = surahs.filter(
        (s) =>
          s.englishName.toLowerCase().includes(lowerText) ||
          s.englishNameTranslation.toLowerCase().includes(lowerText) ||
          s.name.includes(text) ||
          s.number.toString() === text
      );
      setFilteredSurahs(filtered);
    } else {
      if (!text.trim()) {
        setFilteredJuz(JUZ_LIST);
        return;
      }
      const filtered = JUZ_LIST.filter(
        (j) =>
          j.name.toLowerCase().includes(lowerText) ||
          j.nameAr.includes(text) ||
          j.number.toString() === text
      );
      setFilteredJuz(filtered);
    }
  };

  // Switch tabs cleanly
  const toggleTab = (tab: 'surah' | 'juz') => {
    setActiveTab(tab);
    setSearchQuery('');
    if (tab === 'surah') {
      setFilteredSurahs(surahs);
    } else {
      setFilteredJuz(JUZ_LIST);
    }
  };

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

  const renderSurahCard = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigateToQuran({
          surahNumber: item.number,
          surahName: item.englishName,
          translationName: item.englishNameTranslation,
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.surahNameEng}>{item.englishName}</Text>
          <Text style={styles.surahSubText}>
            {item.revelationType === 'Meccan' ? '🕋' : '🕌'} • {item.numberOfAyahs} Ayahs
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.surahNameAr}>{item.name}</Text>
        <Text style={styles.surahTransEng}>{item.englishNameTranslation}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderJuzCard = ({ item }: { item: JuzItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigateToQuran({
          juzNumber: item.number,
          juzName: item.name,
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.surahNameEng}>Para {item.number}</Text>
          <Text style={styles.surahSubText}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.surahNameAr}>{item.nameAr}</Text>
        <Text style={styles.surahTransEng}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>The Holy Quran</Text>
        <Text style={styles.subtitle}>Read and contemplate the words of Allah</Text>
      </View>

      {/* Complete Quran Banner */}
      {globalLastRead ? (
        <View style={styles.premiumBanner}>
          <View style={styles.bannerInfo}>
            <BookmarkCheck color="#FFFFFF" size={24} style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerLabel}>CONTINUE READING</Text>
              <Text style={styles.bannerDetails}>
                {globalLastRead.readingType === 'juz'
                  ? `Para ${globalLastRead.juzNumber} (${globalLastRead.juzName})`
                  : `Surah ${globalLastRead.surahName}`}
                {` • Ayah ${globalLastRead.ayahNumber}`}
              </Text>
            </View>
          </View>
          <View style={styles.bannerActions}>
            <TouchableOpacity style={styles.bannerResumeBtn} onPress={resumeGlobalReading} activeOpacity={0.85}>
              <Text style={styles.bannerResumeText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={startQuranFromBeginning} activeOpacity={0.7}>
              <Text style={styles.bannerResetText}>Start from Beginning</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.premiumBanner}>
          <View style={styles.bannerInfo}>
            <BookOpen color="#FFFFFF" size={24} style={styles.bannerIcon} />
            <View>
              <Text style={styles.bannerTitle}>Read Complete Quran</Text>
              <Text style={styles.bannerDesc}>Read continuously page-by-page from beginning to end</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bannerStartBtn} onPress={startQuranFromBeginning} activeOpacity={0.85}>
            <Text style={styles.bannerStartText}>Start Reading</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Surah / Para Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'surah' ? styles.tabButtonActive : null]}
          onPress={() => toggleTab('surah')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'surah' ? styles.tabButtonTextActive : null]}>
            Surahs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'juz' ? styles.tabButtonActive : null]}
          onPress={() => toggleTab('juz')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'juz' ? styles.tabButtonTextActive : null]}>
            Paras (Juz)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color={Theme.colors.textMuted} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'surah' ? 'Search by Surah name or number...' : 'Search by Para name or number...'}
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
      </View>

      {/* List / Loader / Error */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Quran Index...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <AlertCircle color={Theme.colors.error} size={48} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadSurahList(true)} activeOpacity={0.8}>
            <RefreshCw color={Theme.colors.white} size={16} />
            <Text style={styles.refreshBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'surah' ? (
        // SURAH INDEX LIST
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahCard}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen color={Theme.colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No Surahs found matching "{searchQuery}"</Text>
            </View>
          }
        />
      ) : (
        // JUZ / PARA INDEX LIST
        <FlatList
          data={filteredJuz}
          renderItem={renderJuzCard}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen color={Theme.colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No Paras found matching "{searchQuery}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  premiumBanner: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 20,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  bannerLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerDetails: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerResumeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
  },
  bannerResumeText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  bannerResetText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  bannerStartBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bannerStartText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Theme.radius.md,
    padding: 4,
    marginBottom: 16,
    borderColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Theme.radius.sm,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  tabButtonText: {
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    gap: 8,
  },
  refreshBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 16,
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  numberText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  metaBox: {
    gap: 4,
    flex: 1,
  },
  surahNameEng: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  surahSubText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  surahNameAr: {
    color: Theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Georgia',
  },
  surahTransEng: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
