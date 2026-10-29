import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, LinearTransition } from 'react-native-reanimated';
import { Bell, BellOff, Check, ChevronLeft, CloudSun, Compass, MapPin, Moon, Sun, Sunrise, Sunset } from 'lucide-react-native';
import { useLocation } from '../../../core/hooks/useLocation';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalBox, BrutalPressable, GlassCard, HeaderButton, PressableScale, SkyBackground, haptic, outline } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';
import { calculateQiblaDirection } from '../../../core/utils/QiblaCalculator';
import { formatHijri, toHijri } from '../../../core/utils/hijri';
import { PrayerName, ReminderName, formatTime, getNextPrayer, getPrayerTimes, localDateKey, timeFor } from '../../../core/prayer/prayerTimes';
import { EMPTY_PRAYER_LOG, PrayerLog, getPrayerLog, logPrayer } from '../../../core/services/progress';
import { DEFAULT_REMINDERS, ReminderSettings, loadReminderSettings, saveReminderSettings } from '../../../core/notifications/prayerNotifications';

const ROWS: { name: ReminderName; Icon: typeof Sun }[] = [
  { name: 'Fajr', Icon: Sunrise },
  { name: 'Sunrise', Icon: Sun },
  { name: 'Dhuhr', Icon: Sun },
  { name: 'Asr', Icon: CloudSun },
  { name: 'Maghrib', Icon: Sunset },
  { name: 'Isha', Icon: Moon },
];

