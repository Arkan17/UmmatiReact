import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab } from 'adhan';
import { ChevronLeft, ChevronDown, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../../../core/hooks/useLocation';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { calculateQiblaDirection } from '../../../core/utils/QiblaCalculator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

export function PrayerTimesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useScreenTime('PrayerTimesDetail');
  const { latitude, longitude, loading: locationLoading } = useLocation();

  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(1); // 19 Sat selected by default (matches Sat in mock index)
  const [nextPrayerName, setNextPrayerName] = useState('Asr');
  const [qiblaAngle, setQiblaAngle] = useState(287); // Default NW 287
  const [completedCount, setCompletedCount] = useState(1); // 1/5 Completed by default

  const [prayersChecklist, setPrayersChecklist] = useState<Record<string, boolean>>({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });

  const dates = [
    { day: '18', label: 'Fri' },
    { day: '19', label: 'Sat' },
    { day: '20', label: 'Sun' },
    { day: '21', label: 'Mon' },
    { day: '22', label: 'Tue' },
    { day: '23', label: 'Wed' },
    { day: '24', label: 'Thu' },
  ];

  // Load progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const savedChecklist = await AsyncStorage.getItem(`prayer_checklist_${todayStr}`);
        if (savedChecklist) {
          const checklist = JSON.parse(savedChecklist);
          setPrayersChecklist(checklist);
          const count = Object.values(checklist).filter(Boolean).length;
          setCompletedCount(count);
        }
      } catch (e) {
        console.warn('Failed to load prayer progress on PrayerTimesScreen:', e);
      }
    };
    loadProgress();
  }, []);

  const togglePrayer = async (prayerName: string) => {
    if (selectedDateIndex !== 1) {
      Alert.alert('Cannot Log', 'You can only log prayers for today.');
      return;
    }

    if (prayersChecklist[prayerName]) {
      Alert.alert('Already Logged', 'You have already logged this prayer for today.');
      return;
    }

    if (prayerTimes) {
      let prayerTime: Date | null = null;
      if (prayerName === 'Fajr') prayerTime = prayerTimes.fajr;
      if (prayerName === 'Dhuhr') prayerTime = prayerTimes.dhuhr;
      if (prayerName === 'Asr') prayerTime = prayerTimes.asr;
      if (prayerName === 'Maghrib') prayerTime = prayerTimes.maghrib;
      if (prayerName === 'Isha') prayerTime = prayerTimes.isha;

      if (prayerTime && new Date() < prayerTime) {
        Alert.alert('Time Not Arrived', `You cannot log ${prayerName} yet. The prayer time starts at ${formatTime(prayerTime)}.`);
        return;
      }
    }

    const updatedChecklist = {
      ...prayersChecklist,
      [prayerName]: true,
    };

    setPrayersChecklist(updatedChecklist);

    const count = Object.values(updatedChecklist).filter(Boolean).length;
    setCompletedCount(count);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`prayer_checklist_${todayStr}`, JSON.stringify(updatedChecklist));

      // Re-calculate XP (+10 XP per logged prayer)
      const storedXp = await AsyncStorage.getItem('user_xp');
      let currentXp = storedXp ? parseInt(storedXp, 10) : 1450;
      const newXp = currentXp + 10;
      await AsyncStorage.setItem('user_xp', newXp.toString());
    } catch (e) {
      console.warn('Failed to update prayer log:', e);
    }
  };

  // Calculate prayer times
  useEffect(() => {
    if (locationLoading) return;
    const coords = new Coordinates(latitude, longitude);
    const params = CalculationMethod.Karachi();
    params.madhab = Madhab.Shafi;
    const times = new PrayerTimes(coords, new Date(), params);
    setPrayerTimes(times);

    // Calculate Qibla Direction
    const angle = calculateQiblaDirection(latitude, longitude);
    setQiblaAngle(Math.round(angle));

    // Next prayer calculation
    const now = new Date();
    const next = times.nextPrayer(now);
    const prayerNamesMap: Record<any, string> = {
      [Prayer.Fajr]: 'Fajr',
      [Prayer.Sunrise]: 'Sunrise',
      [Prayer.Dhuhr]: 'Dhuhr',
      [Prayer.Asr]: 'Asr',
      [Prayer.Maghrib]: 'Maghrib',
      [Prayer.Isha]: 'Isha',
    };
    if (next !== Prayer.None) {
      setNextPrayerName(prayerNamesMap[next] || 'Asr');
    }
  }, [latitude, longitude, locationLoading]);

  const formatTime = (timeVal: Date | null) => {
    if (!timeVal) return '--:--';
    return timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <View style={styles.container}>
      {/* 1. Header with custom background mosque silhouette */}
      <View style={styles.headerContainer}>
        {/* Soft yellow/green background glow */}
        <View style={styles.headerBgGlow} />
        
        <Image
          source={require('../../../assets/images/next_prayer_mosque.png')}
          style={styles.headerMosqueImage}
          resizeMode="contain"
        />

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#0F172A" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Prayer Times</Text>
            <TouchableOpacity style={styles.locationSelector} activeOpacity={0.7}>
              <Text style={styles.locationText}>Mumbai, India</Text>
              <ChevronDown color="#64748B" size={14} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Horizontal Date Selector */}
        <View style={styles.dateSelectorContainer}>
          {dates.map((item, index) => {
            const isSelected = index === selectedDateIndex;
            return (
              <TouchableOpacity
                key={item.day}
                style={[
                  styles.datePill,
                  isSelected ? styles.datePillActive : styles.datePillInactive
                ]}
                onPress={() => setSelectedDateIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateDayText,
                  isSelected ? styles.dateDayTextActive : styles.dateDayTextInactive
                ]}>
                  {item.day}
                </Text>
                <Text style={[
                  styles.dateLabelText,
                  isSelected ? styles.dateLabelTextActive : styles.dateLabelTextInactive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Prayer Times List */}
        {locationLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0E9F6E" />
            <Text style={styles.loaderText}>Calculating Prayer Times...</Text>
          </View>
        ) : prayerTimes ? (
          <View style={styles.prayerListContainer}>
            {[
              { name: 'Fajr', time: prayerTimes.fajr },
              { name: 'Dhuhr', time: prayerTimes.dhuhr },
              { name: 'Asr', time: prayerTimes.asr },
              { name: 'Maghrib', time: prayerTimes.maghrib },
              { name: 'Isha', time: prayerTimes.isha },
            ].map((item) => {
              const isNext = nextPrayerName === item.name;
              const isCompleted = prayersChecklist[item.name];
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.prayerItemRow,
                    isNext ? styles.prayerItemRowActive : styles.prayerItemRowInactive,
                    isCompleted && { borderColor: '#0E9F6E', backgroundColor: '#E6F4EA' }
                  ]}
                  onPress={() => togglePrayer(item.name)}
                  activeOpacity={0.85}
                >
                  <View style={styles.prayerItemLeft}>
                    {/* Circle Checkbox */}
                    <View style={[
                      styles.checkboxCircle,
                      isCompleted && styles.checkboxCircleChecked,
                      isNext && !isCompleted && { borderColor: '#FFFFFF' }
                    ]}>
                      {isCompleted && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>

                    <Text style={[
                      styles.prayerNameText,
                      isNext ? styles.prayerNameTextActive : styles.prayerNameTextInactive,
                      isCompleted && { color: '#046C4E', fontWeight: 'bold' }
                    ]}>
                      {item.name}
                    </Text>
                    {isNext && (
                      <View style={styles.nextBadge}>
                        <Text style={styles.nextBadgeText}>Next Prayer</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.prayerItemRight}>
                    <Text style={[
                      styles.prayerTimeText,
                      isNext ? styles.prayerTimeTextActive : styles.prayerTimeTextInactive,
                      isCompleted && { color: '#046C4E' }
                    ]}>
                      {formatTime(item.time)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.bellButton} 
                      activeOpacity={0.7}
                      onPress={() => {
                        Alert.alert('Reminder Configured', `You will receive a notification 10 minutes before ${item.name} Jamat.`);
                      }}
                    >
                      <Bell color={isNext ? '#FFFFFF' : isCompleted ? '#0E9F6E' : '#0E9F6E'} size={18} fill={isNext ? '#FFFFFF' : 'none'} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* 4. Qibla Direction Card */}
        <View style={styles.qiblaCard}>
          <View style={styles.qiblaLeft}>
            <Text style={styles.qiblaTitle}>Qibla Direction</Text>
            <Text style={styles.qiblaValue}>{qiblaAngle}° NW</Text>
            <TouchableOpacity 
              style={styles.viewOnMapButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Qibla')}
            >
              <Text style={styles.viewOnMapButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.compassContainer}>
            {/* Visual SVG Compass aligned NW */}
            <Svg width={90} height={90} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="45" stroke="#E2E8F0" strokeWidth="2" fill="#F8FAFC" />
              {/* Outer compass ring detail */}
              <Circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2" fill="none" />
              {/* Needle pointing NW */}
              <G transform={`rotate(${qiblaAngle}, 50, 50)`}>
                {/* Pointer tip */}
                <Path d="M50,15 L56,45 L44,45 Z" fill="#0E9F6E" />
                <Path d="M50,85 L56,55 L44,55 Z" fill="#94A3B8" />
                <Circle cx="50" cy="50" r="4" fill="#0F172A" />
              </G>
              {/* Compass letters */}
              <SvgText x="50" y="24" fill="#EF4444" fontSize="8" fontWeight="bold" textAnchor="middle">N</SvgText>
            </Svg>
          </View>
        </View>

        {/* 5. Today's Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressCount}>{completedCount}/5</Text>
          </View>
          
          {/* Segmented Progress Bar */}
          <View style={styles.segmentedProgressBar}>
            {[1, 2, 3, 4, 5].map((val) => (
              <View
                key={val}
                style={[
                  styles.progressSegment,
                  val <= completedCount ? styles.progressSegmentActive : styles.progressSegmentInactive
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressTip}>Complete all prayers to earn more XP ✨</Text>
        </View>
        
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    height: 190,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 15,
  },
  headerBgGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFBEB', // soft warm gold/sun glow
    opacity: 0.85,
  },
  headerMosqueImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 260,
    height: 160,
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  datePill: {
    width: '12.5%',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
  },
  datePillActive: {
    backgroundColor: '#0E9F6E',
  },
  datePillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
  },
  dateDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateDayTextActive: {
    color: '#FFFFFF',
  },
  dateDayTextInactive: {
    color: '#0F172A',
  },
  dateLabelText: {
    fontSize: 9,
    fontWeight: '600',
  },
  dateLabelTextActive: {
    color: '#FFFFFF',
  },
  dateLabelTextInactive: {
    color: '#94A3B8',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loaderText: {
    color: '#64748B',
    fontSize: 14,
  },
  prayerListContainer: {
    marginBottom: 24,
    gap: 12,
  },
  prayerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
  },
  prayerItemRowActive: {
    backgroundColor: '#0E9F6E',
  },
  prayerItemRowInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
  },
  prayerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prayerNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  prayerNameTextActive: {
    color: '#FFFFFF',
  },
  prayerNameTextInactive: {
    color: '#0F172A',
  },
  nextBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  prayerItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerTimeText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  prayerTimeTextActive: {
    color: '#FFFFFF',
  },
  prayerTimeTextInactive: {
    color: '#0F172A',
  },
  bellButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxCircleChecked: {
    borderColor: '#0E9F6E',
    backgroundColor: '#0E9F6E',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qiblaCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  qiblaLeft: {
    flex: 1,
  },
  qiblaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  qiblaValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  viewOnMapButton: {
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  viewOnMapButtonText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  compassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0E9F6E',
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressSegmentActive: {
    backgroundColor: '#0E9F6E',
  },
  progressSegmentInactive: {
    backgroundColor: '#F1F5F9',
  },
  progressTip: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
