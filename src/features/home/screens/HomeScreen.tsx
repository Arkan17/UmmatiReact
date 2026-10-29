import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { RUB_EL_HIZB } from '../../../core/components/UmmatiLogo';
import {
  BookOpen, Calendar, Check, ChevronRight, Compass, Flame, HandHeart, Landmark, Lock, Moon,
  Share2, Sparkles, Sun, Sunrise, Sunset, CloudSun, Baby, CircleDot, Coins, History, Utensils,
  Clock, Radio,
} from 'lucide-react-native';

import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useLocation } from '../../../core/hooks/useLocation';
import { useProgress } from '../../../core/hooks/useProgress';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, Card, PressableScale, ProgressBar, SectionHeader, SkyBackground, haptic } from '../../../core/components/ui';
import {
  PRAYERS, PrayerName, formatTime, getNextPrayer, getPrayerTimes, timeFor,
} from '../../../core/prayer/prayerTimes';
import { EMPTY_PRAYER_LOG, PrayerLog, getPrayerHistory, getPrayerLog, levelFor, logPrayer } from '../../../core/services/progress';
import { formatHijri, isRamadan, toHijri } from '../../../core/utils/hijri';
import { HaramainHeroCards } from '../components/HaramainLiveSection';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PRAYER_ICONS: Record<PrayerName, typeof Sun> = { Fajr: Sunrise, Dhuhr: Sun, Asr: CloudSun, Maghrib: Sunset, Isha: Moon };

const greetingFor = (period: string) =>
  period === 'fajr' ? 'Blessed morning' : period === 'isha' ? 'Peaceful night' : period === 'maghrib' ? 'Blessed evening' : 'Assalamu Alaikum';

