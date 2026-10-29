import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Music, Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalPressable, GlassCard, ScreenHeader, SectionHeader } from '../../../core/components/ui';
import { brutal, tints } from '../../../core/theme/palettes';

const ART_TINTS: string[] = Object.values(tints);

function EqualizerBar({ color, delay }: { color: string; delay: number }) {
  const h = useSharedValue(0.35);
  useEffect(() => {
    h.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })), -1, true));
    return () => cancelAnimation(h);
  }, [h, delay]);
  const style = useAnimatedStyle(() => ({ height: 16 * h.value }));
  return <Animated.View style={[styles.eqBar, { backgroundColor: color }, style]} />;
}

/** Bouncing bars for the now-playing track. */
function Equalizer({ color }: { color: string }) {
  return (
    <View style={styles.eq}>
      <EqualizerBar color={color} delay={0} />
      <EqualizerBar color={color} delay={120} />
      <EqualizerBar color={color} delay={240} />
      <EqualizerBar color={color} delay={60} />
    </View>
  );
}

/** Spinning vinyl-style disc that turns while audio plays. */
function Disc({ spinning }: { spinning: boolean }) {
  const { colors } = useAppTheme();
  const rot = useSharedValue(0);
  useEffect(() => {
    if (spinning) {
      rot.value = withRepeat(withTiming(rot.value + 360, { duration: 9000, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(rot);
    }
  }, [spinning, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={[styles.disc, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }, style]}>
      <View style={[styles.discRing, { borderColor: colors.ink }]} />
      <View style={[styles.discCenter, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
        <Music color={colors.ink} size={28} strokeWidth={2.4} />
      </View>
    </Animated.View>
  );
}

export function NaatsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
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

  const statusLabel = buffering && isPlaying ? 'LOADING…' : isPlaying ? 'NOW PLAYING' : 'PAUSED';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Naat & Mankabat" subtitle="Nasheeds and naats in praise of the Prophet ﷺ" onBack={() => navigation.goBack()}>
          {/* Media Player Panel */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <GlassCard style={styles.playerPanel}>
              <View style={styles.playerTop}>
                <Disc spinning={isPlaying && !buffering} />
                <View style={styles.flex}>
                  <View style={styles.statusRow}>
                    {isPlaying && !buffering ? <Equalizer color={colors.accent} /> : null}
                    <Text style={[styles.statusText, { color: colors.onSkyMuted }]}>{statusLabel}</Text>
                  </View>
                  <Text style={[styles.trackTitle, { color: colors.onSky }]} numberOfLines={2}>{activeTrack.title}</Text>
                  <Text style={[styles.trackArtist, { color: colors.onSkyMuted }]} numberOfLines={1}>{activeTrack.artist}</Text>
                </View>
              </View>

              {/* Controls */}
              <View style={styles.controlsRow}>
                <BrutalPressable onPress={handlePrev} fill={colors.surface} radius={16} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.navBtn}>
                  <SkipBack color={colors.text} size={20} fill={colors.text} />
                </BrutalPressable>

                <BrutalPressable onPress={handlePlayPause} fill={colors.accent} radius={33} style={styles.mainPlayBtn}>
                  {buffering ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : isPlaying ? (
                    <Pause color={colors.ink} size={26} fill={colors.ink} />
                  ) : (
                    <Play color={colors.ink} size={26} fill={colors.ink} style={styles.playNudge} />
                  )}
                </BrutalPressable>

                <BrutalPressable onPress={handleNext} fill={colors.surface} radius={16} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.navBtn}>
                  <SkipForward color={colors.text} size={20} fill={colors.text} />
                </BrutalPressable>
              </View>
            </GlassCard>
          </Animated.View>
        </ScreenHeader>

        {/* Playlist Tracks List */}
        <View style={styles.playlistSection}>
          <SectionHeader title={`Playlist · ${naats.length}`} />

          {naats.map((track, idx) => {
            const isSelected = idx === currentTrackIndex;
            const tint = ART_TINTS[idx % ART_TINTS.length];
            return (
              <Animated.View key={track.id} entering={FadeInDown.delay(Math.min(idx * 40, 400))}>
                <BrutalPressable
                  onPress={() => selectTrack(idx)}
                  radius={20}
                  offset={isSelected ? brutal.shadow : brutal.shadowSmall}
                  fill={isSelected ? colors.primarySoft : colors.surface}
                  style={styles.trackRow}
                >
                  <View style={[styles.trackArt, { backgroundColor: isSelected ? colors.primary : tint, borderColor: colors.ink }]}>
                    {isSelected && isPlaying && !buffering ? (
                      <Equalizer color={colors.onPrimary} />
                    ) : isSelected && isPlaying && buffering ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <Text style={[styles.trackNum, { color: colors.ink }]}>{idx + 1}</Text>
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={[styles.rowArtist, { color: colors.textSecondary }]} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <View style={[styles.rowPlay, { backgroundColor: isSelected ? colors.primary : colors.surfaceAlt, borderColor: colors.ink }]}>
                    {isSelected && isPlaying ? (
                      <Pause color={colors.onPrimary} size={14} fill={colors.onPrimary} />
                    ) : (
                      <Play color={isSelected ? colors.onPrimary : colors.text} size={14} fill={isSelected ? colors.onPrimary : colors.text} style={styles.playNudgeSm} />
                    )}
                  </View>
                </BrutalPressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  playerPanel: { marginTop: 18, padding: 16 },
  playerTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  disc: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: brutal.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderStyle: 'dashed' },
  discCenter: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  trackTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2, lineHeight: 23 },
  trackArtist: { fontSize: 13.5, fontWeight: '600', marginTop: 3 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 18 },
  navBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  mainPlayBtn: { width: 66, height: 66, justifyContent: 'center', alignItems: 'center' },
  playNudge: { marginLeft: 3 },
  playNudgeSm: { marginLeft: 2 },
  playlistSection: { paddingHorizontal: 18 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, marginBottom: 14, marginRight: brutal.shadow },
  trackArt: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  trackNum: { fontSize: 16, fontWeight: '900' },
  rowTitle: { fontSize: 15, fontWeight: '900' },
  rowArtist: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  rowPlay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  eq: { flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: 16 },
  eqBar: { width: 3, borderRadius: 2 },
  hiddenWebView: { width: 0, height: 0, position: 'absolute', opacity: 0 },
});
