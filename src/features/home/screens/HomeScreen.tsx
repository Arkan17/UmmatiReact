import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab } from 'adhan';
import { Compass, Book, Award, Bell, Clock, CheckCircle2, Circle } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { useLocation } from '../../../core/hooks/useLocation';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

// Static Inspiring Verses library to cycle
const VERSES_OF_THE_DAY = [
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship [will be] ease.',
    reference: 'Surah Ash-Sharh 94:6',
  },
  {
    arabic: 'وَاقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ',
    translation: 'And establish prayer and give zakah.',
    reference: 'Surah Al-Baqarah 2:43',
  },
  {
    arabic: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
    translation: 'Call upon Me; I will respond to you.',
    reference: 'Surah Ghafir 40:60',
  },
  {
    arabic: 'وَاللَّهُ مَعَ الصَّابِرِينَ',
    translation: 'And Allah is with the patient.',
    reference: 'Surah Al-Baqarah 2:249',
  },
  {
    arabic: 'إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translation: 'Indeed, Allah is over all things competent.',
    reference: 'Surah Al-Baqarah 2:20',
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { user } = useAuth();
  const { latitude, longitude, loading: locationLoading, refreshLocation } = useLocation();
  const navigation = useNavigation<NavigationProp>();

  const [greeting, setGreeting] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [nextPrayerName, setNextPrayerName] = useState('');
  const [countdownStr, setCountdownStr] = useState('00:00:00');
  
  // Gamification progress states
  const [totalXp, setTotalXp] = useState(1450); // Default placeholder
  const [streakCount, setStreakCount] = useState(29); // Default placeholder

  // Checklist State
  const [prayersChecklist, setPrayersChecklist] = useState<Record<string, boolean>>({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Verse of the Day state
  const [verse, setVerse] = useState(VERSES_OF_THE_DAY[0]);

  // Tabular approximation of Hijri Date
  const calculateHijriDate = (date: Date) => {
    const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
    const l = Math.floor(jd) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    let l_rest = l - 10631 * n + 354;
    const j = Math.floor((10985 - l_rest) / 5316) * Math.floor((50 - l_rest) / 5600) + Math.floor(l_rest / 5600);
    l_rest = l_rest - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 30) * 178121 + 30;
    const h_y = 30 * n + j - 30;
    const h_m = Math.floor((24 * l_rest) / 709);
    const h_d = l_rest - Math.floor((709 * h_m) / 24);
    
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' ath-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    return `${h_d} ${hijriMonths[h_m - 1]} ${h_y} AH`;
  };

  // Check progress in database
  const loadUserProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_progress')
        .select('total_xp, streak_count')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        if (data.total_xp !== undefined && data.total_xp !== null) setTotalXp(data.total_xp);
        if (data.streak_count !== undefined && data.streak_count !== null) setStreakCount(data.streak_count);
      }
    } catch (e) {
      console.warn('Failed to load user progress on Home:', e);
    }
  }, [user]);

  // Check checklist in database for today
  const loadChecklist = useCallback(async () => {
    if (!user) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('user_activities')
        .select('details')
        .eq('user_id', user.id)
        .eq('activity_type', 'prayer')
        .eq('activity_date', todayStr)
        .maybeSingle();

      if (data && data.details) {
        setPrayersChecklist({
          Fajr: !!data.details.Fajr,
          Dhuhr: !!data.details.Dhuhr,
          Asr: !!data.details.Asr,
          Maghrib: !!data.details.Maghrib,
          Isha: !!data.details.Isha,
        });
      }
    } catch (e) {
      console.warn('Failed to load daily prayer logs:', e);
    }
  }, [user]);

  // Toggle checklist item and update Supabase
  const togglePrayer = async (prayerName: string) => {
    if (!user) return;
    
    const updatedChecklist = {
      ...prayersChecklist,
      [prayerName]: !prayersChecklist[prayerName],
    };
    
    setPrayersChecklist(updatedChecklist);
    setSavingChecklist(true);
    
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Attempt to upsert
      const { error } = await supabase
        .from('user_activities')
        .upsert(
          {
            user_id: user.id,
            activity_type: 'prayer',
            activity_date: todayStr,
            details: updatedChecklist,
          },
          { onConflict: 'user_id,activity_type,activity_date' }
        );

      if (error) throw error;

      // Update XP in user progress
      const xpChange = !prayersChecklist[prayerName] ? 10 : -10;
      
      const { data: progress } = await supabase
        .from('user_progress')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();
        
      if (progress) {
        const newXp = Math.max(0, progress.total_xp + xpChange);
        await supabase
          .from('user_progress')
          .update({
            total_xp: newXp,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        setTotalXp(newXp);
      }
    } catch (e) {
      console.error('Failed to log prayer checklist activity:', e);
      // Revert in UI on fail
      setPrayersChecklist(prayersChecklist);
    } finally {
      setSavingChecklist(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await loadChecklist();
    await loadUserProgress();
    setRefreshing(false);
  };

  useEffect(() => {
    // 1. Time-aware greeting
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Sabah Al-Khair (Good Morning)');
    } else if (hours < 17) {
      setGreeting('Masa Al-Khair (Good Afternoon)');
    } else {
      setGreeting('Assalamu Alaikum');
    }

    // 2. Hijri date
    setHijriDate(calculateHijriDate(new Date()));

    // 3. Verse of the Day selection
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    setVerse(VERSES_OF_THE_DAY[dayOfYear % VERSES_OF_THE_DAY.length]);

    loadChecklist();
    loadUserProgress();
  }, [user, loadChecklist, loadUserProgress]);

  // Calculate prayer times when GPS is ready
  useEffect(() => {
    if (locationLoading) return;

    const coords = new Coordinates(latitude, longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi; // Standard Shafi calculation for Asr (earlier)
    
    const times = new PrayerTimes(coords, new Date(), params);
    setPrayerTimes(times);

    // Dynamic countdown timer
    const interval = setInterval(() => {
      const now = new Date();
      const next = times.nextPrayer(now);
      
      let nextTime: Date;
      let nextName: string;

      if (next === Prayer.None || next === Prayer.Fajr) {
        // If next is Fajr or None (meaning next day Fajr), fetch next day Fajr
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
    }, 1000);

    return () => clearInterval(interval);
  }, [latitude, longitude, locationLoading]);

  // Format date helper (e.g. 5:12 PM)
  const formatTime = (dateVal: Date | null) => {
    if (!dateVal) return '--:--';
    return dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
      }
    >
      {/* 1. Header Row (Mockup Style) */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.greetingsBox}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.usernameText}>{user?.username || 'Ummati'} 👋</Text>
            <Text style={styles.blessingText}>May Allah bless your day</Text>
          </View>
        </View>
        
        <View style={styles.levelStatusBox}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>⭐ Level {1 + Math.floor(totalXp / 100)}</Text>
          </View>
          <Text style={styles.xpPointsValue}>{totalXp} XP</Text>
          <Text style={styles.xpPointsLabel}>Total Points</Text>
        </View>
      </View>

      {/* 2. Next Prayer Card (Mockup Style) */}
      <View style={styles.nextPrayerContainer}>
        {locationLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loaderText}>Acquiring GPS coordinates...</Text>
          </View>
        ) : prayerTimes ? (
          <View style={styles.nextPrayerContentRow}>
            <View style={styles.nextPrayerLeft}>
              <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
              <Text style={styles.nextPrayerNameText}>{nextPrayerName}</Text>
              <Text style={styles.nextPrayerCountdown}>{countdownStr}</Text>
              <Text style={styles.nextPrayerToGo}>To Go</Text>
            </View>
            <View style={styles.nextPrayerRight}>
              <View style={styles.nextPrayerMosqueGraphic}>
                <Text style={styles.mosqueEmoji}>🕌</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.loaderText}>Failed to load prayer times.</Text>
        )}
      </View>

      {/* 3. Today's Progress / Salah Circles Row (Mockup Style) */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <Text style={styles.progressCountText}>
            {Object.values(prayersChecklist).filter(Boolean).length} / 5 Prayers Completed
          </Text>
        </View>
        
        <View style={styles.prayerCirclesRow}>
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
            const completed = prayersChecklist[prayer];
            return (
              <TouchableOpacity
                key={prayer}
                style={styles.prayerCircleItem}
                onPress={() => togglePrayer(prayer)}
              >
                <View style={[
                  styles.prayerCheckCircle,
                  completed ? styles.prayerCheckCircleCompleted : styles.prayerCheckCirclePending
                ]}>
                  {completed ? (
                    <Text style={styles.checkIconText}>✓</Text>
                  ) : (
                    <View style={styles.emptyDot} />
                  )}
                </View>
                <Text style={styles.prayerCircleLabel}>{prayer}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Streak Indicator Row (Mockup Style) */}
      <View style={styles.streakCard}>
        <View style={styles.streakLeft}>
          <View style={styles.flameCircle}>
            <Text style={styles.flameEmoji}>🔥</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakTitleText}>{streakCount} Day Streak</Text>
            <Text style={styles.streakSubtitleText}>Don't break it!</Text>
          </View>
        </View>
        <View style={styles.streakRight}>
          <View style={styles.streakBarRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => (
              <View
                key={day}
                style={[
                  styles.streakBarSegment,
                  idx < (streakCount % 7 || 7) ? styles.streakBarActive : styles.streakBarInactive
                ]}
              />
            ))}
          </View>
          <Text style={styles.giftEmoji}>🎁</Text>
        </View>
      </View>

      {/* 5. Spiritual Tools Grid (Mockup Style) */}
      <View style={styles.toolsSection}>
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolGridItem} onPress={() => navigation.navigate('QuranTab' as any)}>
            <View style={[styles.toolIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Text style={{ fontSize: 24 }}>📖</Text>
            </View>
            <Text style={styles.toolLabel}>Quran</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolGridItem} onPress={() => navigation.navigate('Qibla')}>
            <View style={[styles.toolIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Text style={{ fontSize: 24 }}>🧭</Text>
            </View>
            <Text style={styles.toolLabel}>Qibla</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolGridItem} onPress={() => navigation.navigate('Tasbih')}>
            <View style={[styles.toolIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Text style={{ fontSize: 24 }}>📿</Text>
            </View>
            <Text style={styles.toolLabel}>Tasbih</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolGridItem} onPress={() => navigation.navigate('Duas')}>
            <View style={[styles.toolIconBox, { backgroundColor: '#FCE7F3' }]}>
              <Text style={{ fontSize: 24 }}>🤲</Text>
            </View>
            <Text style={styles.toolLabel}>Dua</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolGridItem} onPress={() => navigation.navigate('Mosque')}>
            <View style={[styles.toolIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 24 }}>🕌</Text>
            </View>
            <Text style={styles.toolLabel}>Mosques</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolGridItem} onPress={() => navigation.navigate('ExploreTab' as any)}>
            <View style={[styles.toolIconBox, { backgroundColor: '#FFEDD5' }]}>
              <Text style={{ fontSize: 24 }}>🌐</Text>
            </View>
            <Text style={styles.toolLabel}>Explore</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Inspiring Verse of the Day Card */}
      <View style={styles.verseCard}>
        <Text style={styles.verseHeader}>Verse of the Day</Text>
        <Text style={styles.verseArabic}>{verse.arabic}</Text>
        <Text style={styles.verseTranslation}>"{verse.translation}"</Text>
        <Text style={styles.verseRef}>{verse.reference}</Text>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  avatarInitial: {
    color: Theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  greetingsBox: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  blessingText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  levelStatusBox: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.sm,
    marginBottom: 4,
  },
  levelBadgeText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  xpPointsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  xpPointsLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  nextPrayerContainer: {
    backgroundColor: '#E6F4EA', // Light mint green tint
    borderRadius: Theme.radius.lg,
    padding: 20,
    marginBottom: 20,
    borderColor: '#C2E7D9',
    borderWidth: 1,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loaderText: {
    color: Theme.colors.primary,
    fontSize: 14,
  },
  nextPrayerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerLeft: {
    flex: 1,
  },
  nextPrayerLabel: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextPrayerNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 2,
  },
  nextPrayerCountdown: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  nextPrayerToGo: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  nextPrayerRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPrayerMosqueGraphic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C2E7D9',
  },
  mosqueEmoji: {
    fontSize: 40,
  },
  progressCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  progressCountText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  prayerCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prayerCircleItem: {
    alignItems: 'center',
    flex: 1,
  },
  prayerCheckCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  prayerCheckCircleCompleted: {
    backgroundColor: Theme.colors.primary,
  },
  prayerCheckCirclePending: {
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  checkIconText: {
    color: Theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.textMuted,
  },
  prayerCircleLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
  },
  streakCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameEmoji: {
    fontSize: 20,
  },
  streakInfo: {
    justifyContent: 'center',
  },
  streakTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  streakSubtitleText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBarRow: {
    flexDirection: 'row',
    gap: 3,
  },
  streakBarSegment: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakBarActive: {
    backgroundColor: Theme.colors.accent,
  },
  streakBarInactive: {
    backgroundColor: Theme.colors.border,
  },
  giftEmoji: {
    fontSize: 22,
  },
  toolsSection: {
    marginBottom: 20,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolGridItem: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    width: '30%', // Fits 3 items beautifully in a row
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  toolLabel: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verseCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  verseHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  verseArabic: {
    fontSize: 20,
    color: Theme.colors.text,
    fontFamily: 'Georgia',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  verseTranslation: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  verseRef: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
  },
});
