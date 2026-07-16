import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, BookOpen, AlertCircle, RefreshCw, BookmarkCheck, Bookmark, Sparkles, Heart } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Path } from 'react-native-svg';

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

const SvgGradient = ({ colors }: { colors: string[] }) => (
  <View style={StyleSheet.absoluteFill}>
    <Svg height="100%" width="100%">
      <Defs>
        <SvgLinearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors[1]} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#bannerGrad)" />
    </Svg>
  </View>
);

export function SurahListScreen() {
  const navigation = useNavigation<NavigationProp>();
  useScreenTime('QuranIndex');
  
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [filteredJuz, setFilteredJuz] = useState<JuzItem[]>(JUZ_LIST);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [globalLastRead, setGlobalLastRead] = useState<any>(null);
  const [favoriteSurahs, setFavoriteSurahs] = useState<number[]>([]);
  const [favoriteJuz, setFavoriteJuz] = useState<number[]>([]);

  const loadFavorites = async () => {
    try {
      const favSurahs = await AsyncStorage.getItem('ummati_favorite_surahs');
      const favJuz = await AsyncStorage.getItem('ummati_favorite_juz');
      if (favSurahs) setFavoriteSurahs(JSON.parse(favSurahs));
      if (favJuz) setFavoriteJuz(JSON.parse(favJuz));
    } catch (e) {
      console.warn('Failed to load favorites:', e);
    }
  };

  const toggleFavoriteSurah = async (surahNumber: number) => {
    const updated = favoriteSurahs.includes(surahNumber)
      ? favoriteSurahs.filter(id => id !== surahNumber)
      : [...favoriteSurahs, surahNumber];
    setFavoriteSurahs(updated);
    await AsyncStorage.setItem('ummati_favorite_surahs', JSON.stringify(updated));
  };

  const toggleFavoriteJuz = async (juzNumber: number) => {
    const updated = favoriteJuz.includes(juzNumber)
      ? favoriteJuz.filter(id => id !== juzNumber)
      : [...favoriteJuz, juzNumber];
    setFavoriteJuz(updated);
    await AsyncStorage.setItem('ummati_favorite_juz', JSON.stringify(updated));
  };

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
      loadFavorites();
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
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <RubElHizb number={item.number} color={Theme.colors.primary} />
        <View style={styles.metaBox}>
          <Text style={styles.surahNameEng}>{item.englishName}</Text>
          <View style={styles.metaRow}>
            <View style={[
              styles.revelationBadge, 
              item.revelationType === 'Meccan' ? styles.meccanBadge : styles.medinanBadge
            ]}>
              <Text style={[
                styles.revelationText, 
                item.revelationType === 'Meccan' ? styles.meccanText : styles.medinanText
              ]}>
                {item.revelationType === 'Meccan' ? '🕋 Meccan' : '🕌 Medinan'}
              </Text>
            </View>
            <Text style={styles.surahSubText}>{item.numberOfAyahs} Ayahs</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRightContainer}>
        <View style={styles.cardRight}>
          <Text style={styles.surahNameAr}>{item.name}</Text>
          <Text style={styles.surahTransEng}>{item.englishNameTranslation}</Text>
        </View>
        <TouchableOpacity
          style={styles.favIconBtn}
          onPress={() => toggleFavoriteSurah(item.number)}
          activeOpacity={0.7}
        >
          <Heart
            color={favoriteSurahs.includes(item.number) ? '#EF4444' : Theme.colors.textMuted}
            fill={favoriteSurahs.includes(item.number) ? '#EF4444' : 'none'}
            size={18}
          />
        </TouchableOpacity>
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
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <RubElHizb number={item.number} color={Theme.colors.accent} />
        <View style={styles.metaBox}>
          <Text style={styles.surahNameEng}>Para {item.number}</Text>
          <Text style={styles.surahSubText} numberOfLines={1}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.cardRightContainer}>
        <View style={styles.cardRight}>
          <Text style={styles.surahNameAr}>{item.nameAr}</Text>
          <Text style={styles.surahTransEng}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.favIconBtn}
          onPress={() => toggleFavoriteJuz(item.number)}
          activeOpacity={0.7}
        >
          <Heart
            color={favoriteJuz.includes(item.number) ? '#EF4444' : Theme.colors.textMuted}
            fill={favoriteJuz.includes(item.number) ? '#EF4444' : 'none'}
            size={18}
          />
        </TouchableOpacity>
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
          <SvgGradient colors={['#046C4E', '#0E9F6E']} />
          <View style={styles.bannerDecoration}>
            <Svg height="120" width="120" viewBox="0 0 100 100">
              <Path
                d="M80 20 A35 35 0 1 0 80 80 A30 30 0 1 1 80 20 Z"
                fill="rgba(255, 255, 255, 0.08)"
              />
            </Svg>
          </View>
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
          <SvgGradient colors={['#046C4E', '#0E9F6E']} />
          <View style={styles.bannerDecoration}>
            <Svg height="120" width="120" viewBox="0 0 100 100">
              <Path
                d="M80 20 A35 35 0 1 0 80 80 A30 30 0 1 1 80 20 Z"
                fill="rgba(255, 255, 255, 0.08)"
              />
            </Svg>
          </View>
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

      {/* Favorites Quick Shelf */}
      {(favoriteSurahs.length > 0 || favoriteJuz.length > 0) && (
        <View style={styles.favShelfContainer}>
          <View style={styles.favShelfHeader}>
            <Heart color="#EF4444" fill="#EF4444" size={14} />
            <Text style={styles.favShelfTitle}>Favorites Quick Access</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favShelfScroll}
          >
            {/* Render Surahs */}
            {surahs
              .filter((s) => favoriteSurahs.includes(s.number))
              .map((s) => (
                <TouchableOpacity
                  key={`fav-s-${s.number}`}
                  style={styles.favShelfCard}
                  onPress={() =>
                    navigateToQuran({
                      surahNumber: s.number,
                      surahName: s.englishName,
                      translationName: s.englishNameTranslation,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.favShelfCardAr} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.favShelfCardEng} numberOfLines={1}>{s.englishName}</Text>
                  <Text style={styles.favShelfCardSub}>Surah {s.number}</Text>
                </TouchableOpacity>
              ))}

            {/* Render Paras (Juz) */}
            {JUZ_LIST
              .filter((j) => favoriteJuz.includes(j.number))
              .map((j) => (
                <TouchableOpacity
                  key={`fav-j-${j.number}`}
                  style={[styles.favShelfCard, { borderColor: 'rgba(245, 158, 11, 0.15)' }]}
                  onPress={() =>
                    navigateToQuran({
                      juzNumber: j.number,
                      juzName: j.name,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={[styles.favShelfCardAr, { color: Theme.colors.accent }]} numberOfLines={1}>{j.nameAr}</Text>
                  <Text style={styles.favShelfCardEng} numberOfLines={1}>Para {j.number}</Text>
                  <Text style={styles.favShelfCardSub}>{j.name}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Surah / Para Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'surah' ? styles.tabButtonActive : null]}
          onPress={() => toggleTab('surah')}
          activeOpacity={0.8}
        >
          <BookOpen color={activeTab === 'surah' ? '#FFFFFF' : Theme.colors.textSecondary} size={16} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === 'surah' ? styles.tabButtonTextActive : null]}>
            Surahs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'juz' ? styles.tabButtonActive : null]}
          onPress={() => toggleTab('juz')}
          activeOpacity={0.8}
        >
          <Bookmark color={activeTab === 'juz' ? '#FFFFFF' : Theme.colors.textSecondary} size={16} style={{ marginRight: 6 }} />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  premiumBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  bannerDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
    opacity: 0.9,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    zIndex: 2,
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  bannerLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerDetails: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bannerResumeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerStartText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
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
    borderColor: '#F1F5F9',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  revelationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meccanBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  medinanBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  revelationText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  meccanText: {
    color: '#B45309',
  },
  medinanText: {
    color: '#047857',
  },
  surahSubText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  cardRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favIconBtn: {
    padding: 6,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  surahNameAr: {
    color: Theme.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Georgia',
  },
  surahTransEng: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
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
  starContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  starSquare: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderRadius: 5,
  },
  starText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  favShelfContainer: {
    marginBottom: 20,
  },
  favShelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  favShelfTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  favShelfScroll: {
    gap: 10,
    paddingRight: 20,
  },
  favShelfCard: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 14,
    padding: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  favShelfCardAr: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Georgia',
    color: Theme.colors.primary,
    marginBottom: 4,
  },
  favShelfCardEng: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  favShelfCardSub: {
    fontSize: 10,
    fontWeight: '500',
    color: Theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
