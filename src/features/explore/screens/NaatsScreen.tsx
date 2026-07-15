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
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const webViewRef = useRef<WebView<{}>>(null);
  
  const naats = content.naats || [];
  const activeTrack = naats[currentTrackIndex] || { title: 'Naat', artist: '', url: '' };
  
  const injectPlayerCmd = (cmd: string) => {
    webViewRef.current?.injectJavaScript(`document.getElementById("naat-player").${cmd}();`);
  };
  
  const handlePlayPause = () => {
    if (isPlaying) {
      injectPlayerCmd('pause');
      setIsPlaying(false);
    } else {
      injectPlayerCmd('play');
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
  
  // Trigger HTML play script when track index changes
  useEffect(() => {
    if (isPlaying && activeTrack.url) {
      setTimeout(() => {
        const script = `
          const player = document.getElementById("naat-player");
          player.src = "${activeTrack.url}";
          player.play();
        `;
        webViewRef.current?.injectJavaScript(script);
      }, 400);
    }
  }, [currentTrackIndex, activeTrack?.url, isPlaying]);

  const htmlAudio = `
    <html>
      <body>
        <audio id="naat-player" src="${activeTrack?.url || ''}"></audio>
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
