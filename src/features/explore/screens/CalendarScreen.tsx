import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { CalendarDays, ChevronLeft, ChevronRight, Moon, Sparkles, Star } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { Card, GlassCard, PressableScale, ScreenHeader, SectionHeader, haptic } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';
import { HIJRI_MONTHS, HijriDate, formatHijri, isRamadan, isWhiteDay, toHijri } from '../../../core/utils/hijri';

interface IslamicEvent { name: string; hijriLabel: string; month: number; day: number; desc: string }

// Events are defined by Hijri date; their Gregorian dates are computed with the tabular converter.
const ISLAMIC_EVENTS: IslamicEvent[] = [
  { name: 'Islamic New Year', hijriLabel: '1 Muharram', month: 1, day: 1, desc: 'Marks the start of the Hijri year' },
  { name: 'Ashura', hijriLabel: '10 Muharram', month: 1, day: 10, desc: 'Commemorates the day Musa (AS) crossed the Red Sea' },
  { name: 'Mawlid al-Nabi', hijriLabel: "12 Rabi' al-Awwal", month: 3, day: 12, desc: 'Birthday of Prophet Muhammad (PBUH)' },
  { name: 'Ramadan Begins', hijriLabel: '1 Ramadan', month: 9, day: 1, desc: 'The blessed month of fasting begins' },
  { name: 'Laylat al-Qadr', hijriLabel: '27 Ramadan', month: 9, day: 27, desc: 'The Night of Power, Quran first revealed' },
  { name: 'Eid al-Fitr', hijriLabel: '1 Shawwal', month: 10, day: 1, desc: 'Festival celebrating the end of Ramadan fast' },
  { name: 'Hajj Pilgrimage', hijriLabel: '8–12 Dhu al-Hijjah', month: 12, day: 8, desc: 'Annual pilgrimage to Makkah' },
  { name: 'Day of Arafah', hijriLabel: '9 Dhu al-Hijjah', month: 12, day: 9, desc: 'Most important day of Hajj' },
  { name: 'Eid al-Adha', hijriLabel: '10 Dhu al-Hijjah', month: 12, day: 10, desc: 'Festival of Sacrifice honoring Ibrahim (AS)' },
];

