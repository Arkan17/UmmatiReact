// Events near you: radius filter, "Going" and all upcoming, grouped by day, with RSVP + reminders.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CalendarPlus, CalendarX, LocateFixed, RefreshCw } from 'lucide-react-native';
import type { RootStackParamList } from '../../../../core/navigation/RootNavigator';
import { useAuth } from '../../../../core/hooks/useAuth';
import { useLocation } from '../../../../core/hooks/useLocation';
import { FALLBACK_COORDS, loadLastLocation } from '../../../../core/prayer/prayerTimes';
import { useAppTheme } from '../../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, haptic } from '../../../../core/components/ui';
import { fetchEvents, setRsvp } from '../../api/events';
import type { CommunityEvent } from '../../api/types';
import { EventCard } from '../../components/EventCard';
import { EventDetailSheet } from '../../components/EventDetailSheet';
import { dayLabel } from '../../components/EventKinds';
import { useMyRole } from '../../hooks/useCommunityGate';
import { cancelEventReminder, scheduleEventReminder, syncEventReminders } from '../../utils/eventReminders';
import type { SectionProps } from './types';

type Filter = 'nearby' | 'going' | 'all';
const RADII = [10, 25, 50, 100];
const INK = '#1C1A17';

type Row = { type: 'day'; key: string; label: string } | { type: 'event'; key: string; event: CommunityEvent };

