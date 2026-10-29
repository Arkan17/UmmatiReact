import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable,
  ScrollView, Share, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import {
  BadgeCheck, Bike, Bookmark, BookmarkCheck, Car, ChevronLeft, Clock, ExternalLink, Flag, Footprints,
  List, LocateFixed, MapPin, Navigation, Pencil, Phone, RefreshCw, Search, Share2, WifiOff, X,
} from 'lucide-react-native';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLocation } from '../../../core/hooks/useLocation';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, PressableScale, haptic, outline } from '../../../core/components/ui';
import { MosqueMap, MosqueMapHandle } from '../components/MosqueMap';
import { useLiveLocation } from '../hooks/useLiveLocation';
import {
  JamatTimings, Mosque, RouteInfo, TravelMode, directionsUrl, distanceMeters, estimateWalkSeconds,
  fetchNearbyMosques, fetchRoute, formatDistance, formatDuration, getCachedMosques, loadSavedIds, mapsUrl,
  nextJamat, saveJamatTimes, storeSavedIds,
} from '../services/mosqueApi';

const INK = '#1C1A17';

type FilterKey = 'all' | 'walk' | 'saved' | 'mine';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'walk', label: '🚶 Walkable' },
  { key: 'saved', label: '🔖 Saved' },
  { key: 'mine', label: '✓ My times' },
];
const WALKABLE_M = 1500;
const ARRIVED_M = 40;
/** Re-route once the user has moved this far from where the current route started */
const REROUTE_M = 75;

const MODES: { key: TravelMode; label: string; Icon: typeof Car }[] = [
  { key: 'car', label: 'Drive', Icon: Car },
  { key: 'bike', label: 'Bike', Icon: Bike },
  { key: 'walk', label: 'Walk', Icon: Footprints },
];

const JAMAT_LABELS: Record<keyof JamatTimings, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', jummah: "Jumu'ah",
};

type LoadState = 'loading' | 'ready' | 'error';
type RouteState = RouteInfo | 'loading' | null;

