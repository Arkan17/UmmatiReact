import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Check,
  Plus,
  RotateCcw,
  Calculator,
  HelpCircle,
  X,
  Sparkles,
  Award,
  CheckCircle,
  Flame,
  Sun,
  Sunrise,
  Sunset,
  CloudSun,
  Moon,
  Star,
} from 'lucide-react-native';

import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import {
  BrutalBox,
  BrutalPressable,
  Card,
  GlassCard,
  HeaderButton,
  PressableScale,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
  haptic,
  outline,
} from '../../../core/components/ui';
import {
  DEFAULT_QADA_STATE,
  QADA_PRAYERS,
  QadaPrayerName,
  QadaState,
} from '../types';
import {
  addMissedPrayer,
  applyEstimatedDaysToAll,
  calculateCompletionStats,
  completePrayer,
  estimateMissedDays,
  loadQadaState,
  logFullDayCompleted,
  saveQadaState,
  setCounterExact,
} from '../utils/qadaStorage';

const INK = '#1C1A17';

const PRAYER_ICONS: Record<QadaPrayerName, typeof Sun> = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: CloudSun,
  Maghrib: Sunset,
  Isha: Moon,
  Witr: Star,
};

export function QadaTrackerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [state, setState] = useState<QadaState>(DEFAULT_QADA_STATE);
  const [showEstimatorModal, setShowEstimatorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Edit specific prayer state
  const [editingPrayer, setEditingPrayer] = useState<QadaPrayerName | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Estimator fields
  const [estYears, setEstYears] = useState('1');
  const [estMonths, setEstMonths] = useState('0');
  const [estDays, setEstDays] = useState('0');

  useEffect(() => {
    loadQadaState().then(setState);
  }, []);

  const stats = useMemo(() => calculateCompletionStats(state), [state]);

  const handleCompleteOne = async (prayer: QadaPrayerName) => {
    if ((state.counters[prayer] || 0) <= 0) return;
    haptic.success();
    const updated = await completePrayer(state, prayer);
    setState(updated);
  };

  const handleAddOne = async (prayer: QadaPrayerName) => {
    haptic.select();
    const updated = await addMissedPrayer(state, prayer);
    setState(updated);
  };

  const handleOpenEdit = (prayer: QadaPrayerName) => {
    haptic.select();
    setEditingPrayer(prayer);
    setEditingValue(String(state.counters[prayer] || 0));
    setShowEditModal(true);
  };

  const handleSaveExact = async () => {
    if (!editingPrayer) return;
    haptic.success();
    const num = Math.max(0, parseInt(editingValue, 10) || 0);
    const updated = await setCounterExact(state, editingPrayer, num);
    setState(updated);
    setShowEditModal(false);
    setEditingPrayer(null);
  };

  const handleFullDayCompleted = async () => {
    if (stats.remaining <= 0) {
      Alert.alert('Alhamdulillah!', 'You currently have zero remaining Qada prayers.');
      return;
    }
    Alert.alert(
      'Log 1 Full Day Made Up?',
      'This will subtract 1 prayer from Fajr, Dhuhr, Asr, Maghrib, Isha, and Witr.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm (-1 to all 6)',
          style: 'default',
          onPress: async () => {
            haptic.success();
            const updated = await logFullDayCompleted(state);
            setState(updated);
          },
        },
      ],
    );
  };

  const estimatedDaysCount = useMemo(() => {
    const y = parseFloat(estYears) || 0;
    const m = parseFloat(estMonths) || 0;
    const d = parseFloat(estDays) || 0;
    return estimateMissedDays(y, m, d);
  }, [estYears, estMonths, estDays]);

  const handleApplyEstimator = async () => {
    if (estimatedDaysCount <= 0) {
      Alert.alert('Invalid Duration', 'Please enter at least 1 day, month, or year.');
      return;
    }
    Alert.alert(
      'Apply Estimated Missed Prayers?',
      `This will set all 6 prayer counters to ${estimatedDaysCount.toLocaleString()} prayers each (${(
        estimatedDaysCount * 6
      ).toLocaleString()} total prayers).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          style: 'default',
          onPress: async () => {
            haptic.success();
            const updated = await applyEstimatedDaysToAll(state, estimatedDaysCount);
            setState(updated);
            setShowEstimatorModal(false);
          },
        },
      ],
    );
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset All Qada Counters?',
      'This will reset all your missed prayer counters to 0.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to 0',
          style: 'destructive',
          onPress: async () => {
            haptic.medium();
            await saveQadaState(DEFAULT_QADA_STATE);
            setState(DEFAULT_QADA_STATE);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="Qada Tracker"
          subtitle="Make up your missed prayers · Track progress daily"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRow}>
              <HeaderButton onPress={() => setShowInfoModal(true)}>
                <HelpCircle color={colors.onSky} size={20} />
              </HeaderButton>
              <HeaderButton onPress={() => setShowEstimatorModal(true)}>
                <Calculator color={colors.onSky} size={19} />
              </HeaderButton>
              <HeaderButton onPress={handleResetAll}>
                <RotateCcw color={colors.onSky} size={18} />
              </HeaderButton>
            </View>
          }
        >
          <View style={styles.heroRow}>
            <GlassCard style={styles.heroPill}>
              <Flame color={colors.onSky} size={14} />
              <Text style={[styles.heroPillText, { color: colors.onSky }]}>
                {stats.remaining > 0
                  ? `${stats.remaining.toLocaleString()} Qada prayers remaining`
                  : 'All Caught Up! MashaAllah 🌙'}
              </Text>
            </GlassCard>
          </View>
        </ScreenHeader>

        <View style={styles.body}>
          {/* Top Progress Card */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <BrutalBox
              radius={24}
              fill={stats.remaining === 0 ? '#27493D' : tints.violet}
              style={styles.heroSummaryCard}
            >
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={styles.summaryLabel}>
                    {stats.remaining === 0 ? 'STATUS' : 'TOTAL REMAINING'}
                  </Text>
                  <Text
                    style={[
                      styles.summaryBigNum,
                      { color: stats.remaining === 0 ? '#E6D3A0' : INK },
                    ]}
                  >
                    {stats.remaining.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.summaryBadge}>
                  <Award color={INK} size={16} />
                  <Text style={styles.summaryBadgeText}>
                    {stats.completed.toLocaleString()} Prayed
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: stats.remaining === 0 ? '#B5D6C8' : 'rgba(28,26,23,0.7)' },
                    ]}
                  >
                    Completed Progress
                  </Text>
                  <Text
                    style={[
                      styles.progressPercent,
                      { color: stats.remaining === 0 ? '#FFFFFF' : INK },
                    ]}
                  >
                    {stats.percent}%
                  </Text>
                </View>
                <ProgressBar
                  value={stats.percent / 100}
                  color={stats.remaining === 0 ? '#E6D3A0' : tints.green}
                  track="rgba(0,0,0,0.15)"
                  height={8}
                />
              </View>

              {/* Quick Action Button */}
              <BrutalPressable
                onPress={handleFullDayCompleted}
                fill="#FFFAF1"
                radius={16}
                offset={brutal.shadowSmall}
                borderWidth={brutal.borderThin}
                style={styles.fullDayBtn}
              >
                <CheckCircle color={INK} size={18} strokeWidth={2.4} />
                <Text style={styles.fullDayBtnText}>Log 1 Full Day Made Up (-1 to All 6)</Text>
              </BrutalPressable>
            </BrutalBox>
          </Animated.View>

          {/* Individual Prayer Cards */}
          <SectionHeader title="Daily Obligatory Prayers" />
          <View style={styles.cardsGrid}>
            {QADA_PRAYERS.map((prayerMeta, idx) => {
              const pName = prayerMeta.name;
              const count = state.counters[pName] || 0;
              const Icon = PRAYER_ICONS[pName];
              const isDone = count === 0;

              return (
                <Animated.View
                  key={pName}
                  entering={FadeInDown.delay(60 + idx * 40).duration(350)}
                  style={styles.prayerCardWrap}
                >
                  <Card style={styles.prayerCard}>
                    <View style={styles.prayerCardTop}>
                      <View
                        style={[
                          styles.prayerIconBox,
                          outline(colors),
                          { backgroundColor: prayerMeta.tint },
                        ]}
                      >
                        <Icon color={INK} size={18} strokeWidth={2.4} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={[styles.prayerName, { color: colors.text }]}>
                          {pName}
                        </Text>
                        <Text style={[styles.prayerDesc, { color: colors.textMuted }]}>
                          {prayerMeta.description}
                        </Text>
                      </View>
                      {/* Plus button to add missed */}
                      <PressableScale
                        onPress={() => handleAddOne(pName)}
                        style={[
                          styles.smallAddBtn,
                          outline(colors),
                          { backgroundColor: colors.surfaceAlt },
                        ]}
                      >
                        <Plus color={colors.text} size={16} strokeWidth={2.5} />
                      </PressableScale>
                    </View>

                    {/* Big Counter (Tap to manually edit) */}
                    <PressableScale
                      onPress={() => handleOpenEdit(pName)}
                      style={[
                        styles.counterBox,
                        outline(colors),
                        {
                          backgroundColor: isDone ? colors.surfaceAlt : colors.surface,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.counterNumber,
                          { color: isDone ? colors.textMuted : colors.text },
                        ]}
                      >
                        {count.toLocaleString()}
                      </Text>
                      <Text style={[styles.counterHint, { color: colors.textMuted }]}>
                        {isDone ? 'Completed' : 'remaining · tap to edit'}
                      </Text>
                    </PressableScale>

                    {/* Minus / Prayed Button */}
                    <BrutalPressable
                      onPress={() => handleCompleteOne(pName)}
                      disabled={isDone}
                      fill={isDone ? colors.surfaceAlt : colors.primary}
                      radius={14}
                      offset={isDone ? 0 : brutal.shadowSmall}
                      borderWidth={brutal.borderThin}
                      style={[styles.prayBtn, isDone && { opacity: 0.55 }]}
                    >
                      {isDone ? (
                        <>
                          <Check color={colors.textMuted} size={16} strokeWidth={3} />
                          <Text style={[styles.prayBtnText, { color: colors.textMuted }]}>
                            Caught Up
                          </Text>
                        </>
                      ) : (
                        <>
                          <Check color={INK} size={17} strokeWidth={2.8} />
                          <Text style={[styles.prayBtnText, { color: INK }]}>Prayed (-1)</Text>
                        </>
                      )}
                    </BrutalPressable>
                  </Card>
                </Animated.View>
              );
            })}
          </View>

          {/* Quick Strategy Advice Card */}
          <View style={styles.tipCardWrap}>
            <Card style={styles.tipCard}>
              <View
                style={[
                  styles.tipIconBox,
                  outline(colors),
                  { backgroundColor: tints.gold },
                ]}
              >
                <Sparkles color={INK} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  Proven 1+1 Qada Strategy
                </Text>
                <Text style={[styles.tipBody, { color: colors.textSecondary }]}>
                  Pray 1 missed prayer alongside each of your 5 daily prayers (e.g. 1 Qada Fajr
                  after today's Fajr). In 1 year, you will complete an entire year of missed
                  prayers effortlessly!
                </Text>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Estimator Wizard Modal */}
      <Modal
        visible={showEstimatorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEstimatorModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Missed Prayers Estimator
              </Text>
              <PressableScale onPress={() => setShowEstimatorModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Not sure how many prayers you missed? Enter the estimated duration (e.g. 2 years
                before you became regular in prayer).
              </Text>

              <View style={styles.estInputsRow}>
                <View style={styles.flex}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Years</Text>
                  <TextInput
                    style={[
                      styles.inputBox,
                      outline(colors),
                      { backgroundColor: colors.surfaceAlt, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={estYears}
                    onChangeText={setEstYears}
                    placeholder="0"
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Months</Text>
                  <TextInput
                    style={[
                      styles.inputBox,
                      outline(colors),
                      { backgroundColor: colors.surfaceAlt, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={estMonths}
                    onChangeText={setEstMonths}
                    placeholder="0"
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Days</Text>
                  <TextInput
                    style={[
                      styles.inputBox,
                      outline(colors),
                      { backgroundColor: colors.surfaceAlt, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={estDays}
                    onChangeText={setEstDays}
                    placeholder="0"
                  />
                </View>
              </View>

              {/* Estimation result pill */}
              <View
                style={[
                  styles.estResultBox,
                  outline(colors),
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Text style={styles.estResultDays}>
                  {estimatedDaysCount.toLocaleString()} Days
                </Text>
                <Text style={styles.estResultSub}>
                  = {(estimatedDaysCount * 6).toLocaleString()} total prayers ({estimatedDaysCount.toLocaleString()} each for Fajr, Dhuhr, Asr, Maghrib, Isha, Witr)
                </Text>
              </View>

              <BrutalPressable
                onPress={handleApplyEstimator}
                fill={colors.accent}
                radius={16}
                style={styles.modalDoneBtn}
              >
                <Text style={styles.modalDoneBtnText}>Set All Counters</Text>
              </BrutalPressable>
            </ScrollView>
          </BrutalBox>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manual Edit Exact Value Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalSmallCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Set {editingPrayer} Count
              </Text>
              <PressableScale onPress={() => setShowEditModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the exact remaining count for {editingPrayer}:
            </Text>

            <TextInput
              style={[
                styles.inputBox,
                outline(colors),
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.text,
                  fontSize: 22,
                  textAlign: 'center',
                },
              ]}
              keyboardType="numeric"
              value={editingValue}
              onChangeText={setEditingValue}
              autoFocus
            />

            <BrutalPressable
              onPress={handleSaveExact}
              fill={colors.primary}
              radius={16}
              style={[styles.modalDoneBtn, { marginTop: 16 }]}
            >
              <Text style={styles.modalDoneBtnText}>Update Counter</Text>
            </BrutalPressable>
          </BrutalBox>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fiqh & Guidelines Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Qada Guidelines</Text>
              <PressableScale onPress={() => setShowInfoModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>

            <ScrollView style={styles.guideScroll}>
              <Text style={[styles.guideHeading, { color: colors.text }]}>
                1. What is Qada?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                Qada (making up missed prayers) is an established Islamic obligation for any Fard
                or Witr prayers missed after reaching puberty (Bulugh). The Prophet (ﷺ) said:
                "Whoever forgets a prayer or sleeps through it, its expiation is to pray it when
                he remembers it." [Sahih Muslim].
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                2. When can Qada be prayed?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                Qada prayers can be performed at ANY time of the day or night, except during the
                3 disliked times (Makruh Tahrimi):{'\n'}
                • While the sun is rising until it rises completely (~15–20 mins after sunrise){'\n'}
                • When the sun is at its exact zenith/meridian until it declines (Zawal){'\n'}
                • While the sun is setting until it disappears completely
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                3. How to make the Intention (Niyyah)
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                When praying many missed prayers without knowing the exact date, intend: "I intend
                to pray the first missed Fajr (or Dhuhr, etc.) obligatory upon me." With each
                prayer completed, the next one moves to the front!
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                4. Which prayers have Qada?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                Only the obligatory (Fard) prayers and Witr have Qada. Sunnah and Nafl prayers do
                not have to be made up.
              </Text>
            </ScrollView>
          </BrutalBox>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {},
  body: { paddingHorizontal: 16, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroRow: { flexDirection: 'row', marginTop: 14 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  heroPillText: { fontSize: 12.5, fontWeight: '800' },
  heroSummaryCard: { padding: 18, marginBottom: 14 },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: INK },
  summaryBigNum: { fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFAF1',
    borderWidth: brutal.borderThin,
    borderColor: INK,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  summaryBadgeText: { fontSize: 12, fontWeight: '900', color: INK },
  progressContainer: { marginTop: 16, marginBottom: 14 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11.5, fontWeight: '800' },
  progressPercent: { fontSize: 12.5, fontWeight: '900' },
  fullDayBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullDayBtnText: { fontSize: 13, fontWeight: '900', color: INK },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  prayerCardWrap: {
    width: '50%',
    padding: 6,
  },
  prayerCard: {
    padding: 12,
  },
  prayerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  prayerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerName: { fontSize: 14, fontWeight: '900' },
  prayerDesc: { fontSize: 10, fontWeight: '600' },
  smallAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBox: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  counterNumber: { fontSize: 24, fontWeight: '900' },
  counterHint: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  prayBtn: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  prayBtnText: { fontSize: 12.5, fontWeight: '900' },
  tipCardWrap: { marginTop: 8, marginBottom: 20 },
  tipCard: { flexDirection: 'row', gap: 12, padding: 14 },
  tipIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '900' },
  tipBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '85%',
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalSmallCard: {
    margin: 20,
    padding: 20,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 19, fontWeight: '900' },
  modalSubtitle: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  estInputsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inputBox: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '800',
  },
  estResultBox: {
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  estResultDays: { fontSize: 22, fontWeight: '900', color: INK },
  estResultSub: { fontSize: 12, fontWeight: '700', color: 'rgba(28,26,23,0.7)', marginTop: 4, textAlign: 'center' },
  modalDoneBtn: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalDoneBtnText: { fontSize: 14.5, fontWeight: '900', color: INK },
  guideScroll: { maxHeight: 420 },
  guideHeading: { fontSize: 14, fontWeight: '900', marginTop: 12, marginBottom: 4 },
  guideText: { fontSize: 12.5, lineHeight: 19 },
});
