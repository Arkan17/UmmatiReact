// Host a new community event: title, kind, day + time, duration, and a place (typed, current
// location, or a nearby masjid).
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';
import { Building2, CalendarPlus, Check, LocateFixed, MapPin, Minus, Plus } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { saveLastLocation } from '../../../core/prayer/prayerTimes';
import { awardXp } from '../../../core/services/progress';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable, Card, PressableScale, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { supabase } from '../api/client';
import { createEvent } from '../api/events';
import type { EventKind } from '../api/types';
import { EVENT_KINDS, eventKind, formatDistance } from '../components/EventKinds';
import { useCommunityGate } from '../hooks/useCommunityGate';
import { checkContent } from '../utils/contentFilter';
import { formatEventDate } from '../utils/time';

const INK = '#1C1A17';
const DURATIONS: { key: string; label: string; hours: number | 'evening' }[] = [
  { key: '1h', label: '1 hour', hours: 1 },
  { key: '2h', label: '2 hours', hours: 2 },
  { key: '3h', label: '3 hours', hours: 3 },
  { key: 'evening', label: 'All evening', hours: 'evening' },
];
const MINUTES = [0, 15, 30, 45];

interface NearbyMosque { id: string; name: string; address: string; latitude: number; longitude: number; distance: number }

const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

function Label({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.label, { color: colors.textMuted }]}>{children}</Text>;
}

const getPosition = () =>
  new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (e) => reject(new Error(e.message)),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });

