import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl, Image, Alert, Vibration } from 'react-native';
import { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab } from 'adhan';
import { Clock, Sun, Sunrise, Sunset, Moon, Eye, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../core/hooks/useAuth';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useLocation } from '../../../core/hooks/useLocation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Custom SVG Gradient Background for premium card styling
function CardGradient({ colors, style, children }: { colors: readonly string[], style?: any, children?: React.ReactNode }) {
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors[1]} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#cardGrad)" />
      </Svg>
      {children}
    </View>
  );
}

// Custom Lantern SVG Icon
function LanternIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v2M12 20v2M8 4h8v2H8V4ZM6 8h12v12H6V8Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 8c0-2.5 1.5-4 4-4s4 1.5 4 4v12c0 1.5-1.5 2-4 2s-4-.5-4-2V8Z" stroke={color} strokeWidth={1.5} />
      <Path d="M10 11h4M10 14h4" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  useScreenTime('Home');
  const { latitude, longitude, loading: locationLoading, refreshLocation } = useLocation();
  const navigation = useNavigation<NavigationProp>();
  const { content, refresh: refreshDynamicContent } = useDynamicContent();

  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [nextPrayerName, setNextPrayerName] = useState('');
  const [countdownStr, setCountdownStr] = useState('00:00:00');

  // Reminders State
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    Fajr: false,
    Sunrise: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });

  // Gamification progress states
  const [totalXp, setTotalXp] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  // Checklist State
  const [prayersChecklist, setPrayersChecklist] = useState<Record<string, boolean>>({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });
  const [refreshing, setRefreshing] = useState(false);



  // Verse of the Day state
  const [verse, setVerse] = useState(content.verses_of_the_day[0]);



  // Load reminder settings
  const loadReminders = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('prayer_reminders');
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    }
  }, []);

  // Toggle reminder setting


  // Check progress in local storage
  const loadUserProgress = useCallback(async () => {
    if (!user) return;
    try {
      const storedXp = await AsyncStorage.getItem('user_xp');
      const storedStreak = await AsyncStorage.getItem('user_streak');
      if (storedXp !== null) setTotalXp(parseInt(storedXp, 10));
      if (storedStreak !== null) setStreakCount(parseInt(storedStreak, 10));
    } catch (e) {
      console.warn('Failed to load user progress locally:', e);
    }
  }, [user]);

  // Check checklist in local storage for today
  const loadChecklist = useCallback(async () => {
    if (!user) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const savedChecklist = await AsyncStorage.getItem(`prayer_checklist_${todayStr}`);
      if (savedChecklist) {
        setPrayersChecklist(JSON.parse(savedChecklist));
      } else {
        setPrayersChecklist({
          Fajr: false,
          Dhuhr: false,
          Asr: false,
          Maghrib: false,
          Isha: false,
        });
      }
    } catch (e) {
      console.warn('Failed to load daily prayer logs locally:', e);
    }
  }, [user]);

  // Toggle checklist item and update local storage
  const togglePrayer = async (prayerName: string) => {
    if (!user) return;

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
        const timeStr = prayerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        Alert.alert('Time Not Arrived', `You cannot log ${prayerName} yet. The prayer time starts at ${timeStr}.`);
        return;
      }
    }

    const updatedChecklist = {
      ...prayersChecklist,
      [prayerName]: true,
    };

    setPrayersChecklist(updatedChecklist);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Save checklist locally
      await AsyncStorage.setItem(`prayer_checklist_${todayStr}`, JSON.stringify(updatedChecklist));

      // Calculate Daily Streak Change (streak maintained/increased if user logs at least 1 prayer daily)
      const completedCount = Object.values(updatedChecklist).filter(Boolean).length;
      let newStreak = streakCount;

      if (completedCount === 1) {
        // Just checked first prayer of today. Check if they logged any prayer yesterday.
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const yesterdayChecklist = await AsyncStorage.getItem(`prayer_checklist_${yesterdayStr}`);
        const completedYesterday = yesterdayChecklist && Object.values(JSON.parse(yesterdayChecklist)).some(Boolean);

        if (completedYesterday) {
          newStreak = streakCount + 1;
        } else {
          newStreak = 1;
        }
      }

      const currentXp = totalXp;
      const newXp = currentXp + 10;

      // Save new progress values locally
      await AsyncStorage.setItem('user_xp', newXp.toString());
      await AsyncStorage.setItem('user_streak', newStreak.toString());

      setTotalXp(newXp);
      setStreakCount(newStreak);
    } catch (e) {
      console.error('Failed to log prayer checklist activity locally:', e);
      // Revert in UI on fail
      setPrayersChecklist(prayersChecklist);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await loadChecklist();
    await loadUserProgress();
    await refreshDynamicContent();
    setRefreshing(false);
  };

  useEffect(() => {
    // 1. Verse of the Day selection
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    const verses = content.verses_of_the_day || [];
    if (verses.length > 0) {
      setVerse(verses[dayOfYear % verses.length]);
    }

    loadChecklist();
    loadUserProgress();
    loadReminders();
  }, [user, loadChecklist, loadUserProgress, loadReminders, content]);

  // Calculate prayer times when GPS is ready
  useEffect(() => {
    if (locationLoading) return;

    const coords = new Coordinates(latitude, longitude);
    const params = CalculationMethod.Karachi();
    params.madhab = Madhab.Shafi; // Standard Shafi calculation for Asr (earlier)

    const times = new PrayerTimes(coords, new Date(), params);
    setPrayerTimes(times);

    let lastTriggeredKey = '';

    // Dynamic countdown timer
    const interval = setInterval(() => {
      const now = new Date();
      const next = times.nextPrayer(now);

      let nextTime: Date;
      let nextName: string;

      if (next === Prayer.None) {
        // If next is None, all prayers for today are finished, so the next prayer is tomorrow's Fajr
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = new PrayerTimes(coords, tomorrow, params);
        nextTime = tomorrowTimes.fajr;
        nextName = 'Fajr (Tomorrow)';
      } else {
        nextTime = times.timeForPrayer(next)!;

        const prayerNamesMap: Record<any, string> = {
          [Prayer.Fajr]: 'Fajr',
          [Prayer.Sunrise]: 'Sunrise',
          [Prayer.Dhuhr]: 'Dhuhr',
          [Prayer.Asr]: 'Asr',
          [Prayer.Maghrib]: 'Maghrib',
          [Prayer.Isha]: 'Isha',
        };
        nextName = prayerNamesMap[next] || 'Salah';
      }

      setNextPrayerName(nextName);

      const diffMs = nextTime.getTime() - now.getTime();
      if (diffMs > 0) {
        const diffSecs = Math.floor(diffMs / 1000) % 60;
        const diffMins = Math.floor(diffMs / (1000 * 60)) % 60;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        const pad = (n: number) => n.toString().padStart(2, '0');
        setCountdownStr(`${pad(diffHours)}:${pad(diffMins)}:${pad(diffSecs)}`);
      } else {
        setCountdownStr('00:00:00');
      }

      // 4. Background Reminder & Buzzer System
      const checkPrayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      checkPrayers.forEach((pName) => {
        const isReminderActive = reminders[pName];
        if (isReminderActive) {
          const prayerEnum = pName === 'Fajr' ? Prayer.Fajr :
            pName === 'Sunrise' ? Prayer.Sunrise :
              pName === 'Dhuhr' ? Prayer.Dhuhr :
                pName === 'Asr' ? Prayer.Asr :
                  pName === 'Maghrib' ? Prayer.Maghrib : Prayer.Isha;

          const pTime = times.timeForPrayer(prayerEnum);
          if (pTime) {
            // Check if current time matches the calculated prayer time (within the same minute)
            const diffMinutes = Math.floor((now.getTime() - pTime.getTime()) / 60000);
            if (diffMinutes === 0) {
              const todayStr = now.toISOString().split('T')[0];
              const triggerKey = `${pName}_${todayStr}`;

              if (lastTriggeredKey !== triggerKey) {
                lastTriggeredKey = triggerKey;
                // Device Vibration (Buzzer alarm pattern)
                Vibration.vibrate([1000, 500, 1000, 500, 1000]);
                // Visual Alert Notification
                Alert.alert(
                  "🕌 Adhan Salah Reminder",
                  `It is time for ${pName} Salah (${pTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}).`,
                  [{ text: "Acknowledge", onPress: () => Vibration.cancel() }]
                );
              }
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [latitude, longitude, locationLoading, reminders]);



  const currentLevel = Math.floor(totalXp / 500) + 1;
  const xpInCurrentLevel = totalXp % 500;
  const xpNeededForNextLevel = 500 - xpInCurrentLevel;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E9F6E" />
      }
    >
      {/* Soft Blue Gradient Glow at the top */}
      <View style={styles.topGlow} />

      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <View style={styles.greetingsBox}>
            <Text style={styles.greetingText}>Assalamu Alaikum 👋</Text>
            <Text style={styles.usernameText}>{user?.username || 'Arkan'}</Text>
            <Text style={styles.blessingText}>May Allah bless your day 🌿</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.levelCard}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelBadgeText}>Level {currentLevel}</Text>
              <Text style={styles.xpPointsValue}>{totalXp} XP</Text>
              <Text style={styles.xpPointsLabel}>Next: {xpNeededForNextLevel} XP</Text>
            </View>
            <View style={styles.lanternBox}>
              <LanternIcon color="#F59E0B" size={24} />
            </View>
          </View>
        </View>
      </View>

      {/* 2. Next Prayer Card */}
      <View style={styles.nextPrayerCardWrapper}>
        {locationLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loaderText}>Acquiring GPS coordinates...</Text>
          </View>
        ) : prayerTimes ? (
          <CardGradient colors={['#044C34', '#0E9F6E']} style={styles.nextPrayerGradient}>
            <View style={styles.nextPrayerLeft}>
              <Text style={styles.nextPrayerLabel}>NEXT PRAYER</Text>
              <Text style={styles.nextPrayerNameText}>{nextPrayerName}</Text>
              <Text style={styles.nextPrayerCountdown}>{countdownStr}</Text>
              <Text style={styles.countdownLabels}>hrs         mins         secs</Text>

              <TouchableOpacity
                style={styles.viewTimesButton}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PrayerTimes' as any)}
              >
                <Eye color="#0E9F6E" size={13} style={{ marginRight: 6 }} />
                <Text style={styles.viewTimesButtonText}>View Prayer Times</Text>
              </TouchableOpacity>
            </View>

            <Image
              source={require('../../../assets/images/next_prayer_mosque.png')}
              style={styles.nextPrayerMosqueImage}
              resizeMode="contain"
            />
          </CardGradient>
        ) : (
          <View style={styles.loaderContainer}>
            <Text style={styles.loaderText}>Failed to load prayer times.</Text>
          </View>
        )}
      </View>

      {/* 3. Horizontal Prayer Slider */}
      <View style={styles.prayerSliderContainer}>
        {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
          const isSelected = nextPrayerName.toLowerCase().includes(prayer.toLowerCase());
          const isCompleted = prayersChecklist[prayer];

          let IconComponent = Clock;
          if (prayer === 'Fajr') IconComponent = Sunrise;
          if (prayer === 'Dhuhr') IconComponent = Sun;
          if (prayer === 'Asr') IconComponent = Clock;
          if (prayer === 'Maghrib') IconComponent = Sunset;
          if (prayer === 'Isha') IconComponent = Moon;

          return (
            <TouchableOpacity
              key={prayer}
              style={[
                styles.prayerSliderItem,
                isSelected ? styles.prayerSliderItemActive : styles.prayerSliderItemInactive,
                isCompleted && { borderColor: '#0E9F6E', backgroundColor: '#E6F4EA' }
              ]}
              onPress={() => togglePrayer(prayer)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.prayerSliderIconBox,
                isSelected ? styles.prayerSliderIconBoxActive : styles.prayerSliderIconBoxInactive,
                isCompleted && { backgroundColor: '#0E9F6E' }
              ]}>
                {isCompleted ? (
                  <Check color="#FFFFFF" size={16} />
                ) : (
                  <IconComponent color={isSelected ? '#FFFFFF' : '#94A3B8'} size={18} />
                )}
              </View>
              <Text style={[
                styles.prayerSliderLabel,
                isSelected ? styles.prayerSliderLabelActive : styles.prayerSliderLabelInactive,
                isCompleted && { color: '#046C4E', fontWeight: 'bold' }
              ]}>
                {prayer}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Today's Progress Card */}
      <View style={styles.todayProgressContainer}>
        <View style={styles.todayProgressLeft}>
          <View style={styles.todayProgressCapsule} />
          <Text style={styles.todayProgressTitle}>Today's Progress</Text>
        </View>
        <Text style={styles.todayProgressCount}>
          {Object.values(prayersChecklist).filter(Boolean).length}/5 Prayers Completed
        </Text>
      </View>

      {/* 5. Streak Indicator Row */}
      <View style={styles.streakCard}>
        <View style={styles.streakLeft}>
          <View style={styles.flameCircle}>
            <Image
              source={require('../../../assets/images/streak_flame.png')}
              style={styles.streakFlameImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakTitleText}>{streakCount} Day Streak 🔥</Text>
            <Text style={styles.streakSubtitleText}>Keep it up!</Text>
          </View>
        </View>

        <View style={styles.streakRight}>
          <View style={styles.streakBarRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => (
              <View
                key={day}
                style={[
                  styles.streakDot,
                  idx < (streakCount % 7 || 7) ? styles.streakDotActive : styles.streakDotInactive
                ]}
              />
            ))}
          </View>
          <Image
            source={require('../../../assets/images/streak_gift.png')}
            style={styles.streakGiftImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 6. Spiritual Tools Grid */}
      <View style={styles.toolsSection}>
        <View style={styles.toolsGrid}>
          {/* Quran */}
          <TouchableOpacity
            style={styles.toolGridItem}
            onPress={() => navigation.navigate('QuranTab' as any)}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/quran_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <Text style={styles.toolLabel}>Quran</Text>
            <Text style={styles.toolSubLabel}>Read & Reflect</Text>
          </TouchableOpacity>

          {/* Qibla */}
          <TouchableOpacity
            style={styles.toolGridItem}
            onPress={() => navigation.navigate('Qibla')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/qibla_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <Text style={styles.toolLabel}>Qibla</Text>
            <Text style={styles.toolSubLabel}>Find Direction</Text>
          </TouchableOpacity>

          {/* Tasbih */}
          <TouchableOpacity
            style={styles.toolGridItem}
            onPress={() => navigation.navigate('Tasbih')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/tasbih_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <Text style={styles.toolLabel}>Tasbih</Text>
            <Text style={styles.toolSubLabel}>Dhikr Counter</Text>
          </TouchableOpacity>

          {/* Dua */}
          <TouchableOpacity
            style={styles.toolGridItem}
            onPress={() => navigation.navigate('Duas' as any)}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/dua_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <Text style={styles.toolLabel}>Dua</Text>
            <Text style={styles.toolSubLabel}>Supplications</Text>
          </TouchableOpacity>

          {/* Mosques */}
          <TouchableOpacity
            style={styles.toolGridItem}
            onPress={() => navigation.navigate('Mosque')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/mosques_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <Text style={styles.toolLabel}>Mosques</Text>
            <Text style={styles.toolSubLabel}>Find Nearby</Text>
          </TouchableOpacity>

          {/* Explore */}
          <TouchableOpacity
            style={styles.toolGridItem}
            onPress={() => navigation.navigate('CommunityTab' as any)}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/explore_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <Text style={styles.toolLabel}>Explore</Text>
            <Text style={styles.toolSubLabel}>Islamic Content</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Inspiring Verse of the Day Card */}
      <View style={styles.verseCard}>
        <View style={styles.verseLeft}>
          <Text style={styles.verseHeader}>VERSE OF THE DAY</Text>
          <Text style={styles.verseArabic}>{verse.arabic}</Text>
          <Text style={styles.verseTranslation}>"{verse.translation}"</Text>
          <Text style={styles.verseRef}>({verse.reference})</Text>
        </View>

        <Image
          source={require('../../../assets/images/verse_quran.png')}
          style={styles.verseQuranImage}
          resizeMode="contain"
        />
      </View>

      {/* Spacing for bottom floating navigation bar */}
      <View style={{ height: 95 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50 (clean premium off-white background)
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 90, // Space for bottom tab bar
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: '#E0F2FE', // Soft blue top glow matching Home mockup
    opacity: 0.45,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0E9F6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  greetingsBox: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 11,
    color: '#64748B', // Medium gray greeting
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 1,
  },
  blessingText: {
    fontSize: 10,
    color: '#0E9F6E',
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  levelInfo: {
    justifyContent: 'center',
  },
  levelBadgeText: {
    color: '#0E9F6E',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  xpPointsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 1,
  },
  xpPointsLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  lanternBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPrayerCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  nextPrayerGradient: {
    padding: 20,
    flexDirection: 'row',
    height: 185,
    position: 'relative',
  },
  nextPrayerLeft: {
    flex: 1.2,
    zIndex: 1,
  },
  nextPrayerLabel: {
    color: '#A7F3D0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  nextPrayerNameText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  nextPrayerCountdown: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: 1,
  },
  countdownLabels: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  viewTimesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  viewTimesButtonText: {
    color: '#0E9F6E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nextPrayerMosqueImage: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    width: 160,
    height: 160,
    zIndex: 0,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
    backgroundColor: '#0E9F6E',
    height: 185,
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  prayerSliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  prayerSliderItem: {
    width: '18%',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  prayerSliderItemActive: {
    borderColor: '#E2E8F0',
  },
  prayerSliderItemInactive: {
    borderColor: '#F1F5F9',
  },
  prayerSliderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  prayerSliderIconBoxActive: {
    backgroundColor: '#0E9F6E',
    borderColor: '#0E9F6E',
  },
  prayerSliderIconBoxInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  prayerSliderLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  prayerSliderLabelActive: {
    color: '#0E9F6E',
  },
  prayerSliderLabelInactive: {
    color: '#64748B',
  },
  todayProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayProgressCapsule: {
    width: 3,
    height: 14,
    backgroundColor: '#0E9F6E',
    borderRadius: 2,
  },
  todayProgressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  todayProgressCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakFlameImage: {
    width: 24,
    height: 24,
  },
  streakInfo: {
    justifyContent: 'center',
  },
  streakTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  streakSubtitleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  streakDotActive: {
    backgroundColor: '#F97316',
  },
  streakDotInactive: {
    backgroundColor: '#E2E8F0',
  },
  streakGiftImage: {
    width: 30,
    height: 30,
    marginLeft: 2,
  },
  toolsSection: {
    marginBottom: 20,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  toolGridItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    width: '31.5%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  toolIconImage: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  toolLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  toolSubLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  verseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  verseLeft: {
    flex: 1,
    paddingRight: 80,
    zIndex: 1,
  },
  verseHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  verseArabic: {
    fontSize: 18,
    color: '#0E9F6E',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  verseTranslation: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  verseRef: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  verseQuranImage: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 100,
    height: 100,
    zIndex: 0,
  },
});
