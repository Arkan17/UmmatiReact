import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { BookOpen, Pause, Volume2 } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalBox, BrutalPressable, GlassCard, ScreenHeader } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

export function KalimasScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { content } = useDynamicContent();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const webViewRef = useRef<WebView<{}>>(null);

  const kalimas = content.kalimas || [];

  const handlePlayAudio = (index: number, url: string) => {
    if (playingIndex === index) {
      // Pause
      const script = `document.getElementById("kalima-audio").pause();`;
      webViewRef.current?.injectJavaScript(script);
      setPlayingIndex(null);
    } else {
      // Play new
      setPlayingIndex(index);
      const script = `
        const player = document.getElementById("kalima-audio");
        if (player.src !== "${url}") {
          player.src = "${url}";
        }
        player.play();
      `;
      webViewRef.current?.injectJavaScript(script);
    }
  };

  const htmlAudio = `
    <html>
      <body>
        <audio id="kalima-audio"></audio>
        <script>
          const player = document.getElementById("kalima-audio");
          player.onended = () => {
            window.ReactNativeWebView.postMessage("ended");
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hidden Audio WebView */}
      <View style={styles.hiddenWebView}>
        <WebView<{}>
          ref={webViewRef}
          source={{ html: htmlAudio }}
          onMessage={(event: any) => {
            if (event.nativeEvent.data === 'ended') {
              setPlayingIndex(null);
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
        <ScreenHeader
          title="Six Kalimas"
          subtitle="The six declarations of faith — read, listen and memorise"
          onBack={() => navigation.goBack()}
        >
          <View style={styles.heroRow}>
            <GlassCard style={styles.heroPill}>
              <BookOpen color={colors.onSky} size={14} />
              <Text style={[styles.heroPillText, { color: colors.onSky }]}>{kalimas.length || 6} Kalimas</Text>
            </GlassCard>
            {playingIndex !== null && (
              <GlassCard style={styles.heroPill}>
                <Volume2 color={colors.onSky} size={14} />
                <Text style={[styles.heroPillText, { color: colors.onSky }]} numberOfLines={1}>
                  Playing {kalimas[playingIndex]?.name ?? ''}
                </Text>
              </GlassCard>
            )}
          </View>
        </ScreenHeader>

        <View style={styles.list}>
          {kalimas.length === 0 && (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Loading Kalimas…</Text>
          )}
          {kalimas.map((item, index) => {
            const isCurrentPlaying = playingIndex === index;
            return (
              <Animated.View
                key={item.number}
                entering={FadeInDown.delay(Math.min(80 + index * 60, 400)).duration(420)}
                layout={LinearTransition}
              >
                <BrutalBox radius={24} fill={isCurrentPlaying ? colors.primarySoft : colors.surface} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.numberTile, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
                      <Text style={[styles.numberText, { color: colors.ink }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.headerText}>
                      <Text style={[styles.cardKicker, { color: colors.textMuted }]}>KALIMA {index + 1}</Text>
                      <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                    </View>

                    {/* Audio button */}
                    <BrutalPressable
                      onPress={() => handlePlayAudio(index, item.audio)}
                      fill={isCurrentPlaying ? colors.primary : colors.accentSoft}
                      radius={12}
                      offset={brutal.shadowSmall}
                      borderWidth={brutal.borderThin}
                      style={styles.audioBtn}
                    >
                      {isCurrentPlaying
                        ? <Pause color={colors.onPrimary} size={15} />
                        : <Volume2 color={colors.ink} size={15} strokeWidth={2.4} />}
                      <Text style={[styles.audioBtnText, { color: colors.ink }]}>
                        {isCurrentPlaying ? 'Playing' : 'Listen'}
                      </Text>
                    </BrutalPressable>
                  </View>

                  {/* Arabic */}
                  <View style={[styles.arabicPanel, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                    <Text style={[styles.arabic, { color: colors.text }]}>{item.arabic}</Text>
                  </View>

                  {/* Transliteration */}
                  <View style={styles.metaSection}>
                    <View style={styles.metaLabelRow}>
                      <View style={[styles.metaDot, { backgroundColor: colors.accent, borderColor: colors.ink }]} />
                      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Pronunciation</Text>
                    </View>
                    <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{item.transliteration}</Text>
                  </View>

                  {/* Translation */}
                  <View style={[styles.metaSection, styles.metaLast]}>
                    <View style={styles.metaLabelRow}>
                      <View style={[styles.metaDot, { backgroundColor: colors.primary, borderColor: colors.ink }]} />
                      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Translation</Text>
                    </View>
                    <Text style={[styles.translation, { color: colors.text }]}>{item.translation}</Text>
                  </View>
                </BrutalBox>
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
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, maxWidth: '100%' },
  heroPillText: { fontSize: 13, fontWeight: '800', flexShrink: 1 },
  list: { paddingHorizontal: 18, paddingTop: 20 },
  empty: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 30 },
  card: { marginBottom: 20, marginRight: brutal.shadow, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  numberTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  numberText: { fontSize: 20, fontWeight: '900' },
  headerText: { flex: 1 },
  cardKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cardName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.2, marginTop: 2 },
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  audioBtnText: { fontSize: 12, fontWeight: '900' },
  arabicPanel: { borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, borderWidth: brutal.borderThin, marginBottom: 16 },
  arabic: { fontSize: 26, fontFamily: 'Georgia', lineHeight: 50, textAlign: 'center', writingDirection: 'rtl' },
  metaSection: { marginBottom: 14, gap: 6 },
  metaLast: { marginBottom: 0 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  metaLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  transliteration: { fontSize: 14, lineHeight: 22, fontStyle: 'italic', fontWeight: '500' },
  translation: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  hiddenWebView: { width: 0, height: 0, position: 'absolute', opacity: 0 },
});
