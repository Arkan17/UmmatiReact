import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  LinearTransition,
  ZoomIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { RotateCcw, Vibrate, VibrateOff, Trash, Plus, Check, X, Sparkles, History, Target, Infinity as InfinityIcon, BookOpen } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../core/hooks/useAuth';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { Palette, brutal, radius as R, type as T } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, Card, HeaderButton, PressableScale, ScreenHeader, SectionHeader, haptic, outline } from '../../../core/components/ui';
import { supabase } from '../../../core/config/SupabaseClient';
import { awardXp, incrementActivity } from '../../../core/services/progress';

interface DhikrItem {
  phrase: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  virtue: string;
  category: 'daily' | 'wazifa' | 'custom';
}

const STATIC_DHIKR_DATA: DhikrItem[] = [
  {
    phrase: 'SubhanAllah',
    arabic: 'سُبْحَانَ ٱللَّٰهِ',
    transliteration: 'Subhan-Allahi',
    translation: 'Glory be to Allah',
    target: 33,
    virtue: 'Forgives sins, purifies the heart, and builds treasures in Paradise.',
    category: 'daily'
  },
  {
    phrase: 'Alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    transliteration: 'Al-hamdu lillah',
    translation: 'Praise be to Allah',
    target: 33,
    virtue: 'Fills the scale of good deeds and increases blessings (Barakah) in life.',
    category: 'daily'
  },
  {
    phrase: 'Allahu Akbar',
    arabic: 'ٱللَّٰهُ أَكْبَرُ',
    transliteration: 'Allahu-Akbar',
    translation: 'Allah is the Greatest',
    target: 34,
    virtue: 'Magnifies the glory of Allah and fills the soul with strength and peace.',
    category: 'daily'
  },
  {
    phrase: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness from Allah',
    target: 100,
    virtue: 'Relieves anxiety, opens doors of sustenance, and earns Allah’s mercy.',
    category: 'daily'
  },
  {
    phrase: 'SubhanAllahi wa Bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhan-Allahi wa bi-hamdihi',
    translation: 'Glory be to Allah and Praise be to Him',
    target: 100,
    virtue: 'Forgives all sins, even if they are as abundant as the foam of the sea.',
    category: 'wazifa'
  },
  {
    phrase: 'La ilaha illallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illallahu wahdahu la sharika lahu...',
    translation: 'None has the right to be worshipped but Allah alone...',
    target: 100,
    virtue: 'Equivalent to freeing 10 slaves, adds 100 good deeds, and protects from Shaytan.',
    category: 'wazifa'
  },
  {
    phrase: 'Durood / Salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammadin wa ala ali...',
    translation: 'O Allah, send blessings upon Muhammad and his family',
    target: 100,
    virtue: 'Removes worries. Allah sends 10 blessings and raises 10 ranks per Salawat.',
    category: 'wazifa'
  },
  {
    phrase: 'La Hawla wa la Quwwata',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    translation: 'There is no power nor strength except with Allah',
    target: 100,
    virtue: 'A treasure from Paradise. Strengthens the heart against hardships.',
    category: 'wazifa'
  }
];

