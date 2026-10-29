import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Moon,
  Sunrise,
  Sunset,
  Flame,
  CheckCircle,
  Sparkles,
  Share2,
  Calendar,
  Utensils,
  Trophy,
  Award,
  Heart,
  HelpCircle,
  X,
} from 'lucide-react-native';

import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import {
  BrutalBox,
  BrutalPressable,
  Card,
  GlassCard,
  HeaderButton,
  PressableScale,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
  haptic,
  outline,
} from '../../../core/components/ui';
import { useLocation } from '../../../core/hooks/useLocation';
import { formatTime, localDateKey } from '../../../core/prayer/prayerTimes';
import {
  DEFAULT_FASTING_STATE,
  FAST_TYPE_LABELS,
  FastingState,
} from '../types';
import {
  getRecommendedFastType,
  getSuhoorIftarTimes,
  loadFastingState,
  toggleFastForDate,
} from '../utils/fastingStorage';

const INK = '#1C1A17';

const pad = (n: number) => String(n).padStart(2, '0');

export function FastingHubScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { latitude, longitude } = useLocation();

  const [state, setState] = useState<FastingState>(DEFAULT_FASTING_STATE);
  const [now, setNow] = useState(new Date());
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Load saved state
  useEffect(() => {
    loadFastingState().then(setState);
  }, []);

  // Tick every second for smooth countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateString = now.toDateString();
  const todayKey = useMemo(() => localDateKey(now), [dateString]); // eslint-disable-line react-hooks/exhaustive-deps
  const isFastedToday = !!state.logs[todayKey]?.completed;
  const recommendedType = useMemo(() => getRecommendedFastType(now), [dateString]); // eslint-disable-line react-hooks/exhaustive-deps
  const typeMeta = FAST_TYPE_LABELS[recommendedType];

  const timesInfo = useMemo(
    () => getSuhoorIftarTimes(latitude, longitude, now),
    [latitude, longitude, now],
  );

  const remaining = timesInfo.remainingMs;
  const hh = Math.floor(remaining / 3_600_000);
  const mm = Math.floor((remaining / 60_000) % 60);
  const ss = Math.floor((remaining / 1000) % 60);
  const formattedCountdown = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;

  const totalCompletedFasts = useMemo(() => {
    return Object.values(state.logs).filter((l) => l.completed).length;
  }, [state.logs]);

  // Last 7 days status for mini habit calendar
  const pastSevenDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = localDateKey(d);
      const isLogged = !!state.logs[key]?.completed;
      return {
        date: d,
        key,
        dayName: d.toLocaleDateString([], { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isLogged,
        isToday: key === todayKey,
      };
    });
  }, [dateString, state.logs, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleToday = async () => {
    haptic.success();
    const updated = await toggleFastForDate(state, now, recommendedType);
    setState(updated);
    if (!isFastedToday) {
      Alert.alert(
        'MashaAllah! 🌙',
        'Today has been marked as a completed fast. +20 XP awarded!',
      );
    }
  };

  const handleShareIftarDua = () => {
    Share.share({
      message: `Iftar Dua:\n\nذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ\n\n"The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills." [Abu Dawood]\n\nShared from Ummati`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="Fasting Hub"
          subtitle="Suhoor & Iftar countdowns · Track voluntary fasts"
          onBack={() => navigation.goBack()}
          right={
            <HeaderButton onPress={() => setShowGuideModal(true)}>
              <HelpCircle color={colors.onSky} size={20} />
            </HeaderButton>
          }
        >
          <View style={styles.heroRow}>
            <GlassCard style={styles.heroPill}>
              <Sparkles color={colors.onSky} size={14} />
              <Text style={[styles.heroPillText, { color: colors.onSky }]}>
                {typeMeta.badge} · {typeMeta.label}
              </Text>
            </GlassCard>
          </View>
        </ScreenHeader>

        <View style={styles.body}>
          {/* Main Countdown & Status Card */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <BrutalBox
              radius={24}
              fill={timesInfo.isFastingWindow ? '#27493D' : tints.gold}
              style={styles.heroCard}
            >
              <View style={styles.heroCardTop}>
                <View>
                  <Text
                    style={[
                      styles.heroKicker,
                      { color: timesInfo.isFastingWindow ? '#E6D3A0' : INK },
                    ]}
                  >
                    {timesInfo.isFastingWindow ? '✦ CURRENTLY FASTING' : '🌙 SUHOOR COUNTDOWN'}
                  </Text>
                  <Text
                    style={[
                      styles.heroBigTimer,
                      { color: timesInfo.isFastingWindow ? '#FFFFFF' : INK },
                    ]}
                  >
                    {formattedCountdown}
                  </Text>
                  <Text
                    style={[
                      styles.heroSubText,
                      { color: timesInfo.isFastingWindow ? '#B5D6C8' : 'rgba(28,26,23,0.75)' },
                    ]}
                  >
                    {timesInfo.isFastingWindow
                      ? `until Iftar at ${formatTime(timesInfo.iftarStart)}`
                      : `until Suhoor ends (Fajr) at ${formatTime(timesInfo.suhoorEnd)}`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.timeIconTile,
                    {
                      backgroundColor: timesInfo.isFastingWindow ? '#E6D3A0' : '#FFFAF1',
                      borderColor: INK,
                    },
                  ]}
                >
                  {timesInfo.isFastingWindow ? (
                    <Sunset color={INK} size={26} strokeWidth={2.4} />
                  ) : (
                    <Sunrise color={INK} size={26} strokeWidth={2.4} />
                  )}
                </View>
              </View>

              {/* Progress bar during fast */}
              {timesInfo.isFastingWindow && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressRow}>
                    <Text style={styles.timeLabel}>
                      Suhoor Closed {formatTime(timesInfo.suhoorEnd)}
                    </Text>
                    <Text style={styles.timeLabel}>
                      Iftar {formatTime(timesInfo.iftarStart)}
                    </Text>
                  </View>
                  <ProgressBar
                    value={timesInfo.progressRatio}
                    color="#E6D3A0"
                    track="rgba(0,0,0,0.25)"
                    height={7}
                  />
                </View>
              )}

              {/* Check-in / Toggle Button */}
              <BrutalPressable
                onPress={handleToggleToday}
                fill={isFastedToday ? colors.primary : '#FFFAF1'}
                radius={16}
                offset={brutal.shadowSmall}
                borderWidth={brutal.borderThin}
                style={styles.checkInBtn}
              >
                {isFastedToday ? (
                  <>
                    <CheckCircle color={colors.onPrimary} size={19} strokeWidth={2.5} />
                    <Text style={[styles.checkInBtnText, { color: colors.onPrimary }]}>
                      Fasted Today · MashaAllah (+20 XP)
                    </Text>
                  </>
                ) : (
                  <>
                    <Utensils color={INK} size={18} strokeWidth={2.4} />
                    <Text style={[styles.checkInBtnText, { color: INK }]}>
                      Mark Today as Fasted
                    </Text>
                  </>
                )}
              </BrutalPressable>
            </BrutalBox>
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <View
                style={[
                  styles.statIconBox,
                  outline(colors),
                  { backgroundColor: tints.orange },
                ]}
              >
                <Flame color={INK} size={18} strokeWidth={2.5} />
              </View>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {state.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Day Streak
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View
                style={[
                  styles.statIconBox,
                  outline(colors),
                  { backgroundColor: tints.teal },
                ]}
              >
                <Trophy color={INK} size={18} strokeWidth={2.5} />
              </View>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {totalCompletedFasts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Total Fasts
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View
                style={[
                  styles.statIconBox,
                  outline(colors),
                  { backgroundColor: tints.violet },
                ]}
              >
                <Award color={INK} size={18} strokeWidth={2.5} />
              </View>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {state.bestStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Best Streak
              </Text>
            </Card>
          </View>

          {/* Past 7 Days Habit Tracker */}
          <SectionHeader title="Recent Activity" />
          <Card style={styles.weekCard}>
            <Text style={[styles.weekCardTitle, { color: colors.text }]}>
              Past 7 Days
            </Text>
            <View style={styles.weekGrid}>
              {pastSevenDays.map((d) => (
                <View key={d.key} style={styles.weekCol}>
                  <Text style={[styles.weekDayLabel, { color: colors.textMuted }]}>
                    {d.dayName}
                  </Text>
                  <View
                    style={[
                      styles.weekCircle,
                      outline(colors),
                      {
                        backgroundColor: d.isLogged
                          ? colors.primary
                          : d.isToday
                          ? colors.accentSoft
                          : colors.surfaceAlt,
                      },
                    ]}
                  >
                    {d.isLogged ? (
                      <CheckCircle color={colors.onPrimary} size={16} strokeWidth={2.5} />
                    ) : (
                      <Text style={[styles.weekDayNum, { color: colors.text }]}>
                        {d.dayNum}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Sunnah Fasting Days Guide */}
          <SectionHeader title="Blessed Sunnah Fasts" />
          <Card style={styles.sunnahCard}>
            <View style={styles.sunnahRow}>
              <View
                style={[
                  styles.sunnahBadge,
                  outline(colors),
                  { backgroundColor: tints.green },
                ]}
              >
                <Calendar color={INK} size={16} strokeWidth={2.5} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.sunnahTitle, { color: colors.text }]}>
                  Mondays & Thursdays
                </Text>
                <Text style={[styles.sunnahDesc, { color: colors.textSecondary }]}>
                  "Deeds are shown (to Allah) on Mondays and Thursdays, and I love for my deeds
                  to be shown while I am fasting." [At-Tirmidhi]
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.sunnahRow}>
              <View
                style={[
                  styles.sunnahBadge,
                  outline(colors),
                  { backgroundColor: tints.blue },
                ]}
              >
                <Moon color={INK} size={16} strokeWidth={2.5} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.sunnahTitle, { color: colors.text }]}>
                  White Days (Ayyam al-Bid)
                </Text>
                <Text style={[styles.sunnahDesc, { color: colors.textSecondary }]}>
                  13th, 14th, and 15th of each lunar month. Fasting these 3 days carries the
                  reward of fasting the entire lifetime!
                </Text>
              </View>
            </View>
          </Card>

          {/* Iftar Dua Card */}
          <SectionHeader title="Essential Fasting Duas" />
          <Card style={styles.duaCard}>
            <View style={styles.duaHeaderRow}>
              <View
                style={[
                  styles.duaIconBox,
                  outline(colors),
                  { backgroundColor: tints.rose },
                ]}
              >
                <Heart color={INK} size={18} strokeWidth={2.4} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.duaTitle, { color: colors.text }]}>
                  Dua for Breaking Fast (Iftar)
                </Text>
                <Text style={[styles.duaSource, { color: colors.textMuted }]}>
                  Sunan Abu Dawood
                </Text>
              </View>
              <BrutalPressable
                onPress={handleShareIftarDua}
                fill={colors.accent}
                radius={12}
                offset={brutal.shadowSmall}
                borderWidth={brutal.borderThin}
                style={styles.shareBtn}
              >
                <Share2 color={INK} size={14} />
                <Text style={styles.shareBtnText}>Share</Text>
              </BrutalPressable>
            </View>

            <Text style={styles.arabicText}>
              ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ
            </Text>

            <Text style={[styles.transliterationText, { color: colors.textSecondary }]}>
              Dhahaba al-zama'u wabtallat al-'urooq wa thabata al-ajru in sha' Allah
            </Text>

            <Text style={[styles.translationText, { color: colors.text }]}>
              "The thirst is gone, the veins are moistened, and the reward is confirmed, if
              Allah wills."
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Fiqh & Guidelines Modal */}
      <Modal
        visible={showGuideModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGuideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Fasting Guidelines & Sunnahs
              </Text>
              <PressableScale onPress={() => setShowGuideModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>

            <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.guideHeading, { color: colors.text }]}>
                1. What Breaks the Fast?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                Intentional eating, drinking, smoking, and sexual relations between the break
                of dawn (Fajr) and sunset (Maghrib).
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                2. What Does NOT Break the Fast?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                • Eating or drinking forgetfully (continue the fast!){'\n'}
                • Using eye drops, ear drops, or injections not for nourishment{'\n'}
                • Rinsing the mouth or using the Miswak / toothbrush without swallowing{'\n'}
                • Blood tests and involuntary vomiting
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                3. Sunnahs of Suhoor & Iftar
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                • Delay Suhoor until close to Fajr (there is Barakah in Suhoor){'\n'}
                • Hasten Iftar as soon as the sun sets (Maghrib begins){'\n'}
                • Break the fast with fresh dates, dried dates, or water{'\n'}
                • Supplicate at the time of Iftar — the dua of a fasting person is answered!
              </Text>
            </ScrollView>
          </BrutalBox>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {},
  body: { paddingHorizontal: 16, paddingTop: 16 },
  heroRow: { flexDirection: 'row', marginTop: 14 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  heroPillText: { fontSize: 12.5, fontWeight: '800' },
  heroCard: { padding: 18, marginBottom: 14 },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroKicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  heroBigTimer: { fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  heroSubText: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  timeIconTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: brutal.borderThin,
  },
  progressContainer: { marginTop: 16, marginBottom: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  timeLabel: { fontSize: 11, fontWeight: '800', color: '#B5D6C8' },
  checkInBtn: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  checkInBtnText: { fontSize: 14, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 12, alignItems: 'center' },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '900', marginTop: 6 },
  statLabel: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  weekCard: { padding: 16, marginBottom: 14 },
  weekCardTitle: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCol: { alignItems: 'center', gap: 6 },
  weekDayLabel: { fontSize: 11, fontWeight: '800' },
  weekCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNum: { fontSize: 13, fontWeight: '900' },
  sunnahCard: { padding: 14, marginBottom: 14 },
  sunnahRow: { flexDirection: 'row', gap: 12 },
  sunnahBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunnahTitle: { fontSize: 14, fontWeight: '900' },
  sunnahDesc: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  divider: { height: 1, marginVertical: 12, opacity: 0.15 },
  duaCard: { padding: 16, marginBottom: 20 },
  duaHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  duaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duaTitle: { fontSize: 14.5, fontWeight: '900' },
  duaSource: { fontSize: 11.5, fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
  },
  shareBtnText: { fontSize: 12, fontWeight: '900', color: INK },
  arabicText: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    fontFamily: 'Georgia',
    color: '#0E9F6E',
    marginVertical: 10,
  },
  transliterationText: { fontSize: 13, fontStyle: 'italic', lineHeight: 19, marginBottom: 6 },
  translationText: { fontSize: 13.5, fontWeight: '700', lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '85%',
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 19, fontWeight: '900' },
  guideScroll: { maxHeight: 420 },
  guideHeading: { fontSize: 14, fontWeight: '900', marginTop: 12, marginBottom: 4 },
  guideText: { fontSize: 12.5, lineHeight: 19 },
});
