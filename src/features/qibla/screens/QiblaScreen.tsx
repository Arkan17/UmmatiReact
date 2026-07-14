import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { ArrowLeft, RefreshCw, Navigation } from 'lucide-react-native';
import Svg, { Circle as SvgCircle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { useLocation } from '../../../core/hooks/useLocation';
import { calculateQiblaDirection } from '../../../core/utils/QiblaCalculator';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = SCREEN_WIDTH * 0.75;

// Kaaba Coordinates
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

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

export function QiblaScreen() {
  const navigation = useNavigation();
  const { latitude, longitude, loading: locationLoading, refreshLocation, isUsingFallback } = useLocation();

  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distanceToKaaba, setDistanceToKaaba] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [isSensorAvailable, setIsSensorAvailable] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // Initialize location & Qibla math
  useEffect(() => {
    if (!locationLoading) {
      const angle = calculateQiblaDirection(latitude, longitude);
      setQiblaAngle(angle);

      const distance = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setDistanceToKaaba(distance);
    }
  }, [latitude, longitude, locationLoading]);

  // Load and check Compass magnetometer sensor
  useEffect(() => {
    let CompassHeading: any = null;

    try {
      // Safely import to prevent compile issues if not fully linked
      CompassHeading = require('react-native-compass-heading').default;
      
      if (CompassHeading) {
        setIsSensorAvailable(true);
        const degree_update_rate = 1;
        
        CompassHeading.start(degree_update_rate, ({ heading }: { heading: number }) => {
          if (!isManualMode) {
            setDeviceHeading(heading);
          }
        });
      }
    } catch {
      console.log('Compass sensor not available, using manual mode.');
      setIsSensorAvailable(false);
      setIsManualMode(true);
    }

    return () => {
      if (CompassHeading) {
        CompassHeading.stop();
      }
    };
  }, [isManualMode]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Qibla Compass</Text>
        <TouchableOpacity onPress={refreshLocation} style={styles.backBtn}>
          <RefreshCw color={Theme.colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {locationLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching GPS Coordinates...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Proximity Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance to Kaaba</Text>
              <Text style={styles.statValue}>{distanceToKaaba.toLocaleString()} km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Qibla Bearing</Text>
              <Text style={styles.statValue}>{Math.round(qiblaAngle)}° {qiblaAngle > 180 ? 'W' : 'E'}</Text>
            </View>
          </View>

          {/* Compass Dial Outer Container */}
          <View style={styles.compassWrapper}>
            {/* Alignment Guideline Marker */}
            <View style={styles.northMarker} />

            {/* Compass Disk (Rotating Dial) */}
            <View
              style={[
                styles.compassDisk,
                { transform: [{ rotate: `${-deviceHeading}deg` }] },
              ]}
            >
              <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 200 200">
                {/* Dial circle */}
                <SvgCircle cx="100" cy="100" r="95" stroke={Theme.colors.border} strokeWidth="2" fill={Theme.colors.surface} />
                
                {/* Degree ticks */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 100 + 85 * Math.sin(angle);
                  const y1 = 100 - 85 * Math.cos(angle);
                  const x2 = 100 + 92 * Math.sin(angle);
                  const y2 = 100 - 92 * Math.cos(angle);
                  return (
                    <Line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={i % 3 === 0 ? Theme.colors.primary : Theme.colors.border}
                      strokeWidth={i % 3 === 0 ? '2' : '1'}
                    />
                  );
                })}

                {/* Cardinal Labels */}
                <SvgText x="100" y="24" fill={Theme.colors.error} fontSize="14" fontWeight="bold" textAnchor="middle">N</SvgText>
                <SvgText x="178" y="105" fill={Theme.colors.textSecondary} fontSize="14" textAnchor="middle">E</SvgText>
                <SvgText x="100" y="186" fill={Theme.colors.textSecondary} fontSize="14" textAnchor="middle">S</SvgText>
                <SvgText x="22" y="105" fill={Theme.colors.textSecondary} fontSize="14" textAnchor="middle">W</SvgText>

                {/* Inner decorative rings */}
                <SvgCircle cx="100" cy="100" r="50" stroke="rgba(35, 68, 50, 0.4)" strokeWidth="1" fill="none" />

                {/* Pointer Arrow pointing to Qibla (Kaaba) relative to dial */}
                <G transform={`rotate(${qiblaAngle}, 100, 100)`}>
                  {/* Outer needle pointer */}
                  <Path
                    d="M100,15 L108,55 L92,55 Z"
                    fill={Theme.colors.accent}
                  />
                  <Line x1="100" y1="55" x2="100" y2="100" stroke={Theme.colors.accent} strokeWidth="2" strokeDasharray="3" />
                  
                  {/* Kaaba Representation Marker */}
                  <Path
                    d="M93,30 L107,30 L107,44 L93,44 Z"
                    fill="#1A1A1A"
                  />
                  {/* Gold band on Kaaba representation */}
                  <Line x1="93" y1="34" x2="107" y2="34" stroke={Theme.colors.accent} strokeWidth="1.5" />
                </G>
                
                {/* Center cap */}
                <SvgCircle cx="100" cy="100" r="6" fill={Theme.colors.white} stroke={Theme.colors.border} strokeWidth="2" />
              </Svg>
            </View>
          </View>

          {/* Compass Control & Warning widgets */}
          {isUsingFallback ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ GPS location denied or failed. Showing Qibla relative to fallback coordinates (Makkah).
              </Text>
            </View>
          ) : null}

          <View style={styles.controls}>
            {isSensorAvailable ? (
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => {
                  setIsManualMode(!isManualMode);
                  if (isManualMode) setDeviceHeading(0);
                }}
              >
                <Navigation color={Theme.colors.white} size={16} />
                <Text style={styles.toggleBtnText}>
                  {isManualMode ? 'Enable Device Sensors' : 'Switch to Manual Adjust'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ℹ️ Magnetometer sensor not detected on this device. Using manual rotation.
                </Text>
              </View>
            )}

            {/* Slider for Manual Direction Calibration */}
            {isManualMode ? (
              <View style={styles.sliderBox}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Align Dial manually to North</Text>
                  <Text style={styles.sliderValue}>{Math.round(deviceHeading)}°</Text>
                </View>
                <View style={styles.manualControlsRow}>
                  <TouchableOpacity
                    style={styles.manualAdjustBtn}
                    onPress={() => setDeviceHeading((prev) => (prev - 15 + 360) % 360)}
                  >
                    <Text style={styles.manualAdjustBtnText}>-15°</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manualAdjustBtn}
                    onPress={() => setDeviceHeading((prev) => (prev - 5 + 360) % 360)}
                  >
                    <Text style={styles.manualAdjustBtnText}>-5°</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manualAdjustBtn}
                    onPress={() => setDeviceHeading((prev) => (prev + 5) % 360)}
                  >
                    <Text style={styles.manualAdjustBtnText}>+5°</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manualAdjustBtn}
                    onPress={() => setDeviceHeading((prev) => (prev + 15) % 360)}
                  >
                    <Text style={styles.manualAdjustBtnText}>+15°</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sliderSub}>Use the buttons to align the dial manually until 'N' points north.</Text>
              </View>
            ) : (
              <View style={styles.sensorBox}>
                <Text style={styles.sensorStatus}>
                  🧭 Real-time compass active. Rotate your device to calibrate.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    justifyContent: 'space-between',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    paddingVertical: 16,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: Theme.colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Theme.colors.border,
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 40,
  },
  northMarker: {
    position: 'absolute',
    top: -12,
    width: 6,
    height: 18,
    backgroundColor: Theme.colors.error,
    borderRadius: 3,
    zIndex: 10,
  },
  compassDisk: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  toggleBtnText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    padding: 12,
    width: '100%',
  },
  warningText: {
    color: Theme.colors.accent,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  sliderBox: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderValue: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderSub: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
  manualControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 8,
  },
  manualAdjustBtn: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  manualAdjustBtnText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sensorBox: {
    paddingVertical: 12,
  },
  sensorStatus: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
