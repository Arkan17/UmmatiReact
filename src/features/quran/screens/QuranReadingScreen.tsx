import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Play, Pause, Bookmark, BookmarkCheck, Volume2, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

interface Ayah {
  number: number;
  numberInSurah: number;
  textAr: string;
  textEn: string;
}

type ScreenRouteProp = RouteProp<RootStackParamList, 'QuranReading'>;

export function QuranReadingScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { surahNumber, surahName, translationName } = route.params;

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Bookmarks & Last Read State
  const [lastReadAyah, setLastReadAyah] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<number, boolean>>({});
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const webViewRef = useRef<WebView<{}>>(null);

  // Audio Stream URL (Mishary Rashid Alafasy whole surah MP3)
  const audioUrl = `https://download.quranicaudio.com/quran/mishari_rashid_al-afasi/${surahNumber.toString().padStart(3, '0')}.mp3`;

  // Fetch Surah text and translations (and cache)
  const loadSurahContent = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cacheKey = `ummati_cached_surah_${surahNumber}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        setAyahs(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // Fetch Arabic and English translation in parallel
      const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.code === 200 && json.data && json.data.length === 2) {
        const arabicAyahs = json.data[0].ayahs;
        const englishAyahs = json.data[1].ayahs;

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
    } catch (e) {
      console.warn('Error loading Surah:', e);
      setErrorMsg('Failed to load verses. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [surahNumber]);

  // Sync Last Read & Bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('ummati_saved_bookmarks');
      if (saved) {
        setBookmarkedAyahs(JSON.parse(saved));
      }
      
      // Load last read from device cache
      const lastRead = await AsyncStorage.getItem(`ummati_last_read_surah_${surahNumber}`);
      if (lastRead) {
        setLastReadAyah(parseInt(lastRead, 10));
      }
    } catch (e) {
      console.warn('Error loading bookmark cache:', e);
    }
  }, [surahNumber]);

  const handleBookmarkAyah = async (ayah: Ayah) => {
    const isBookmarked = !!bookmarkedAyahs[ayah.number];
    const updated = {
      ...bookmarkedAyahs,
      [ayah.number]: !isBookmarked,
    };
    
    setBookmarkedAyahs(updated);
    await AsyncStorage.setItem('ummati_saved_bookmarks', JSON.stringify(updated));

    // Update Last Read and Progress in Supabase
    setLastReadAyah(ayah.numberInSurah);
    await AsyncStorage.setItem(`ummati_last_read_surah_${surahNumber}`, ayah.numberInSurah.toString());
    
    if (user) {
      try {
        // Log activity progress
        await supabase
          .from('user_progress')
          .update({
            last_read_surah: surahNumber,
            last_read_ayah: ayah.numberInSurah,
            last_read_timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
          
        // Log daily Quran activity
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('user_activities').insert({
          user_id: user.id,
          activity_type: 'quran',
          activity_date: todayStr,
          details: { surah: surahNumber, ayah: ayah.numberInSurah, action: 'bookmark_or_read' }
        });
      } catch (e) {
        console.warn('Failed to sync reading progression to database:', e);
      }
    }
  };

  // HTML5 audio injection helper via WebView
  const playAudio = useCallback(() => {
    const playScript = `document.getElementById("audio-player").play();`;
    webViewRef.current?.injectJavaScript(playScript);
    setIsPlaying(true);
  }, []);

  const pauseAudio = useCallback(() => {
    const pauseScript = `document.getElementById("audio-player").pause();`;
    webViewRef.current?.injectJavaScript(pauseScript);
    setIsPlaying(false);
  }, []);

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
  };

  // Embed HTML page inside WebView to load audio player safely
  const audioPlayerHTML = `
    <html>
      <body>
        <audio id="audio-player" src="${audioUrl}"></audio>
        <script>
          const audio = document.getElementById("audio-player");
          audio.onended = () => {
            window.ReactNativeWebView.postMessage("ended");
          };
          audio.onerror = () => {
            window.ReactNativeWebView.postMessage("error");
          };
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    loadSurahContent();
    loadBookmarks();
    return () => {
      // Pause audio when leaving screen
      pauseAudio();
    };
  }, [surahNumber, loadSurahContent, loadBookmarks, pauseAudio]);

  const renderAyahRow = ({ item }: { item: Ayah }) => {
    const isBookmarked = !!bookmarkedAyahs[item.number];
    const isLastRead = lastReadAyah === item.numberInSurah;
    
    return (
      <View style={[styles.ayahContainer, isLastRead ? styles.lastReadContainer : null]}>
        {/* Ayah Actions Row */}
        <View style={styles.ayahHeader}>
          <View style={styles.ayahBadge}>
            <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
          </View>
          
          <View style={styles.ayahActions}>
            {isLastRead ? <Text style={styles.lastReadLabel}>LAST READ</Text> : null}
            <TouchableOpacity onPress={() => handleBookmarkAyah(item)} style={styles.actionBtn}>
              {isBookmarked ? (
                <BookmarkCheck color={Theme.colors.primary} size={20} />
              ) : (
                <Bookmark color={Theme.colors.textMuted} size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Text Arabic */}
        <Text style={styles.textArabic}>{item.textAr}</Text>
        
        {/* Text English Translation */}
        <Text style={styles.textEnglish}>{item.textEn}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title}>{surahName}</Text>
          <Text style={styles.subtitle}>{translationName}</Text>
        </View>
        <View style={styles.placeholderWidth} />
      </View>

      {/* Hidden WebView for HTML5 Audio Execution */}
      <View style={styles.hiddenWebView}>
        <WebView<{}>
          ref={webViewRef}
          source={{ html: audioPlayerHTML }}
          onMessage={(event: any) => {
            const msg = event.nativeEvent.data;
            if (msg === 'ended') onAudioEnded();
            if (msg === 'error') {
              setIsPlaying(false);
              Alert.alert('Audio Error', 'Failed to stream recitation. Check connection.');
            }
          }}
          javaScriptEnabled
        />
      </View>

      {/* Loader / Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching verses...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <AlertCircle color={Theme.colors.error} size={48} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSurahContent}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={ayahs}
            renderItem={renderAyahRow}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              // Display Bismillah except for At-Tawbah (Surah 9)
              surahNumber !== 9 ? (
                <View style={styles.bismillahBox}>
                  <Text style={styles.bismillahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                </View>
              ) : null
            }
          />

          {/* Bottom Audio Controller */}
          <View style={styles.audioController}>
            <View style={styles.audioInfo}>
              <Volume2 color={Theme.colors.accent} size={22} />
              <View style={styles.audioTextMeta}>
                <Text style={styles.audioTitle}>Surah Recitation</Text>
                <Text style={styles.audioArtist}>Sheikh Mishary Alafasy</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.playBtn} onPress={toggleAudio}>
              {isPlaying ? (
                <Pause color={Theme.colors.white} size={22} fill={Theme.colors.white} />
              ) : (
                <Play color={Theme.colors.white} size={22} fill={Theme.colors.white} style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    padding: 8,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  placeholderWidth: {
    width: 40,
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
  listContainer: {
    padding: 16,
    paddingBottom: 100, // leave space for bottom audio player
  },
  bismillahBox: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(35, 68, 50, 0.2)',
  },
  bismillahText: {
    fontSize: 26,
    color: Theme.colors.text,
    fontFamily: 'Georgia',
  },
  ayahContainer: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(35, 68, 50, 0.3)',
  },
  lastReadContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 8,
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  ayahBadgeText: {
    color: Theme.colors.primary,
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
    fontSize: 26,
    color: Theme.colors.text,
    fontFamily: 'Georgia',
    lineHeight: 46,
    textAlign: 'right',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  textEnglish: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'left',
  },
  audioController: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioTextMeta: {
    gap: 2,
  },
  audioTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  audioArtist: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
  },
});
