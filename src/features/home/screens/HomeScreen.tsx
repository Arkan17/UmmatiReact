import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl, Image, Modal, Alert, Vibration } from 'react-native';
import { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab } from 'adhan';
import { Bell, Clock, ChevronRight, Sun, Sunrise, Sunset, Moon, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../core/hooks/useAuth';
import { useLocation } from '../../../core/hooks/useLocation';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Custom SVG Gradient Background (Simplified to solid background to prevent SVG rendering failures)
function CardGradient({ colors, style, children }: { colors: string[], style?: any, children?: React.ReactNode }) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors[1] || '#0E9F6E' }, style]}>
      {children}
    </View>
  );
}

// Custom Dome Outline SVG Icon
function DomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v2M12 5c-2 0-3.5 1.5-3.5 3.5V10h7V8.5c0-2-1.5-3.5-3.5-3.5ZM6 17c0-2.5 2-4.5 4.5-4.5h3c2.5 0 4.5 2 4.5 4.5v2H6v-2ZM4 19h16"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { latitude, longitude, loading: locationLoading, refreshLocation } = useLocation();
  const navigation = useNavigation<NavigationProp>();
  const { content, refresh: refreshDynamicContent } = useDynamicContent();

  const [greeting, setGreeting] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [nextPrayerName, setNextPrayerName] = useState('');
  const [countdownStr, setCountdownStr] = useState('00:00:00');

  // Modal State
  const [showTimesModal, setShowTimesModal] = useState(false);

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
  const [verse, setVerse] = useState(content.verses_of_the_day[0]);

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
  const toggleReminder = async (prayerName: string) => {
    const updated = {
      ...reminders,
      [prayerName]: !reminders[prayerName],
    };
    setReminders(updated);
    try {
      await AsyncStorage.setItem('prayer_reminders', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save reminder preference:', e);
    }
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
    await refreshDynamicContent();
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

  // Format date helper (e.g. 5:12 PM)
  const formatTime = (dateVal: Date | null) => {
    if (!dateVal) return '--:--';
    return dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.greetingsBox}>
            <Text style={styles.greetingText}>Sabah Al-Khair 👋</Text>
            <Text style={styles.usernameText}>{user?.username || 'Ummati'}</Text>
            <Text style={styles.blessingText}>May Allah bless your day ✨</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.levelStatusBox}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>⭐ Level {1 + Math.floor(totalXp / 100)}</Text>
            </View>
            <Text style={styles.xpPointsValue}>{totalXp} XP</Text>
            <Text style={styles.xpPointsLabel}>Total Points</Text>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
            <Bell color="#0F172A" size={20} fill="#0F172A" />
            <View style={styles.bellBadgeDot} />
          </TouchableOpacity>
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
          <CardGradient colors={['#55D2B3', '#0E9F6E']} style={styles.nextPrayerGradient}>
            <View style={styles.nextPrayerLeft}>
              <Text style={styles.nextPrayerLabel}>NEXT PRAYER</Text>
              <Text style={styles.nextPrayerNameText}>{nextPrayerName}</Text>
              <Text style={styles.nextPrayerCountdown}>{countdownStr}</Text>
              <Text style={styles.countdownLabels}>HRS         MINS         SECS</Text>
              
              <TouchableOpacity 
                style={styles.viewTimesButton} 
                activeOpacity={0.9}
                onPress={() => setShowTimesModal(true)}
              >
                <Clock color="#0E9F6E" size={13} style={{ marginRight: 4 }} />
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

      {/* 3. Today's Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.progressTitleIndicator} />
            <Text style={styles.progressTitle}>Today's Progress</Text>
          </View>
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
                activeOpacity={0.7}
              >
                <View style={[
                  styles.prayerRing,
                  completed ? styles.prayerRingCompleted : styles.prayerRingPending
                ]}>
                  <DomeIcon color={completed ? '#0E9F6E' : '#94A3B8'} size={22} />
                </View>
                <Text style={[styles.prayerCircleLabel, completed && styles.prayerCircleLabelActive]}>
                  {prayer}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Streak Indicator Row */}
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
            <Text style={styles.streakSubtitleText}>Don't break it!</Text>
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

      {/* 5. Spiritual Tools Grid */}
      <View style={styles.toolsSection}>
        <View style={styles.toolsGrid}>
          {/* Quran */}
          <TouchableOpacity 
            style={styles.toolGridItem} 
            onPress={() => navigation.navigate('QuranTab' as any)}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/quran_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <View style={styles.toolInfoBox}>
              <Text style={styles.toolLabel}>Quran</Text>
              <Text style={styles.toolSubLabel}>Read & Reflect</Text>
            </View>
            <View style={styles.toolCaret}>
              <ChevronRight color="#94A3B8" size={10} />
            </View>
          </TouchableOpacity>

          {/* Qibla */}
          <TouchableOpacity 
            style={styles.toolGridItem} 
            onPress={() => navigation.navigate('Qibla')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/qibla_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <View style={styles.toolInfoBox}>
              <Text style={styles.toolLabel}>Qibla</Text>
              <Text style={styles.toolSubLabel}>Find Direction</Text>
            </View>
            <View style={styles.toolCaret}>
              <ChevronRight color="#94A3B8" size={10} />
            </View>
          </TouchableOpacity>

          {/* Tasbih */}
          <TouchableOpacity 
            style={styles.toolGridItem} 
            onPress={() => navigation.navigate('Tasbih')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/tasbih_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <View style={styles.toolInfoBox}>
              <Text style={styles.toolLabel}>Tasbih</Text>
              <Text style={styles.toolSubLabel}>Dhikr Counter</Text>
            </View>
            <View style={styles.toolCaret}>
              <ChevronRight color="#94A3B8" size={10} />
            </View>
          </TouchableOpacity>

          {/* Dua */}
          <TouchableOpacity 
            style={styles.toolGridItem} 
            onPress={() => navigation.navigate('Duas' as any)}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/dua_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <View style={styles.toolInfoBox}>
              <Text style={styles.toolLabel}>Dua</Text>
              <Text style={styles.toolSubLabel}>Supplications</Text>
            </View>
            <View style={styles.toolCaret}>
              <ChevronRight color="#94A3B8" size={10} />
            </View>
          </TouchableOpacity>

          {/* Mosques */}
          <TouchableOpacity 
            style={styles.toolGridItem} 
            onPress={() => navigation.navigate('Mosque')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/mosques_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <View style={styles.toolInfoBox}>
              <Text style={styles.toolLabel}>Mosques</Text>
              <Text style={styles.toolSubLabel}>Find Nearby</Text>
            </View>
            <View style={styles.toolCaret}>
              <ChevronRight color="#94A3B8" size={10} />
            </View>
          </TouchableOpacity>

          {/* Explore */}
          <TouchableOpacity 
            style={styles.toolGridItem} 
            onPress={() => navigation.navigate('CommunityTab' as any)}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/images/explore_icon.png')} style={styles.toolIconImage} resizeMode="contain" />
            <View style={styles.toolInfoBox}>
              <Text style={styles.toolLabel}>Explore</Text>
              <Text style={styles.toolSubLabel}>Islamic Content</Text>
            </View>
            <View style={styles.toolCaret}>
              <ChevronRight color="#94A3B8" size={10} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Inspiring Verse of the Day Card */}
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
      <View style={{ height: 90 }} />
      
      {/* Prayer Times Bottom Sheet Modal */}
      <Modal
        visible={showTimesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimesModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setShowTimesModal(false)}
        >
          <View style={styles.modalContentSheet}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Header Row */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Prayer Times</Text>
                <Text style={styles.modalSubtitle}>{hijriDate} • Mumbai</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowTimesModal(false)}
              >
                <X color="#64748B" size={18} />
              </TouchableOpacity>
            </View>

            {/* List of Prayer Times */}
            {prayerTimes && (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {[
                  { name: 'Fajr', time: prayerTimes.fajr, icon: Sunrise, color: '#FF9F43', bg: '#FFF3E8' },
                  { name: 'Sunrise', time: prayerTimes.sunrise, icon: Sun, color: '#FFD200', bg: '#FFFEEB' },
                  { name: 'Dhuhr', time: prayerTimes.dhuhr, icon: Sun, color: '#00D2FC', bg: '#E3FCFF' },
                  { name: 'Asr', time: prayerTimes.asr, icon: Clock, color: '#341F97', bg: '#EEECFF' },
                  { name: 'Maghrib', time: prayerTimes.maghrib, icon: Sunset, color: '#FF5252', bg: '#FFEBEE' },
                  { name: 'Isha', time: prayerTimes.isha, icon: Moon, color: '#5F27CD', bg: '#F1ECFF' },
                ].map((item) => {
                  const reminderActive = reminders[item.name];
                  const Icon = item.icon;
                  const displayTime = item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <View key={item.name} style={styles.modalRow}>
                      <View style={styles.modalRowLeft}>
                        <View style={[styles.modalIconBox, { backgroundColor: item.bg }]}>
                          <Icon color={item.color} size={18} />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.modalPrayerName}>{item.name}</Text>
                          <Text style={styles.modalPrayerTime}>{displayTime}</Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        style={[
                          styles.modalBellButton,
                          reminderActive ? styles.modalBellButtonActive : styles.modalBellButtonInactive
                        ]}
                        onPress={() => toggleReminder(item.name)}
                        activeOpacity={0.7}
                      >
                        <Bell color={reminderActive ? '#0E9F6E' : '#94A3B8'} size={18} fill={reminderActive ? '#0E9F6E' : 'none'} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.modalCloseMainButton} 
              onPress={() => setShowTimesModal(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.modalCloseMainButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50 (very premium, soft light gray/blue background)
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
    height: 250,
    backgroundColor: '#E0F2FE', // Light blue top glow
    opacity: 0.45,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    marginBottom: 20,
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
    backgroundColor: '#0E9F6E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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
    fontSize: 13,
    fontWeight: '500',
    color: '#F59E0B', // Warm Gold greeting
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    marginTop: 1,
  },
  blessingText: {
    fontSize: 10,
    color: '#94A3B8', // Slate 400
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelStatusBox: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 3,
  },
  levelBadgeText: {
    color: '#046C4E',
    fontSize: 10,
    fontWeight: '700',
  },
  xpPointsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  xpPointsLabel: {
    fontSize: 8,
    color: '#94A3B8',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E9F6E',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  nextPrayerCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  nextPrayerGradient: {
    padding: 20,
    flexDirection: 'row',
    height: 180,
    position: 'relative',
  },
  nextPrayerLeft: {
    flex: 1,
    zIndex: 1,
  },
  nextPrayerLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  nextPrayerNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  nextPrayerCountdown: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 1,
  },
  countdownLabels: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  viewTimesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  viewTimesButtonText: {
    color: '#0E9F6E',
    fontSize: 10,
    fontWeight: '700',
  },
  nextPrayerMosqueImage: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    width: 155,
    height: 155,
    zIndex: 0,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
    backgroundColor: '#0E9F6E',
    height: 180,
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitleIndicator: {
    width: 4,
    height: 14,
    backgroundColor: '#0E9F6E',
    borderRadius: 2,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  prayerCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prayerCircleItem: {
    alignItems: 'center',
    flex: 1,
  },
  prayerRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
  },
  prayerRingCompleted: {
    borderColor: '#0E9F6E',
    backgroundColor: '#E6F4EA',
  },
  prayerRingPending: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  prayerCircleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  prayerCircleLabelActive: {
    color: '#0E9F6E',
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
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED', // Soft light orange
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  streakFlameImage: {
    width: 26,
    height: 26,
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
    backgroundColor: '#F97316', // Orange active dot
  },
  streakDotInactive: {
    backgroundColor: '#E2E8F0',
  },
  streakGiftImage: {
    width: 32,
    height: 32,
    marginLeft: 4,
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
    width: '31.5%', // Perfect fit for 3 items in a row
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  toolIconImage: {
    width: 44,
    height: 44,
    marginBottom: 6,
  },
  toolInfoBox: {
    alignItems: 'center',
    justifyContent: 'center',
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
  toolCaret: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  verseCard: {
    backgroundColor: '#EBFBFA', // Light mint green/cyan tint
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2F7F5',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  verseLeft: {
    flex: 1,
    paddingRight: 100, // Space for the Quran image
    zIndex: 1,
  },
  verseHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  verseArabic: {
    fontSize: 18,
    color: '#0F172A',
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
    right: -15,
    bottom: -15,
    width: 115,
    height: 115,
    zIndex: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrayerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalPrayerTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  modalBellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBellButtonActive: {
    backgroundColor: '#E6F4EA',
  },
  modalBellButtonInactive: {
    backgroundColor: '#F8FAFC',
  },
  modalCloseMainButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCloseMainButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