export function MosqueScreen() {
  useScreenTime('Mosques');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { width: screenW } = useWindowDimensions();
  const isStackScreen = route.name === 'Mosque';
  const { latitude, longitude, loading: locating, isUsingFallback, refreshLocation } = useLocation();

  const live = useLiveLocation({ latitude, longitude }, isFocused && !locating);
  const mapRef = useRef<MosqueMapHandle>(null);
  const carouselRef = useRef<FlatList<Mosque>>(null);

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [fromCache, setFromCache] = useState(false);
  const [radius, setRadius] = useState(5000);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [listOpen, setListOpen] = useState(false);
  const [editing, setEditing] = useState<Mosque | null>(null);

  // Tracker (turn-by-turn style) state
  const [tracking, setTracking] = useState<Mosque | null>(null);
  const [mode, setMode] = useState<TravelMode>('walk');
  const [routes, setRoutes] = useState<Record<TravelMode, RouteState>>({ car: null, bike: null, walk: null });
  const [follow, setFollow] = useState(false);
  const routeFrom = useRef<{ latitude: number; longitude: number } | null>(null);
  const arrivedFor = useRef<string | null>(null);

  // Floating UI heights, so the map frames markers in the visible gap between them
  const [topH, setTopH] = useState(150);
  const [bottomH, setBottomH] = useState(220);
  const bottomOffset = isStackScreen ? insets.bottom + 14 : Math.max(insets.bottom, 12) + 68 + 16;
  const mapPadding = useMemo(() => ({ top: topH, bottom: bottomH + bottomOffset }), [topH, bottomH, bottomOffset]);

  useEffect(() => { loadSavedIds().then(setSavedIds); }, []);

  const load = useCallback(async (lat: number, lng: number) => {
    setLoadState('loading');
    // Show the last result for this area straight away, then refresh it
    const cached = await getCachedMosques(lat, lng);
    if (cached?.mosques.length) {
      setMosques(cached.mosques);
      setRadius(cached.radius);
    }
    try {
      const res = await fetchNearbyMosques(lat, lng);
      setMosques(res.mosques);
      setRadius(res.radius);
      setFromCache(!!res.fromCache);
      setLoadState('ready');
    } catch {
      setFromCache(!!cached?.mosques.length);
      setLoadState(cached?.mosques.length ? 'ready' : 'error');
    }
  }, []);

  useEffect(() => {
    if (!locating) load(latitude, longitude);
  }, [locating, latitude, longitude, load]);

  // Sorted by distance from where the search was made (stable order), distances shown live
  const sorted = useMemo(
    () => [...mosques].sort((a, b) =>
      distanceMeters(latitude, longitude, a.latitude, a.longitude) - distanceMeters(latitude, longitude, b.latitude, b.longitude)),
    [mosques, latitude, longitude],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.address.toLowerCase().includes(q)) return false;
      if (filter === 'walk') return distanceMeters(latitude, longitude, m.latitude, m.longitude) <= WALKABLE_M;
      if (filter === 'saved') return savedIds.includes(m.id);
      if (filter === 'mine') return !m.isEstimated;
      return true;
    });
  }, [sorted, query, filter, savedIds, latitude, longitude]);

  const counts = useMemo(() => ({
    all: sorted.length,
    walk: sorted.filter((m) => distanceMeters(latitude, longitude, m.latitude, m.longitude) <= WALKABLE_M).length,
    saved: sorted.filter((m) => savedIds.includes(m.id)).length,
    mine: sorted.filter((m) => !m.isEstimated).length,
  }), [sorted, savedIds, latitude, longitude]);

  const distTo = useCallback((m: Mosque) => distanceMeters(live.latitude, live.longitude, m.latitude, m.longitude), [live]);

  // Keep a valid selection: default to the nearest visible masjid
  useEffect(() => {
    if (tracking) return;
    if (!visible.length) { setSelectedId(null); return; }
    if (!selectedId || !visible.some((m) => m.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId, tracking]);

  // Frame the results whenever the result set itself changes
  const visibleKey = visible.map((m) => m.id).join(',');
  useEffect(() => {
    if (!tracking && visible.length) {
      const t = setTimeout(() => mapRef.current?.run({ type: 'fitAll' }), 250);
      return () => clearTimeout(t);
    }
  }, [visibleKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback((id: string, from: 'map' | 'carousel' | 'list') => {
    setSelectedId(id);
    mapRef.current?.run({ type: 'focus', id });
    if (from !== 'carousel') {
      const idx = visible.findIndex((m) => m.id === id);
      if (idx >= 0) carouselRef.current?.scrollToIndex({ index: idx, animated: from === 'map' });
    }
  }, [visible]);

  const onMarkerPress = useCallback((id: string) => {
    if (tracking) return;
    haptic.select();
    select(id, 'map');
  }, [tracking, select]);

  // ── Tracker ──
  const fetchMode = useCallback(async (m: TravelMode, dest: Mosque, from: { latitude: number; longitude: number }) => {
    setRoutes((r) => ({ ...r, [m]: r[m] && r[m] !== 'loading' ? r[m] : 'loading' }));
    const res = await fetchRoute(m, from, dest);
    setRoutes((r) => ({ ...r, [m]: res }));
  }, []);

  const startTracking = (m: Mosque) => {
    haptic.medium();
    const from = { latitude: live.latitude, longitude: live.longitude };
    const d = distTo(m);
    const firstMode: TravelMode = d <= WALKABLE_M ? 'walk' : 'car';
    routeFrom.current = from;
    arrivedFor.current = null;
    setRoutes({ car: 'loading', bike: 'loading', walk: 'loading' });
    setMode(firstMode);
    setTracking(m);
    setSelectedId(m.id);
    setFollow(false);
    MODES.forEach(({ key }) => fetchMode(key, m, from));
  };

  const stopTracking = () => {
    setTracking(null);
    setFollow(false);
    setRoutes({ car: null, bike: null, walk: null });
    setTimeout(() => mapRef.current?.run({ type: 'fitAll' }), 200);
  };

  const activeRoute = tracking && routes[mode] && routes[mode] !== 'loading' ? (routes[mode] as RouteInfo) : null;

  // Fit the route once it first arrives for the chosen mode
  const routeKey = activeRoute ? `${tracking?.id}-${mode}` : '';
  const fittedRoute = useRef('');
  useEffect(() => {
    if (routeKey && fittedRoute.current !== routeKey && !follow) {
      fittedRoute.current = routeKey;
      setTimeout(() => mapRef.current?.run({ type: 'fitRoute' }), 150);
    }
  }, [routeKey, follow]);

  // Live tracking: reroute after moving, and celebrate on arrival
  useEffect(() => {
    if (!tracking) return;
    const d = distTo(tracking);
    if (d <= ARRIVED_M && arrivedFor.current !== tracking.id) {
      arrivedFor.current = tracking.id;
      haptic.success();
    }
    const from = routeFrom.current;
    if (from && distanceMeters(from.latitude, from.longitude, live.latitude, live.longitude) > REROUTE_M) {
      routeFrom.current = { latitude: live.latitude, longitude: live.longitude };
      fetchMode(mode, tracking, routeFrom.current);
    }
  }, [live, tracking, mode, distTo, fetchMode]);

  const changeMode = (m: TravelMode) => {
    haptic.select();
    setMode(m);
    fittedRoute.current = '';
  };

  // ── Actions ──
  const toggleSaved = (m: Mosque) => {
    haptic.select();
    const next = savedIds.includes(m.id) ? savedIds.filter((id) => id !== m.id) : [...savedIds, m.id];
    setSavedIds(next);
    storeSavedIds(next).catch(() => {});
  };

  const shareMosque = (m: Mosque) => {
    Share.share({ message: `🕌 ${m.name}${m.address ? `\n${m.address}` : ''}\n${mapsUrl(m)}\n\nShared via Ummati` });
  };

  const openExternal = (m: Mosque) => {
    Linking.openURL(directionsUrl(m, mode)).catch(() => Linking.openURL(mapsUrl(m)));
  };

  const onTimesSaved = (id: string, timings: JamatTimings) => {
    setMosques((list) => list.map((m) => (m.id === id ? { ...m, timings, isEstimated: false } : m)));
    if (tracking?.id === id) setTracking((t) => (t ? { ...t, timings, isEstimated: false } : t));
  };

  const recenter = () => {
    haptic.light();
    if (tracking) setFollow(true);
    mapRef.current?.run({ type: 'recenter' });
  };

  // ── Render helpers ──
  const cardW = screenW - 56;
  const snap = cardW + 12;

  const statusText = locating
    ? 'Finding your location…'
    : loadState === 'loading' && !mosques.length
      ? 'Searching for masjids nearby…'
      : loadState === 'error'
        ? "Couldn't reach map servers"
        : `${sorted.length} masjid${sorted.length === 1 ? '' : 's'} within ${radius / 1000} km${fromCache ? ' · offline' : ''}`;

  const mapMosques = useMemo(
    () => (tracking ? [tracking] : visible).map((m) => ({ id: m.id, name: m.name, latitude: m.latitude, longitude: m.longitude, saved: savedIds.includes(m.id) })),
    [tracking, visible, savedIds],
  );

  const renderCard = ({ item, index }: { item: Mosque; index: number }) => {
    const d = distTo(item);
    const nj = nextJamat(item.timings);
    const saved = savedIds.includes(item.id);
    return (
      <View style={{ width: cardW, marginRight: 12 }}>
        <BrutalBox fill={colors.surface} radius={22} style={styles.card}>
          <Pressable onPress={() => select(item.id, 'carousel')}>
            <View style={styles.cardTop}>
              <View style={[styles.rankTile, { backgroundColor: index === 0 && filter === 'all' && !query ? colors.accent : tints.teal, borderColor: colors.ink }]}>
                <Text style={styles.rankNum}>{index + 1}</Text>
                <Text style={styles.rankSub}>{index === 0 && filter === 'all' && !query ? 'NEAREST' : 'MASJID'}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <View style={styles.addrRow}>
                  <MapPin color={colors.textMuted} size={12} />
                  <Text style={[styles.addr, { color: colors.textSecondary }]} numberOfLines={1}>{item.address || 'Tap Directions for the exact spot'}</Text>
                </View>
              </View>
              <PressableScale onPress={() => toggleSaved(item)} hapticOnPress={false} style={[styles.iconBtnSm, { backgroundColor: saved ? tints.rose : colors.surfaceAlt, borderColor: colors.ink }]}>
                {saved ? <BookmarkCheck color={INK} size={16} strokeWidth={2.4} /> : <Bookmark color={colors.text} size={16} strokeWidth={2.4} />}
              </PressableScale>
            </View>

            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: tints.blue, borderColor: colors.ink }]}>
                <Navigation color={INK} size={11} strokeWidth={2.6} />
                <Text style={styles.chipText}>{formatDistance(d)}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: tints.green, borderColor: colors.ink }]}>
                <Footprints color={INK} size={11} strokeWidth={2.6} />
                <Text style={styles.chipText}>~{formatDuration(estimateWalkSeconds(d))}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: item.isEstimated ? tints.gold : tints.violet, borderColor: colors.ink }]}>
                {item.isEstimated ? <Clock color={INK} size={11} strokeWidth={2.6} /> : <BadgeCheck color={INK} size={11} strokeWidth={2.6} />}
                <Text style={styles.chipText}>{JAMAT_LABELS[nj.key]} {nj.time}</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.cardActions}>
            <BrutalPressable fill={colors.primary} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.dirBtn} onPress={() => startTracking(item)}>
              <Navigation color={INK} size={16} strokeWidth={2.6} />
              <Text style={styles.dirText}>Directions</Text>
            </BrutalPressable>
            <BrutalPressable fill={colors.accentSoft} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.sqBtn} onPress={() => setEditing(item)}>
              <Pencil color={INK} size={16} strokeWidth={2.4} />
            </BrutalPressable>
            <BrutalPressable fill={colors.surfaceAlt} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.sqBtn} onPress={() => shareMosque(item)}>
              <Share2 color={colors.text} size={16} strokeWidth={2.4} />
            </BrutalPressable>
          </View>
        </BrutalBox>
      </View>
    );
  };

  const renderBottom = () => {
    if (tracking) return renderTracker();
    if ((locating || loadState === 'loading') && !mosques.length) {
      return (
        statusCard({
          icon: <ActivityIndicator color={INK} />,
          tint: tints.teal,
          title: locating ? 'Locating you' : 'Searching nearby',
          text: locating ? 'Getting your GPS position…' : 'Looking for masjids around you… the first search can take up to 30 seconds.',
        })
      );
    }
    if (loadState === 'error') {
      return (
        statusCard({
          icon: <WifiOff color={INK} size={22} />,
          tint: tints.rose,
          title: "Couldn't load masjids",
          text: "The map servers didn't respond. Check your internet and try again.",
          action: "Try again",
          onAction: () => load(latitude, longitude),
        })
      );
    }
    if (!visible.length) {
      return (
        statusCard({
          icon: <MapPin color={INK} size={22} />,
          tint: tints.gold,
          title: query ? 'No matches' : filter === 'saved' ? 'Nothing saved yet' : filter === 'mine' ? 'No times added yet' : 'No masjids found',
          text: query ? `Nothing nearby matches "${query}".`
            : filter === 'saved' ? 'Tap the bookmark on a masjid to keep it here.'
              : filter === 'mine' ? 'Tap ✏️ on a masjid to enter its real Jamat times.'
                : filter === 'walk' ? `No masjid within ${WALKABLE_M / 1000} km walking distance.`
                  : `No masjids are mapped within ${radius / 1000} km of you.`,
          action: query || filter !== 'all' ? 'Show all' : undefined,
          onAction: () => { setQuery(''); setFilter('all'); },
        })
      );
    }
    return (
      <FlatList
        ref={carouselRef}
        data={visible}
        keyExtractor={(m) => m.id}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 22, paddingRight: 22 + brutal.shadow }}
        getItemLayout={(_, i) => ({ length: snap, offset: snap * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / snap);
          const m = visible[Math.min(Math.max(idx, 0), visible.length - 1)];
          if (m && m.id !== selectedId) { haptic.select(); select(m.id, 'carousel'); }
        }}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  // Plain render functions (not components) so live location updates don't remount them
  function statusCard({ icon, tint, title, text, action, onAction }: {
    icon: React.ReactNode; tint: string; title: string; text: string; action?: string; onAction?: () => void;
  }) {
    return (
      <View style={styles.hPad}>
        <BrutalBox fill={colors.surface} radius={22} style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: tint, borderColor: colors.ink }]}>{icon}</View>
          <View style={styles.flex}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{text}</Text>
          </View>
          {action ? (
            <BrutalPressable fill={colors.accent} radius={12} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.statusBtn} onPress={onAction}>
              <Text style={styles.statusBtnText}>{action}</Text>
            </BrutalPressable>
          ) : null}
        </BrutalBox>
      </View>
    );
  }

  function renderTracker() {
    if (!tracking) return null;
    const straight = distTo(tracking);
    const arrived = straight <= ARRIVED_M;
    const r = routes[mode];
    const remaining = r && r !== 'loading' ? r.distance : straight;
    const eta = r && r !== 'loading' ? new Date(Date.now() + r.duration * 1000) : null;
    return (
      <Animated.View entering={FadeInUp.duration(260)} style={styles.hPad}>
        <BrutalBox fill={colors.surface} radius={24} style={styles.tracker}>
          <View style={styles.trackerHead}>
            <View style={[styles.trackerIcon, { backgroundColor: arrived ? colors.primary : colors.accent, borderColor: colors.ink }]}>
              {arrived ? <Flag color={INK} size={18} strokeWidth={2.6} /> : <Navigation color={INK} size={18} strokeWidth={2.6} />}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.trackerEyebrow, { color: colors.textMuted }]}>{arrived ? 'YOU HAVE ARRIVED' : 'HEADING TO'}</Text>
              <Text style={[styles.trackerName, { color: colors.text }]} numberOfLines={1}>{tracking.name}</Text>
            </View>
            <PressableScale onPress={stopTracking} style={[styles.iconBtnSm, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
              <X color={colors.text} size={17} strokeWidth={2.6} />
            </PressableScale>
          </View>

          {arrived ? (
            <View style={[styles.arrivedBox, { backgroundColor: colors.primarySoft, borderColor: colors.ink }]}>
              <Text style={[styles.arrivedTitle, { color: colors.text }]}>Assalamu Alaikum 🕌</Text>
              <Text style={[styles.arrivedText, { color: colors.textSecondary }]}>
                Enter with your right foot and say: “Allahumma-ftah li abwaba rahmatik.”
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.modeRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                {MODES.map(({ key, label, Icon }) => {
                  const on = key === mode;
                  const mr = routes[key];
                  return (
                    <PressableScale
                      key={key}
                      hapticOnPress={false}
                      onPress={() => changeMode(key)}
                      style={[styles.modeBtn, on && { backgroundColor: colors.primary, borderColor: colors.ink }]}
                    >
                      <Icon color={on ? INK : colors.textSecondary} size={17} strokeWidth={2.4} />
                      {mr === 'loading'
                        ? <ActivityIndicator size="small" color={on ? INK : colors.textMuted} style={styles.modeSpinner} />
                        : <Text style={[styles.modeEta, { color: on ? INK : colors.textSecondary }]}>{mr ? formatDuration(mr.duration) : label}</Text>}
                    </PressableScale>
                  );
                })}
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.stat, { backgroundColor: tints.blue, borderColor: colors.ink }]}>
                  <Text style={styles.statLabel}>DISTANCE</Text>
                  <Text style={styles.statVal}>{formatDistance(remaining)}</Text>
                </View>
                <View style={[styles.stat, { backgroundColor: tints.green, borderColor: colors.ink }]}>
                  <Text style={styles.statLabel}>ARRIVE BY</Text>
                  <Text style={styles.statVal}>{eta ? eta.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : r === 'loading' ? '…' : '—'}</Text>
                </View>
                <View style={[styles.stat, { backgroundColor: tints.gold, borderColor: colors.ink }]}>
                  <Text style={styles.statLabel}>NEXT JAMAT</Text>
                  <Text style={styles.statVal}>{nextJamat(tracking.timings).time}</Text>
                </View>
              </View>
              <Text style={[styles.trackerNote, { color: colors.textMuted }]}>
                {r === null ? 'Route unavailable — showing straight-line distance.' : mode === 'car' ? 'Live tracking on · times exclude traffic' : 'Live tracking on · updates as you move'}
              </Text>
            </>
          )}

          <View style={styles.cardActions}>
            <BrutalPressable fill={colors.primary} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.dirBtn} onPress={() => openExternal(tracking)}>
              <ExternalLink color={INK} size={16} strokeWidth={2.6} />
              <Text style={styles.dirText}>Google Maps</Text>
            </BrutalPressable>
            {tracking.phone ? (
              <BrutalPressable fill={tints.teal} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.sqBtn} onPress={() => Linking.openURL(`tel:${tracking.phone}`)}>
                <Phone color={INK} size={16} strokeWidth={2.4} />
              </BrutalPressable>
            ) : null}
            <BrutalPressable fill={colors.accentSoft} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.sqBtn} onPress={() => setEditing(tracking)}>
              <Clock color={INK} size={16} strokeWidth={2.4} />
            </BrutalPressable>
            <BrutalPressable fill={colors.surfaceAlt} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.sqBtn} onPress={() => shareMosque(tracking)}>
              <Share2 color={colors.text} size={16} strokeWidth={2.4} />
            </BrutalPressable>
          </View>
        </BrutalBox>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MosqueMap
        ref={mapRef}
        user={live}
        mosques={mapMosques}
        selectedId={tracking ? tracking.id : selectedId}
        route={activeRoute?.path ?? null}
        dashedRoute={mode === 'walk'}
        follow={!!tracking && follow}
        padding={mapPadding}
        onSelect={onMarkerPress}
        onUserPan={() => setFollow(false)}
      />

      {/* Top: search + filters + status */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none" onLayout={(e) => setTopH(e.nativeEvent.layout.height)}>
        <Animated.View entering={FadeInDown.duration(350)} style={styles.searchRow}>
          {isStackScreen ? (
            <BrutalPressable fill={colors.surface} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ChevronLeft color={colors.text} size={22} strokeWidth={2.6} />
            </BrutalPressable>
          ) : null}
          <BrutalBox fill={colors.surface} radius={16} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.search}>
            <Search color={colors.textMuted} size={18} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search masjids nearby"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              editable={!tracking}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.searchClear}>
                <X color={colors.text} size={16} />
              </Pressable>
            ) : null}
          </BrutalBox>
        </Animated.View>

        {!tracking ? (
          <Animated.View entering={FadeIn.delay(120).duration(300)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
              {FILTERS.map((f) => {
                const on = f.key === filter;
                return (
                  <PressableScale
                    key={f.key}
                    hapticOnPress={false}
                    onPress={() => { haptic.select(); setFilter(f.key); }}
                    style={[styles.filterChip, { backgroundColor: on ? colors.accent : colors.surface, borderColor: colors.ink }]}
                  >
                    <Text style={[styles.filterText, { color: on ? INK : colors.text }]}>{f.label}</Text>
                    <View style={[styles.filterCount, { backgroundColor: on ? colors.surface : colors.surfaceAlt }]}>
                      <Text style={[styles.filterCountText, { color: colors.text }]}>{counts[f.key]}</Text>
                    </View>
                  </PressableScale>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={isUsingFallback ? refreshLocation : loadState === 'error' ? () => load(latitude, longitude) : undefined}
              style={[styles.statusPill, { backgroundColor: colors.surface, borderColor: colors.ink }]}
            >
              {loadState === 'loading' || locating
                ? <ActivityIndicator size="small" color={colors.primary} style={styles.pillSpinner} />
                : <View style={[styles.liveDot, { backgroundColor: loadState === 'error' ? colors.danger : fromCache ? colors.accent : colors.primary }]} />}
              <Text style={[styles.statusPillText, { color: colors.text }]} numberOfLines={1}>
                {isUsingFallback && !locating ? 'Location off · tap to enable' : statusText}
              </Text>
              {loadState === 'error' ? <RefreshCw color={colors.text} size={12} strokeWidth={2.6} /> : null}
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      {/* Right-side map buttons */}
      <View style={[styles.fabs, { bottom: bottomOffset + bottomH + 14 }]} pointerEvents="box-none">
        {!tracking && visible.length > 0 ? (
          <BrutalPressable fill={colors.surface} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.fab} onPress={() => setListOpen(true)}>
            <List color={colors.text} size={20} strokeWidth={2.4} />
          </BrutalPressable>
        ) : null}
        <BrutalPressable fill={tracking && follow ? colors.primary : colors.surface} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.fab} onPress={recenter}>
          <LocateFixed color={tracking && follow ? INK : colors.text} size={20} strokeWidth={2.4} />
        </BrutalPressable>
      </View>

      {/* Bottom: carousel / status / tracker */}
      <View style={[styles.bottom, { bottom: bottomOffset }]} pointerEvents="box-none" onLayout={(e) => setBottomH(e.nativeEvent.layout.height)}>
        {renderBottom()}
      </View>

      <ListSheet
        visible={listOpen}
        mosques={visible}
        savedIds={savedIds}
        distTo={distTo}
        onClose={() => setListOpen(false)}
        onPick={(m) => { setListOpen(false); setTimeout(() => select(m.id, 'list'), 250); }}
      />

      <TimesSheet mosque={editing} onClose={() => setEditing(null)} onSaved={onTimesSaved} />
    </View>
  );
}

/** Full list of results, nearest first. */
function ListSheet({ visible, mosques, savedIds, distTo, onClose, onPick }: {
  visible: boolean;
  mosques: Mosque[];
  savedIds: string[];
  distTo: (m: Mosque) => number;
  onClose: () => void;
  onPick: (m: Mosque) => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={[styles.sheet, styles.listSheet, { backgroundColor: colors.surface, borderColor: colors.ink, paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.dragHandle, { backgroundColor: colors.ink }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Nearby masjids</Text>
            <PressableScale onPress={onClose} style={[styles.iconBtnSm, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
              <X color={colors.text} size={17} />
            </PressableScale>
          </View>
          <FlatList
            data={mosques}
            keyExtractor={(m) => m.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const nj = nextJamat(item.timings);
              return (
                <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(250)}>
                  <PressableScale onPress={() => onPick(item)} style={[styles.listRow, { borderColor: colors.ink, backgroundColor: index % 2 ? colors.surface : colors.surfaceAlt }]}>
                    <View style={[styles.listRank, { backgroundColor: index === 0 ? colors.accent : tints.teal, borderColor: colors.ink }]}>
                      <Text style={styles.listRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}{savedIds.includes(item.id) ? '  🔖' : ''}
                      </Text>
                      <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {JAMAT_LABELS[nj.key]} {nj.time}{item.isEstimated ? ' (est.)' : ''}{item.address ? ` · ${item.address}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.listDist, { color: colors.text }]}>{formatDistance(distTo(item))}</Text>
                  </PressableScale>
                </Animated.View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

/** Edit a masjid's real Jamat times (stored on this device). */
function TimesSheet({ mosque, onClose, onSaved }: {
  mosque: Mosque | null;
  onClose: () => void;
  onSaved: (id: string, t: JamatTimings) => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<JamatTimings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(mosque ? { ...mosque.timings } : null); }, [mosque]);

  const valid = (v: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(v.trim());

  const save = async () => {
    if (!mosque || !draft) return;
    const bad = (Object.keys(draft) as (keyof JamatTimings)[]).filter((k) => !valid(draft[k]));
    if (bad.length) {
      Alert.alert('Check the times', `Use 24-hour HH:MM, e.g. 13:30. Fix: ${bad.map((k) => JAMAT_LABELS[k]).join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim().padStart(5, '0')])) as unknown as JamatTimings;
      await saveJamatTimes(mosque.id, clean);
      onSaved(mosque.id, clean);
      haptic.success();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not save the times.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={!!mosque} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.ink, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.dragHandle, { backgroundColor: colors.ink }]} />
          <View style={styles.sheetHeader}>
            <View style={styles.flex}>
              <Text style={[styles.sheetEyebrow, { color: colors.textMuted }]}>JAMAT TIMES · 24-HOUR</Text>
              <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={2}>{mosque?.name}</Text>
            </View>
            <PressableScale onPress={onClose} style={[styles.iconBtnSm, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
              <X color={colors.text} size={17} />
            </PressableScale>
          </View>
          {mosque?.isEstimated ? (
            <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
              These are estimates from prayer start times. Enter the masjid's real times to mark it ✓.
            </Text>
          ) : null}
          <View style={styles.formGrid}>
            {draft && (Object.keys(JAMAT_LABELS) as (keyof JamatTimings)[]).map((k) => (
              <View key={k} style={styles.formItem}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>{JAMAT_LABELS[k].toUpperCase()}</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, ...outline(colors), borderColor: valid(draft[k]) ? colors.ink : colors.danger }]}
                  value={draft[k]}
                  onChangeText={(v) => setDraft((d) => (d ? { ...d, [k]: v } : d))}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}
          </View>
          <BrutalPressable fill={colors.primary} radius={16} style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={INK} /> : <Text style={styles.saveText}>Save times</Text>}
          </BrutalPressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  hPad: { paddingHorizontal: 18, paddingRight: 18 + brutal.shadow },

  // Top overlay
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: brutal.shadowSmall },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '700', padding: 0 },
  searchClear: { padding: 4 },
  filters: { gap: 8, paddingTop: 12, paddingBottom: 4, paddingRight: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingLeft: 12, paddingRight: 5, borderRadius: 17, borderWidth: brutal.borderThin },
  filterText: { fontSize: 12.5, fontWeight: '900' },
  filterCount: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontSize: 11, fontWeight: '900' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 11, height: 28, borderRadius: 14, borderWidth: brutal.borderThin },
  pillSpinner: { transform: [{ scale: 0.7 }], width: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  statusPillText: { fontSize: 11.5, fontWeight: '800', maxWidth: 260 },

  // Floating buttons
  fabs: { position: 'absolute', right: 16 + brutal.shadowSmall, gap: 12 },
  fab: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },

  // Bottom overlay
  bottom: { position: 'absolute', left: 0, right: 0 },
  card: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankTile: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  rankNum: { fontSize: 20, fontWeight: '900', color: INK, lineHeight: 22 },
  rankSub: { fontSize: 7.5, fontWeight: '900', color: INK, letterSpacing: 0.6 },
  cardName: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2, lineHeight: 20 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  addr: { flex: 1, fontSize: 12, fontWeight: '600' },
  iconBtnSm: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 11.5, fontWeight: '900', color: INK },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12, marginRight: brutal.shadowSmall },
  dirBtn: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  dirText: { fontSize: 14, fontWeight: '900', color: INK },
  sqBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  statusIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  statusTitle: { fontSize: 15.5, fontWeight: '900' },
  statusText: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  statusBtn: { paddingHorizontal: 12, height: 36, justifyContent: 'center' },
  statusBtnText: { fontSize: 12.5, fontWeight: '900', color: INK },

  // Tracker
  tracker: { padding: 14 },
  trackerHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  trackerEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  trackerName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
  modeRow: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16, marginTop: 12, borderWidth: brutal.borderThin },
  modeBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: brutal.borderThin, borderColor: 'transparent' },
  modeEta: { fontSize: 11, fontWeight: '900' },
  modeSpinner: { transform: [{ scale: 0.7 }], height: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 8, alignItems: 'center', borderWidth: brutal.borderThin },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: 'rgba(28,26,23,0.7)' },
  statVal: { fontSize: 16, fontWeight: '900', color: INK, marginTop: 1, fontVariant: ['tabular-nums'] },
  trackerNote: { fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  arrivedBox: { marginTop: 12, padding: 12, borderRadius: 16, borderWidth: brutal.borderThin },
  arrivedTitle: { fontSize: 16, fontWeight: '900' },
  arrivedText: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },

  // Sheets
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, borderWidth: brutal.border, borderBottomWidth: 0 },
  listSheet: { maxHeight: '78%' },
  dragHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sheetEyebrow: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1.2, marginBottom: 3 },
  sheetTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, flexShrink: 1 },
  sheetHint: { fontSize: 12.5, lineHeight: 18, marginBottom: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, marginBottom: 8, borderWidth: brutal.borderThin },
  listRank: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  listRankText: { fontSize: 14, fontWeight: '900', color: INK },
  listName: { fontSize: 14.5, fontWeight: '900' },
  listMeta: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  listDist: { fontSize: 13, fontWeight: '900' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  formItem: { width: '30%', flexGrow: 1, gap: 6 },
  formLabel: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.6 },
  formInput: { height: 46, borderRadius: 14, textAlign: 'center', fontSize: 16, fontWeight: '800' },
  saveBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '900', color: INK },
});
