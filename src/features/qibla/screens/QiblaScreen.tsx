import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { RefreshCw, Navigation, Info, TriangleAlert, MapPin, Compass, Hand, Check } from 'lucide-react-native';
import Svg, { Circle as SvgCircle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../../core/hooks/useLocation';
import { calculateQiblaDirection } from '../../../core/utils/QiblaCalculator';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, type as T } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, Card, GlassCard, HeaderButton, ScreenHeader, haptic, outline } from '../../../core/components/ui';

// Kaaba Coordinates
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;
/** Degrees either side of the Qibla that count as "facing" it. */
const ALIGN_TOLERANCE = 5;
const KAABA_BLACK = '#17171A';

// Haversine formula to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const compassPoint = (deg: number) => POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

export function QiblaScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const { latitude, longitude, loading: locationLoading, refreshLocation, isUsingFallback } = useLocation();

  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distanceToKaaba, setDistanceToKaaba] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [isSensorAvailable, setIsSensorAvailable] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const compassSize = Math.min(width - 64, 320);

  // Initialize location & Qibla math
  useEffect(() => {
    if (!locationLoading) {
      const angle = calculateQiblaDirection(latitude, longitude);
      setQiblaAngle(angle);

      const distance = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setDistanceToKaaba(distance);
    }
  }, [latitude, longitude, locationLoading]);

  // Load and check Compass magnetometer sensor.
  // The sensor can fire dozens of times a second; re-rendering the whole screen for each reading made
  // it stutter, so readings are coalesced to at most ~10 state updates/sec (always keeping the latest).
  const pendingHeading = useRef<number | null>(null);
  const headingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let CompassHeading: any = null;

    try {
      // Safely import to prevent compile issues if not fully linked
      CompassHeading = require('react-native-compass-heading').default;

      if (CompassHeading) {
        setIsSensorAvailable(true);
        const degree_update_rate = 2;

        CompassHeading.start(degree_update_rate, ({ heading }: { heading: number }) => {
          if (isManualMode) return;
          pendingHeading.current = heading;
          if (headingTimer.current) return;
          headingTimer.current = setTimeout(() => {
            headingTimer.current = null;
            if (pendingHeading.current !== null) setDeviceHeading(Math.round(pendingHeading.current));
          }, 100);
        });
      }
    } catch {
      console.log('Compass sensor not available, using manual mode.');
      setIsSensorAvailable(false);
      setIsManualMode(true);
    }

    return () => {
      if (headingTimer.current) clearTimeout(headingTimer.current);
      headingTimer.current = null;
      if (CompassHeading) {
        CompassHeading.stop();
      }
    };
  }, [isManualMode]);

  // --- Presentation: smooth dial rotation along the shortest path ---
  const dialRotation = useSharedValue(0);
  const cumulative = useRef(0);
  useEffect(() => {
    const current = ((cumulative.current % 360) + 360) % 360;
    const delta = ((deviceHeading - current + 540) % 360) - 180;
    cumulative.current += delta;
    dialRotation.value = withTiming(-cumulative.current, { duration: 260, easing: Easing.out(Easing.quad) });
  }, [deviceHeading, dialRotation]);
  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${dialRotation.value}deg` }] }));

  // Offset between where the device points and the Qibla (-180..180, + means turn right)
  const offset = ((qiblaAngle - deviceHeading + 540) % 360) - 180;
  const aligned = !locationLoading && Math.abs(offset) <= ALIGN_TOLERANCE;

  const glow = useSharedValue(0);
  const pulse = useSharedValue(1);
  const wasAligned = useRef(false);
  useEffect(() => {
    glow.value = withTiming(aligned ? 1 : 0, { duration: 350 });
    if (aligned) {
      pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
    if (aligned && !wasAligned.current) haptic.success();
    wasAligned.current = aligned;
  }, [aligned, glow, pulse]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: pulse.value }] }));

  // Static dial ticks: built once per theme so heading updates don't re-create 72 SVG lines
  const tickLines = useMemo(() => Array.from({ length: 72 }, (_, i) => {
    const deg = i * 5;
    const major = deg % 30 === 0;
    const a = (deg * Math.PI) / 180;
    const outer = 93;
    const inner = major ? 83 : 88;
    return (
      <Line
        key={i}
        x1={100 + inner * Math.sin(a)}
        y1={100 - inner * Math.cos(a)}
        x2={100 + outer * Math.sin(a)}
        y2={100 - outer * Math.cos(a)}
        stroke={major ? colors.text : colors.textMuted}
        strokeOpacity={major ? 0.9 : 0.5}
        strokeWidth={major ? 1.6 : 0.8}
        strokeLinecap="round"
      />
    );
  }), [colors.text, colors.textMuted]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Qibla"
        subtitle={isUsingFallback ? 'Using fallback location (Makkah)' : 'Face the Kaaba from anywhere'}
        onBack={() => navigation.goBack()}
        right={
          <HeaderButton onPress={refreshLocation}>
            <RefreshCw color={colors.onSky} size={20} strokeWidth={2.4} />
          </HeaderButton>
        }
      >
        {!locationLoading && (
          <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Text style={[styles.statLabel, { color: colors.onSkyMuted }]}>DISTANCE TO KAABA</Text>
              <Text style={[styles.statValue, { color: colors.onSky }]}>{distanceToKaaba.toLocaleString()} km</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text style={[styles.statLabel, { color: colors.onSkyMuted }]}>QIBLA BEARING</Text>
              <Text style={[styles.statValue, { color: colors.onSky }]}>
                {Math.round(qiblaAngle)}° {compassPoint(qiblaAngle)}
              </Text>
            </GlassCard>
          </Animated.View>
        )}
      </ScreenHeader>

      {locationLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching GPS Coordinates...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          entering={FadeIn.duration(300)}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading readout */}
          <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.readout}>
            <Text style={[styles.readoutDeg, { color: aligned ? colors.success : colors.text }]}>
              {Math.round(((deviceHeading % 360) + 360) % 360)}°
            </Text>
            <Text style={[styles.readoutPoint, { color: colors.textMuted }]}>{compassPoint(deviceHeading)}</Text>
          </Animated.View>

          {/* Compass */}
          <Animated.View
            entering={FadeInDown.delay(220).duration(500)}
            style={[styles.compassWrapper, { width: compassSize + 36, height: compassSize + 36 }]}
          >
            {/* Alignment glow */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  width: compassSize + 24,
                  height: compassSize + 24,
                  borderRadius: (compassSize + 24) / 2,
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.ink,
                },
                glowStyle,
              ]}
            />

            {/* Hard shadow stays put while the dial rotates */}
            <View
              pointerEvents="none"
              style={[
                styles.dialShadow,
                { width: compassSize, height: compassSize, borderRadius: compassSize / 2, backgroundColor: colors.ink },
              ]}
            />

            {/* Fixed device pointer */}
            <View style={styles.pointer}>
              <Svg width={22} height={18} viewBox="0 0 22 18">
                <Path d="M11 17 L1.5 1.5 L20.5 1.5 Z" fill={aligned ? colors.success : colors.accent} stroke={colors.ink} strokeWidth={2.5} strokeLinejoin="round" />
              </Svg>
            </View>

            {/* Rotating dial */}
            <Animated.View
              style={[
                styles.dial,
                {
                  width: compassSize,
                  height: compassSize,
                  borderRadius: compassSize / 2,
                  backgroundColor: colors.surface,
                  borderColor: colors.ink,
                },
                dialStyle,
              ]}
            >
              <Svg width={compassSize} height={compassSize} viewBox="0 0 200 200">
                <SvgCircle cx="100" cy="100" r="97" fill={colors.surface} />
                <SvgCircle cx="100" cy="100" r="74" fill={colors.surfaceAlt} stroke={colors.ink} strokeWidth="2" />

                {/* Degree ticks every 5° */}
                {tickLines}

                {/* Cardinal letters */}
                <SvgText x="100" y="34" fill={colors.danger} stroke={colors.ink} strokeWidth="0.8" fontSize="16" fontWeight="900" textAnchor="middle">N</SvgText>
                <SvgText x="171" y="105" fill={colors.text} fontSize="14" fontWeight="900" textAnchor="middle">E</SvgText>
                <SvgText x="100" y="176" fill={colors.text} fontSize="14" fontWeight="900" textAnchor="middle">S</SvgText>
                <SvgText x="29" y="105" fill={colors.text} fontSize="14" fontWeight="900" textAnchor="middle">W</SvgText>

                {/* Inner decorative ring */}
                <SvgCircle cx="100" cy="100" r="46" stroke={colors.ink} strokeWidth="1.5" strokeDasharray="3 5" fill="none" />

                {/* Qibla needle + Kaaba marker */}
                <G transform={`rotate(${qiblaAngle}, 100, 100)`}>
                  <Line x1="100" y1="100" x2="100" y2="52" stroke={colors.ink} strokeWidth="4" strokeLinecap="round" />
                  <Path d="M100,40 L108,57 L92,57 Z" fill={colors.accent} stroke={colors.ink} strokeWidth="2" strokeLinejoin="round" />
                  {/* Kaaba */}
                  <Rect x="91" y="18" width="18" height="18" rx="2.5" fill={KAABA_BLACK} stroke={colors.ink} strokeWidth="2" />
                  <Line x1="91" y1="23.5" x2="109" y2="23.5" stroke={colors.accent} strokeWidth="2" />
                  <Rect x="98" y="29" width="4" height="7" rx="0.8" fill={colors.accent} opacity={0.85} />
                </G>

                {/* Center cap */}
                <SvgCircle cx="100" cy="100" r="9" fill={colors.accent} stroke={colors.ink} strokeWidth="2.5" />
                <SvgCircle cx="100" cy="100" r="3" fill={colors.ink} />
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Guidance */}
          <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.fullWidth}>
            <BrutalBox fill={aligned ? colors.primarySoft : colors.surface} style={styles.guidance}>
              <View style={[styles.iconTile, outline(colors), { backgroundColor: aligned ? colors.primary : colors.accent }]}>
                {aligned ? <Check color={colors.ink} size={18} strokeWidth={3} /> : <Navigation color={colors.ink} size={18} strokeWidth={2.5} />}
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.guidanceTitle, { color: colors.text }]}>
                  {aligned ? 'You are facing the Qibla' : `Turn ${offset > 0 ? 'right' : 'left'} ${Math.round(Math.abs(offset))}°`}
                </Text>
                <Text style={[styles.guidanceSub, { color: colors.textMuted }]}>
                  {aligned ? 'Alhamdulillah — the Kaaba is straight ahead.' : 'Line up the Kaaba with the marker at the top.'}
                </Text>
              </View>
            </BrutalBox>
          </Animated.View>

          {/* Warnings */}
          {isUsingFallback ? (
            <Animated.View entering={FadeInDown.delay(340).duration(450)} style={[styles.banner, outline(colors), { backgroundColor: colors.accentSoft }]}>
              <TriangleAlert color={colors.text} size={18} strokeWidth={2.4} />
              <Text style={[styles.bannerText, { color: colors.text }]}>
                GPS location denied or failed. Showing Qibla relative to fallback coordinates (Makkah).
              </Text>
            </Animated.View>
          ) : null}

          {/* Controls */}
          <Animated.View entering={FadeInDown.delay(380).duration(450)} style={styles.fullWidth}>
            {isSensorAvailable ? (
              <BrutalPressable
                fill={colors.primary}
                style={styles.toggleBtn}
                onPress={() => {
                  setIsManualMode(!isManualMode);
                  if (isManualMode) setDeviceHeading(0);
                }}
              >
                {isManualMode ? <Compass color={colors.onPrimary} size={18} /> : <Hand color={colors.onPrimary} size={18} />}
                <Text style={[styles.toggleBtnText, { color: colors.onPrimary }]}>
                  {isManualMode ? 'Enable Device Sensors' : 'Switch to Manual Adjust'}
                </Text>
              </BrutalPressable>
            ) : (
              <View style={[styles.banner, outline(colors), { backgroundColor: colors.accentSoft }]}>
                <Info color={colors.text} size={18} strokeWidth={2.4} />
                <Text style={[styles.bannerText, { color: colors.text }]}>
                  Magnetometer sensor not detected on this device. Using manual rotation.
                </Text>
              </View>
            )}
          </Animated.View>

          {isManualMode ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.fullWidth}>
              <Card style={styles.manualCard}>
                <View style={styles.manualHeader}>
                  <Text style={[styles.manualLabel, { color: colors.text }]}>Align dial manually to North</Text>
                  <View style={[styles.valuePill, outline(colors), { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.valuePillText, { color: colors.text }]}>{Math.round(deviceHeading)}°</Text>
                  </View>
                </View>
                <View style={styles.manualControlsRow}>
                  {[-15, -5, 5, 15].map((step) => (
                    <BrutalPressable
                      key={step}
                      fill={colors.surfaceAlt}
                      radius={14}
                      offset={brutal.shadowSmall}
                      borderWidth={brutal.borderThin}
                      style={styles.manualAdjustBtn}
                      onPress={() => setDeviceHeading((prev) => (prev + step + 360) % 360)}
                    >
                      <Text style={[styles.manualAdjustBtnText, { color: colors.text }]}>
                        {step > 0 ? `+${step}` : step}°
                      </Text>
                    </BrutalPressable>
                  ))}
                </View>
                <Text style={[styles.manualSub, { color: colors.textMuted }]}>
                  Use the buttons to align the dial manually until 'N' points north.
                </Text>
              </Card>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={styles.sensorRow}>
              <MapPin color={colors.text} size={15} strokeWidth={2.4} />
              <Text style={[styles.sensorStatus, { color: colors.textSecondary }]}>
                Real-time compass active. Rotate your device to calibrate.
              </Text>
            </Animated.View>
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  fullWidth: { width: '100%' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  statLabel: { ...T.caption, fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  statValue: { fontSize: 19, fontWeight: '900', marginTop: 4, letterSpacing: -0.3 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, fontWeight: '600' },

  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, gap: 16 },

  readout: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  readoutDeg: { fontSize: 46, fontWeight: '900', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  readoutPoint: { fontSize: 18, fontWeight: '900' },

  compassWrapper: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    borderWidth: brutal.border,
  },
  dialShadow: { position: 'absolute', transform: [{ translateX: brutal.shadow + 1 }, { translateY: brutal.shadow + 1 }] },
  pointer: { position: 'absolute', top: 0, zIndex: 10 },
  dial: {
    borderWidth: brutal.border,
    overflow: 'hidden',
  },

  guidance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconTile: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  guidanceTitle: { fontSize: 16, fontWeight: '900' },
  guidanceSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 14, width: '100%' },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },

  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 8,
  },
  toggleBtnText: { fontSize: 15, fontWeight: '900' },

  manualCard: { padding: 18 },
  manualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manualLabel: { fontSize: 15, fontWeight: '900' },
  valuePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  valuePillText: { fontSize: 13, fontWeight: '800' },
  manualControlsRow: { flexDirection: 'row', marginVertical: 14, gap: 10 },
  manualAdjustBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  manualAdjustBtnText: { fontSize: 14, fontWeight: '900' },
  manualSub: { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  sensorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  sensorStatus: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