function PrayerChip({ name, time, done, locked, isNext, onPress }: {
  name: PrayerName; time: Date; done: boolean; locked: boolean; isNext: boolean; onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const Icon = PRAYER_ICONS[name];
  const pop = useSharedValue(1);
  useEffect(() => {
    if (done) pop.value = withSequence(withSpring(1.18, { damping: 6 }), withSpring(1));
  }, [done, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const bg = done ? colors.primary : isNext ? colors.accent : colors.surfaceAlt;
  const fg = done || isNext ? colors.ink : colors.textSecondary;
  return (
    <PressableScale onPress={onPress} style={styles.chipWrap}>
      <Animated.View style={[styles.chipIcon, { backgroundColor: bg, borderColor: colors.ink }, popStyle]}>
        {done ? <Check color={fg} size={20} strokeWidth={3} /> : locked ? <Lock color={colors.textMuted} size={16} /> : <Icon color={fg} size={20} />}
      </Animated.View>
      <Text style={[styles.chipName, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.chipTime, { color: colors.textMuted }]}>{formatTime(time).replace(' ', '')}</Text>
    </PressableScale>
  );
}

function PulsingFlame({ active, color }: { active: boolean; color: string }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (active) s.value = withRepeat(withSequence(withTiming(1.15, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [active, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={style}><Flame color={color} fill={active ? color : 'transparent'} size={26} /></Animated.View>;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Self-ticking countdown, so only this Text re-renders every second instead of the whole Home screen. */
function Countdown({ target, onElapsed, style }: { target: Date; onElapsed: () => void; style: StyleProp<TextStyle> }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(0, target.getTime() - nowMs);
  useEffect(() => { if (remaining === 0) onElapsed(); }, [remaining === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const hh = Math.floor(remaining / 3_600_000);
  const mm = Math.floor((remaining / 60_000) % 60);
  const ss = Math.floor((remaining / 1000) % 60);
  return <Text style={style}>{pad(hh)}:{pad(mm)}:{pad(ss)}</Text>;
}

/** Text colour on the flat pastel cards (same in light and dark themes) */
const INK = '#1C1A17';

/** Faint Rub el Hizb watermark for colour cards. */
function StarWatermark({ size, color, style }: { size: number; color: string; style?: object }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Path d={RUB_EL_HIZB} fill="none" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Flat colour card with ink outline + hard shadow. */
function ColorCard({ fill, style, children }: { fill: string; style?: object; children: React.ReactNode }) {
  return (
    <BrutalBox fill={fill} radius={22} style={[styles.colorCard, style]}>
      {children}
    </BrutalBox>
  );
}

const TOOLS: { key: string; label: string; Icon: typeof Sun; tint: string; route: keyof RootStackParamList | 'QuranTab' | 'CommunityTab' }[] = [
  { key: 'quran', label: 'Quran', Icon: BookOpen, tint: tints.green, route: 'QuranTab' },
  { key: 'qibla', label: 'Qibla', Icon: Compass, tint: tints.blue, route: 'Qibla' },
  { key: 'tasbih', label: 'Tasbih', Icon: CircleDot, tint: tints.violet, route: 'Tasbih' },
  { key: 'duas', label: 'Duas', Icon: HandHeart, tint: tints.gold, route: 'Duas' },
  { key: 'names', label: '99 Names', Icon: Sparkles, tint: tints.rose, route: 'NamesOfAllah' },
  { key: 'mosques', label: 'Mosques', Icon: Landmark, tint: tints.teal, route: 'Mosque' },
  { key: 'calendar', label: 'Calendar', Icon: Calendar, tint: tints.indigo, route: 'Calendar' },
  { key: 'zakat', label: 'Zakat', Icon: Coins, tint: tints.gold, route: 'ZakatCalculator' },
  { key: 'qada', label: 'Qada', Icon: History, tint: tints.rose, route: 'QadaTracker' },
  { key: 'fasting', label: 'Fasting', Icon: Utensils, tint: tints.teal, route: 'FastingHub' },
  { key: 'kids', label: 'Kids', Icon: Baby, tint: tints.orange, route: 'KidsSection' },
  { key: 'live', label: 'Live', Icon: Radio, tint: tints.blue, route: 'LiveStreams' },
];

export function HomeScreen() {
  useScreenTime('Home');
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, period } = useAppTheme();
  const { progress, refresh: refreshProgress } = useProgress();
  const { latitude, longitude, refreshLocation } = useLocation();
  const { content, refresh: refreshContent } = useDynamicContent();

  const [now, setNow] = useState(new Date());
  const [log, setLog] = useState<PrayerLog>(EMPTY_PRAYER_LOG);
  const [week, setWeek] = useState<{ key: string; date: Date; count: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // The ring and prayer chips only need minute precision; <Countdown> handles the seconds.
  const tick = useCallback(() => setNow(new Date()), []);
  useEffect(() => {
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [tick]);

  const loadDay = useCallback(async () => {
    const [today, history] = await Promise.all([getPrayerLog(), getPrayerHistory(7)]);
    setLog(today);
    setWeek(history);
  }, []);

  useFocusEffect(useCallback(() => { loadDay(); }, [loadDay]));

  const times = useMemo(() => getPrayerTimes(latitude, longitude, now), [latitude, longitude, now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = useMemo(() => getNextPrayer(latitude, longitude, now), [latitude, longitude, now]);
  const hijri = useMemo(() => toHijri(now), [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const verse = useMemo(() => {
    const list = content.verses_of_the_day ?? [];
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000);
    return list[dayOfYear % Math.max(list.length, 1)];
  }, [content, now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = PRAYERS.filter((p) => log[p]).length;
  const { level, intoLevel, progress: levelProgress } = levelFor(progress.total_xp);

  const onPrayerPress = async (name: PrayerName) => {
    if (log[name]) return;
    const at = timeFor(times, name);
    // Fresh clock: `now` only ticks every 30s, which could wrongly say "Not yet" right at prayer time
    if (new Date() < at) {
      haptic.medium();
      Alert.alert('Not yet', `${name} begins at ${formatTime(at)}. Come back then to mark it.`);
      return;
    }
    haptic.success();
    const optimistic = { ...log, [name]: true };
    setLog(optimistic);
    try {
      const saved = await logPrayer(name, log);
      setLog(saved);
      if (PRAYERS.every((p) => saved[p])) {
        Alert.alert('MashaAllah! 🌙', 'All five prayers completed today. +25 bonus XP');
      }
      loadDay();
    } catch {
      setLog(log);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshLocation(), loadDay(), refreshProgress(), refreshContent()]);
    setRefreshing(false);
  };

  const shareVerse = () => {
    if (!verse) return;
    Share.share({ message: `${verse.arabic}\n\n"${verse.translation}"\n— ${verse.reference}\n\nShared from Ummati` });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.onSky} />}
    >
      {/* ── Hero: Time-of-day sky with compact Next Prayer Timer + Cute Haramain Live ── */}
      <SkyBackground height={355} horizon={1} style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        {/* Header: date + greeting on the left, level/profile badge on the right */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hijri, { color: colors.onSkyMuted }]} numberOfLines={1}>{formatHijri(hijri)}</Text>
            <Text style={[styles.greeting, { color: colors.onSky }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {greetingFor(period)}, {user?.username?.split(' ')[0] ?? 'friend'}
            </Text>
          </View>
          <BrutalPressable
            onPress={() => navigation.navigate('ProfileTab' as never)}
            fill={colors.glass}
            radius={14}
            offset={brutal.shadowSmall}
            borderWidth={brutal.borderThin}
            style={styles.levelBadge}
          >
            <Sparkles color={colors.onSky} size={13} strokeWidth={2.4} />
            <Text style={[styles.levelBadgeText, { color: colors.onSky }]}>Lv {level}</Text>
          </BrutalPressable>
        </Animated.View>

        {/* Next prayer: name + time on the left, live countdown on the right, day times underneath */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <BrutalPressable
            onPress={() => navigation.navigate('PrayerTimes' as never)}
            fill={colors.accent}
            radius={20}
            offset={brutal.shadowSmall}
            borderWidth={brutal.borderThin}
            style={styles.nextCard}
          >
            <View style={styles.rowBetween}>
              <View>
                <View style={styles.nextLabelRow}>
                  <Clock color={INK} size={12} strokeWidth={2.6} />
                  <Text style={styles.nextLabel}>{next.isTomorrow ? 'TOMORROW' : 'NEXT PRAYER'}</Text>
                </View>
                <Text style={styles.nextPrayer}>{next.name}</Text>
                <Text style={styles.nextAt}>at {formatTime(next.time)}</Text>
              </View>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>STARTS IN</Text>
                <Countdown target={next.time} onElapsed={tick} style={styles.countdown} />
              </View>
            </View>
            <View style={styles.nextDivider} />
            <View style={styles.rowBetween}>
              <Text style={styles.nextFooterText} numberOfLines={1}>
                {isRamadan(hijri) ? `🌙 Ramadan Mubarak · Iftar ${formatTime(times.maghrib)}` : `☀️ Sunrise ${formatTime(times.sunrise)}   🌅 Maghrib ${formatTime(times.maghrib)}`}
              </Text>
              <ChevronRight color={INK} size={18} strokeWidth={2.6} />
            </View>
          </BrutalPressable>
        </Animated.View>

        {/* Haramain live streams */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.heroLiveRow}>
          <HaramainHeroCards />
        </Animated.View>
      </SkyBackground>

      <View style={styles.body}>
        {/* ── Today's Salah tracker ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <Card style={styles.overlapCard}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Salah</Text>
              <View style={[styles.countPill, { backgroundColor: colors.primary, borderColor: colors.ink }]}>
                <Text style={[styles.cardMeta, { color: colors.onPrimary }]}>{doneCount}/5</Text>
              </View>
            </View>
            <View style={styles.chipsRow}>
              {PRAYERS.map((p) => (
                <PrayerChip
                  key={p}
                  name={p}
                  time={timeFor(times, p)}
                  done={log[p]}
                  locked={now < timeFor(times, p)}
                  isNext={!next.isTomorrow && next.name === p}
                  onPress={() => onPrayerPress(p)}
                />
              ))}
            </View>
            <ProgressBar value={doneCount / 5} color={colors.primary} track={colors.surfaceAlt} />
          </Card>
        </Animated.View>

        {/* ── Streak + level ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(300)} style={styles.statsRow}>
          <ColorCard fill={tints.orange} style={styles.statCard}>
            <StarWatermark size={120} color="rgba(28,26,23,0.10)" style={{ right: -30, top: -30 }} />
            <View style={styles.rowBetween}>
              <PulsingFlame active={progress.streak_count > 0} color={INK} />
              <Text style={styles.statBig}>{progress.streak_count}</Text>
            </View>
            <Text style={styles.statLabel}>day streak</Text>
            <View style={styles.weekRow}>
              {week.map((d) => (
                <View key={d.key} style={styles.weekCol}>
                  <View style={styles.weekBar}>
                    <View style={[styles.weekFill, { height: `${(d.count / 5) * 100}%` }]} />
                  </View>
                  <Text style={styles.weekDay}>{d.date.toLocaleDateString([], { weekday: 'narrow' })}</Text>
                </View>
              ))}
            </View>
          </ColorCard>
          <ColorCard fill={tints.violet} style={styles.statCard}>
            <StarWatermark size={120} color="rgba(28,26,23,0.10)" style={{ right: -30, top: -30 }} />
            <View style={styles.rowBetween}>
              <Sparkles color={INK} size={24} />
              <Text style={styles.statBig}>{level}</Text>
            </View>
            <Text style={styles.statLabel}>level · {progress.total_xp} XP</Text>
            <View style={{ marginTop: 'auto' }}>
              <ProgressBar value={levelProgress} color={tints.gold} track="#FFFAF1" />
              <Text style={styles.statHint}>{500 - intoLevel} XP to level {level + 1}</Text>
            </View>
          </ColorCard>
        </Animated.View>

        {/* ── Continue reading ── */}
        {progress.last_read_surah ? (
          <Animated.View entering={FadeInDown.delay(170).duration(300)}>
            <BrutalPressable onPress={() => navigation.navigate('QuranReading', { surahNumber: progress.last_read_surah! })} fill={tints.green} radius={22} style={[styles.colorCard, styles.continueCard]}>
                <StarWatermark size={140} color="rgba(28,26,23,0.10)" style={{ right: -20, top: -40 }} />
                <View style={styles.continueIcon}><BookOpen color={INK} size={24} strokeWidth={2.4} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.continueLabel}>CONTINUE READING</Text>
                  <Text style={styles.continueTitle}>
                    Surah {progress.last_read_surah} · Ayah {progress.last_read_ayah ?? 1}
                  </Text>
                </View>
                <ChevronRight color={INK} size={22} strokeWidth={2.6} />
            </BrutalPressable>
          </Animated.View>
        ) : null}

        {/* ── Tools ── */}
        <SectionHeader title="Explore" />
        <View style={styles.grid}>
          {TOOLS.map((t, i) => (
            <Animated.View key={t.key} entering={FadeInDown.delay(200 + i * 25).duration(300)} style={styles.gridCell}>
              <BrutalPressable onPress={() => navigation.navigate(t.route as never)} fill={t.tint} radius={18} offset={brutal.shadowSmall} style={styles.toolIcon}>
                <t.Icon color={INK} size={24} strokeWidth={2.3} />
              </BrutalPressable>
              <Text style={[styles.toolLabel, { color: colors.text }]} numberOfLines={1}>{t.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ── Verse of the day ── */}
        {verse && (
          <>
            <SectionHeader title="Verse of the day" />
            <Animated.View entering={FadeInDown.delay(220).duration(300)}>
              <ColorCard fill="#27493D">
                <StarWatermark size={220} color="rgba(253,230,138,0.10)" style={{ left: -60, bottom: -70 }} />
                <StarWatermark size={110} color="rgba(253,230,138,0.12)" style={{ right: -24, top: -24 }} />
                <Text style={styles.verseKicker}>✦ AYAH OF THE DAY</Text>
                <Text style={styles.arabic}>{verse.arabic}</Text>
                <Text style={styles.translation}>"{verse.translation}"</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.reference}>{verse.reference}</Text>
                  <BrutalPressable onPress={shareVerse} fill="#E6D3A0" radius={12} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.shareBtn}>
                    <Share2 color={INK} size={16} />
                    <Text style={styles.shareText}>Share</Text>
                  </BrutalPressable>
                </View>
              </ColorCard>
            </Animated.View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingBottom: 68, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, borderBottomWidth: brutal.border, borderColor: INK },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  hijri: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.4 },
  greeting: { fontSize: 22, fontWeight: '900', marginTop: 2, letterSpacing: -0.3 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7 },
  levelBadgeText: { fontSize: 13, fontWeight: '900' },
  nextCard: { marginTop: 14, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  nextLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nextLabel: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.2, color: INK },
  nextPrayer: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: INK, marginTop: 2 },
  nextAt: { fontSize: 12, fontWeight: '700', color: 'rgba(28,26,23,0.75)' },
  countdownBox: { alignItems: 'center', backgroundColor: '#FFFAF1', borderWidth: brutal.borderThin, borderColor: INK, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  countdownLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: 'rgba(28,26,23,0.65)' },
  countdown: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'], color: INK, marginTop: 1 },
  nextDivider: { height: 1.5, backgroundColor: 'rgba(28,26,23,0.18)', marginVertical: 9 },
  nextFooterText: { flex: 1, fontSize: 12.5, fontWeight: '800', color: INK },
  heroLiveRow: { marginTop: 16 },
  body: { paddingHorizontal: 18 },
  overlapCard: { marginTop: -22 },
  colorCard: { padding: 16, overflow: 'hidden' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  cardMeta: { fontSize: 14, fontWeight: '900' },
  countPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: brutal.borderThin },
  chipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  chipWrap: { alignItems: 'center', width: 58 },
  chipIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  chipName: { fontSize: 12.5, fontWeight: '800', marginTop: 6 },
  chipTime: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 18 },
  statCard: { flex: 1, minHeight: 150 },
  statBig: { fontSize: 34, fontWeight: '900', color: INK },
  statLabel: { fontSize: 13, fontWeight: '800', marginTop: 2, color: INK },
  statHint: { fontSize: 11, fontWeight: '800', marginTop: 6, color: 'rgba(28,26,23,0.75)' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 },
  weekCol: { alignItems: 'center', gap: 4 },
  weekBar: { width: 10, height: 34, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#FFFAF1', borderWidth: 1.5, borderColor: INK },
  weekFill: { width: '100%', backgroundColor: INK },
  weekDay: { fontSize: 10, fontWeight: '900', color: INK },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  continueIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAF1', borderWidth: brutal.borderThin, borderColor: INK },
  continueLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: 'rgba(28,26,23,0.7)' },
  continueTitle: { fontSize: 17, fontWeight: '900', marginTop: 2, color: INK },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridCell: { width: '25%', padding: 6, alignItems: 'center' },
  toolIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 12, fontWeight: '800', marginTop: 9 },
  verseKicker: { fontSize: 11, fontWeight: '900', letterSpacing: 2, color: '#E6D3A0', marginBottom: 12 },
  arabic: { fontSize: 26, lineHeight: 46, textAlign: 'right', fontFamily: 'Georgia', color: '#E6D3A0' },
  translation: { fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.88)' },
  reference: { fontSize: 13, fontWeight: '800', color: '#B5D6C8' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36 },
  shareText: { fontSize: 13, fontWeight: '900', color: INK },
});
