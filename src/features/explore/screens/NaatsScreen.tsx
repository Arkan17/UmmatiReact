import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function NaatsScreen() {
  const navigation = useNavigation();
  const { content } = useDynamicContent();
  
  const [naats, setNaats] = useState<any[]>(content.naats || []);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const webViewRef = useRef<WebView<{}>>(null);
  
  const activeTrack = naats[currentTrackIndex] || { title: 'Naat', artist: '', url: '' };

  // Sync with local/cached data initially
  useEffect(() => {
    if (content.naats && content.naats.length > 0 && naats.length === 0) {
      setNaats(content.naats);
    }
  }, [content, naats.length]);

  // Fetch live, popular Naats/Nasheeds from Archive.org Search API
  useEffect(() => {
    const fetchLiveNaats = async () => {
      try {
        const searchUrl = 'https://archive.org/advancedsearch.php?q=title%3A(Naat%20OR%20Nasheed)+AND+format%3A(VBR%20MP3%20OR%20MP3)+AND+mediatype%3A(audio)&fl%5B%5D=identifier,title,creator,downloads&sort%5B%5D=downloads+desc&rows=30&output=json';
        const res = await fetch(searchUrl);
        if (res.ok) {
          const json = await res.json();
          if (json && json.response && json.response.docs) {
            const docs = json.response.docs;
            const mapped = docs.map((doc: any) => ({
              id: doc.identifier,
              title: doc.title,
              artist: doc.creator || 'Islamic Artist',
              url: '', // resolve dynamically when played
            }));
            setNaats(mapped);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch live Naats from Archive.org:', e);
      }
    };
    fetchLiveNaats();
  }, []);

  // Fetch specific MP3 filename from Archive.org metadata
  const fetchTrackAudioUrl = async (identifier: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://archive.org/metadata/${identifier}`);
      if (res.ok) {
        const json = await res.json();
        const files = json.files || [];
        const mp3File = files.find((f: any) => f.name.endsWith('.mp3'));
        if (mp3File) {
          return `https://archive.org/download/${identifier}/${encodeURIComponent(mp3File.name)}`;
        }
      }
    } catch (e) {
      console.warn('Error fetching Archive.org item metadata:', e);
    }
    return null;
  };
  
  const injectPlayerCmd = (cmd: string) => {
    webViewRef.current?.injectJavaScript(`document.getElementById("naat-player").${cmd}();`);
  };
  
  const handlePlayPause = () => {
    if (isPlaying) {
      injectPlayerCmd('pause');
      setIsPlaying(false);
    } else {
      if (activeTrack.url) {
        injectPlayerCmd('play');
      }
      setIsPlaying(true);
    }
  };
  
  const handleNext = () => {
    if (naats.length === 0) return;
    setBuffering(true);
    const nextIdx = (currentTrackIndex + 1) % naats.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  };
  
  const handlePrev = () => {
    if (naats.length === 0) return;
    setBuffering(true);
    const prevIdx = (currentTrackIndex - 1 + naats.length) % naats.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
  };
  
  const selectTrack = (index: number) => {
    setBuffering(true);
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };
  
  // Trigger HTML play script when track index changes or play state changes
  useEffect(() => {
    let active = true;
    if (!isPlaying) {
      injectPlayerCmd('pause');
      return;
    }

    const playActiveTrack = async () => {
      if (!activeTrack.id && activeTrack.id !== 0) return;
      
      let playUrl = activeTrack.url;
      if (!playUrl) {
        setBuffering(true);
        const resolved = await fetchTrackAudioUrl(activeTrack.id);
        if (!active) return;
        if (resolved) {
          playUrl = resolved;
          // Cache it in state so we don't have to fetch it again
          setNaats(prev => {
            const updated = [...prev];
            if (updated[currentTrackIndex]) {
              updated[currentTrackIndex] = { ...updated[currentTrackIndex], url: resolved };
            }
            return updated;
          });
        } else {
          setBuffering(false);
          setIsPlaying(false);
          return;
        }
      }

      // Play instantly without delay
      const script = `
        const player = document.getElementById("naat-player");
        player.pause();
        player.src = "${playUrl}";
        player.load();
        player.play().catch(function(err) {
          console.error("Playback failed:", err);
        });
      `;
      webViewRef.current?.injectJavaScript(script);
    };

    playActiveTrack();

    return () => {
      active = false;
    };
  }, [currentTrackIndex, isPlaying, activeTrack.id, activeTrack.url]);

  const htmlAudio = `
    <html>
      <body>
        <audio id="naat-player"></audio>
        <script>
          const player = document.getElementById("naat-player");
          player.onended = () => {
            window.ReactNativeWebView.postMessage("ended");
          };
          player.onloadstart = () => {
            window.ReactNativeWebView.postMessage("loading");
          };
          player.oncanplay = () => {
            window.ReactNativeWebView.postMessage("canplay");
          };
          player.onerror = () => {
            window.ReactNativeWebView.postMessage("error");
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Naat & Mankabat</Text>
        <View style={styles.placeholderWidth} />
      </View>

      {/* Hidden Audio Player WebView */}
      <View style={styles.hiddenWebView}>
        <WebView<{}>
          ref={webViewRef}
          source={{ html: htmlAudio }}
          onMessage={(event: any) => {
            const msg = event.nativeEvent.data;
            if (msg === 'ended') handleNext();
            if (msg === 'loading') setBuffering(true);
            if (msg === 'canplay') setBuffering(false);
            if (msg === 'error') {
              setBuffering(false);
              setIsPlaying(false);
            }
          }}
          javaScriptEnabled
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Media Player Panel */}
        <View style={styles.playerPanel}>
          <View style={styles.albumArtContainer}>
            <Music color={Theme.colors.accent} size={64} style={styles.musicIcon} />
          </View>

          <Text style={styles.trackTitle} numberOfLines={1}>{activeTrack.title}</Text>
          <Text style={styles.trackArtist}>{activeTrack.artist}</Text>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
              <SkipBack color={Theme.colors.text} size={24} fill={Theme.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} style={styles.mainPlayBtn}>
              {buffering ? (
                <ActivityIndicator color={Theme.colors.white} />
              ) : isPlaying ? (
                <Pause color={Theme.colors.white} size={24} fill={Theme.colors.white} />
              ) : (
                <Play color={Theme.colors.white} size={24} fill={Theme.colors.white} style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
              <SkipForward color={Theme.colors.text} size={24} fill={Theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Tracks List */}
        <View style={styles.playlistSection}>
          <Text style={styles.sectionHeader}>Playlist Tracks</Text>
          
          <View style={styles.listBorder}>
            {naats.map((track, idx) => {
              const isSelected = idx === currentTrackIndex;
              return (
                <TouchableOpacity
                  key={track.id}
                  style={[styles.trackRow, isSelected ? styles.activeRow : null]}
                  onPress={() => selectTrack(idx)}
                >
                  <View style={styles.trackRowLeft}>
                    <Text style={[styles.trackNum, isSelected ? styles.activeText : null]}>
                      {idx + 1}
                    </Text>
                    <View>
                      <Text style={[styles.rowTitle, isSelected ? styles.activeText : null]} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.rowArtist}>{track.artist}</Text>
                    </View>
                  </View>
                  {isSelected && isPlaying ? (
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                  ) : (
                    <Play color={Theme.colors.textMuted} size={16} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  placeholderWidth: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  playerPanel: {
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    margin: 20,
    padding: 24,
    borderRadius: Theme.radius.lg,
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  albumArtContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  musicIcon: {},
  trackTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    width: '100%',
  },
  trackArtist: {
    color: Theme.colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navBtn: {
    padding: 10,
  },
  mainPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playlistSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listBorder: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
  },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(35, 68, 50, 0.2)',
  },
  activeRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  trackRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  trackNum: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
    width: 20,
  },
  rowTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    width: SCREEN_WIDTH - 150,
  },
  rowArtist: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  activeText: {
    color: Theme.colors.primary,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
  },
});