export function PrayerTimesScreen() {
  useScreenTime('PrayerTimesDetail');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { latitude, longitude, isUsingFallback } = useLocation();

  const [offset, setOffset] = useState(0); // days from today
  const [log, setLog] = useState<PrayerLog>(EMPTY_PRAYER_LOG);
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 1); // yesterday … +5
    return d;
  }), []);
  const date = days[offset + 1];
  const isToday = offset === 0;

  const times = useMemo(() => getPrayerTimes(latitude, longitude, date), [latitude, longitude, date]);
  const next = useMemo(() => getNextPrayer(latitude, longitude), [latitude, longitude]);
  const qibla = Math.round(calculateQiblaDirection(latitude, longitude));

  useFocusEffect(useCallback(() => { loadReminderSettings().then(setReminders); }, []));
  useEffect(() => {
    if (offset <= 0) getPrayerLog(localDateKey(date)).then(setLog);
    else setLog(EMPTY_PRAYER_LOG);
  }, [offset, date]);

  const toggleReminder = async (name: ReminderName) => {
    haptic.select();
    const updated = { ...reminders, [name]: !reminders[name] };
    setReminders(updated);
    await saveReminderSettings(updated);
  };

  const markPrayed = async (name: PrayerName) => {
    if (!isToday || log[name]) return;
    const at = timeFor(times, name);
    if (new Date() < at) {
      Alert.alert('Not yet', `${name} begins at ${formatTime(at)}.`);
      return;
    }
    haptic.success();
    setLog({ ...log, [name]: true });
    setLog(await logPrayer(name, log));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SkyBackground height={330} horizon={1} style={[styles.hero, { paddingTop: insets.top + 8, borderColor: colors.ink }]}>
        <View style={styles.topRow}>
          <HeaderButton onPress={() => navigation.goBack()}>
            <ChevronLeft color={colors.onSky} size={22} strokeWidth={2.6} />
          </HeaderButton>
          <Text style={[styles.title, { color: colors.onSky }]}>Prayer Times</Text>
          <View style={styles.iconBtn} />
        </View>

        <Text style={[styles.hijri, { color: colors.onSkyMuted }]}>{formatHijri(toHijri(date))}</Text>
        <Text style={[styles.gregorian, { color: colors.onSky }]}>
          {date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        <View style={styles.metaRow}>
          <GlassCard style={styles.metaPill}>
            <MapPin color={colors.onSky} size={14} />
            <Text style={[styles.metaText, { color: colors.onSky }]}>{isUsingFallback ? 'Default location' : 'Your location'}</Text>
          </GlassCard>
          <GlassCard style={styles.metaPill}>
            <Compass color={colors.onSky} size={14} />
            <Text style={[styles.metaText, { color: colors.onSky }]}>Qibla {qibla}°</Text>
          </GlassCard>
        </View>
      </SkyBackground>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {days.map((d, i) => {
            const active = i - 1 === offset;
            return (
              <Animated.View key={d.toDateString()} entering={FadeInRight.delay(i * 40)}>
                <BrutalPressable
                  onPress={() => { haptic.select(); setOffset(i - 1); }}
                  hapticOnPress={false}
                  fill={active ? colors.primary : colors.surface}
                  radius={18}
                  offset={active ? brutal.shadow : brutal.shadowSmall}
                  borderWidth={brutal.borderThin}
                  style={styles.day}
                >
                  <Text style={[styles.dayLabel, { color: active ? colors.onPrimary : colors.textMuted }]}>
                    {i === 1 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayNum, { color: active ? colors.onPrimary : colors.text }]}>{d.getDate()}</Text>
                </BrutalPressable>
              </Animated.View>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 18 }}>
          {ROWS.map(({ name, Icon }, i) => {
            const at = timeFor(times, name);
            const isPrayer = name !== 'Sunrise';
            const done = isPrayer && log[name as PrayerName];
            const highlighted = isToday && !next.isTomorrow && next.name === name;
            return (
              <Animated.View key={name} entering={FadeInDown.delay(80 + i * 50)} layout={LinearTransition}>
                <BrutalBox fill={highlighted ? colors.accentSoft : colors.surface} offset={highlighted ? brutal.shadow : brutal.shadowSmall} style={styles.row}>
                  <View style={[styles.rowIcon, outline(colors), { backgroundColor: highlighted ? colors.accent : colors.surfaceAlt }]}>
                    <Icon color={highlighted ? colors.ink : colors.text} size={20} strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.text }]}>{name}</Text>
                    {highlighted && <Text style={[styles.rowSub, { color: colors.text }]}>UP NEXT</Text>}
                  </View>
                  <Text style={[styles.rowTime, { color: colors.text }]}>{formatTime(at)}</Text>

                  <PressableScale onPress={() => toggleReminder(name)} hapticOnPress={false} hitSlop={8} style={styles.rowAction}>
                    {reminders[name] ? <Bell color={colors.text} fill={colors.accent} size={20} /> : <BellOff color={colors.textMuted} size={20} />}
                  </PressableScale>

                  {isPrayer && offset <= 0 && (
                    <PressableScale
                      onPress={() => markPrayed(name as PrayerName)}
                      style={[styles.check, { backgroundColor: done ? colors.primary : colors.surface, borderColor: colors.ink }]}
                    >
                      {done && <Check color={colors.onPrimary} size={16} strokeWidth={3} />}
                    </PressableScale>
                  )}
                </BrutalBox>
              </Animated.View>
            );
          })}
          <Text style={[styles.footnote, { color: colors.textMuted }]}>
            Tap the bell to toggle Adhan notifications. Times use the Karachi method (Shafi Asr).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 64, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, borderBottomWidth: brutal.border },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 42, height: 42 },
  title: { fontSize: 20, fontWeight: '900' },
  hijri: { fontSize: 13, fontWeight: '700', marginTop: 22, letterSpacing: 0.3 },
  gregorian: { fontSize: 28, fontWeight: '900', marginTop: 4, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  metaText: { fontSize: 13, fontWeight: '800' },
  days: { paddingHorizontal: 18, paddingVertical: 18, gap: 10 },
  day: { width: 58, height: 72, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 12, fontWeight: '800' },
  dayNum: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 16, fontWeight: '900' },
  rowSub: { fontSize: 11, fontWeight: '900', marginTop: 1, letterSpacing: 0.8 },
  rowTime: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rowAction: { padding: 4 },
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: brutal.borderThin, alignItems: 'center', justifyContent: 'center' },
  footnote: { fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