const eventsOn = (h: HijriDate) => ISLAMIC_EVENTS.filter((e) => e.month === h.month && e.day === h.day);
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayHijri = useMemo(() => toHijri(today), [today]);
  const gregDate = today.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<Date>(today);

  const viewMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1), [today, monthOffset]);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const lead = viewMonth.getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const list: ({ date: Date; hijri: HijriDate } | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= count; d++) {
      const date = new Date(year, month, d);
      list.push({ date, hijri: toHijri(date) });
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [viewMonth]);

  const hijriSpan = useMemo(() => {
    const days = cells.filter((c): c is { date: Date; hijri: HijriDate } => c !== null);
    const first = days[0].hijri;
    const last = days[days.length - 1].hijri;
    if (first.month === last.month) return `${first.monthName} ${first.year} AH`;
    const firstLabel = first.year === last.year ? first.monthName : `${first.monthName} ${first.year}`;
    return `${firstLabel} – ${last.monthName} ${last.year} AH`;
  }, [cells]);

  // Next occurrence of each event within the coming ~13 months.
  const upcoming = useMemo(() => {
    const found = new Map<string, { event: IslamicEvent; date: Date; days: number }>();
    for (let i = 0; i <= 400 && found.size < ISLAMIC_EVENTS.length; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      for (const event of eventsOn(toHijri(date))) {
        if (!found.has(event.name)) found.set(event.name, { event, date, days: i });
      }
    }
    return [...found.values()].sort((a, b) => a.days - b.days);
  }, [today]);

  const selectedHijri = toHijri(selected);
  const selectedEvents = eventsOn(selectedHijri);

  const changeMonth = (delta: number) => {
    haptic.select();
    setMonthOffset((m) => m + delta);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Islamic Calendar" subtitle={gregDate} onBack={() => navigation.goBack()}>
          <GlassCard style={styles.todayCard}>
            <View style={[styles.todayIcon, { backgroundColor: colors.accent, borderColor: colors.ink }]}>
              <Moon color={colors.ink} size={22} strokeWidth={2.4} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.todayLabel, { color: colors.onSkyMuted }]}>TODAY</Text>
              <Text style={[styles.todayHijri, { color: colors.onSky }]}>{formatHijri(todayHijri)}</Text>
              {(isRamadan(todayHijri) || isWhiteDay(todayHijri)) && (
                <Text style={[styles.todayNote, { color: colors.onSky }]}>
                  {isRamadan(todayHijri) ? 'Ramadan Mubarak' : 'White day · recommended fast'}
                </Text>
              )}
            </View>
          </GlassCard>
        </ScreenHeader>

        <View style={styles.body}>
          {/* Month grid */}
          <Animated.View entering={FadeInDown.delay(60).duration(420)}>
            <Card style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <PressableScale onPress={() => changeMonth(-1)} hapticOnPress={false} style={[styles.navBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                  <ChevronLeft color={colors.text} size={18} />
                </PressableScale>
                <View style={styles.monthTitleBox}>
                  <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {viewMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.monthHijri, { color: colors.textSecondary }]} numberOfLines={1}>{hijriSpan}</Text>
                </View>
                <PressableScale onPress={() => changeMonth(1)} hapticOnPress={false} style={[styles.navBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                  <ChevronRight color={colors.text} size={18} />
                </PressableScale>
              </View>

              <View style={styles.grid}>
                {WEEKDAYS.map((w, i) => (
                  <View key={`w${i}`} style={styles.cell}>
                    <Text style={[styles.weekday, { color: i === 5 ? colors.text : colors.textMuted }]}>{w}</Text>
                  </View>
                ))}
                {cells.map((c, i) => {
                  if (!c) return <View key={`e${i}`} style={styles.cell} />;
                  const isToday = sameDay(c.date, today);
                  const isSelected = sameDay(c.date, selected);
                  const white = isWhiteDay(c.hijri);
                  const ramadan = isRamadan(c.hijri);
                  const hasEvent = eventsOn(c.hijri).length > 0;
                  let bg = 'transparent';
                  if (isToday) bg = colors.primary;
                  else if (white) bg = colors.accentSoft;
                  else if (ramadan) bg = colors.primarySoft;
                  const fg = isToday ? colors.onPrimary : colors.text;
                  const sub = isToday ? colors.onPrimary : c.hijri.day === 1 ? colors.text : colors.textMuted;
                  return (
                    <View key={c.date.toDateString()} style={styles.cell}>
                      <PressableScale
                        onPress={() => { haptic.select(); setSelected(c.date); }}
                        hapticOnPress={false}
                        scaleTo={0.9}
                        style={[
                          styles.dayBtn,
                          { backgroundColor: bg, borderColor: isSelected || isToday ? colors.ink : 'transparent' },
                        ]}
                      >
                        <Text style={[styles.dayNum, { color: fg }]}>{c.date.getDate()}</Text>
                        <Text style={[styles.dayHijri, { color: sub }]}>
                          {c.hijri.day === 1 ? HIJRI_MONTHS[c.hijri.month - 1].slice(0, 3) : c.hijri.day}
                        </Text>
                        {hasEvent && <View style={[styles.eventDot, { backgroundColor: colors.accent, borderColor: colors.ink }]} />}
                      </PressableScale>
                    </View>
                  );
                })}
              </View>

              <View style={styles.legend}>
                <LegendItem color={colors.primary} label="Today" />
                <LegendItem color={colors.accentSoft} label="White days" />
                <LegendItem color={colors.primarySoft} label="Ramadan" />
                <LegendItem color={colors.accent} label="Event" dot />
              </View>
            </Card>
          </Animated.View>

          {/* Selected day detail */}
          <Animated.View key={selected.toDateString()} entering={FadeIn.duration(250)}>
            <Card style={styles.detailCard}>
              <View style={[styles.tile, { backgroundColor: colors.primarySoft, borderColor: colors.ink }]}>
                <CalendarDays color={colors.ink} size={20} strokeWidth={2.4} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.detailHijri, { color: colors.text }]}>{formatHijri(selectedHijri)}</Text>
                <Text style={[styles.detailGreg, { color: colors.textSecondary }]}>
                  {selected.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                {selectedEvents.map((e) => (
                  <Text key={e.name} style={[styles.detailTag, { color: colors.text }]}>★ {e.name}</Text>
                ))}
                {isWhiteDay(selectedHijri) && (
                  <Text style={[styles.detailTag, { color: colors.text }]}>White day · Ayyam al-Bid fast</Text>
                )}
              </View>
            </Card>
          </Animated.View>

          {/* Upcoming Islamic Events */}
          <SectionHeader title="Upcoming Hijri Dates & Holidays" />
          {upcoming.map(({ event, date, days }, idx) => {
            const major = event.name.startsWith('Eid') || event.name === 'Ramadan Begins';
            const Icon = major ? Sparkles : Star;
            return (
              <Animated.View key={event.name} entering={FadeInDown.delay(Math.min(120 + idx * 50, 400)).duration(400)}>
                <Card style={styles.eventCard}>
                  <View style={[styles.tile, { backgroundColor: major ? colors.accent : colors.surfaceAlt, borderColor: colors.ink }]}>
                    <Icon color={colors.ink} size={20} strokeWidth={2.4} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.eventName, { color: colors.text }]}>{event.name}</Text>
                    <Text style={[styles.eventHijri, { color: colors.textSecondary }]}>{event.hijriLabel}</Text>
                    <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>{event.desc}</Text>
                  </View>
                  <View style={styles.eventRight}>
                    <Text style={[styles.eventDate, { color: colors.text }]}>
                      {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.eventYear, { color: colors.textMuted }]}>{date.getFullYear()}</Text>
                    <View style={[styles.daysPill, { backgroundColor: days === 0 ? colors.primary : colors.primarySoft, borderColor: colors.ink }]}>
                      <Text style={[styles.daysText, { color: colors.ink }]}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            );
          })}
          <Text style={[styles.footnote, { color: colors.textMuted }]}>
            Hijri dates use the tabular calendar and may differ by a day from local moon sighting.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[dot ? styles.legendDot : styles.legendSwatch, { backgroundColor: color, borderColor: colors.ink }]} />
      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, padding: 14 },
  todayIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  todayLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  todayHijri: { fontSize: 20, fontWeight: '900', marginTop: 2, letterSpacing: -0.2 },
  todayNote: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  body: { paddingHorizontal: 18, paddingTop: 20 },
  monthCard: { padding: 14, marginRight: brutal.shadow },
  monthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  monthTitleBox: { flex: 1, alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
  monthHijri: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  weekday: { fontSize: 11, fontWeight: '800', paddingVertical: 4 },
  dayBtn: { width: '92%', maxWidth: 44, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  dayNum: { fontSize: 15, fontWeight: '800' },
  dayHijri: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  eventDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5 },
  legendDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  legendText: { fontSize: 11, fontWeight: '700' },
  detailCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 18, marginRight: brutal.shadow },
  tile: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  detailHijri: { fontSize: 16, fontWeight: '900' },
  detailGreg: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  detailTag: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, marginRight: brutal.shadow, paddingVertical: 14 },
  eventName: { fontSize: 15, fontWeight: '900' },
  eventHijri: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  eventDesc: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  eventRight: { alignItems: 'flex-end' },
  eventDate: { fontSize: 14, fontWeight: '800' },
  eventYear: { fontSize: 11, fontWeight: '600' },
  daysPill: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1.5 },
  daysText: { fontSize: 11, fontWeight: '900' },
  footnote: { fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
