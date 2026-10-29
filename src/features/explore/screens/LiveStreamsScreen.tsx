import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Info, Landmark, MapPin, Radio, Tv } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalBox, BrutalPressable, Card, GlassCard, ScreenHeader } from '../../../core/components/ui';
import { brutal, tints } from '../../../core/theme/palettes';
import { HARAMAIN_STREAMS, HaramainPlayer } from '../../home/components/HaramainLiveSection';

type StreamType = 'makkah' | 'madinah';

// Flat pastel fills for the two Haramain cards (ink text on top).
const STREAMS: { key: StreamType; title: string; place: string; label: string; fill: string }[] = [
  { key: 'makkah', title: 'Masjid al-Haram', place: 'Makkah', label: 'Makkah Live', fill: tints.gold },
  { key: 'madinah', title: 'Masjid an-Nabawi', place: 'Madinah', label: 'Madina Live', fill: tints.green },
];

const LIVE_RED = '#E07A6E';
const INK = '#1C1A17';

/** Red LIVE pill with a softly pulsing dot. */
function LiveBadge({ active = true }: { active?: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.8 }],
  }));
  return (
    <View style={[styles.liveBadge, { backgroundColor: active ? LIVE_RED : '#FFFAF1' }]}>
      <View style={styles.liveDotWrap}>
        <Animated.View style={[styles.liveRing, ring]} />
        <View style={styles.liveDot} />
      </View>
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

export function LiveStreamsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [activeStream, setActiveStream] = useState<StreamType>('makkah');
  const [loading, setLoading] = useState(true);

  const active = STREAMS.find((s) => s.key === activeStream) ?? STREAMS[0];
  // Verified official feeds shared with the Home screen player
  const activeFeed = HARAMAIN_STREAMS.find((s) => s.id === activeStream) ?? HARAMAIN_STREAMS[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Live Streams"
          subtitle="Watch the Haramain live, around the clock"
          onBack={() => navigation.goBack()}
        >
          <View style={styles.heroRow}>
            <GlassCard style={styles.heroPill}>
              <Radio color={colors.onSky} size={14} />
              <Text style={[styles.heroPillText, { color: colors.onSky }]}>Now watching · {active.place}</Text>
            </GlassCard>
          </View>
        </ScreenHeader>

        <View style={styles.body}>
          {/* Stream selector cards */}
          <View style={styles.selectorRow}>
            {STREAMS.map((s, i) => {
              const isActive = activeStream === s.key;
              return (
                <Animated.View key={s.key} style={styles.flex} entering={FadeInDown.delay(60 + i * 70).duration(420)}>
                  <BrutalPressable
                    onPress={() => {
                      if (isActive) return;
                      setActiveStream(s.key);
                      setLoading(true);
                    }}
                    radius={22}
                    fill={isActive ? s.fill : colors.surfaceAlt}
                    style={styles.mediaCard}
                  >
                    <Landmark color="rgba(28,26,23,0.12)" size={110} style={styles.mediaWatermark} />
                    <View style={styles.mediaTop}>
                      <LiveBadge active={isActive} />
                      <View style={styles.mediaIcon}>
                        <Tv color={INK} size={16} strokeWidth={2.4} />
                      </View>
                    </View>
                    <View>
                      <View style={styles.placeRow}>
                        <MapPin color={isActive ? INK : colors.textSecondary} size={12} />
                        <Text style={[styles.placeText, { color: isActive ? INK : colors.textSecondary }]}>{s.place}</Text>
                      </View>
                      <Text style={[styles.mediaTitle, { color: isActive ? INK : colors.text }]} numberOfLines={2}>{s.title}</Text>
                      <Text style={[styles.mediaLabel, { color: isActive ? INK : colors.textSecondary }]}>{isActive ? 'Playing below' : `Tap to watch ${s.label}`}</Text>
                    </View>
                  </BrutalPressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Video Container */}
          <Animated.View entering={FadeInDown.delay(200).duration(420)} style={styles.playerShadow}>
            <BrutalBox radius={24} fill="#000000" style={styles.videoWrapper}>
              <HaramainPlayer
                key={activeFeed.id}
                stream={activeFeed}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
              {loading ? (
                <View style={[styles.loaderBox, { backgroundColor: active.fill }]}>
                  <ActivityIndicator size="large" color={INK} />
                  <Text style={styles.loaderText}>Establishing live feed link...</Text>
                </View>
              ) : null}
              <View style={styles.playerBadge} pointerEvents="none">
                <LiveBadge />
              </View>
            </BrutalBox>
          </Animated.View>

          <View style={styles.nowRow}>
            <Text style={[styles.nowTitle, { color: colors.text }]}>{active.title}</Text>
            <Text style={[styles.nowSub, { color: colors.textSecondary }]}>{activeFeed.channel} · YouTube broadcast</Text>
          </View>

          {/* Warning/Info box */}
          <Animated.View entering={FadeInDown.delay(260).duration(420)}>
            <Card style={styles.infoCard}>
              <View style={[styles.infoTile, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
                <Info color={colors.ink} size={18} strokeWidth={2.4} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Note on Live Feeds</Text>
                <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                  Live streams are sourced directly from YouTube broadcasters. If a channel is temporarily offline or undergoing maintenance, the stream may take a moment to buffer or show as unavailable.
                </Text>
              </View>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  heroRow: { flexDirection: 'row', marginTop: 18 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  heroPillText: { fontSize: 13, fontWeight: '800' },
  body: { paddingHorizontal: 18, paddingTop: 20 },
  selectorRow: { flexDirection: 'row', gap: 14, marginRight: brutal.shadow },
  mediaCard: { height: 170, padding: 14, justifyContent: 'space-between', overflow: 'hidden' },
  mediaWatermark: { position: 'absolute', right: -18, bottom: -14 },
  mediaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mediaIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAF1', borderWidth: brutal.borderThin, borderColor: INK },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  mediaTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3, marginTop: 4 },
  mediaLabel: { fontSize: 11, fontWeight: '800', marginTop: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: brutal.borderThin, borderColor: INK },
  liveDotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: INK },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: INK },
  liveText: { color: INK, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  playerShadow: { marginTop: 22, marginRight: brutal.shadow },
  videoWrapper: { aspectRatio: 16 / 9, overflow: 'hidden' },
  loaderBox: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: INK, fontSize: 13, fontWeight: '800' },
  playerBadge: { position: 'absolute', top: 12, left: 12 },
  nowRow: { marginTop: 14, marginBottom: 16, paddingHorizontal: 4 },
  nowTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  nowSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginRight: brutal.shadow },
  infoTile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  infoTitle: { fontSize: 14, fontWeight: '900' },
  infoDesc: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
