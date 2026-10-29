import React, { memo, useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { awardXp, incrementActivity, saveLastRead } from '../../../core/services/progress';
import { WebView } from 'react-native-webview';
import Animated, { FadeIn, FadeInDown, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play, Pause, Bookmark, BookmarkCheck, AlertCircle, Settings2, BookOpen, AlignLeft,
  SkipForward, SkipBack, Headphones, RefreshCw, Check, Type, Palette as PaletteIcon, Languages, Gauge, AudioLines, Share2,
  Mic, ChevronRight, X, WifiOff,
} from 'lucide-react-native';
import {
  QURAN_RECITERS,
  DEFAULT_RECITER,
  getReciterById,
  buildAyahAudioUrl,
  type Reciter,
} from '../data/reciters';
import { getBundledSurah } from '../utils/quranOffline';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalBox, BrutalPressable, Card, HeaderButton, PressableScale, ProgressBar, ScreenHeader, haptic } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';
import { MushafBook } from '../components/MushafBook';

interface Ayah {
  number: number;
  numberInSurah: number;
  textAr: string;
  textEn: string;
  surahName?: string;
  surahNumber?: number;
}

type ScreenRouteProp = RouteProp<RootStackParamList, 'QuranReading'>;

/** Reading-surface themes (user setting). The surrounding chrome follows the app palette. */
// `border` is the soft rule inside cards; card outlines/shadows use the app ink.
const themes = {
  light: {
    bg: '#F3EEE4',
    cardBg: '#FFFAF1',
    text: '#1C1A17',
    textSecondary: '#4B463E',
    border: '#D9D0BF',
  },
  sepia: {
    bg: '#EFE3CF',
    cardBg: '#FBF3E4',
    text: '#3F3020',
    textSecondary: '#6E5D4F',
    border: '#D8C6A8',
  },
  dark: {
    bg: '#17171D',
    cardBg: '#272833',
    text: '#EFE9DD',
    textSecondary: '#B3AC9F',
    border: 'rgba(239,233,221,0.14)',
  },
};

/** Pastel "sticker" chips: readable (ink on pastel) on every reading theme. */
const STICKER_INK = '#1C1A17';
const PLAYING_STICKER = '#F6E2B6';
const LAST_READ_STICKER = '#CFEADB';

const fontSizes = {
  small: { arabic: 22, translation: 13 },
  medium: { arabic: 26, translation: 15 },
  large: { arabic: 32, translation: 18 },
};

const JUZ_NAMES = [
  'Alif Lam Mim', 'Sayaqul', 'Tilkal Rusul', 'Lan Tanaloo', 'Wal Muhsanat',
  'La Yuhibbullah', 'Wa Iza Samiu', 'Wa Lau Annana', 'Qal Al-Mala', 'Walamu',
  'Yatazirun', 'Wa Mamin Dabbah', 'Wa Ma Ubarriu', 'Alif Lam Ra / Rubama', 'Subhanallazi',
  'Qal Alam', 'Aqtaraba', 'Qad Aflaha', 'Wa Qalallazina', 'Aman Khalaqa',
  'Utlu Ma Oohiya', 'Wa Man Yaqnut', 'Wa Maliya', 'Faman Azlam', 'Ilayhi Yuraddu',
  'Ha Meem', 'Qala Fama Khatbukum', 'Qad Samiallah', 'Tabarakallazi', 'Amma Yatasa\'alun'
];

/** Eight-point star (Rub el Hizb) ayah number badge. */
const StarBadge = ({ number, color, fill, size = 38 }: { number: number; color: string; fill: string; size?: number }) => {
  const square = size * 0.68;
  const fontSize = number > 99 ? 10 : number > 9 ? 12 : 13;
  return (
    <View style={[styles.starContainer, { width: size, height: size }]}>
      <View style={[styles.starSquare, { width: square, height: square, backgroundColor: fill }]} />
      <View style={[styles.starSquare, { width: square, height: square, backgroundColor: fill, transform: [{ rotate: '45deg' }] }]} />
      <Text style={[styles.starText, { color, fontSize }]}>{number}</Text>
    </View>
  );
};