const CATEGORIES: { key: 'daily' | 'wazifa' | 'custom'; label: string }[] = [
  { key: 'daily', label: 'Daily Azkar' },
  { key: 'wazifa', label: 'Wazifas' },
  { key: 'custom', label: 'Custom' },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** Number of beads shown around the free counter / progress hint. */
const FREE_CYCLE = 33;

/** The big glowing tap target with an animated SVG progress ring. */
function TasbihRing({
  size,
  progress,
  count,
  tick,
  target,
  colors,
  onPress,
}: {
  size: number;
  progress: number;
  count: number;
  /** Increments on every tap; drives the pulse even when the count wraps to 0. */
  tick: number;
  target: number;
  colors: Palette;
  onPress: () => void;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const inner = size - stroke * 2 - 28;

  const p = useSharedValue(0);
  const press = useSharedValue(1);
  const ripple = useSharedValue(0);
  const bump = useSharedValue(1);

  useEffect(() => {
    p.value = withTiming(progress, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [progress, p]);

  useEffect(() => {
    if (tick === 0) return;
    bump.value = withSequence(withTiming(1.14, { duration: 70 }), withSpring(1, { damping: 9, stiffness: 260 }));
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) });
  }, [tick, bump, ripple]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - p.value) }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - ripple.value),
    transform: [{ scale: 0.86 + ripple.value * 0.32 }],
  }));
  const countStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  return (
    <View style={[styles.center, { width: size + 40, height: size + 40 }]}>
      {/* Soft halo */}
      <View
        style={[
          styles.halo,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            backgroundColor: colors.primarySoft,
            borderColor: colors.ink,
          },
        ]}
      />
      {/* Tap ripple */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          { width: size, height: size, borderRadius: size / 2, borderColor: colors.ink },
          rippleStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={() => { press.value = withSpring(0.94, { damping: 18, stiffness: 420 }); }}
        onPressOut={() => { press.value = withSpring(1, { damping: 10, stiffness: 280 }); }}
        accessibilityRole="button"
        accessibilityLabel={`Count ${count}. Tap to count`}
      >
        <Animated.View style={[styles.center, { width: size, height: size }, pressStyle]}>
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
            {/* Bead ticks */}
            {Array.from({ length: FREE_CYCLE }).map((_, i) => {
              const a = (i / FREE_CYCLE) * Math.PI * 2 - Math.PI / 2;
              return (
                <Circle
                  key={i}
                  cx={size / 2 + r * Math.cos(a)}
                  cy={size / 2 + r * Math.sin(a)}
                  r={1.8}
                  fill={colors.ink}
                  opacity={0.35}
                />
              );
            })}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={target > 0 ? colors.primary : colors.accent}
              strokeWidth={stroke}
              strokeLinecap="butt"
              fill="none"
              strokeDasharray={circumference}
              animatedProps={ringProps}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            {/* Ink outlines on both edges of the track */}
            <Circle cx={size / 2} cy={size / 2} r={r + stroke / 2} stroke={colors.ink} strokeWidth={2.5} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2} stroke={colors.ink} strokeWidth={2.5} fill="none" />
          </Svg>
          <View
            style={[
              styles.innerDisc,
              {
                width: inner,
                height: inner,
                borderRadius: inner / 2,
                backgroundColor: colors.surface,
                borderColor: colors.ink,
              },
            ]}
          >
            <Animated.Text style={[styles.countNumber, { color: colors.text }, countStyle]}>{count}</Animated.Text>
            <View style={[styles.targetPill, outline(colors), { backgroundColor: colors.primarySoft }]}>
              {target > 0 ? <Target color={colors.text} size={12} strokeWidth={2.5} /> : <InfinityIcon color={colors.text} size={12} strokeWidth={2.5} />}
              <Text style={[styles.targetLabel, { color: colors.text }]}>
                {target > 0 ? `of ${target}` : 'Free Counter'}
              </Text>
            </View>
            <Text style={[styles.tapHint, { color: colors.textMuted }]}>TAP TO COUNT</Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function TasbihScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  useScreenTime('Tasbih');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeCategory, setActiveCategory] = useState<'daily' | 'wazifa' | 'custom'>('daily');
  const [customDhikrs, setCustomDhikrs] = useState<DhikrItem[]>([]);
  const [activeDhikr, setActiveDhikr] = useState<DhikrItem>(STATIC_DHIKR_DATA[0]);
  const [count, setCount] = useState(0);
  const [totalDhikrSession, setTotalDhikrSession] = useState(0);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // History list
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Custom Dhikr Add Form states
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newTransliteration, setNewTransliteration] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newTarget, setNewTarget] = useState('100');
  const [newVirtue, setNewVirtue] = useState('Personal custom wazifa');

  // Celebration state
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const target = activeDhikr.target;
  const ringSize = Math.min(width - 96, 270);
  const progress = target > 0 ? Math.min(count, target) / target : (count % FREE_CYCLE) / FREE_CYCLE;

  // Load Custom Dhikrs
  const loadCustomDhikrs = async () => {
    try {
      const saved = await AsyncStorage.getItem('ummati_user_custom_dhikrs');
      if (saved) {
        setCustomDhikrs(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load custom dhikrs:', e);
    }
  };

  useEffect(() => {
    loadCustomDhikrs();
  }, []);

  const handleIncrement = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    setTotalDhikrSession(totalDhikrSession + 1);

    // Check if target reached
    if (target > 0 && nextCount === target) {
      if (hapticEnabled) haptic.success();

      // Auto save session target reach
      saveDhikrRecord(activeDhikr.phrase, target);
      setCount(0);
      setShowCelebrationModal(true);
    } else if (hapticEnabled) {
      haptic.light();
    }
  };

  const handleReset = () => {
    if (count > 0) {
      if (target === 0) {
        saveDhikrRecord(activeDhikr.phrase, count);
      }
      setCount(0);
    }
  };

  const handleDhikrSelect = (dhikr: DhikrItem) => {
    if (count > 0 && target === 0) {
      saveDhikrRecord(activeDhikr.phrase, count);
    }
    setActiveDhikr(dhikr);
    setCount(0);
  };

  const handleCategorySelect = (key: 'daily' | 'wazifa' | 'custom') => {
    setActiveCategory(key);
    if (key === 'custom') {
      if (customDhikrs.length > 0) {
        handleDhikrSelect(customDhikrs[0]);
      } else {
        handleDhikrSelect({
          phrase: 'Custom Dhikr',
          arabic: 'ذِكْر',
          transliteration: 'Dhikr',
          translation: 'Remembrance',
          target: 0,
          virtue: 'Create your own custom counts.',
          category: 'custom'
        });
      }
    } else {
      handleDhikrSelect(STATIC_DHIKR_DATA.find(d => d.category === key)!);
    }
  };

  const handleAddCustomDhikr = async () => {
    if (!newPhrase.trim()) return;
    const item: DhikrItem = {
      phrase: newPhrase,
      arabic: newArabic.trim() || 'ذِكْر',
      transliteration: newTransliteration.trim() || newPhrase,
      translation: newTranslation.trim() || 'Custom Dhikr',
      target: parseInt(newTarget, 10) || 0,
      virtue: newVirtue.trim() || 'Personal custom remembrance',
      category: 'custom'
    };
    const updated = [...customDhikrs, item];
    setCustomDhikrs(updated);
    await AsyncStorage.setItem('ummati_user_custom_dhikrs', JSON.stringify(updated));

    // Auto select
    setActiveDhikr(item);
    setCount(0);
    setShowAddCustomModal(false);

    // Reset inputs
    setNewPhrase('');
    setNewArabic('');
    setNewTransliteration('');
    setNewTranslation('');
    setNewTarget('100');
    setNewVirtue('Personal custom remembrance');
  };

  const handleDeleteCustomDhikr = async (phraseToDelete: string) => {
    const updated = customDhikrs.filter(d => d.phrase !== phraseToDelete);
    setCustomDhikrs(updated);
    await AsyncStorage.setItem('ummati_user_custom_dhikrs', JSON.stringify(updated));
    if (activeDhikr.phrase === phraseToDelete) {
      setActiveDhikr(STATIC_DHIKR_DATA[0]);
      setCount(0);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const savedHistory = await AsyncStorage.getItem('local_tasbih_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory).slice(0, 10));
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.warn('Failed to load Tasbih history locally:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const saveDhikrRecord = async (phrase: string, recordCount: number) => {
    if (!user || recordCount === 0) return;
    try {
      // 1. Award XP (+10 XP per completion) and sync the session to Supabase
      awardXp(10, 'tasbih');
      supabase.from('tasbih_history').insert({ user_id: user.id, phrase, count: recordCount }).then(({ error }) => {
        if (error) console.warn('Failed to sync tasbih history:', error.message);
      });

      // 2. Save history locally
      const generateLocalUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const newRecord = {
        id: generateLocalUUID(),
        phrase: phrase,
        count: recordCount,
        created_at: new Date().toISOString(),
      };

      const savedHistory = await AsyncStorage.getItem('local_tasbih_history');
      const historyList = savedHistory ? JSON.parse(savedHistory) : [];
      const updatedHistory = [newRecord, ...historyList].slice(0, 50);
      await AsyncStorage.setItem('local_tasbih_history', JSON.stringify(updatedHistory));

      // 3. Add to today's dhikr total
      await incrementActivity('tasbih', { count: recordCount, sessions: 1 });

      fetchHistory();
    } catch (e) {
      console.warn('Failed to save Tasbih logs locally:', e);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    try {
      await AsyncStorage.removeItem('local_tasbih_history');
      setHistory([]);
    } catch (e) {
      console.warn('Failed to delete history locally:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, fetchHistory]);

  const presets = useMemo(
    () => (activeCategory === 'custom' ? customDhikrs : STATIC_DHIKR_DATA.filter(d => d.category === activeCategory)),
    [activeCategory, customDhikrs],
  );
  const accentTint = activeCategory === 'wazifa' ? colors.accent : colors.primary;
  const accentTintSoft = activeCategory === 'wazifa' ? colors.accentSoft : colors.primarySoft;
  const remaining = target > 0 ? Math.max(target - count, 0) : null;

  const inputStyle = [styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink, color: colors.text }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Tasbih"
          subtitle="Remember Allah with every bead"
          onBack={() => navigation.goBack()}
          right={
            <HeaderButton onPress={() => setHapticEnabled(!hapticEnabled)}>
              {hapticEnabled ? <Vibrate color={colors.onSky} size={20} /> : <VibrateOff color={colors.onSkyMuted} size={20} />}
            </HeaderButton>
          }
        >
          {/* Category segmented control */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(450)}
            style={[styles.segment, { backgroundColor: colors.glass, borderColor: colors.ink }]}
          >
            {CATEGORIES.map((c) => {
              const active = activeCategory === c.key;
              return (
                <PressableScale
                  key={c.key}
                  onPress={() => handleCategorySelect(c.key)}
                  style={[styles.segmentBtn, active && [outline(colors), { backgroundColor: colors.accent }]]}
                >
                  <Text style={[styles.segmentText, { color: active ? colors.ink : colors.onSky }]}>{c.label}</Text>
                </PressableScale>
              );
            })}
          </Animated.View>
        </ScreenHeader>

        {/* Preset chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {activeCategory === 'custom' && (
            <Animated.View entering={FadeInRight.duration(300)}>
              <PressableScale
                style={[styles.presetChip, styles.presetChipDashed, { borderColor: colors.ink, backgroundColor: colors.primarySoft }]}
                onPress={() => setShowAddCustomModal(true)}
              >
                <Plus color={colors.text} size={15} strokeWidth={2.6} />
                <Text style={[styles.presetText, { color: colors.text }]}>Create Dhikr</Text>
              </PressableScale>
            </Animated.View>
          )}
          {presets.map((dhikr, i) => {
            const active = activeDhikr.phrase === dhikr.phrase;
            return (
              <Animated.View key={`${activeCategory}-${dhikr.phrase}`} entering={FadeInRight.delay(i * 40).duration(300)}>
                <BrutalPressable
                  fill={active ? colors.primary : colors.surface}
                  radius={999}
                  offset={active ? brutal.shadowSmall : 0}
                  borderWidth={brutal.borderThin}
                  style={styles.presetChip}
                  onPress={() => handleDhikrSelect(dhikr)}
                >
                  <Text style={[styles.presetText, { color: active ? colors.onPrimary : colors.text }]}>{dhikr.phrase}</Text>
                </BrutalPressable>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Counter */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.counterSection}>
          <Animated.Text
            key={`ar-${activeDhikr.phrase}`}
            entering={FadeIn.duration(350)}
            style={[styles.phraseAr, { color: colors.text }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {activeDhikr.arabic}
          </Animated.Text>
          <Text style={[styles.phraseEn, { color: colors.text }]}>{activeDhikr.phrase}</Text>

          <TasbihRing
            size={ringSize}
            progress={progress}
            count={count}
            tick={totalDhikrSession}
            target={target}
            colors={colors}
            onPress={handleIncrement}
          />
        </Animated.View>

        {/* Stats + reset */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.statsRow}>
          <BrutalPressable onPress={handleReset} fill={colors.accentSoft} radius={20} style={styles.resetBtn}>
            <View style={[styles.iconTile, outline(colors), { backgroundColor: colors.surface }]}>
              <RotateCcw color={colors.text} size={18} strokeWidth={2.5} />
            </View>
            <Text style={[styles.statLabel, { color: colors.text }]}>RESET</Text>
          </BrutalPressable>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>SESSION</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalDhikrSession}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{remaining !== null ? 'REMAINING' : 'COUNT'}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{remaining !== null ? remaining : count}</Text>
          </Card>
        </Animated.View>

        <View style={styles.body}>
          {/* Virtue card */}
          <Animated.View entering={FadeInDown.delay(320).duration(450)} layout={LinearTransition}>
            <SectionHeader title="Pronunciation & Virtues" />
            <Card style={styles.virtueCard}>
              <View style={styles.virtueHeader}>
                <View style={[styles.iconTile, outline(colors), { backgroundColor: accentTint }]}>
                  <Sparkles color={colors.ink} size={18} strokeWidth={2.4} />
                </View>
                <Text style={[styles.pronounceText, { color: colors.text }]}>“{activeDhikr.transliteration}”</Text>
                {activeCategory === 'custom' && activeDhikr.phrase !== 'Custom Dhikr' && (
                  <PressableScale
                    style={[styles.deleteBtn, outline(colors), { backgroundColor: colors.danger }]}
                    onPress={() => handleDeleteCustomDhikr(activeDhikr.phrase)}
                  >
                    <Trash color={colors.ink} size={16} strokeWidth={2.4} />
                  </PressableScale>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.virtueRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>MEANING</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{activeDhikr.translation}</Text>
              </View>

              <View style={styles.virtueRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>REWARD</Text>
                <Text style={[styles.detailValue, styles.detailStrong, { color: colors.text }]}>{activeDhikr.virtue}</Text>
              </View>

              {target > 0 && (
                <View style={[styles.recommendPill, outline(colors), { backgroundColor: accentTintSoft }]}>
                  <Target color={colors.text} size={14} strokeWidth={2.5} />
                  <Text style={[styles.recommendText, { color: colors.text }]}>Recommended {target} times</Text>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* History */}
          <Animated.View entering={FadeInDown.delay(400).duration(450)}>
            <SectionHeader
              title="Counter History"
              action={history.length > 0 ? 'Clear All' : undefined}
              onAction={clearHistory}
            />
            {historyLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
            ) : history.length > 0 ? (
              <Card style={styles.historyCard}>
                {history.map((record, i) => {
                  const date = new Date(record.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <Animated.View
                      key={record.id}
                      entering={FadeInDown.delay(i * 40).duration(300)}
                      style={[
                        styles.historyItem,
                        i < history.length - 1 && { borderBottomWidth: 1.5, borderBottomColor: colors.ink },
                      ]}
                    >
                      <View style={[styles.iconTile, outline(colors), { backgroundColor: colors.primarySoft }]}>
                        <History color={colors.text} size={18} strokeWidth={2.4} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={[styles.recordPhrase, { color: colors.text }]} numberOfLines={1}>{record.phrase}</Text>
                        <Text style={[styles.recordTime, { color: colors.textMuted }]}>{date}</Text>
                      </View>
                      <View style={styles.recordRight}>
                        <Text style={[styles.recordCount, { color: colors.text }]}>+{record.count}</Text>
                        <Text style={[styles.recordXp, { color: colors.textSecondary }]}>+10 XP</Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <View style={[styles.iconTile, outline(colors), { backgroundColor: colors.surfaceAlt }]}>
                  <BookOpen color={colors.text} size={18} strokeWidth={2.4} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasbih records completed yet.</Text>
              </Card>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Celebration Modal when Target Reached */}
      <Modal
        visible={showCelebrationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCelebrationModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.celebrationWrap}>
          <BrutalBox radius={28} offset={6} style={styles.celebrationCard}>
            <View style={[styles.celebrationGlow, outline(colors), { backgroundColor: colors.primarySoft }]}>
              <View style={[styles.celebrationIcon, outline(colors, brutal.border), { backgroundColor: colors.primary }]}>
                <Sparkles color={colors.onPrimary} size={32} strokeWidth={2.3} />
              </View>
            </View>
            <Text style={[styles.celebrationTitle, { color: colors.text }]}>Mubarak!</Text>
            <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>Target completed</Text>

            <Text style={[styles.celebrationDetails, { color: colors.textSecondary }]}>
              You have completed {target} counts of "{activeDhikr.phrase}"! May Allah accept your remembrance.
            </Text>

            <View style={[styles.xpBadge, outline(colors), { backgroundColor: colors.accentSoft }]}>
              <Check color={colors.text} size={16} strokeWidth={3} />
              <Text style={[styles.xpText, { color: colors.text }]}>+10 XP GAINED</Text>
            </View>

            <BrutalPressable
              fill={colors.primary}
              style={styles.primaryBtn}
              onPress={() => setShowCelebrationModal(false)}
            >
              <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>Alhamdulillah</Text>
            </BrutalPressable>
          </BrutalBox>
          </Animated.View>
        </View>
      </Modal>

      {/* Add Custom Dhikr Sheet */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlaySheet}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAddCustomModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.ink, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.ink }]} />
            <View style={styles.sheetHeader}>
              <View style={[styles.iconTile, outline(colors), { backgroundColor: colors.primarySoft }]}>
                <Plus color={colors.text} size={18} strokeWidth={2.6} />
              </View>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Create Custom Dhikr</Text>
              <PressableScale onPress={() => setShowAddCustomModal(false)} style={[styles.closeBtn, outline(colors), { backgroundColor: colors.surfaceAlt }]}>
                <X color={colors.text} size={18} strokeWidth={2.6} />
              </PressableScale>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Dhikr Name (Transliteration)</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Subhanallahi wa bihamdihi"
                  placeholderTextColor={colors.textMuted}
                  value={newPhrase}
                  onChangeText={setNewPhrase}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Arabic Text (Optional)</Text>
                <TextInput
                  style={[inputStyle, styles.inputArabic]}
                  placeholder="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
                  placeholderTextColor={colors.textMuted}
                  value={newArabic}
                  onChangeText={setNewArabic}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phonetic / Pronunciation Help</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Subhan-Allahi wa bi-hamdihi"
                  placeholderTextColor={colors.textMuted}
                  value={newTransliteration}
                  onChangeText={setNewTransliteration}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Translation / English Meaning</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Glory be to Allah and praise be to Him"
                  placeholderTextColor={colors.textMuted}
                  value={newTranslation}
                  onChangeText={setNewTranslation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Count (0 for free counter)</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 100"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={newTarget}
                  onChangeText={setNewTarget}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Virtues / Rewards (Fazilat)</Text>
                <TextInput
                  style={[inputStyle, styles.inputMultiline]}
                  placeholder="e.g. Forgiveness of all sins..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={newVirtue}
                  onChangeText={setNewVirtue}
                />
              </View>

              <BrutalPressable
                fill={colors.primary}
                style={[styles.primaryBtn, { opacity: newPhrase.trim() ? 1 : 0.5 }]}
                onPress={handleAddCustomDhikr}
              >
                <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>Create Dhikr</Text>
              </BrutalPressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20 },

  segment: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 4,
    gap: 4,
    borderRadius: 16,
    borderWidth: brutal.borderThin,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  segmentText: { fontSize: 13, fontWeight: '900' },

  presetRow: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, gap: 10 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: brutal.borderThin,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: R.round,
  },
  presetChipDashed: { borderStyle: 'dashed' },
  presetText: { fontSize: 13, fontWeight: '800' },

  counterSection: { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
  phraseAr: { fontSize: 32, ...T.arabic, textAlign: 'center', lineHeight: 52, marginBottom: 4 },
  phraseEn: { fontSize: 15, fontWeight: '900', letterSpacing: 0.3, marginBottom: 8 },

  halo: {
    position: 'absolute',
    borderWidth: brutal.border,
  },
  ripple: { position: 'absolute', borderWidth: 3 },
  innerDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: brutal.border,
  },
  countNumber: { fontSize: 68, fontWeight: '900', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.round,
    marginTop: 2,
  },
  targetLabel: { fontSize: 12, fontWeight: '900' },
  tapHint: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 10 },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 8 },
  resetBtn: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  statCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  statLabel: { ...T.caption, fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 2, fontVariant: ['tabular-nums'] },

  iconTile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  virtueCard: { padding: 18 },
  virtueHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pronounceText: { flex: 1, fontSize: 16, fontWeight: '700', fontStyle: 'italic', lineHeight: 22 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { height: brutal.borderThin, marginVertical: 14, opacity: 0.2 },
  virtueRow: { marginBottom: 12 },
  detailLabel: { ...T.caption, fontSize: 10, letterSpacing: 1, marginBottom: 4, fontWeight: '800' },
  detailValue: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  detailStrong: { fontWeight: '600' },
  recommendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.round,
    marginTop: 2,
  },
  recommendText: { fontSize: 12, fontWeight: '900' },

  spinner: { marginVertical: 20 },
  historyCard: { paddingVertical: 4, paddingHorizontal: 14 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  recordPhrase: { fontSize: 14, fontWeight: '800' },
  recordTime: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  recordRight: { alignItems: 'flex-end' },
  recordCount: { fontSize: 16, fontWeight: '900' },
  recordXp: { fontSize: 10, fontWeight: '800', marginTop: 1 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600', flex: 1 },

  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationWrap: { width: '100%', maxWidth: 360 },
  celebrationCard: {
    padding: 24,
    alignItems: 'center',
  },
  celebrationGlow: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  celebrationIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTitle: { ...T.title, marginBottom: 2 },
  celebrationSubtitle: { fontSize: 14, fontWeight: '800', marginBottom: 14 },
  celebrationDetails: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 18 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R.round,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
    marginBottom: 22,
  },
  xpText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  primaryBtn: { height: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryBtnText: { fontWeight: '900', fontSize: 16 },

  modalOverlaySheet: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: brutal.border,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '88%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  sheetTitle: { flex: 1, fontSize: 19, fontWeight: '900', letterSpacing: -0.2 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formScroll: { paddingBottom: 12 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: { borderWidth: brutal.borderThin, borderRadius: 14, height: 48, paddingHorizontal: 14, fontSize: 15, fontWeight: '500' },
  inputArabic: { textAlign: 'right', ...T.arabic },
  inputMultiline: { height: 76, paddingTop: 12, textAlignVertical: 'top' },
});
