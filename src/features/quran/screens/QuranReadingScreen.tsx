import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, Dimensions, NativeSyntheticEvent, NativeScrollEvent, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Play, Pause, Bookmark, BookmarkCheck, Volume2, AlertCircle, Settings, BookOpen, AlignLeft, ChevronLeft, ChevronRight, SkipForward, SkipBack } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Path } from 'react-native-svg';

interface Ayah {
  number: number;
  numberInSurah: number;
  textAr: string;
  textEn: string;
  surahName?: string;
  surahNumber?: number;
}

type ScreenRouteProp = RouteProp<RootStackParamList, 'QuranReading'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const themes = {
  light: {
    bg: '#F6F9F8',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
  },
  sepia: {
    bg: '#F4ECE1',
    cardBg: '#FCF8F2',
    text: '#433422',
    textSecondary: '#6E5D4F',
    border: '#E3D7C5',
  },
  dark: {
    bg: '#0F172A',
    cardBg: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
  },
};

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

export function QuranReadingScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  useScreenTime('QuranReading');
  
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

  // Bookmarks & Last Read State
  const [lastReadAyah, setLastReadAyah] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<number, boolean>>({});

  // Paging State
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null);

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
          setLoading(false);
          return;
        }

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
          await AsyncStorage.setItem(cacheKey, JSON.stringify(merged));
        } else {
          setErrorMsg('Failed to parse Quranic translations.');
        }
      }
    } catch (e) {
      console.warn('Error loading content:', e);
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

  const saveLastReadPosition = async (ayah: Ayah) => {
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

      if (user) {
        await supabase
          .from('user_progress')
          .update({
            last_read_surah: currentJuzNumber !== undefined ? null : currentSurahNumber,
            last_read_ayah: ayah.numberInSurah,
            last_read_timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('Failed to save last read position:', e);
    }
  };

  const handleBookmarkAyah = async (ayah: Ayah) => {
    const isBookmarked = !!bookmarkedAyahs[ayah.number];
    const updated = {
      ...bookmarkedAyahs,
      [ayah.number]: !isBookmarked,
    };

    setBookmarkedAyahs(updated);
    await AsyncStorage.setItem('ummati_saved_bookmarks', JSON.stringify(updated));

    await saveLastReadPosition(ayah);

    if (user) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('user_activities').insert({
          user_id: user.id,
          activity_type: 'quran',
          activity_date: todayStr,
          details: {
            juz: currentJuzNumber,
            surah: currentSurahNumber || ayah.surahNumber,
            ayah: ayah.numberInSurah,
            action: 'bookmark_or_read'
          }
        });
      } catch (e) {
        console.warn('Failed to sync reading progression:', e);
      }
    }
  };

  const getAyahAudioUrl = useCallback((ayah: Ayah, mode: 'ar' | 'hi' = 'ar') => {
    const sNum = (ayah.surahNumber || currentSurahNumber || 1).toString().padStart(3, '0');
    const aNum = ayah.numberInSurah.toString().padStart(3, '0');
    if (mode === 'hi') {
      return `https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/${sNum}${aNum}.mp3`;
    }
    return `https://everyayah.com/data/Alafasy_128kbps/${sNum}${aNum}.mp3`;
  }, [currentSurahNumber]);

  const playSpecificAyah = useCallback((ayah: Ayah) => {
    setPlayingAyahId(ayah.number);
    setIsPlaying(true);
    webViewRef.current?.injectJavaScript(`window.playAyahById(${ayah.number});`);
    saveLastReadPosition(ayah);
  }, [currentJuzNumber, currentJuzName, currentSurahNumber, currentSurahName, currentTranslationName, user]);

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
        setCurrentPageIndex(0);
        if (delta === -1) {
          setPendingScrollIndex(-1); // flag for last page
        } else {
          setPendingScrollIndex(0); // flag for first page
        }
      }
    } else if (currentSurahNumber !== undefined) {
      const nextNumber = currentSurahNumber + delta;
      if (nextNumber >= 1 && nextNumber <= 114) {
        pauseAudio();
        setCurrentSurahNumber(nextNumber);
        setLoading(true);
        setCurrentPageIndex(0);
        if (delta === -1) {
          setPendingScrollIndex(-1);
        } else {
          setPendingScrollIndex(0);
        }
      }
    }
  };

  useEffect(() => {
    loadContent();
    loadSettingsAndBookmarks();
  }, [currentSurahNumber, currentJuzNumber, loadContent, loadSettingsAndBookmarks]);

  // Cleanup audio on screen unmount
  useEffect(() => {
    return () => {
      const script = `document.getElementById("audio-player").pause();`;
      webViewRef.current?.injectJavaScript(script);
    };
  }, []);

  // Adjust scroll after loading adjacent content
  useEffect(() => {
    if (!loading && ayahs.length > 0 && pendingScrollIndex !== null && readingMode === 'page') {
      const ayahsPerPage = 4;
      const targetIndex = pendingScrollIndex === -1 ? Math.ceil(ayahs.length / ayahsPerPage) - 1 : pendingScrollIndex;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
        setCurrentPageIndex(targetIndex);
        setPendingScrollIndex(null);
      }, 150);
    }
  }, [loading, ayahs, pendingScrollIndex, readingMode]);

  // Auto-scroll / Focus playing Ayah
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
      } catch (err) {
        // catch scroll failed, handled by onScrollToIndexFailed
      }
    } else {
      // Paged mode
      const ayahsPerPage = 4;
      const pageIndex = Math.floor(activeIdx / ayahsPerPage);
      const totalPages = Math.ceil(ayahs.length / ayahsPerPage);
      if (pageIndex >= 0 && pageIndex < totalPages && pageIndex !== currentPageIndex) {
        try {
          flatListRef.current?.scrollToIndex({
            index: pageIndex,
            animated: true
          });
          setCurrentPageIndex(pageIndex);
        } catch (err) {
          // catch scroll failed, handled by onScrollToIndexFailed
        }
      }
    }
  }, [playingAyahId, readingMode, ayahs, currentPageIndex]);

  const activeTheme = themes[theme];
  const activeSizes = fontSizes[textSize];

  const handlePageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setCurrentPageIndex(index);
  };

  const pageTurn = (direction: 'next' | 'prev') => {
    const ayahsPerPage = 4;
    const totalPages = Math.ceil(ayahs.length / ayahsPerPage);
    if (direction === 'next') {
      if (currentPageIndex < totalPages - 1) {
        flatListRef.current?.scrollToIndex({ index: currentPageIndex + 1, animated: true });
        setCurrentPageIndex(currentPageIndex + 1);
      } else {
        loadAdjacentBoundary(1); // load next chapter/juz
      }
    } else {
      if (currentPageIndex > 0) {
        flatListRef.current?.scrollToIndex({ index: currentPageIndex - 1, animated: true });
        setCurrentPageIndex(currentPageIndex - 1);
      } else {
        loadAdjacentBoundary(-1); // load prev chapter/juz
      }
    }
  };

  const renderAyahRow = ({ item, index }: { item: Ayah; index: number }) => {
    const isBookmarked = !!bookmarkedAyahs[item.number];
    const isLastRead = lastReadAyah === item.numberInSurah;
    const isPlayingCurrent = playingAyahId === item.number;

    const lastReadBgStyle = isLastRead ? (theme === 'dark' ? styles.lastReadDark : styles.lastReadLight) : null;
    const playingBgStyle = isPlayingCurrent
      ? { backgroundColor: theme === 'dark' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.04)', borderColor: '#D4AF37' }
      : null;
    const badgeColor = isPlayingCurrent ? '#D4AF37' : Theme.colors.primary;

    // Show Surah header inline when Surah shifts (or at index 0)
    const showSurahHeader = index === 0 || (item.surahNumber !== undefined && item.surahNumber !== ayahs[index - 1]?.surahNumber);

    return (
      <View style={{ marginBottom: 12 }}>
        {showSurahHeader && (
          <View style={[styles.surahHeaderBanner, { borderColor: activeTheme.border }]}>
            <SvgGradient colors={['#046C4E', '#0E9F6E']} />
            <Text style={styles.surahHeaderNameAr}>
              {item.surahName ? `سورة ${item.surahName}` : `سورة ${currentSurahName}`}
            </Text>
            <Text style={styles.surahHeaderNameEng}>
              Surah {item.surahName || currentSurahName}
            </Text>
            {item.surahNumber !== 9 && currentSurahNumber !== 9 && (
              <Text style={styles.surahHeaderBismillah}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={() => playSpecificAyah(item)}
          activeOpacity={0.9}
          style={[
            styles.ayahContainer,
            { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border },
            lastReadBgStyle,
            playingBgStyle
          ]}
        >
          <View style={styles.ayahHeader}>
            <RubElHizb number={item.numberInSurah} color={badgeColor} />

            <View style={styles.ayahActions}>
              {isLastRead ? <Text style={styles.lastReadLabel}>LAST READ</Text> : null}
              {isPlayingCurrent ? <Text style={[styles.lastReadLabel, { color: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>PLAYING</Text> : null}
              <TouchableOpacity onPress={() => handleBookmarkAyah(item)} style={styles.actionBtn}>
                {isBookmarked ? (
                  <BookmarkCheck color={Theme.colors.primary} size={20} />
                ) : (
                  <Bookmark color={activeTheme.textSecondary} size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[
            styles.textArabic, 
            { fontSize: activeSizes.arabic }
          ]}>
            {(() => {
              const words = item.textAr.split(' ');
              const activeWordIndex = isPlayingCurrent && playingProgress && playingProgress.ayahId === item.number
                ? Math.min(words.length - 1, Math.floor(playingProgress.pct * words.length))
                : -1;
              return words.map((word, idx) => {
                const isPast = isPlayingCurrent && idx < activeWordIndex;
                const isActive = isPlayingCurrent && idx === activeWordIndex;
                let wordColor = activeTheme.text;
                if (isActive) wordColor = '#F59E0B';
                else if (isPast) wordColor = '#D4AF37';
                
                return (
                  <Text key={idx} style={{ color: wordColor, fontWeight: isActive ? 'bold' : 'normal' }}>
                    {word}{' '}
                  </Text>
                );
              });
            })()}
          </Text>

          <Text style={[
            styles.textEnglish, 
            { fontSize: activeSizes.translation },
            isPlayingCurrent ? { color: theme === 'dark' ? '#E2E8F0' : '#B45309' } : { color: activeTheme.textSecondary }
          ]}>
            {item.textEn}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPageItem = ({ item }: { item: Ayah[] }) => {
    return (
      <View style={[styles.pageSlide, { width: SCREEN_WIDTH }]}>
        <ScrollView contentContainerStyle={styles.pageSlideScroll} showsVerticalScrollIndicator={false}>
          {item.map((ayah) => {
            const isBookmarked = !!bookmarkedAyahs[ayah.number];
            const isLastRead = lastReadAyah === ayah.numberInSurah;
            const isPlayingCurrent = playingAyahId === ayah.number;

            const lastReadBgStyle = isLastRead ? (theme === 'dark' ? styles.lastReadDark : styles.lastReadLight) : null;
            const playingBgStyle = isPlayingCurrent
              ? { backgroundColor: theme === 'dark' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.04)', borderColor: '#D4AF37' }
              : null;
            const badgeColor = isPlayingCurrent ? '#D4AF37' : Theme.colors.primary;

            // Show Surah header inline when Surah changes within paged block
            const showSurahHeader = ayah.numberInSurah === 1;

            return (
              <View key={ayah.number} style={{ marginBottom: 12 }}>
                {showSurahHeader && (
                  <View style={[styles.surahHeaderBanner, { borderColor: activeTheme.border }]}>
                    <SvgGradient colors={['#046C4E', '#0E9F6E']} />
                    <Text style={styles.surahHeaderNameAr}>
                      {ayah.surahName ? `سورة ${ayah.surahName}` : `سورة ${currentSurahName}`}
                    </Text>
                    <Text style={styles.surahHeaderNameEng}>
                      Surah {ayah.surahName || currentSurahName}
                    </Text>
                    {ayah.surahNumber !== 9 && currentSurahNumber !== 9 && (
                      <Text style={styles.surahHeaderBismillah}>
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => playSpecificAyah(ayah)}
                  activeOpacity={0.9}
                  style={[
                    styles.ayahContainerPaged,
                    { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border },
                    lastReadBgStyle,
                    playingBgStyle
                  ]}
                >
                  <View style={styles.ayahHeader}>
                    <RubElHizb number={ayah.numberInSurah} color={badgeColor} />
                    <View style={styles.ayahActions}>
                      {isLastRead ? <Text style={styles.lastReadLabel}>LAST READ</Text> : null}
                      {isPlayingCurrent ? <Text style={[styles.lastReadLabel, { color: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>PLAYING</Text> : null}
                      <TouchableOpacity onPress={() => handleBookmarkAyah(ayah)} style={styles.actionBtn}>
                        {isBookmarked ? (
                          <BookmarkCheck color={Theme.colors.primary} size={20} />
                        ) : (
                          <Bookmark color={activeTheme.textSecondary} size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[
                    styles.textArabic, 
                    { fontSize: activeSizes.arabic }
                  ]}>
                    {(() => {
                      const words = ayah.textAr.split(' ');
                      const activeWordIndex = isPlayingCurrent && playingProgress && playingProgress.ayahId === ayah.number
                        ? Math.min(words.length - 1, Math.floor(playingProgress.pct * words.length))
                        : -1;
                      return words.map((word, idx) => {
                        const isPast = isPlayingCurrent && idx < activeWordIndex;
                        const isActive = isPlayingCurrent && idx === activeWordIndex;
                        let wordColor = activeTheme.text;
                        if (isActive) wordColor = '#F59E0B';
                        else if (isPast) wordColor = '#D4AF37';
                        
                        return (
                          <Text key={idx} style={{ color: wordColor, fontWeight: isActive ? 'bold' : 'normal' }}>
                            {word}{' '}
                          </Text>
                        );
                      });
                    })()}
                  </Text>
                  <Text style={[
                    styles.textEnglish, 
                    { fontSize: activeSizes.translation },
                    isPlayingCurrent ? { color: theme === 'dark' ? '#E2E8F0' : '#B45309' } : { color: activeTheme.textSecondary }
                  ]}>
                    {ayah.textEn}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const ayahsPerPage = 4;
  const pages = [];
  for (let i = 0; i < ayahs.length; i += ayahsPerPage) {
    pages.push(ayahs.slice(i, i + ayahsPerPage));
  }

  // Header Titles
  const displayTitle = currentJuzNumber !== undefined
    ? `Para ${currentJuzNumber}`
    : currentSurahName;
  const displaySubtitle = currentJuzNumber !== undefined
    ? `Juz ${currentJuzName || JUZ_NAMES[currentJuzNumber - 1]}`
    : currentTranslationName;

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeTheme.cardBg, borderBottomColor: activeTheme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color={activeTheme.text} size={24} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={[styles.title, { color: activeTheme.text }]}>{displayTitle}</Text>
          <Text style={[styles.subtitle, { color: activeTheme.textSecondary }]}>{displaySubtitle}</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Layout Toggle */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              const nextMode = readingMode === 'scroll' ? 'page' : 'scroll';
              setReadingMode(nextMode);
              saveConfig('ummati_quran_reading_mode', nextMode);
            }}
            activeOpacity={0.7}
          >
            {readingMode === 'scroll' ? (
              <BookOpen color={activeTheme.text} size={22} />
            ) : (
              <AlignLeft color={activeTheme.text} size={22} />
            )}
          </TouchableOpacity>

          {/* Settings Toggle */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowSettings(!showSettings)}
            activeOpacity={0.7}
          >
            <Settings color={activeTheme.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

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
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        >
          <View style={[styles.bottomSheet, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            <View style={styles.bottomSheetHeader}>
              <Text style={[styles.bottomSheetTitle, { color: activeTheme.text }]}>Display & Audio Settings</Text>
            </View>

            {/* Theme Row */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: activeTheme.textSecondary }]}>Theme</Text>
              <View style={styles.optionsRow}>
                {(['light', 'sepia', 'dark'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.optionPill,
                      theme === t ? styles.optionPillActive : { borderColor: activeTheme.border }
                    ]}
                    onPress={() => {
                      setTheme(t);
                      saveConfig('ummati_quran_theme', t);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionPillText,
                      theme === t ? styles.optionPillTextActive : { color: activeTheme.textSecondary }
                    ]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Size Row */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: activeTheme.textSecondary }]}>Text Size</Text>
              <View style={styles.optionsRow}>
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.optionPill,
                      textSize === s ? styles.optionPillActive : { borderColor: activeTheme.border }
                    ]}
                    onPress={() => {
                      setTextSize(s);
                      saveConfig('ummati_quran_text_size', s);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionPillText,
                      textSize === s ? styles.optionPillTextActive : { color: activeTheme.textSecondary }
                    ]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Translation Lang Row */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: activeTheme.textSecondary }]}>Translation</Text>
              <View style={styles.optionsRow}>
                {(['english', 'hindi'] as const).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.optionPill,
                      translationLang === lang ? styles.optionPillActive : { borderColor: activeTheme.border }
                    ]}
                    onPress={() => {
                      setTranslationLang(lang);
                      saveConfig('ummati_quran_translation_lang', lang);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionPillText,
                      translationLang === lang ? styles.optionPillTextActive : { color: activeTheme.textSecondary }
                    ]}>
                      {lang === 'english' ? 'English' : 'Hindi'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Audio Recitation Mode Row */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: activeTheme.textSecondary }]}>Audio Recitation</Text>
              <View style={styles.optionsRow}>
                {(['arabic', 'hindi', 'both'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.optionPill,
                      audioMode === mode ? styles.optionPillActive : { borderColor: activeTheme.border }
                    ]}
                    onPress={() => {
                      setAudioMode(mode);
                      saveConfig('ummati_quran_audio_mode', mode);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionPillText,
                      audioMode === mode ? styles.optionPillTextActive : { color: activeTheme.textSecondary }
                    ]}>
                      {mode === 'arabic' ? 'Arabic' : mode === 'hindi' ? 'Hindi Meaning' : 'Arabic + Hindi'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Playback Speed Row */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: activeTheme.textSecondary }]}>Recitation Speed</Text>
              <View style={styles.optionsRow}>
                {([1.0, 1.15, 1.25, 1.5] as const).map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.optionPill,
                      playbackRate === rate ? styles.optionPillActive : { borderColor: activeTheme.border }
                    ]}
                    onPress={() => {
                      setPlaybackRateState(rate);
                      saveConfig('ummati_quran_playback_rate', rate.toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionPillText,
                      playbackRate === rate ? styles.optionPillTextActive : { color: activeTheme.textSecondary }
                    ]}>
                      {rate === 1.0 ? 'Normal' : `${rate}x`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowSettings(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Close Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loader / Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={[styles.loadingText, { color: activeTheme.textSecondary }]}>Fetching verses...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <AlertCircle color={Theme.colors.error} size={48} />
          <Text style={[styles.errorText, { color: activeTheme.textSecondary }]}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadContent} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : readingMode === 'scroll' ? (
        // VERTICAL SCROLL MODE
        <View style={styles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={ayahs}
            renderItem={renderAyahRow}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
              }, 100);
            }}
          />
        </View>
      ) : (
        // HORIZONTAL PAGE MODE
        <View style={styles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={pages}
            renderItem={renderPageItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            inverted={true}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handlePageScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.pageListContainer}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 100);
            }}
          />

          {/* Left Paging Chevron (Goes Next in RTL) */}
          {((currentJuzNumber !== undefined && currentJuzNumber < 30) ||
            (currentSurahNumber !== undefined && currentSurahNumber < 114) ||
            currentPageIndex < pages.length - 1) && (
            <TouchableOpacity
              style={[styles.floatingPageBtn, styles.leftPageBtn, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}
              onPress={() => pageTurn('next')}
              activeOpacity={0.85}
            >
              <ChevronLeft color={activeTheme.text} size={24} />
            </TouchableOpacity>
          )}

          {/* Right Paging Chevron (Goes Prev in RTL) */}
          {((currentJuzNumber !== undefined && currentJuzNumber > 1) ||
            (currentSurahNumber !== undefined && currentSurahNumber > 1) ||
            currentPageIndex > 0) && (
            <TouchableOpacity
              style={[styles.floatingPageBtn, styles.rightPageBtn, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}
              onPress={() => pageTurn('prev')}
              activeOpacity={0.85}
            >
              <ChevronRight color={activeTheme.text} size={24} />
            </TouchableOpacity>
          )}

          {/* Page Progress Indicator Footer */}
          <View style={[styles.pageFooter, { backgroundColor: activeTheme.cardBg, borderTopColor: activeTheme.border }]}>
            <Text style={[styles.pageFooterText, { color: activeTheme.textSecondary }]}>
              Page {currentPageIndex + 1} of {pages.length}  •  {currentJuzNumber !== undefined ? `Para ${currentJuzNumber} of 30` : `Surah ${currentSurahNumber} of 114`}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Audio Controller */}
      {!loading && !errorMsg && (() => {
        const currentPlayingAyahObj = ayahs.find(a => a.number === playingAyahId);
        const audioTitleText = currentPlayingAyahObj
          ? `Ayah ${currentPlayingAyahObj.numberInSurah} of ${currentPlayingAyahObj.surahName || currentSurahName}`
          : 'Surah Recitation';
        return (
          <View style={[styles.audioController, { backgroundColor: activeTheme.cardBg, borderColor: activeTheme.border }]}>
            <View style={styles.audioInfo}>
              <Volume2 color={Theme.colors.accent} size={20} />
              <View style={styles.audioTextMeta}>
                <Text style={[styles.audioTitle, { color: activeTheme.text }]} numberOfLines={1}>{audioTitleText}</Text>
                <Text style={[styles.audioArtist, { color: activeTheme.textSecondary }]}>Sheikh Mishary Alafasy</Text>
              </View>
            </View>

            <View style={styles.audioControlsGroup}>
              {/* Skip Back */}
              <TouchableOpacity style={styles.skipBtn} onPress={playPrevAyah} activeOpacity={0.7}>
                <SkipBack color={activeTheme.text} size={18} fill={theme === 'dark' ? activeTheme.text : 'none'} />
              </TouchableOpacity>

              {/* Play / Pause */}
              <TouchableOpacity style={styles.playBtn} onPress={toggleAudio} activeOpacity={0.85}>
                {isPlaying ? (
                  <Pause color={Theme.colors.white} size={20} fill={Theme.colors.white} />
                ) : (
                  <Play color={Theme.colors.white} size={20} fill={Theme.colors.white} style={styles.playIconOffset} />
                )}
              </TouchableOpacity>

              {/* Skip Forward */}
              <TouchableOpacity style={styles.skipBtn} onPress={playNextAyah} activeOpacity={0.7}>
                <SkipForward color={activeTheme.text} size={18} fill={theme === 'dark' ? activeTheme.text : 'none'} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    padding: 8,
  },
  headerTitleBox: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionPillTextActive: {
    color: Theme.colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 15,
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Theme.radius.sm,
  },
  retryBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 110, // space for audio controller
  },
  surahHeaderBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  surahHeaderNameAr: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Georgia',
    color: '#FFFFFF',
    marginBottom: 4,
    zIndex: 2,
  },
  surahHeaderNameEng: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    zIndex: 2,
  },
  surahHeaderBismillah: {
    fontSize: 24,
    fontFamily: 'Georgia',
    color: '#FFFFFF',
    marginTop: 4,
    zIndex: 2,
  },
  ayahContainer: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  ayahContainerPaged: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ayahBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  ayahBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ayahActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lastReadLabel: {
    fontSize: 10,
    color: Theme.colors.accent,
    fontWeight: 'bold',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionBtn: {
    padding: 6,
  },
  textArabic: {
    fontFamily: 'Georgia',
    lineHeight: 52,
    textAlign: 'right',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  textEnglish: {
    lineHeight: 22,
    textAlign: 'left',
  },
  pageListContainer: {
    alignItems: 'stretch',
  },
  pageSlide: {
    flex: 1,
  },
  pageSlideScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 160, // leave space for bottom pagination footer + audio controls
  },
  floatingPageBtn: {
    position: 'absolute',
    top: '40%',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  leftPageBtn: {
    left: 12,
  },
  rightPageBtn: {
    right: 12,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 90, // just above the audio controller
    left: 0,
    right: 0,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  pageFooterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  audioController: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 20,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  audioTextMeta: {
    gap: 2,
    flex: 1,
  },
  audioTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  audioArtist: {
    fontSize: 11,
  },
  audioControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    padding: 8,
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
  },
  lastReadLight: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  lastReadDark: {
    backgroundColor: '#1E293B',
  },
  ayahBadgeLight: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  ayahBadgeDark: {
    backgroundColor: '#334155',
  },
  starContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starSquare: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  starText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