export function EventsSection({ header, bottomInset }: SectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const role = useMyRole();
  const location = useLocation();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filter, setFilter] = useState<Filter>('nearby');
  const [radius, setRadius] = useState(25);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CommunityEvent | null>(null);

  // Real GPS fix first; otherwise the last location saved by the prayer times screen (if any)
  useEffect(() => {
    if (location.loading) return;
    if (!location.isUsingFallback) {
      setCoords({ lat: location.latitude, lng: location.longitude });
      return;
    }
    loadLastLocation().then((l) => {
      const isFallback = l.latitude === FALLBACK_COORDS.latitude && l.longitude === FALLBACK_COORDS.longitude;
      setCoords(isFallback ? null : { lat: l.latitude, lng: l.longitude });
    });
  }, [location.loading, location.isUsingFallback, location.latitude, location.longitude]);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const rows = await fetchEvents(
        filter === 'going'
          ? { lat: coords?.lat, lng: coords?.lng, radiusKm: 20000, mine: true }
          : filter === 'all'
            ? { lat: coords?.lat, lng: coords?.lng, radiusKm: 20000 }
            : { lat: coords?.lat, lng: coords?.lng, radiusKm: radius },
      );
      setEvents(rows);
      syncEventReminders(rows);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, radius, coords]);

  // Wait for the location lookup before the first load so "Nearby" is accurate
  // (also re-runs when filters change, and refreshes after returning from CreateEvent)
  const ready = !location.loading;
  useFocusEffect(useCallback(() => { if (ready) load(); }, [ready, load]));

  const toggleRsvp = async (ev: CommunityEvent) => {
    if (!user) { navigation.navigate('Auth', { mode: 'signin' }); return; }
    const going = !ev.my_rsvp;
    const patch = (on: boolean) => (e: CommunityEvent) =>
      e.id === ev.id ? { ...e, my_rsvp: on, rsvp_count: Math.max(0, e.rsvp_count + (on ? 1 : -1)) } : e;
    if (going) haptic.success(); else haptic.light();
    setEvents((list) => list.map(patch(going)));
    setSelected((s) => (s && s.id === ev.id ? patch(going)(s) : s));
    try {
      await setRsvp(ev.id, going);
      if (going) scheduleEventReminder(ev); else cancelEventReminder(ev.id);
      if (!going && filter === 'going') setEvents((list) => list.filter((e) => e.id !== ev.id));
    } catch (e: any) {
      setEvents((list) => list.map(patch(!going)));
      setSelected((s) => (s && s.id === ev.id ? patch(!going)(s) : s));
      Alert.alert('Could not update RSVP', e?.message ?? 'Please try again.');
    }
  };

  const onRemoved = (ev: CommunityEvent, blockedHost: boolean) => {
    setEvents((list) => list.filter((e) => (blockedHost ? e.created_by !== ev.created_by : e.id !== ev.id)));
  };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let last = '';
    for (const e of events) {
      const label = dayLabel(e.starts_at);
      if (label !== last) { out.push({ type: 'day', key: `day-${label}`, label }); last = label; }
      out.push({ type: 'event', key: e.id, event: e });
    }
    return out;
  }, [events]);

  const selectFilter = (f: Filter) => { haptic.select(); setFilter(f); };

  const listHeader = (
    <View>
      {header}
      <View style={styles.body}>
        <View style={styles.filterRow}>
          {([['nearby', 'Nearby'], ['going', 'Going'], ['all', 'All upcoming']] as [Filter, string][]).map(([key, label]) => {
            const on = filter === key;
            return (
              <BrutalPressable
                key={key}
                hapticOnPress={false}
                onPress={() => selectFilter(key)}
                radius={16}
                offset={on ? brutal.shadowSmall : 0}
                borderWidth={brutal.borderThin}
                fill={on ? tints.blue : colors.surface}
                style={styles.filterChip}
              >
                <Text style={[styles.filterText, { color: on ? INK : colors.text }]}>{label}</Text>
              </BrutalPressable>
            );
          })}
        </View>

        {filter === 'nearby' && coords ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
            <Text style={[styles.radiusLabel, { color: colors.textMuted }]}>WITHIN</Text>
            {RADII.map((r) => {
              const on = radius === r;
              return (
                <BrutalPressable
                  key={r}
                  hapticOnPress={false}
                  onPress={() => { haptic.select(); setRadius(r); }}
                  radius={14}
                  offset={0}
                  borderWidth={brutal.borderThin}
                  fill={on ? colors.accent : colors.surface}
                  style={styles.radiusChip}
                >
                  <Text style={[styles.radiusText, { color: on ? INK : colors.text }]}>{r} km</Text>
                </BrutalPressable>
              );
            })}
          </ScrollView>
        ) : null}

        {!coords && filter === 'nearby' ? (
          <BrutalPressable onPress={() => location.refreshLocation()} fill={colors.accentSoft} radius={16} offset={brutal.shadowSmall} style={styles.locHint}>
            <LocateFixed color={colors.text} size={18} strokeWidth={2.4} />
            <Text style={[styles.locHintText, { color: colors.text }]}>Turn on location to see nearby events. Showing all upcoming events for now.</Text>
          </BrutalPressable>
        ) : null}
      </View>
    </View>
  );

  const empty = loading ? (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : error ? (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.center}>
      <BrutalBox fill={colors.danger} radius={22} style={styles.emptyIcon}>
        <RefreshCw color={INK} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load events</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
      <BrutalPressable fill={colors.surface} style={styles.retry} onPress={() => load()}>
        <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
      </BrutalPressable>
    </Animated.View>
  ) : (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.center}>
      <BrutalBox fill={tints.blue} radius={22} style={styles.emptyIcon}>
        <CalendarX color={INK} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {filter === 'going' ? "You haven't RSVP'd yet" : 'No upcoming events'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {filter === 'going'
          ? "Tap \"Going?\" on an event and we'll remind you an hour before."
          : filter === 'nearby' && coords
            ? `Nothing within ${radius} km yet. Try a bigger radius, or host a halaqa, iftar or class yourself!`
            : 'Be the first to host a halaqa, iftar or class for your community.'}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        renderItem={({ item, index }) =>
          item.type === 'day' ? (
            <Text style={[styles.dayLabel, { color: colors.text }]}>{item.label}</Text>
          ) : (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 320)).duration(350)} style={styles.cardWrap}>
              <EventCard event={item.event} onPress={() => setSelected(item.event)} onToggleRsvp={() => toggleRsvp(item.event)} />
            </Animated.View>
          )
        }
      />

      <Animated.View entering={FadeInDown.delay(250).duration(350)} style={[styles.fabWrap, { bottom: bottomInset }]}>
        <BrutalPressable fill={tints.blue} radius={27} style={styles.fab} onPress={() => navigation.navigate('CreateEvent')}>
          <CalendarPlus color={INK} size={20} strokeWidth={2.6} />
          <Text style={styles.fabText}>New event</Text>
        </BrutalPressable>
      </Animated.View>

      <EventDetailSheet
        event={selected}
        onClose={() => setSelected(null)}
        onToggleRsvp={toggleRsvp}
        onRemoved={onRemoved}
        myId={user?.id ?? null}
        isAdmin={role === 'admin'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, height: 38, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13.5, fontWeight: '900' },
  radiusRow: { alignItems: 'center', gap: 8, paddingTop: 12 },
  radiusLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginRight: 2 },
  radiusChip: { paddingHorizontal: 12, height: 32, alignItems: 'center', justifyContent: 'center' },
  radiusText: { fontSize: 13, fontWeight: '800' },
  locHint: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 12 },
  locHintText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  dayLabel: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2, paddingHorizontal: 18, marginTop: 18, marginBottom: 10 },
  cardWrap: { paddingHorizontal: 18 },
  center: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 36, gap: 10 },
  emptyIcon: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retry: { paddingHorizontal: 20, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  retryText: { fontSize: 14.5, fontWeight: '900' },
  fabWrap: { position: 'absolute', right: 18 },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 54 },
  fabText: { color: INK, fontSize: 15.5, fontWeight: '900' },
});
