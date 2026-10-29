import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../core/hooks/useAuth';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BellRing, BookOpenText, Compass, HeartHandshake, Sparkles } from 'lucide-react-native';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalPressable, PressableScale, SkyBackground } from '../../../core/components/ui';
import { brutal, tints } from '../../../core/theme/palettes';
import { UmmatiLogo } from '../../../core/components/UmmatiLogo';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  { key: 'welcome', Icon: null, title: 'Assalamu Alaikum', body: 'One home for your Salah, Quran, Duas and community. Built to help you grow a little every day.' },
  { key: 'prayer', Icon: BellRing, title: 'Never miss a prayer', body: 'Accurate times for wherever you are, Adhan notifications, and a tracker that celebrates every Salah.' },
  { key: 'quran', Icon: BookOpenText, title: 'Live with the Quran', body: 'Read with translation and recitation, pick up where you left off, and work towards your Khatam.' },
  { key: 'qibla', Icon: Compass, title: 'Qibla, mosques & more', body: 'A live Qibla compass, nearby mosques with jamaat times, Tasbih, 99 Names and a Kids zone.' },
  { key: 'ummah', Icon: HeartHandshake, title: 'Grow together', body: 'Streaks, levels and a friendly leaderboard. Share reflections and ask the Ummah to make dua for you.' },
] as const;

const SLIDE_FILLS = [tints.green, tints.gold, tints.teal, tints.blue, tints.rose];

function Slide({ index, scrollX, width, slide }: { index: number; scrollX: SharedValue<number>; width: number; slide: (typeof SLIDES)[number] }) {
  const { colors } = useAppTheme();
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  const art = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(scrollX.value, range, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, range, [0.6, 1, 0.6], Extrapolation.CLAMP) },
      { rotate: `${interpolate(scrollX.value, range, [-25, 0, 25], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollX.value, range, [30, 0, 30], Extrapolation.CLAMP) }],
  }));

  const Icon = slide.Icon;
  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.artWrap, art]}>
        {/* Hard shadow disc + outlined art disc */}
        <View style={[styles.artShadow, { backgroundColor: colors.ink }]} />
        <View style={[styles.artCircle, { backgroundColor: SLIDE_FILLS[index % SLIDE_FILLS.length], borderColor: colors.ink }]}>
          {Icon ? <Icon color={colors.ink} size={64} strokeWidth={2.2} /> : <UmmatiLogo size={110} />}
        </View>
      </Animated.View>
      <Animated.View style={text}>
        <Text style={[styles.title, { color: colors.onSky }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: colors.onSkyMuted }]}>{slide.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, scrollX, width, color, ink }: { index: number; scrollX: SharedValue<number>; width: number; color: string; ink: string }) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, range, [10, 30, 10], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color, borderColor: ink }, style]} />;
}

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const { continueAsGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const listRef = useRef<Animated.ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });

  const next = () => {
    if (isLast) return navigation.navigate('Auth', { mode: 'signup' });
    listRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <SkyBackground style={{ flex: 1 }} height={height}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Sparkles color={colors.accent} size={18} />
        <Text style={[styles.brand, { color: colors.onSky }]}>UMMATI</Text>
        <PressableScale onPress={() => navigation.navigate('Auth', { mode: 'signin' })} hitSlop={12}>
          <Text style={[styles.skip, { color: colors.onSkyMuted }]}>Sign in</Text>
        </PressableScale>
      </View>

      <Animated.ScrollView
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {SLIDES.map((s, i) => <Slide key={s.key} index={i} slide={s} scrollX={scrollX} width={width} />)}
      </Animated.ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => <Dot key={s.key} index={i} scrollX={scrollX} width={width} color={colors.accent} ink={colors.ink} />)}
        </View>
        <BrutalPressable onPress={next} fill={colors.accent} radius={20} style={styles.cta}>
          <Text style={[styles.ctaText, { color: colors.ink }]}>{isLast ? 'Create my account' : 'Continue'}</Text>
        </BrutalPressable>
        {isLast && (
          <PressableScale onPress={() => navigation.navigate('Auth', { mode: 'signin' })} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: colors.onSky }]}>I already have an account</Text>
          </PressableScale>
        )}
        <PressableScale
          onPress={async () => { if (!(await continueAsGuest()).success) navigation.navigate('Auth', { mode: 'signin' }); }}
          style={styles.guestLink}
        >
          <Text style={[styles.guestLinkText, { color: colors.onSkyMuted }]}>Continue as guest</Text>
        </PressableScale>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  brand: { fontSize: 15, fontWeight: '900', letterSpacing: 6 },
  skip: { fontSize: 15, fontWeight: '800' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  artWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  artShadow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, transform: [{ translateX: 6 }, { translateY: 6 }] },
  artCircle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.border },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  body: { fontSize: 16, fontWeight: '600', lineHeight: 24, textAlign: 'center', marginTop: 14 },
  bottom: { paddingHorizontal: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { height: 10, borderRadius: 5, borderWidth: 2 },
  cta: { height: 58, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '900' },
  secondary: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  secondaryText: { fontSize: 15, fontWeight: '800' },
  guestLink: { alignItems: 'center', paddingVertical: 10 },
  guestLinkText: { fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});