function SettingGroup({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.settingGroup}>
      <View style={styles.settingLabelRow}>
        <View style={[styles.settingIcon, { backgroundColor: colors.primarySoft, borderColor: colors.ink }]}>{icon}</View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={[styles.optionsRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>{children}</View>
    </View>
  );
}

function OptionPill({ active, label, onPress, swatch }: { active: boolean; label: string; onPress: () => void; swatch?: string }) {
  const { colors } = useAppTheme();
  return (
    <PressableScale
      onPress={() => { haptic.select(); onPress(); }}
      hapticOnPress={false}
      style={[styles.optionPill, active && { backgroundColor: colors.primary, borderColor: colors.ink }]}
    >
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.ink }]} /> : null}
      <Text
        style={[styles.optionPillText, { color: active ? colors.onPrimary : colors.textSecondary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </PressableScale>
  );
}

type ReadingThemeKey = keyof typeof themes;

interface AyahCardProps {
  item: Ayah;
  index: number;
  showSurahHeader: boolean;
  isBookmarked: boolean;
  isLastRead: boolean;
  isPlaying: boolean;
  /** 0–1 playback position of this ayah (only meaningful while playing) */
  progressPct: number;
  readingTheme: ReadingThemeKey;
  textSize: keyof typeof fontSizes;
  fallbackSurahNumber?: number;
  fallbackSurahName?: string;
  onPress: (ayah: Ayah) => void;
  onBookmark: (ayah: Ayah) => void;
  /** Share this ayah into a Community post */
  onShare: (ayah: Ayah) => void;
}

/** Memoised so audio progress ticks only re-render the ayah that is playing. */
const AyahCard = memo(function AyahCard({
  item, index, showSurahHeader, isBookmarked, isLastRead, isPlaying, progressPct, readingTheme, textSize,
  fallbackSurahNumber, fallbackSurahName, onPress, onBookmark, onShare,
}: AyahCardProps) {
  const { colors } = useAppTheme();
  const activeTheme = themes[readingTheme];
  const activeSizes = fontSizes[textSize];
  const isDarkReading = readingTheme === 'dark';
  // Playing ayah gets a flat warm fill; outline + hard shadow come from BrutalPressable
  const cardFill = isPlaying ? (isDarkReading ? '#3A3324' : '#FBEFD2') : activeTheme.cardBg;
  const activeWordColor = isDarkReading ? '#E8B65A' : '#A86F12';

  const words = item.textAr.split(' ');
  const activeWordIndex = isPlaying ? Math.min(words.length - 1, Math.floor(progressPct * words.length)) : -1;

  return (
    <Animated.View
      entering={index < 12 ? FadeInDown.delay(Math.min(index, 10) * 40).duration(400) : undefined}
      style={styles.ayahWrap}
    >
      {showSurahHeader && (
        <Animated.View entering={ZoomIn.duration(450)} style={styles.surahBannerWrap}>
          <BrutalBox fill={colors.sky[0]} radius={26} style={styles.surahHeaderBanner}>
            <View style={[styles.bannerChip, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.bannerChipText, { color: colors.onSky }]}>
                SURAH {item.surahNumber ?? fallbackSurahNumber ?? ''}
              </Text>
            </View>
            <Text style={[styles.surahHeaderNameAr, { color: colors.onSky }]}>
              {`سورة ${item.surahName ?? fallbackSurahName}`}
            </Text>
            <Text style={[styles.surahHeaderNameEng, { color: colors.onSkyMuted }]}>
              Surah {item.surahName || fallbackSurahName}
            </Text>
            {item.surahNumber !== 9 && fallbackSurahNumber !== 9 && (
              <>
                <View style={[styles.bannerDivider, { backgroundColor: colors.ink }]} />
                <Text style={[styles.surahHeaderBismillah, { color: colors.onSky }]}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
              </>
            )}
          </BrutalBox>
        </Animated.View>
      )}

      <BrutalPressable
        onPress={() => onPress(item)}
        fill={cardFill}
        radius={22}
        offset={isPlaying ? brutal.shadow + 1 : brutal.shadow}
        style={styles.ayahContainer}
      >
        <View style={styles.ayahHeader}>
          <View style={styles.ayahHeaderLeft}>
            <StarBadge
              number={item.numberInSurah}
              color={STICKER_INK}
              fill={isPlaying ? PLAYING_STICKER : LAST_READ_STICKER}
            />
            {item.surahName ? (
              <Text style={[styles.ayahRef, { color: activeTheme.textSecondary }]} numberOfLines={1}>
                {item.surahName} · {item.numberInSurah}
              </Text>
            ) : null}
          </View>

          <View style={styles.ayahActions}>
            {isPlaying ? (
              <Animated.View entering={FadeIn} style={[styles.stateChip, { backgroundColor: PLAYING_STICKER, borderColor: STICKER_INK }]}>
                <AudioLines color={STICKER_INK} size={12} strokeWidth={2.6} />
                <Text style={[styles.stateChipText, { color: STICKER_INK }]}>PLAYING</Text>
              </Animated.View>
            ) : isLastRead ? (
              <View style={[styles.stateChip, { backgroundColor: LAST_READ_STICKER, borderColor: STICKER_INK }]}>
                <Text style={[styles.stateChipText, { color: STICKER_INK }]}>LAST READ</Text>
              </View>
            ) : null}
            <PressableScale
              onPress={() => onShare(item)}
              style={[styles.actionBtn, { borderColor: activeTheme.textSecondary }]}
              hitSlop={6}
              accessibilityLabel="Share to Community"
            >
              <Share2 color={activeTheme.textSecondary} size={17} strokeWidth={2.2} />
            </PressableScale>
            <PressableScale
              onPress={() => onBookmark(item)}
              style={[styles.actionBtn, { backgroundColor: isBookmarked ? LAST_READ_STICKER : 'transparent', borderColor: isBookmarked ? STICKER_INK : activeTheme.textSecondary }]}
              hitSlop={6}
            >
              {isBookmarked ? (
                <BookmarkCheck color={STICKER_INK} size={18} strokeWidth={2.4} />
              ) : (
                <Bookmark color={activeTheme.textSecondary} size={18} strokeWidth={2.2} />
              )}
            </PressableScale>
          </View>
        </View>

        <Text style={[
          styles.textArabic,
          { fontSize: activeSizes.arabic, lineHeight: Math.round(activeSizes.arabic * 1.95) },
        ]}>
          {words.map((word, idx) => {
            let wordColor = activeTheme.text;
            if (idx === activeWordIndex) wordColor = activeWordColor;
            else if (isPlaying && idx < activeWordIndex) wordColor = '#B8995A';
            return (
              <Text key={idx} style={{ color: wordColor, fontWeight: idx === activeWordIndex ? 'bold' : 'normal' }}>
                {word}{' '}
              </Text>
            );
          })}
        </Text>

        <View style={[styles.ayahDivider, { backgroundColor: activeTheme.border }]} />

        <Text style={[
          styles.textEnglish,
          { fontSize: activeSizes.translation, lineHeight: Math.round(activeSizes.translation * 1.6) },
          isPlaying ? { color: isDarkReading ? '#EFE9DD' : '#7A5420' } : { color: activeTheme.textSecondary },
        ]}>
          {item.textEn}
        </Text>
      </BrutalPressable>
    </Animated.View>
  );
});

export function QuranReadingScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  useScreenTime('QuranReading');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const { surahNumber, surahName, translationName, juzNumber, juzName } = route.params;

  // Reading type configs
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number | undefined>(surahNumber);
  const [currentSurahName, setCurrentSurahName] = useState<string | undefined>(surahName);
  const [currentTranslationName, setCurrentTranslationName] = useState<string | undefined>(translationName);

  const [currentJuzNumber, setCurrentJuzNumber] = useState<number | undefined>(juzNumber);
  const [currentJuzName, setCurrentJuzName] = useState<string | undefined>(juzName);

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Layout & Settings State
  const [readingMode, setReadingMode] = useState<'scroll' | 'page'>('scroll');
  const [showSettings, setShowSettings] = useState(false);
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [translationLang, setTranslationLang] = useState<'english' | 'hindi'>('english');
  const [audioMode, setAudioMode] = useState<'arabic' | 'hindi' | 'both'>('arabic');
  const [playbackRate, setPlaybackRateState] = useState<number>(1.15); // Default to 1.15x slightly faster
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Bookmarks & Last Read State
  const [lastReadAyah, setLastReadAyah] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<number, boolean>>({});

  // Book mode: open the next section on its first page, the previous one on its last page
  const [openAtEnd, setOpenAtEnd] = useState(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAyahId, setPlayingAyahId] = useState<number | null>(null);
  const [playingProgress, setPlayingProgress] = useState<{ ayahId: number; pct: number } | null>(null);
  const webViewRef = useRef<WebView<{}>>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch content (with cache)
  const loadContent = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const translationEdition = translationLang === 'hindi' ? 'hi.farooq' : 'en.sahih';
      
      if (currentJuzNumber !== undefined) {
        // Fetch by Juz
        const cacheKey = `ummati_cached_juz_${currentJuzNumber}_${translationLang}`;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
          setAyahs(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const [responseAr, responseEn] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/juz/${currentJuzNumber}/quran-uthmani`),
          fetch(`https://api.alquran.cloud/v1/juz/${currentJuzNumber}/${translationEdition}`)
        ]);
        const [jsonAr, jsonEn] = await Promise.all([
          responseAr.json(),
          responseEn.json()
        ]);

        if (jsonAr.code === 200 && jsonEn.code === 200 && jsonAr.data && jsonEn.data) {
          const arabicAyahs = jsonAr.data.ayahs;
          const englishAyahs = jsonEn.data.ayahs;

          const merged: Ayah[] = arabicAyahs.map((ar: any, idx: number) => ({
            number: ar.number,
            numberInSurah: ar.numberInSurah,
            textAr: ar.text,
            textEn: englishAyahs[idx].text,
            surahName: ar.surah.englishName,
            surahNumber: ar.surah.number,
          }));

          setAyahs(merged);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(merged));
        } else {
          setErrorMsg('Failed to parse Quranic Juz translations.');
        }
      } else if (currentSurahNumber !== undefined) {
        // Fetch by Surah
        const cacheKey = `ummati_cached_surah_${currentSurahNumber}_${translationLang}`;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
          setAyahs(JSON.parse(cached));
          setIsOfflineFallback(false);
          setLoading(false);
          return;
        }

        try {
          const url = `https://api.alquran.cloud/v1/surah/${currentSurahNumber}/editions/quran-uthmani,${translationEdition}`;
          const response = await fetch(url);
          const json = await response.json();

          if (json.code === 200 && json.data && json.data.length === 2) {
            const arabicAyahs = json.data[0].ayahs;
            const englishAyahs = json.data[1].ayahs;

            const sName = json.data[0].englishName;
            const sTrans = json.data[0].englishNameTranslation;
            setCurrentSurahName(sName);
            setCurrentTranslationName(sTrans);

            const merged: Ayah[] = arabicAyahs.map((ar: any, idx: number) => ({
              number: ar.number,
              numberInSurah: ar.numberInSurah,
              textAr: ar.text,
              textEn: englishAyahs[idx].text,
            }));

            setAyahs(merged);
            setIsOfflineFallback(false);
            await AsyncStorage.setItem(cacheKey, JSON.stringify(merged));
            setLoading(false);
            return;
          }
        } catch (netErr) {
          console.warn('Network fetch failed, trying bundled offline fallback:', netErr);
        }

        // Offline bundled fallback check
        const bundled = getBundledSurah(currentSurahNumber);
        if (bundled) {
          setCurrentSurahName(bundled.englishName);
          setCurrentTranslationName(bundled.translationName);
          setAyahs(bundled.ayahs as Ayah[]);
          setIsOfflineFallback(true);
          setLoading(false);
          return;
        }

        setErrorMsg('Connect to the internet to download and cache this Surah.');
      }
    } catch (e) {
      console.warn('Error loading content:', e);
      if (currentSurahNumber !== undefined) {
        const bundled = getBundledSurah(currentSurahNumber);
        if (bundled) {
          setCurrentSurahName(bundled.englishName);
          setCurrentTranslationName(bundled.translationName);
          setAyahs(bundled.ayahs as Ayah[]);
          setIsOfflineFallback(true);
          setLoading(false);
          return;
        }
      }
      setErrorMsg('Failed to load verses. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [currentSurahNumber, currentJuzNumber, translationLang]);

  // Load Bookmarks & settings from storage
  const loadSettingsAndBookmarks = useCallback(async () => {
    try {
      const savedBookmarks = await AsyncStorage.getItem('ummati_saved_bookmarks');
      if (savedBookmarks) {
        setBookmarkedAyahs(JSON.parse(savedBookmarks));
      }

      const lastReadKey = currentJuzNumber !== undefined
        ? `ummati_last_read_juz_${currentJuzNumber}`
        : `ummati_last_read_surah_${currentSurahNumber}`;
      
      const lastRead = await AsyncStorage.getItem(lastReadKey);
      if (lastRead) {
        setLastReadAyah(parseInt(lastRead, 10));
      } else {
        setLastReadAyah(null);
      }

      const savedTheme = await AsyncStorage.getItem('ummati_quran_theme');
      if (savedTheme) setTheme(savedTheme as any);

      const savedTextSize = await AsyncStorage.getItem('ummati_quran_text_size');
      if (savedTextSize) setTextSize(savedTextSize as any);

      const savedReadingMode = await AsyncStorage.getItem('ummati_quran_reading_mode');
      if (savedReadingMode) setReadingMode(savedReadingMode as any);

      const savedLang = await AsyncStorage.getItem('ummati_quran_translation_lang');
      if (savedLang) setTranslationLang(savedLang as any);

      const savedAudioMode = await AsyncStorage.getItem('ummati_quran_audio_mode');
      if (savedAudioMode) setAudioMode(savedAudioMode as any);

      const savedRate = await AsyncStorage.getItem('ummati_quran_playback_rate');
      if (savedRate) setPlaybackRateState(parseFloat(savedRate));

      const savedReciterId = await AsyncStorage.getItem('ummati_quran_reciter_id');
      if (savedReciterId) setSelectedReciter(getReciterById(savedReciterId));
    } catch (e) {
      console.warn('Error loading config:', e);
    }
  }, [currentSurahNumber, currentJuzNumber]);

  const saveConfig = async (key: string, val: string) => {
    try {
      await AsyncStorage.setItem(key, val);
    } catch (e) {
      console.warn('Failed to save config:', e);
    }
  };

  const saveLastReadPosition = useCallback(async (ayah: Ayah) => {
    try {
      setLastReadAyah(ayah.numberInSurah);
      
      const lastReadKey = currentJuzNumber !== undefined
        ? `ummati_last_read_juz_${currentJuzNumber}`
        : `ummati_last_read_surah_${currentSurahNumber}`;
      await AsyncStorage.setItem(lastReadKey, ayah.numberInSurah.toString());

      // Save global last read info
      const globalLastRead = currentJuzNumber !== undefined ? {
        readingType: 'juz',
        juzNumber: currentJuzNumber,
        juzName: currentJuzName || JUZ_NAMES[currentJuzNumber - 1],
        ayahNumber: ayah.numberInSurah,
        surahName: ayah.surahName || currentSurahName,
      } : {
        readingType: 'surah',
        surahNumber: currentSurahNumber,
        surahName: currentSurahName,
        translationName: currentTranslationName,
        ayahNumber: ayah.numberInSurah,
      };
      await AsyncStorage.setItem('ummati_global_last_read', JSON.stringify(globalLastRead));
      const surahForSync = ayah.surahNumber || currentSurahNumber;
      if (surahForSync) saveLastRead(surahForSync, ayah.numberInSurah);
    } catch (e) {
      console.warn('Failed to save last read position locally:', e);
    }
  }, [currentJuzNumber, currentSurahNumber, currentJuzName, currentSurahName, currentTranslationName]);

  const handleBookmarkAyah = async (ayah: Ayah) => {
    const isBookmarked = !!bookmarkedAyahs[ayah.number];
    const updated = {
      ...bookmarkedAyahs,
      [ayah.number]: !isBookmarked,
    };

    setBookmarkedAyahs(updated);
    await AsyncStorage.setItem('ummati_saved_bookmarks', JSON.stringify(updated));

    await saveLastReadPosition(ayah);

    if (!isBookmarked) {
      incrementActivity('quran', { bookmarks: 1 });
      awardXp(5, 'quran_bookmark');
    }
  };

  const getAyahAudioUrl = useCallback((ayah: Ayah, mode: 'ar' | 'hi' = 'ar') => {
    const sNum = ayah.surahNumber || currentSurahNumber || 1;
    const aNum = ayah.numberInSurah;
    return buildAyahAudioUrl(sNum, aNum, selectedReciter.folder, mode);
  }, [currentSurahNumber, selectedReciter.folder]);

  const handleSelectReciter = useCallback((reciter: Reciter) => {
    haptic.select();
    setSelectedReciter(reciter);
    saveConfig('ummati_quran_reciter_id', reciter.id);
    setShowReciterModal(false);
    if (playingAyahId !== null && isPlaying) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`window.playAyahById(${playingAyahId});`);
      }, 350);
    }
  }, [playingAyahId, isPlaying]);

  const playSpecificAyah = useCallback((ayah: Ayah) => {
    setPlayingAyahId(ayah.number);
    setIsPlaying(true);
    webViewRef.current?.injectJavaScript(`window.playAyahById(${ayah.number});`);
    saveLastReadPosition(ayah);
  }, [saveLastReadPosition]);

  const playNextAyah = () => {
    if (ayahs.length === 0) return;
    let nextIdx = 0;
    if (playingAyahId !== null) {
      const currentIdx = ayahs.findIndex(a => a.number === playingAyahId);
      if (currentIdx !== -1 && currentIdx < ayahs.length - 1) {
        nextIdx = currentIdx + 1;
      } else {
        return;
      }
    }
    playSpecificAyah(ayahs[nextIdx]);
  };

  const playPrevAyah = () => {
    if (ayahs.length === 0) return;
    let prevIdx = 0;
    if (playingAyahId !== null) {
      const currentIdx = ayahs.findIndex(a => a.number === playingAyahId);
      if (currentIdx > 0) {
        prevIdx = currentIdx - 1;
      } else {
        return;
      }
    }
    playSpecificAyah(ayahs[prevIdx]);
  };

  // Sync playlist to WebView when ayahs load/change
  useEffect(() => {
    if (ayahs.length > 0) {
      const list: Array<{ id: number; url: string }> = [];
      ayahs.forEach(a => {
        if (audioMode === 'arabic' || audioMode === 'both') {
          list.push({ id: a.number, url: getAyahAudioUrl(a, 'ar') });
        }
        if (audioMode === 'hindi' || audioMode === 'both') {
          list.push({ id: a.number, url: getAyahAudioUrl(a, 'hi') });
        }
      });
      const listJson = JSON.stringify(list);
      const injectScript = `window.setPlaylist('${listJson.replace(/'/g, "\\'")}'); window.setPlaybackRate(${playbackRate});`;
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(injectScript);
      }, 800); // Allow WebView a moment to be ready
    }
  }, [ayahs, audioMode, getAyahAudioUrl, playbackRate]);

  // Sync playback rate to WebView when it changes
  useEffect(() => {
    webViewRef.current?.injectJavaScript(`window.setPlaybackRate(${playbackRate});`);
  }, [playbackRate]);

  // Audio Player Injection Helpers
  const playAudio = useCallback(() => {
    if (playingAyahId !== null) {
      webViewRef.current?.injectJavaScript(`window.resumeAudio();`);
      setIsPlaying(true);
    } else if (ayahs.length > 0) {
      playSpecificAyah(ayahs[0]);
    }
  }, [playingAyahId, ayahs, playSpecificAyah]);

  const pauseAudio = useCallback(() => {
    webViewRef.current?.injectJavaScript(`window.pauseAudio();`);
    setIsPlaying(false);
  }, []);

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const audioPlayerHTML = `
    <html>
      <body>
        <audio id="audio-player"></audio>
        <script>
          const player = document.getElementById("audio-player");
          window.playlist = [];
          window.currentIndex = 0;
          window.playbackRate = 1.15;

          const applyRate = () => {
            player.playbackRate = window.playbackRate;
          };
          player.onplay = applyRate;
          player.onplaying = applyRate;

          player.onended = () => {
            if (window.playlist.length > 0 && window.currentIndex < window.playlist.length - 1) {
              window.currentIndex++;
              const nextTrack = window.playlist[window.currentIndex];
              player.pause();
              player.src = nextTrack.url;
              player.load();
              applyRate();
              player.play().then(() => {
                applyRate();
                window.ReactNativeWebView.postMessage("playing:" + nextTrack.id);
              }).catch(err => {
                window.ReactNativeWebView.postMessage("error:autoplay_blocked");
              });
            } else {
              window.ReactNativeWebView.postMessage("ended");
            }
          };

          player.onerror = () => {
            window.ReactNativeWebView.postMessage("error");
          };

          let lastTimeSent = 0;
          player.ontimeupdate = () => {
            if (player.duration) {
              const now = Date.now();
              if (now - lastTimeSent > 150) {
                lastTimeSent = now;
                const pct = player.currentTime / player.duration;
                const track = window.playlist[window.currentIndex];
                if (track) {
                  window.ReactNativeWebView.postMessage("progress:" + track.id + ":" + pct);
                }
              }
            }
          };

          window.setPlaylist = (listJson) => {
            window.playlist = JSON.parse(listJson);
          };

          window.setPlaybackRate = (rate) => {
            window.playbackRate = parseFloat(rate);
            applyRate();
          };

          window.playAyahById = (id) => {
            const idx = window.playlist.findIndex(t => t.id === id);
            if (idx !== -1) {
              window.currentIndex = idx;
              const track = window.playlist[idx];
              player.pause();
              player.src = track.url;
              player.load();
              applyRate();
              player.play().then(() => {
                applyRate();
              }).catch(err => {
                window.ReactNativeWebView.postMessage("error:" + err.message);
              });
            }
          };

          window.pauseAudio = () => {
            player.pause();
          };

          window.resumeAudio = () => {
            applyRate();
            player.play().then(() => {
              applyRate();
            }).catch(err => {
              window.ReactNativeWebView.postMessage("error:" + err.message);
            });
          };
        </script>
      </body>
    </html>
  `;

  // Consecutive Navigation Boundaries
  const loadAdjacentBoundary = (delta: number) => {
    if (currentJuzNumber !== undefined) {
      const nextNumber = currentJuzNumber + delta;
      if (nextNumber >= 1 && nextNumber <= 30) {
        pauseAudio();
        setCurrentJuzNumber(nextNumber);
        setCurrentJuzName(JUZ_NAMES[nextNumber - 1]);
        setLoading(true);
        setOpenAtEnd(delta === -1);
      }
    } else if (currentSurahNumber !== undefined) {
      const nextNumber = currentSurahNumber + delta;
      if (nextNumber >= 1 && nextNumber <= 114) {
        pauseAudio();
        setCurrentSurahNumber(nextNumber);
        setLoading(true);
        setOpenAtEnd(delta === -1);
      }
    }
  };

  useEffect(() => {
    loadContent();
    loadSettingsAndBookmarks();
  }, [currentSurahNumber, currentJuzNumber, loadContent, loadSettingsAndBookmarks]);

  // Cleanup audio on screen unmount
  useEffect(() => {
    const currentWebView = webViewRef.current;
    return () => {
      const script = `document.getElementById("audio-player").pause();`;
      currentWebView?.injectJavaScript(script);
    };
  }, []);

  // Auto-scroll to the playing Ayah (book mode turns its own pages)
  useEffect(() => {
    if (playingAyahId === null || ayahs.length === 0) return;

    const activeIdx = ayahs.findIndex(a => a.number === playingAyahId);
    if (activeIdx === -1) return;

    if (readingMode === 'scroll') {
      try {
        flatListRef.current?.scrollToIndex({
          index: activeIdx,
          animated: true,
          viewPosition: 0.3 // Positions the active Ayah slightly above screen center
        });
      } catch {
        // catch scroll failed, handled by onScrollToIndexFailed
      }
    }
  }, [playingAyahId, readingMode, ayahs]);

  const activeTheme = themes[theme];
  const activeSizes = fontSizes[textSize];

  // Stable callbacks for memoised children; they always call the latest handlers
  const actions = useRef({ play: playSpecificAyah, bookmark: handleBookmarkAyah, save: saveLastReadPosition, adjacent: loadAdjacentBoundary });
  actions.current = { play: playSpecificAyah, bookmark: handleBookmarkAyah, save: saveLastReadPosition, adjacent: loadAdjacentBoundary };
  const onAyahPress = useCallback((a: Ayah) => actions.current.play(a), []);
  const onAyahBookmark = useCallback((a: Ayah) => actions.current.bookmark(a), []);
  const onAyahShare = useCallback((a: Ayah) => {
    const surah = a.surahName ?? currentSurahName;
    const num = a.surahNumber ?? currentSurahNumber;
    navigation.navigate('ComposePost', {
      category: 'discuss',
      attachment: { type: 'ayah', arabic: a.textAr, translation: a.textEn, ref: `${surah ?? 'Surah'} ${num ?? ''}:${a.numberInSurah}`.replace(' :', ':') },
    });
  }, [navigation, currentSurahName, currentSurahNumber]);
  const onBookPageSettled = useCallback((a: Ayah) => { actions.current.save(a); }, []);
  const onNextSection = useCallback(() => actions.current.adjacent(1), []);
  const onPrevSection = useCallback(() => actions.current.adjacent(-1), []);

  const playingPct = playingProgress && playingProgress.ayahId === playingAyahId ? playingProgress.pct : 0;

  const renderAyahRow = useCallback(({ item, index }: { item: Ayah; index: number }) => {
    // Show Surah header inline when Surah shifts (or at index 0)
    const showSurahHeader = index === 0 || (item.surahNumber !== undefined && item.surahNumber !== ayahs[index - 1]?.surahNumber);
    const isPlayingCurrent = playingAyahId === item.number;
    return (
      <AyahCard
        item={item}
        index={index}
        showSurahHeader={showSurahHeader}
        isBookmarked={!!bookmarkedAyahs[item.number]}
        isLastRead={lastReadAyah === item.numberInSurah}
        isPlaying={isPlayingCurrent}
        progressPct={isPlayingCurrent ? playingPct : 0}
        readingTheme={theme}
        textSize={textSize}
        fallbackSurahNumber={currentSurahNumber}
        fallbackSurahName={currentSurahName}
        onPress={onAyahPress}
        onBookmark={onAyahBookmark}
        onShare={onAyahShare}
      />
    );
  }, [ayahs, playingAyahId, playingPct, bookmarkedAyahs, lastReadAyah, theme, textSize, currentSurahNumber, currentSurahName, onAyahPress, onAyahBookmark, onAyahShare]);

  // Book mode resumes at the last-read ayah (surah mode only: juz bookmarks store just the in-surah number)
  const bookStartAyah = currentJuzNumber === undefined && lastReadAyah !== null
    ? ayahs.find(a => a.numberInSurah === lastReadAyah)?.number ?? null
    : null;

  // Header Titles
  const displayTitle = currentJuzNumber !== undefined
    ? `Para ${currentJuzNumber}`
    : currentSurahName;
  const displaySubtitle = currentJuzNumber !== undefined
    ? `Juz ${currentJuzName || JUZ_NAMES[currentJuzNumber - 1]}`
    : currentTranslationName;

  const currentPlayingAyahObj = ayahs.find(a => a.number === playingAyahId);
  const audioTitleText = currentPlayingAyahObj
    ? `Ayah ${currentPlayingAyahObj.numberInSurah} of ${currentPlayingAyahObj.surahName || currentSurahName}`
    : 'Surah Recitation';
  const audioPct = playingPct;

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.bg }]}>
      {/* Header */}
      <ScreenHeader
        title={displayTitle || 'Quran'}
        subtitle={displaySubtitle}
        onBack={() => navigation.goBack()}
        style={styles.headerCompact}
        right={(
          <>
            {/* Layout Toggle */}
            <HeaderButton
              onPress={() => {
                const nextMode = readingMode === 'scroll' ? 'page' : 'scroll';
                setReadingMode(nextMode);
                saveConfig('ummati_quran_reading_mode', nextMode);
              }}
            >
              {readingMode === 'scroll' ? (
                <BookOpen color={colors.onSky} size={20} />
              ) : (
                <AlignLeft color={colors.onSky} size={20} />
              )}
            </HeaderButton>

            {/* Settings Toggle */}
            <HeaderButton onPress={() => setShowSettings(!showSettings)}>
              <Settings2 color={colors.onSky} size={20} />
            </HeaderButton>
          </>
        )}
      >
        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.headerChips}>
          <View style={[styles.headerChip, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.headerChipText, { color: colors.onSky }]}>
              {currentJuzNumber !== undefined ? `Para ${currentJuzNumber} of 30` : `Surah ${currentSurahNumber ?? ''} of 114`}
            </Text>
          </View>
          {ayahs.length > 0 && !loading ? (
            <View style={[styles.headerChip, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.headerChipText, { color: colors.onSky }]}>{ayahs.length} Ayahs</Text>
            </View>
          ) : null}
          {lastReadAyah !== null ? (
            <View style={[styles.headerChip, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Bookmark color={colors.onSky} size={11} />
              <Text style={[styles.headerChipText, { color: colors.onSky }]}>Verse {lastReadAyah}</Text>
            </View>
          ) : null}
          {isOfflineFallback ? (
            <View style={[styles.headerChip, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
              <WifiOff color={colors.ink} size={11} strokeWidth={2.5} />
              <Text style={[styles.headerChipText, { color: colors.ink }]}>Offline Mode</Text>
            </View>
          ) : null}
        </Animated.View>
      </ScreenHeader>

      {/* Hidden Webview for Reciter Audio */}
      <View style={styles.hiddenWebView}>
        <WebView<{}>
          ref={webViewRef}
          source={{ html: audioPlayerHTML }}
          onMessage={(event: any) => {
            const msg = event.nativeEvent.data;
            if (msg === 'ended') {
              setIsPlaying(false);
              setPlayingAyahId(null);
              setPlayingProgress(null);
            } else if (msg.startsWith('playing:')) {
              const id = parseInt(msg.split(':')[1], 10);
              setPlayingAyahId(id);
              setIsPlaying(true);
              setPlayingProgress({ ayahId: id, pct: 0 });
            } else if (msg.startsWith('progress:')) {
              const parts = msg.split(':');
              const id = parseInt(parts[1], 10);
              const pct = parseFloat(parts[2]);
              setPlayingProgress({ ayahId: id, pct: pct });
            } else if (msg === 'error') {
              setIsPlaying(false);
              setPlayingProgress(null);
              Alert.alert('Audio Error', 'Failed to stream recitation. Check connection.');
            }
          }}
          onLoadEnd={() => {
            if (ayahs.length > 0) {
              const list: Array<{ id: number; url: string }> = [];
              ayahs.forEach(a => {
                if (audioMode === 'arabic' || audioMode === 'both') {
                  list.push({ id: a.number, url: getAyahAudioUrl(a, 'ar') });
                }
                if (audioMode === 'hindi' || audioMode === 'both') {
                  list.push({ id: a.number, url: getAyahAudioUrl(a, 'hi') });
                }
              });
              const listJson = JSON.stringify(list);
              webViewRef.current?.injectJavaScript(`window.setPlaylist('${listJson.replace(/'/g, "\\'")}'); window.setPlaybackRate(${playbackRate});`);
            }
          }}
          javaScriptEnabled
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>

      {/* Slide-up Bottom Sheet Settings Panel */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(180)}
            style={[styles.bottomSheet, { backgroundColor: colors.surface, borderColor: colors.ink, paddingBottom: insets.bottom + 20 }]}
          >
            {/* Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: colors.ink }]} />

            <View style={styles.bottomSheetHeader}>
              <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Reading Settings</Text>
              <Text style={[styles.bottomSheetSubtitle, { color: colors.textMuted }]}>Display & recitation preferences</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Theme Row */}
              <SettingGroup icon={<PaletteIcon color={colors.text} size={15} strokeWidth={2.4} />} label="Reading Theme">
                {(['light', 'sepia', 'dark'] as const).map((t) => (
                  <OptionPill
                    key={t}
                    active={theme === t}
                    label={t.charAt(0).toUpperCase() + t.slice(1)}
                    swatch={themes[t].cardBg}
                    onPress={() => {
                      setTheme(t);
                      saveConfig('ummati_quran_theme', t);
                    }}
                  />
                ))}
              </SettingGroup>

              {/* Text Size Row */}
              <SettingGroup icon={<Type color={colors.text} size={15} strokeWidth={2.4} />} label="Text Size">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <OptionPill
                    key={s}
                    active={textSize === s}
                    label={s.charAt(0).toUpperCase() + s.slice(1)}
                    onPress={() => {
                      setTextSize(s);
                      saveConfig('ummati_quran_text_size', s);
                    }}
                  />
                ))}
              </SettingGroup>

              {/* Translation Lang Row */}
              <SettingGroup icon={<Languages color={colors.text} size={15} strokeWidth={2.4} />} label="Translation">
                {(['english', 'hindi'] as const).map((lang) => (
                  <OptionPill
                    key={lang}
                    active={translationLang === lang}
                    label={lang === 'english' ? 'English' : 'Hindi'}
                    onPress={() => {
                      setTranslationLang(lang);
                      saveConfig('ummati_quran_translation_lang', lang);
                    }}
                  />
                ))}
              </SettingGroup>

              {/* Audio Recitation Mode Row */}
              <SettingGroup icon={<Headphones color={colors.text} size={15} strokeWidth={2.4} />} label="Audio Recitation">
                {(['arabic', 'hindi', 'both'] as const).map((mode) => (
                  <OptionPill
                    key={mode}
                    active={audioMode === mode}
                    label={mode === 'arabic' ? 'Arabic' : mode === 'hindi' ? 'Hindi Meaning' : 'Arabic + Hindi'}
                    onPress={() => {
                      setAudioMode(mode);
                      saveConfig('ummati_quran_audio_mode', mode);
                    }}
                  />
                ))}
              </SettingGroup>

              {/* Reciter (Qari) Selection Row */}
              <SettingGroup icon={<Mic color={colors.text} size={15} strokeWidth={2.4} />} label="Reciter (Qari)">
                <PressableScale
                  style={[styles.reciterPickerBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}
                  onPress={() => {
                    setShowSettings(false);
                    setTimeout(() => setShowReciterModal(true), 200);
                  }}
                >
                  <View style={styles.reciterPickerContent}>
                    <View style={styles.reciterPickerLeft}>
                      <Text style={[styles.reciterCurrentName, { color: colors.text }]} numberOfLines={1}>
                        {selectedReciter.name}
                      </Text>
                      <Text style={[styles.reciterCurrentSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {selectedReciter.subname} • {selectedReciter.style}
                      </Text>
                    </View>
                    <View style={[styles.changeReciterBadge, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
                      <Text style={[styles.changeReciterText, { color: colors.ink }]}>Change</Text>
                      <ChevronRight color={colors.ink} size={13} strokeWidth={2.8} />
                    </View>
                  </View>
                </PressableScale>
              </SettingGroup>

              {/* Playback Speed Row */}
              <SettingGroup icon={<Gauge color={colors.text} size={15} strokeWidth={2.4} />} label="Recitation Speed">
                {([1.0, 1.15, 1.25, 1.5] as const).map((rate) => (
                  <OptionPill
                    key={rate}
                    active={playbackRate === rate}
                    label={rate === 1.0 ? 'Normal' : `${rate}x`}
                    onPress={() => {
                      setPlaybackRateState(rate);
                      saveConfig('ummati_quran_playback_rate', rate.toString());
                    }}
                  />
                ))}
              </SettingGroup>
            </ScrollView>

            {/* Close Button */}
            <BrutalPressable
              fill={colors.primary}
              style={styles.doneBtn}
              onPress={() => setShowSettings(false)}
            >
              <Check color={colors.onPrimary} size={18} strokeWidth={3} />
              <Text style={[styles.doneBtnText, { color: colors.onPrimary }]}>Done</Text>
            </BrutalPressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Reciter Selector Bottom Sheet Modal */}
      <Modal
        visible={showReciterModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowReciterModal(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowReciterModal(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(180)}
            style={[styles.reciterSheet, { backgroundColor: colors.surface, borderColor: colors.ink, paddingBottom: insets.bottom + 16 }]}
          >
            {/* Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: colors.ink }]} />

            <View style={styles.reciterSheetHeader}>
              <View style={styles.reciterSheetTitleGroup}>
                <View style={[styles.reciterHeaderBadge, { backgroundColor: colors.primarySoft, borderColor: colors.ink }]}>
                  <Mic color={colors.text} size={18} strokeWidth={2.5} />
                </View>
                <View style={styles.reciterHeaderTexts}>
                  <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Quran Reciter</Text>
                  <Text style={[styles.bottomSheetSubtitle, { color: colors.textMuted }]}>Choose authentic Qari for audio playback</Text>
                </View>
              </View>
              <PressableScale
                onPress={() => setShowReciterModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}
              >
                <X color={colors.text} size={16} strokeWidth={2.5} />
              </PressableScale>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.recitersListContent}
            >
              {QURAN_RECITERS.map((r) => {
                const isSelected = selectedReciter.id === r.id;
                return (
                  <BrutalPressable
                    key={r.id}
                    fill={isSelected ? colors.accentSoft : colors.surfaceAlt}
                    radius={16}
                    offset={isSelected ? brutal.shadowSmall : 2}
                    borderWidth={brutal.borderThin}
                    style={styles.reciterItemCard}
                    onPress={() => handleSelectReciter(r)}
                  >
                    <View style={styles.reciterCardRow}>
                      <View style={styles.reciterCardInfo}>
                        <View style={styles.reciterNameRow}>
                          <Text style={[styles.reciterCardName, { color: colors.text }]} numberOfLines={1}>
                            {r.name}
                          </Text>
                        </View>
                        <Text style={[styles.reciterCardArabic, { color: colors.textSecondary }]}>
                          {r.arabicName}
                        </Text>
                        <View style={styles.reciterMetaPills}>
                          <View style={[styles.miniPill, { backgroundColor: r.style === 'Mujawwad' ? colors.accentSoft : colors.primarySoft, borderColor: colors.ink }]}>
                            <Text style={[styles.miniPillText, { color: colors.text }]}>{r.style}</Text>
                          </View>
                          <View style={[styles.miniPill, { backgroundColor: colors.surface, borderColor: colors.ink }]}>
                            <Text style={[styles.miniPillText, { color: colors.textMuted }]}>{r.bitrate}</Text>
                          </View>
                          <Text style={[styles.reciterCountryText, { color: colors.textMuted }]} numberOfLines={1}>
                            {r.subname}
                          </Text>
                        </View>
                      </View>

                      <View style={[
                        styles.radioIndicator,
                        { borderColor: colors.ink, backgroundColor: isSelected ? colors.primary : colors.surface }
                      ]}>
                        {isSelected && <Check color={colors.onPrimary} size={14} strokeWidth={3} />}
                      </View>
                    </View>
                  </BrutalPressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Loader / Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <Animated.View entering={ZoomIn} style={[styles.stateIcon, { backgroundColor: colors.primarySoft, borderColor: colors.ink }]}>
            <ActivityIndicator size="large" color={colors.text} />
          </Animated.View>
          <Text style={[styles.loadingText, { color: activeTheme.textSecondary }]}>Fetching verses...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <Card style={styles.errorCard}>
            <View style={[styles.stateIcon, styles.errorIcon, { borderColor: colors.ink }]}>
              <AlertCircle color={STICKER_INK} size={30} strokeWidth={2.4} />
            </View>
            <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
            <BrutalPressable fill={colors.primary} radius={14} offset={brutal.shadowSmall} style={styles.retryBtn} onPress={loadContent}>
              <RefreshCw color={colors.onPrimary} size={15} strokeWidth={2.6} />
              <Text style={[styles.retryBtnText, { color: colors.onPrimary }]}>Retry</Text>
            </BrutalPressable>
            {currentSurahNumber !== 1 && (
              <BrutalPressable
                fill={colors.accent}
                radius={14}
                offset={brutal.shadowSmall}
                style={[styles.retryBtn, { marginTop: 8 }]}
                onPress={() => {
                  setCurrentSurahNumber(1);
                  setCurrentJuzNumber(undefined);
                }}
              >
                <BookOpen color={colors.ink} size={15} strokeWidth={2.6} />
                <Text style={[styles.retryBtnText, { color: colors.ink }]}>Read Al-Fatihah (Offline)</Text>
              </BrutalPressable>
            )}
          </Card>
        </View>
      ) : readingMode === 'scroll' ? (
        // VERTICAL SCROLL MODE
        <View style={styles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={ayahs}
            renderItem={renderAyahRow}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
              }, 100);
            }}
          />
        </View>
      ) : (
        // BOOK MODE: Mushaf-style pages, swipe right-to-left like a printed Quran
        <MushafBook
          key={`${currentJuzNumber ?? 's'}-${currentSurahNumber}`}
          ayahs={ayahs}
          theme={activeTheme}
          fontSize={activeSizes.arabic + 2}
          ink={colors.ink}
          fallbackSurahNumber={currentSurahNumber}
          fallbackSurahName={currentSurahName}
          contextLabel={currentJuzNumber !== undefined ? `Para ${currentJuzNumber}` : `Surah ${currentSurahNumber ?? ''}`}
          playingAyahId={playingAyahId}
          initialAyahNumber={bookStartAyah}
          openAtEnd={openAtEnd}
          bottomInset={insets.bottom + 96}
          hasNextSection={currentJuzNumber !== undefined ? currentJuzNumber < 30 : (currentSurahNumber ?? 114) < 114}
          hasPrevSection={currentJuzNumber !== undefined ? currentJuzNumber > 1 : (currentSurahNumber ?? 1) > 1}
          onAyahPress={onAyahPress}
          onPageSettled={onBookPageSettled}
          onNextSection={onNextSection}
          onPrevSection={onPrevSection}
        />
      )}

      {/* Bottom Audio Controller */}
      {!loading && !errorMsg && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(450)}
          style={[styles.audioController, { bottom: insets.bottom + 12 }]}
        >
          <BrutalBox radius={24} style={styles.audioCard}>
          <View style={styles.audioRow}>
            <View style={styles.audioInfo}>
              <View style={[styles.audioIconTile, { backgroundColor: colors.accentSoft, borderColor: colors.ink }]}>
                {isPlaying ? <AudioLines color={colors.text} size={20} strokeWidth={2.4} /> : <Headphones color={colors.text} size={20} strokeWidth={2.4} />}
              </View>
              <View style={styles.audioTextMeta}>
                <Text style={[styles.audioTitle, { color: colors.text }]} numberOfLines={1}>{audioTitleText}</Text>
                <Pressable
                  onPress={() => setShowReciterModal(true)}
                  hitSlop={8}
                  style={styles.audioArtistTouch}
                >
                  <Text style={[styles.audioArtist, { color: colors.textMuted }]} numberOfLines={1}>
                    {selectedReciter.name}
                  </Text>
                  <ChevronRight color={colors.textMuted} size={11} strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>

            <View style={styles.audioControlsGroup}>
              {/* Skip Back */}
              <BrutalPressable fill={colors.surfaceAlt} radius={12} offset={2} borderWidth={brutal.borderThin} style={styles.skipBtn} onPress={playPrevAyah}>
                <SkipBack color={colors.text} size={16} fill={colors.text} />
              </BrutalPressable>

              {/* Play / Pause */}
              <BrutalPressable fill={colors.primary} radius={16} offset={brutal.shadowSmall} style={styles.playBtn} onPress={toggleAudio}>
                {isPlaying ? (
                  <Pause color={colors.onPrimary} size={20} fill={colors.onPrimary} />
                ) : (
                  <Play color={colors.onPrimary} size={20} fill={colors.onPrimary} style={styles.playIconOffset} />
                )}
              </BrutalPressable>

              {/* Skip Forward */}
              <BrutalPressable fill={colors.surfaceAlt} radius={12} offset={2} borderWidth={brutal.borderThin} style={styles.skipBtn} onPress={playNextAyah}>
                <SkipForward color={colors.text} size={16} fill={colors.text} />
              </BrutalPressable>
            </View>
          </View>
          {playingAyahId !== null && (
            <View style={styles.audioProgress}>
              <ProgressBar value={audioPct} color={colors.accent} track={colors.surfaceAlt} height={4} />
            </View>
          )}
          </BrutalBox>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCompact: { minHeight: 0, paddingBottom: 18 },
  headerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: brutal.borderThin,
  },
  headerChipText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

  // Settings sheet
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
    borderWidth: brutal.border,
    borderBottomWidth: 0,
  },
  dragHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  bottomSheetHeader: { marginBottom: 8 },
  bottomSheetTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  bottomSheetSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  settingGroup: { marginTop: 16 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  settingIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  settingLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  optionsRow: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16, borderWidth: brutal.borderThin },
  optionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: brutal.borderThin,
    borderColor: 'transparent',
  },
  optionPillText: { fontSize: 13, fontWeight: '800' },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  doneBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  doneBtnText: { fontWeight: '900', fontSize: 16 },

  // States
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  stateIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  errorIcon: { backgroundColor: '#F6D3CE' },
  loadingText: { fontSize: 15, fontWeight: '700' },
  errorCard: { alignItems: 'center', gap: 14, paddingVertical: 28, alignSelf: 'stretch' },
  errorText: { textAlign: 'center', fontSize: 15, fontWeight: '600', lineHeight: 21 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 14 },
  retryBtnText: { fontWeight: '900', fontSize: 14 },

  // Reading surface
  contentContainer: { flex: 1 },
  listContainer: { paddingHorizontal: 16, paddingTop: 8 },
  ayahWrap: { marginBottom: 12 },
  surahBannerWrap: { marginTop: 12, marginBottom: 18, marginRight: brutal.shadow },
  surahHeaderBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  bannerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: brutal.borderThin,
    marginBottom: 10,
  },
  bannerChipText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  surahHeaderNameAr: { fontSize: 30, fontWeight: 'bold', fontFamily: 'Georgia', lineHeight: 48, textAlign: 'center' },
  surahHeaderNameEng: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  bannerDivider: { width: 60, height: 3, borderRadius: 2, marginVertical: 14 },
  surahHeaderBismillah: { fontSize: 24, fontFamily: 'Georgia', lineHeight: 42, textAlign: 'center' },
  // Right margin leaves room for the hard shadow inside the list's padding
  ayahContainer: { padding: 18, marginRight: brutal.shadow },
  ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ayahHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  ayahRef: { fontSize: 12, fontWeight: '800', flexShrink: 1 },
  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: brutal.borderThin },
  stateChipText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: brutal.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArabic: { fontFamily: 'Georgia', textAlign: 'right', writingDirection: 'rtl', letterSpacing: 0.5 },
  ayahDivider: { height: 2, borderRadius: 1, marginVertical: 14 },
  textEnglish: { textAlign: 'left', fontWeight: '500' },

  // Audio controller
  audioController: { position: 'absolute', left: 16, right: 16 + brutal.shadow },
  audioCard: { paddingHorizontal: 12, paddingVertical: 10 },
  audioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audioInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  audioIconTile: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  audioTextMeta: { gap: 2, flex: 1 },
  audioTitle: { fontSize: 14, fontWeight: '900' },
  audioArtist: { fontSize: 11, fontWeight: '700' },
  audioControlsGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skipBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  playIconOffset: { marginLeft: 2 },
  audioProgress: { marginTop: 10, marginHorizontal: 4 },
  hiddenWebView: { width: 0, height: 0, position: 'absolute', opacity: 0 },
  starContainer: { justifyContent: 'center', alignItems: 'center' },
  starSquare: { position: 'absolute', borderRadius: 6 },
  starText: { fontWeight: '900', textAlign: 'center' },

  // Reciter Picker styles
  reciterPickerBar: {
    borderRadius: 16,
    borderWidth: brutal.borderThin,
    padding: 12,
  },
  reciterPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reciterPickerLeft: { flex: 1, gap: 2 },
  reciterCurrentName: { fontSize: 14, fontWeight: '900' },
  reciterCurrentSub: { fontSize: 11, fontWeight: '700' },
  changeReciterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: brutal.borderThin,
  },
  changeReciterText: { fontSize: 11, fontWeight: '900' },
  audioArtistTouch: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reciterSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
    borderWidth: brutal.border,
    borderBottomWidth: 0,
  },
  reciterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  reciterSheetTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  reciterHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: brutal.borderThin,
  },
  reciterHeaderTexts: { flex: 1 },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: brutal.borderThin,
  },
  recitersListContent: { paddingBottom: 16, gap: 10 },
  reciterItemCard: { padding: 12, borderRadius: 16 },
  reciterCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reciterCardInfo: { flex: 1, marginRight: 12, gap: 3 },
  reciterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reciterCardName: { fontSize: 15, fontWeight: '900' },
  reciterCardArabic: { fontSize: 15, fontFamily: 'Georgia', writingDirection: 'rtl' },
  reciterMetaPills: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  miniPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: brutal.borderThin,
  },
  miniPillText: { fontSize: 10, fontWeight: '900' },
  reciterCountryText: { fontSize: 11, fontWeight: '600' },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: brutal.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