export function CreateEventScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateEvent'>>();
  const groupId = route.params?.groupId ?? null;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const gate = useCommunityGate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<EventKind>('lecture');
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(19);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState('2h');
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [mosques, setMosques] = useState<NearbyMosque[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  }), []);

  const start = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }, [dayOffset, hour, minute]);

  const end = useMemo(() => {
    const opt = DURATIONS.find((x) => x.key === duration)!;
    if (opt.hours === 'evening') {
      // Until 11pm, or 4 hours if it already starts late
      const e = new Date(start);
      e.setHours(23, 0, 0, 0);
      return e.getTime() - start.getTime() >= 60 * 60 * 1000 ? e : new Date(start.getTime() + 4 * 3600_000);
    }
    return new Date(start.getTime() + opt.hours * 3600_000);
  }, [start, duration]);

  const inPast = start.getTime() <= Date.now();
  const tint = eventKind(kind).tint;

  const pinMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await getPosition();
      saveLastLocation(pos.latitude, pos.longitude);
      setCoords(pos);
      setMosqueId(null);
      haptic.success();
      // Masjids added by the community within ~15 km
      const d = 0.14;
      const { data } = await supabase
        .from('mosques')
        .select('id, name, address, latitude, longitude')
        .gte('latitude', pos.latitude - d).lte('latitude', pos.latitude + d)
        .gte('longitude', pos.longitude - d).lte('longitude', pos.longitude + d)
        .limit(40);
      setMosques((data ?? [])
        .map((m: any) => ({ ...m, distance: distanceKm(pos.latitude, pos.longitude, m.latitude, m.longitude) }))
        .sort((a: NearbyMosque, b: NearbyMosque) => a.distance - b.distance)
        .slice(0, 8));
    } catch {
      Alert.alert('Location unavailable', 'Please allow location access, or type the place name instead.');
    } finally {
      setLocating(false);
    }
  };

  const pickMosque = (m: NearbyMosque) => {
    haptic.select();
    if (mosqueId === m.id) { setMosqueId(null); return; }
    setMosqueId(m.id);
    setLocationName(m.name);
    setCoords({ latitude: m.latitude, longitude: m.longitude });
  };

  const submit = async () => {
    const t = checkContent(title, { min: 3, max: 100 });
    if (!t.ok) return Alert.alert('Check the title', t.reason);
    if (description.trim()) {
      const d = checkContent(description, { min: 2, max: 1000 });
      if (!d.ok) return Alert.alert('Check the description', d.reason);
    }
    const l = checkContent(locationName, { min: 2, max: 160 });
    if (!l.ok) return Alert.alert('Where is it?', locationName.trim() ? l.reason : 'Please add a place name, or pick a masjid.');
    if (inPast) return Alert.alert('Pick a later time', 'The event must start in the future.');
    if (!(await gate.ensureCanPost())) return;

    setSaving(true);
    try {
      await createEvent({
        title,
        description,
        kind,
        startsAt: start,
        endsAt: end,
        locationName,
        mosqueId,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        groupId,
      });
      haptic.success();
      awardXp(10, 'community_event').catch(() => {});
      navigation.goBack();
      Alert.alert('Event published', 'JazakAllahu khairan for bringing the community together! +10 XP');
    } catch (e: any) {
      Alert.alert('Could not create event', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="New event" subtitle={groupId ? 'Posting to your group' : 'Bring the community together'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Card style={styles.card}>
            <Label>WHAT</Label>
            <TextInput
              style={[styles.input, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
              placeholder="e.g. Tafsir of Surah Yusuf"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, styles.multiline, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Details: speaker, what to bring, sisters' section… (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
              multiline
            />
            <View style={styles.wrap}>
              {EVENT_KINDS.map((k) => {
                const on = kind === k.key;
                return (
                  <PressableScale
                    key={k.key}
                    hapticOnPress={false}
                    onPress={() => { haptic.select(); setKind(k.key); }}
                    style={[styles.kindChip, outline(colors), { backgroundColor: on ? k.tint : colors.surfaceAlt }]}
                  >
                    <Text style={styles.kindEmoji}>{k.emoji}</Text>
                    <Text style={[styles.kindText, { color: on ? INK : colors.textSecondary }]}>{k.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(350)}>
          <Card style={styles.card}>
            <Label>WHEN</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
              {days.map((d, i) => {
                const on = dayOffset === i;
                return (
                  <PressableScale
                    key={i}
                    hapticOnPress={false}
                    onPress={() => { haptic.select(); setDayOffset(i); }}
                    style={[styles.dayChip, outline(colors), { backgroundColor: on ? tint : colors.surface }]}
                  >
                    <Text style={[styles.dayName, { color: on ? INK : colors.textMuted }]}>
                      {i === 0 ? 'TODAY' : i === 1 ? 'TMRW' : d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[styles.dayNum, { color: on ? INK : colors.text }]}>{d.getDate()}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>

            <View style={styles.timeRow}>
              <View style={[styles.stepper, outline(colors), { backgroundColor: colors.surface }]}>
                <PressableScale onPress={() => setHour((h) => (h + 23) % 24)} style={styles.stepBtn}>
                  <Minus color={colors.text} size={18} strokeWidth={2.6} />
                </PressableScale>
                <View style={styles.stepValue}>
                  <Text style={[styles.timeBig, { color: colors.text }]}>{String(hour % 12 === 0 ? 12 : hour % 12)}</Text>
                  <Text style={[styles.timeUnit, { color: colors.textMuted }]}>{hour < 12 ? 'AM' : 'PM'}</Text>
                </View>
                <PressableScale onPress={() => setHour((h) => (h + 1) % 24)} style={styles.stepBtn}>
                  <Plus color={colors.text} size={18} strokeWidth={2.6} />
                </PressableScale>
              </View>
              <View style={styles.minutes}>
                {MINUTES.map((m) => {
                  const on = minute === m;
                  return (
                    <PressableScale
                      key={m}
                      hapticOnPress={false}
                      onPress={() => { haptic.select(); setMinute(m); }}
                      style={[styles.minChip, outline(colors), { backgroundColor: on ? tint : colors.surface }]}
                    >
                      <Text style={[styles.minText, { color: on ? INK : colors.text }]}>:{String(m).padStart(2, '0')}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            <View style={styles.wrap}>
              {DURATIONS.map((d) => {
                const on = duration === d.key;
                return (
                  <PressableScale
                    key={d.key}
                    hapticOnPress={false}
                    onPress={() => { haptic.select(); setDuration(d.key); }}
                    style={[styles.durChip, outline(colors), { backgroundColor: on ? colors.accent : colors.surfaceAlt }]}
                  >
                    <Text style={[styles.kindText, { color: on ? INK : colors.textSecondary }]}>{d.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
            <Text style={[styles.summary, { color: inPast ? colors.danger : colors.textSecondary }]}>
              {inPast ? 'That time has already passed — pick a later time.' : `${formatEventDate(start.toISOString())} – ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)}>
          <Card style={styles.card}>
            <Label>WHERE</Label>
            <View style={[styles.locInput, outline(colors), { backgroundColor: colors.surface }]}>
              <MapPin color={colors.textMuted} size={18} strokeWidth={2.4} />
              <TextInput
                style={[styles.flex, styles.locText, { color: colors.text }]}
                placeholder="Masjid, hall or address"
                placeholderTextColor={colors.textMuted}
                value={locationName}
                onChangeText={(t) => { setLocationName(t); if (mosqueId) setMosqueId(null); }}
                maxLength={160}
              />
            </View>
            <BrutalPressable fill={coords ? colors.primarySoft : colors.surface} offset={brutal.shadowSmall} style={styles.locBtn} onPress={pinMyLocation} disabled={locating}>
              {locating ? <ActivityIndicator color={colors.text} size="small" /> : coords ? <Check color={colors.text} size={18} strokeWidth={2.8} /> : <LocateFixed color={colors.text} size={18} strokeWidth={2.4} />}
              <Text style={[styles.locBtnText, { color: colors.text }]}>
                {coords ? 'Location pinned · tap to refresh' : 'Use my current location'}
              </Text>
            </BrutalPressable>

            {mosques && mosques.length > 0 ? (
              <View style={styles.mosqueList}>
                <Text style={[styles.mosqueHead, { color: colors.textMuted }]}>OR PICK A NEARBY MASJID</Text>
                {mosques.map((m) => {
                  const on = mosqueId === m.id;
                  return (
                    <PressableScale
                      key={m.id}
                      onPress={() => pickMosque(m)}
                      style={[styles.mosque, outline(colors), { backgroundColor: on ? tint : colors.surface }]}
                    >
                      <Building2 color={on ? INK : colors.textSecondary} size={18} strokeWidth={2.4} />
                      <View style={styles.flex}>
                        <Text style={[styles.mosqueName, { color: on ? INK : colors.text }]} numberOfLines={1}>{m.name}</Text>
                        <Text style={[styles.mosqueAddr, { color: on ? INK : colors.textMuted }]} numberOfLines={1}>{m.address}</Text>
                      </View>
                      <Text style={[styles.mosqueDist, { color: on ? INK : colors.textSecondary }]}>{formatDistance(m.distance)}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            ) : mosques ? (
              <Text style={[styles.summary, { color: colors.textMuted }]}>No masjids saved near you yet — just type the place name.</Text>
            ) : null}
          </Card>
        </Animated.View>

        <BrutalPressable fill={colors.primary} style={styles.submit} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.onPrimary} /> : <CalendarPlus color={colors.onPrimary} size={20} strokeWidth={2.5} />}
          <Text style={[styles.submitText, { color: colors.onPrimary }]}>{saving ? 'Publishing…' : 'Publish event'}</Text>
        </BrutalPressable>
      </ScrollView>
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18 },
  card: { borderRadius: 24, marginBottom: 18 },
  label: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5, fontWeight: '600', marginBottom: 10 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 36, borderRadius: 18 },
  kindEmoji: { fontSize: 14 },
  kindText: { fontSize: 13, fontWeight: '800' },
  dayRow: { gap: 8, paddingBottom: 4 },
  dayChip: { width: 56, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayName: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.6 },
  dayNum: { fontSize: 21, fontWeight: '900' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 56 },
  stepBtn: { width: 42, height: 54, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 64, justifyContent: 'center' },
  timeBig: { fontSize: 26, fontWeight: '900' },
  timeUnit: { fontSize: 12, fontWeight: '900' },
  minutes: { flex: 1, flexDirection: 'row', gap: 6 },
  minChip: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  minText: { fontSize: 13.5, fontWeight: '900' },
  durChip: { paddingHorizontal: 12, height: 34, borderRadius: 17, justifyContent: 'center' },
  summary: { fontSize: 13.5, fontWeight: '700', marginTop: 12 },
  locInput: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12 },
  locText: { fontSize: 15.5, fontWeight: '600', paddingVertical: 12 },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, marginTop: 12 },
  locBtnText: { fontSize: 14, fontWeight: '800' },
  mosqueList: { gap: 8, marginTop: 14 },
  mosqueHead: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  mosque: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 14 },
  mosqueName: { fontSize: 14.5, fontWeight: '800' },
  mosqueAddr: { fontSize: 12, marginTop: 1 },
  mosqueDist: { fontSize: 12.5, fontWeight: '800' },
  submit: { flexDirection: 'row', gap: 8, height: 58, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 17, fontWeight: '900' },
});
