import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, ScrollView, Image, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { Search, BookOpen, ChevronRight, AlertCircle, X, RefreshCw, Bookmark, Layers, WifiOff } from 'lucide-react-native';
import { getOfflineSurahList } from '../utils/quranOffline';
import { BUNDLED_OFFLINE_SURAHS } from '../data/offlineSurahs';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalPressable, Card, ScreenHeader, SectionHeader, haptic } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';

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

/** Eight-point star (Rub el Hizb) number badge, filled with the soft primary tint. */
const StarBadge = ({ number, color, fill, size = 44 }: { number: number; color: string; fill: string; size?: number }) => {
  const square = size * 0.66;
  const fontSize = number > 99 ? 11 : number > 9 ? 13 : 14;
  return (
    <View style={[styles.starContainer, { width: size, height: size }]}>
      <View style={[styles.starSquare, { width: square, height: square, backgroundColor: fill }]} />
      <View style={[styles.starSquare, { width: square, height: square, backgroundColor: fill, transform: [{ rotate: '45deg' }] }]} />
      <Text style={[styles.starText, { color, fontSize }]}>{number}</Text>
    </View>
  );
};

export function SurahListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  useScreenTime('QuranIndex');

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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
        setIsOfflineMode(false);
        await AsyncStorage.setItem('ummati_cached_surah_list', JSON.stringify(json.data));
      } else {
        const offlineList = getOfflineSurahList();
        setSurahs(offlineList);
        setIsOfflineMode(true);
      }
    } catch (e: any) {
      console.warn('Error fetching Surahs, using offline fallback:', e);
      const offlineList = getOfflineSurahList();
      if (offlineList && offlineList.length > 0) {
        setSurahs(offlineList);
        setIsOfflineMode(true);
      } else {
        setErrorMsg('Failed to connect to Quran API. Please check your internet connection.');
      }
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

  const selectedJuz = selectedJuzNumber !== null ? JUZ_LIST.find((j) => j.number === selectedJuzNumber) : undefined;

  const continueTitle = globalLastRead
    ? (globalLastRead.readingType === 'juz'
        ? `Para ${globalLastRead.juzNumber}`
        : `Surah ${globalLastRead.surahName}`)
    : 'Surah Al-Kahf';
  const continueSubtitle = globalLastRead ? `Last read: Verse ${globalLastRead.ayahNumber}` : 'Last read: Verse 24';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Al-Qur'an" subtitle="114 Surahs · 30 Juz · Recited by Alafasy">
        <Animated.View
          entering={FadeInDown.delay(120).duration(450)}
          style={[styles.searchContainer, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
        >
          <Search color={colors.onSky} size={19} strokeWidth={2.6} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSky }]}
            placeholder="Search Surah by name or number"
            placeholderTextColor={colors.onSkyMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCorrect={false}
            selectionColor={colors.onSky}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <X color={colors.onSkyMuted} size={18} />
            </Pressable>
          )}
        </Animated.View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Offline Notice Banner */}
        {isOfflineMode && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.offlineNoticeWrap}>
            <View style={[styles.offlineNotice, { backgroundColor: colors.accentSoft, borderColor: colors.ink }]}>
              <WifiOff color={colors.ink} size={15} strokeWidth={2.4} />
              <Text style={[styles.offlineNoticeText, { color: colors.ink }]}>
                Offline Mode • All 114 Surahs catalogued
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Continue Reading Card */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <BrutalPressable
            fill={colors.sky[0]}
            radius={26}
            onPress={globalLastRead ? resumeGlobalReading : startQuranFromBeginning}
            style={styles.continueReadingCard}
          >
              <View style={[styles.continueOrb, { backgroundColor: colors.glass, borderColor: colors.ink }]} />
              <View style={styles.continueReadingLeft}>
                <View style={[styles.continuePill, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                  <Bookmark color={colors.onSky} size={12} strokeWidth={2.6} />
                  <Text style={[styles.continueReadingLabel, { color: colors.onSky }]}>CONTINUE READING</Text>
                </View>
                <Text style={[styles.continueReadingTitle, { color: colors.onSky }]} numberOfLines={1}>{continueTitle}</Text>
                <Text style={[styles.continueReadingSubtitle, { color: colors.onSkyMuted }]}>{continueSubtitle}</Text>
                <View style={[styles.resumeButton, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
                  <BookOpen color="#1C1A17" size={15} strokeWidth={2.6} />
                  <Text style={styles.resumeButtonText}>{globalLastRead ? 'Resume' : 'Start reading'}</Text>
                </View>
              </View>
              <Image
                source={require('../../../assets/images/verse_quran.png')}
                style={styles.continueReadingImage}
                resizeMode="contain"
              />
          </BrutalPressable>
        </Animated.View>

        {/* Juz' Index Horizontal Slider */}
        <SectionHeader title="Juz' Index" action="View All" onAction={() => { haptic.select(); setSelectedJuzNumber(null); }} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.juzSliderContainer}
          style={styles.juzSlider}
        >
          {JUZ_LIST.map((item, index) => {
            const isActive = item.number === selectedJuzNumber;
            return (
              <Animated.View key={item.number} entering={index < 8 ? FadeInDown.delay(index * 40) : undefined}>
                <BrutalPressable
                  fill={isActive ? colors.primary : colors.surface}
                  radius={20}
                  offset={brutal.shadowSmall}
                  borderWidth={brutal.borderThin}
                  style={styles.juzCard}
                  onPress={() =>
                    setSelectedJuzNumber((prev) => (prev === item.number ? null : item.number))
                  }
                >
                  <Text style={[styles.juzCardCaption, { color: isActive ? colors.onPrimary : colors.textMuted }]}>JUZ'</Text>
                  <Text style={[styles.juzCardNumber, { color: isActive ? colors.onPrimary : colors.text }]}>{item.number}</Text>
                  <Text style={[styles.juzCardArabic, { color: isActive ? colors.onPrimary : colors.textSecondary }]} numberOfLines={1}>
                    {item.nameAr}
                  </Text>
                </BrutalPressable>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Complete Para Shortcut Banner */}
        {selectedJuz && (
          <Animated.View key={selectedJuz.number} entering={FadeInDown.duration(350)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
            <BrutalPressable
              fill={colors.primarySoft}
              radius={20}
              style={styles.openCompleteParaCard}
              onPress={() => {
                navigateToQuran({
                  juzNumber: selectedJuz.number,
                  juzName: selectedJuz.name,
                });
              }}
            >
              <View style={[styles.openParaIcon, { backgroundColor: colors.primary, borderColor: colors.ink }]}>
                <Layers color={colors.onPrimary} size={20} strokeWidth={2.4} />
              </View>
              <View style={styles.openParaLeft}>
                <Text style={[styles.openParaTitle, { color: colors.text }]}>Open Complete Para {selectedJuz.number}</Text>
                <Text style={[styles.openParaSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {selectedJuz.name} • {selectedJuz.description}
                </Text>
              </View>
              <ChevronRight color={colors.text} size={20} strokeWidth={2.8} />
            </BrutalPressable>
          </Animated.View>
        )}

        {/* Surahs List */}
        <Animated.View layout={LinearTransition}>
          <SectionHeader
            title={selectedJuz ? `Surahs in Juz' ${selectedJuz.number}` : 'All Surahs'}
            action="View All"
            onAction={() => { haptic.select(); setSelectedJuzNumber(null); setSearchQuery(''); }}
          />

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Quran Index...</Text>
            </View>
          ) : errorMsg ? (
            <Animated.View entering={FadeIn}>
              <Card style={styles.errorCard}>
                <View style={[styles.errorIcon, styles.errorIconDanger, { borderColor: colors.ink }]}>
                  <AlertCircle color="#1C1A17" size={28} strokeWidth={2.4} />
                </View>
                <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
                <BrutalPressable fill={colors.primary} radius={14} offset={brutal.shadowSmall} style={styles.retryButton} onPress={() => loadSurahList(true)}>
                  <RefreshCw color={colors.onPrimary} size={15} strokeWidth={2.6} />
                  <Text style={[styles.retryText, { color: colors.onPrimary }]}>Try again</Text>
                </BrutalPressable>
              </Card>
            </Animated.View>
          ) : displayedSurahs.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.centerContainer}>
              <View style={[styles.errorIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                <Search color={colors.textMuted} size={26} />
              </View>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>No Surahs match “{searchQuery}”</Text>
            </Animated.View>
          ) : (
            <View style={styles.surahListContainer}>
              {displayedSurahs.map((item, index) => (
                <Animated.View
                  key={item.number}
                  entering={index < 12 ? FadeInDown.delay(Math.min(index, 10) * 40).duration(400) : undefined}
                >
                  <BrutalPressable
                    radius={20}
                    offset={brutal.shadowSmall}
                    style={styles.surahRow}
                    onPress={() =>
                      navigateToQuran({
                        surahNumber: item.number,
                        surahName: item.englishName,
                        translationName: item.englishNameTranslation,
                      })
                    }
                  >
                    <StarBadge number={item.number} color={colors.text} fill={colors.primarySoft} />
                    <View style={styles.surahNameColumn}>
                      <Text style={[styles.surahEnglishName, { color: colors.text }]} numberOfLines={1}>{item.englishName}</Text>
                      <View style={styles.surahMetaRow}>
                        <Text style={[styles.surahTranslationName, { color: colors.textMuted }]} numberOfLines={1}>
                          {item.revelationType === 'Meccan' ? 'Makki' : 'Madani'} · {item.numberOfAyahs} Verses
                        </Text>
                        {BUNDLED_OFFLINE_SURAHS[item.number] !== undefined && (
                          <View style={[styles.offlineBadge, { backgroundColor: colors.primarySoft, borderColor: colors.ink }]}>
                            <Text style={[styles.offlineBadgeText, { color: colors.ink }]}>Offline Ready</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.surahRowRight}>
                      <Text style={[styles.surahArabicName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.surahVersesCount, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.englishNameTranslation}
                      </Text>
                    </View>
                  </BrutalPressable>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {!loading && !errorMsg && displayedSurahs.length > 0 && (
          <Animated.View entering={ZoomIn.delay(300)} style={styles.footerOrnament}>
            <Text style={[styles.footerArabic, { color: colors.textMuted }]}>صَدَقَ ٱللَّٰهُ ٱلْعَظِيمُ</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: brutal.border,
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '700', paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  continueReadingCard: {
    padding: 20,
    marginRight: brutal.shadow,
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -60, top: -70, borderWidth: brutal.border },
  continueReadingLeft: { flex: 1, zIndex: 1, paddingRight: 90 },
  continuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: brutal.borderThin,
  },
  continueReadingLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  continueReadingTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginTop: 12 },
  continueReadingSubtitle: { fontSize: 13, marginTop: 3, fontWeight: '700' },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    alignSelf: 'flex-start',
    borderWidth: brutal.borderThin,
  },
  resumeButtonText: { color: '#1C1A17', fontSize: 13, fontWeight: '900' },
  continueReadingImage: { position: 'absolute', right: -12, bottom: -12, width: 140, height: 140, zIndex: 0 },
  juzSlider: { marginHorizontal: -20 },
  juzSliderContainer: { paddingHorizontal: 20, paddingBottom: 8, paddingRight: 24, gap: 12 },
  juzCard: {
    width: 78,
    paddingVertical: 12,
    alignItems: 'center',
  },
  juzCardCaption: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  juzCardNumber: { fontSize: 26, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
  juzCardArabic: { fontSize: 12, fontFamily: 'Georgia', marginTop: 2, paddingHorizontal: 6 },
  openCompleteParaCard: {
    padding: 14,
    marginTop: 16,
    marginRight: brutal.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  openParaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  openParaLeft: { flex: 1 },
  openParaTitle: { fontSize: 15, fontWeight: '900' },
  openParaSubtitle: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  surahListContainer: { gap: 12 },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    marginRight: brutal.shadowSmall,
  },
  surahNameColumn: { flex: 1, justifyContent: 'center' },
  surahEnglishName: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  surahMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  surahTranslationName: { fontSize: 12, fontWeight: '700' },
  surahRowRight: { alignItems: 'flex-end', maxWidth: '40%' },
  surahArabicName: { fontSize: 20, fontFamily: 'Georgia', fontWeight: '700', textAlign: 'right' },
  surahVersesCount: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorCard: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  errorIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  errorIconDanger: { backgroundColor: '#F6D3CE' },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { fontSize: 14, fontWeight: '900' },
  starContainer: { justifyContent: 'center', alignItems: 'center' },
  starSquare: { position: 'absolute', borderRadius: 7 },
  starText: { fontWeight: '900', textAlign: 'center' },
  footerOrnament: { alignItems: 'center', marginTop: 28 },
  footerArabic: { fontSize: 18, fontFamily: 'Georgia' },

  // Offline styles
  offlineNoticeWrap: { marginBottom: 12, marginRight: brutal.shadow },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: brutal.borderThin,
  },
  offlineNoticeText: { fontSize: 12.5, fontWeight: '800' },
  offlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: brutal.borderThin,
    marginLeft: 6,
  },
  offlineBadgeText: { fontSize: 9.5, fontWeight: '900' },
});
