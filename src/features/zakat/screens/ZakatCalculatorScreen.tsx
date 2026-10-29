import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Share,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Coins,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Save,
  Share2,
  Sparkles,
  Scale,
  Wallet,
  Building2,
  Receipt,
  X,
  HelpCircle,
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
import { awardXp } from '../../../core/services/progress';
import {
  CURRENCIES,
  CurrencyConfig,
  DEFAULT_CURRENCY,
  GOLD_NISAB_GRAMS,
  SILVER_NISAB_GRAMS,
} from '../data/currencies';
import {
  DEFAULT_ZAKAT_INPUTS,
  ZakatInputs,
  calculateZakat,
  clearZakatCalculation,
  formatAmount,
  loadZakatCalculation,
  saveZakatCalculation,
} from '../utils/zakatCalculator';

const INK = '#1C1A17';

export function ZakatCalculatorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [inputs, setInputs] = useState<ZakatInputs>(DEFAULT_ZAKAT_INPUTS);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Accordion section visibility
  const [openSections, setOpenSections] = useState({
    cash: true,
    metals: true,
    investments: false,
    liabilities: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    haptic.select();
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Load previously saved calculation
  useEffect(() => {
    loadZakatCalculation().then((saved) => {
      if (saved) {
        setInputs(saved);
      }
    });
  }, []);

  const currencyConfig: CurrencyConfig = CURRENCIES[inputs.currency] || CURRENCIES[DEFAULT_CURRENCY];
  const symbol = currencyConfig.symbol;

  const result = useMemo(() => calculateZakat(inputs), [inputs]);

  const updateNumericField = (field: keyof ZakatInputs, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned) || 0;
    setInputs((prev) => ({ ...prev, [field]: num }));
  };

  const handleSelectCurrency = (code: string) => {
    haptic.select();
    const config = CURRENCIES[code];
    if (config) {
      setInputs((prev) => ({
        ...prev,
        currency: code,
        goldPricePerGram: config.defaultGoldPricePerGram,
        silverPricePerGram: config.defaultSilverPricePerGram,
      }));
    }
    setShowCurrencyModal(false);
  };

  const handleSave = async () => {
    haptic.success();
    await saveZakatCalculation(inputs);
    awardXp(15, 'zakat_calculated');
    Alert.alert(
      'Zakat Calculation Saved',
      `Your total zakat due is ${formatAmount(result.zakatDue, symbol)}. You earned +15 XP!`,
    );
  };

  const handleReset = () => {
    Alert.alert('Reset All Fields?', 'This will clear all amounts entered in the calculator.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          await clearZakatCalculation();
          setInputs({
            ...DEFAULT_ZAKAT_INPUTS,
            currency: inputs.currency,
            goldPricePerGram: currencyConfig.defaultGoldPricePerGram,
            silverPricePerGram: currencyConfig.defaultSilverPricePerGram,
          });
        },
      },
    ]);
  };

  const handleShare = () => {
    const message = [
      `📊 My Zakat Summary (${inputs.currency})`,
      `─────────────────────────`,
      `• Total Assets: ${formatAmount(result.totalAssets, symbol)}`,
      `• Liabilities: ${formatAmount(result.totalLiabilities, symbol)}`,
      `• Net Wealth: ${formatAmount(result.netZakatableWealth, symbol)}`,
      `• Nisab Threshold (${inputs.nisabStandard}): ${formatAmount(result.nisabThreshold, symbol)}`,
      `• Status: ${result.isEligible ? 'Zakat Obligatory (2.5%)' : 'Below Nisab'}`,
      `• Zakat Payable: ${formatAmount(result.zakatDue, symbol)}`,
      `─────────────────────────`,
      `Calculated with Ummati App 🌙`,
    ].join('\n');

    Share.share({ message });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader
            title="Zakat Calculator"
            subtitle="Purify your wealth with accurate 2.5% calculation"
            onBack={() => navigation.goBack()}
            right={
              <View style={styles.headerRow}>
                <HeaderButton onPress={() => setShowInfoModal(true)}>
                  <HelpCircle color={colors.onSky} size={20} />
                </HeaderButton>
                <HeaderButton onPress={handleReset}>
                  <RotateCcw color={colors.onSky} size={18} />
                </HeaderButton>
              </View>
            }
          >
            {/* Nisab Quick Status Pill */}
            <View style={styles.heroRow}>
              <GlassCard style={styles.heroPill}>
                <Scale color={colors.onSky} size={14} />
                <Text style={[styles.heroPillText, { color: colors.onSky }]}>
                  {inputs.nisabStandard === 'silver'
                    ? `Silver Nisab (${SILVER_NISAB_GRAMS}g): ${formatAmount(result.nisabThreshold, symbol)}`
                    : `Gold Nisab (${GOLD_NISAB_GRAMS}g): ${formatAmount(result.nisabThreshold, symbol)}`}
                </Text>
              </GlassCard>
            </View>
          </ScreenHeader>

          <View style={styles.body}>
            {/* Top Summary Result Card */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <BrutalBox
                radius={24}
                fill={result.isEligible ? '#27493D' : colors.surfaceAlt}
                style={styles.summaryCard}
              >
                <View style={styles.summaryTop}>
                  <View>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: result.isEligible ? '#E6D3A0' : colors.textSecondary },
                      ]}
                    >
                      TOTAL ZAKAT DUE (2.5%)
                    </Text>
                    <Text
                      style={[
                        styles.summaryBigAmount,
                        { color: result.isEligible ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {formatAmount(result.zakatDue, symbol)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: result.isEligible ? '#E6D3A0' : colors.surface,
                        borderColor: INK,
                      },
                    ]}
                  >
                    {result.isEligible ? (
                      <>
                        <CheckCircle color={INK} size={14} strokeWidth={2.5} />
                        <Text style={styles.statusBadgeText}>Obligatory</Text>
                      </>
                    ) : (
                      <>
                        <AlertCircle color={colors.textSecondary} size={14} strokeWidth={2.5} />
                        <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                          Below Nisab
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Net Wealth vs Nisab Bar */}
                <View style={styles.netWealthRow}>
                  <View style={styles.netWealthCol}>
                    <Text
                      style={[
                        styles.netWealthLabel,
                        { color: result.isEligible ? '#B5D6C8' : colors.textMuted },
                      ]}
                    >
                      Net Zakatable Wealth
                    </Text>
                    <Text
                      style={[
                        styles.netWealthVal,
                        { color: result.isEligible ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {formatAmount(result.netZakatableWealth, symbol)}
                    </Text>
                  </View>

                  <View style={styles.netWealthColRight}>
                    <Text
                      style={[
                        styles.netWealthLabel,
                        { color: result.isEligible ? '#B5D6C8' : colors.textMuted },
                      ]}
                    >
                      Nisab Threshold
                    </Text>
                    <Text
                      style={[
                        styles.netWealthVal,
                        { color: result.isEligible ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {formatAmount(result.nisabThreshold, symbol)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressWrap}>
                  <ProgressBar
                    value={
                      result.nisabThreshold > 0
                        ? Math.min(1, result.netZakatableWealth / result.nisabThreshold)
                        : 0
                    }
                    color={result.isEligible ? '#E6D3A0' : tints.gold}
                    track="rgba(0,0,0,0.2)"
                    height={7}
                  />
                </View>

                {/* Action buttons inside card */}
                <View style={styles.cardActionRow}>
                  <BrutalPressable
                    onPress={handleSave}
                    fill={result.isEligible ? '#E6D3A0' : colors.primary}
                    radius={14}
                    offset={brutal.shadowSmall}
                    borderWidth={brutal.borderThin}
                    style={styles.actionBtn}
                  >
                    <Save color={INK} size={16} />
                    <Text style={styles.actionBtnText}>Save</Text>
                  </BrutalPressable>

                  <BrutalPressable
                    onPress={handleShare}
                    fill={result.isEligible ? '#3B6858' : colors.surface}
                    radius={14}
                    offset={brutal.shadowSmall}
                    borderWidth={brutal.borderThin}
                    style={styles.actionBtn}
                  >
                    <Share2 color={result.isEligible ? '#FFFFFF' : colors.text} size={16} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: result.isEligible ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      Share
                    </Text>
                  </BrutalPressable>
                </View>
              </BrutalBox>
            </Animated.View>

            {/* Currency & Settings Bar */}
            <View style={styles.configBar}>
              <BrutalPressable
                onPress={() => setShowCurrencyModal(true)}
                fill={colors.surface}
                radius={16}
                offset={brutal.shadowSmall}
                borderWidth={brutal.borderThin}
                style={styles.configChip}
              >
                <Coins color={colors.text} size={16} />
                <Text style={[styles.configChipText, { color: colors.text }]}>
                  {inputs.currency} ({symbol})
                </Text>
                <ChevronDown color={colors.textMuted} size={14} />
              </BrutalPressable>

              <BrutalPressable
                onPress={() => setShowRatesModal(true)}
                fill={colors.surface}
                radius={16}
                offset={brutal.shadowSmall}
                borderWidth={brutal.borderThin}
                style={styles.configChip}
              >
                <Scale color={colors.text} size={16} />
                <Text style={[styles.configChipText, { color: colors.text }]}>
                  Nisab: {inputs.nisabStandard === 'silver' ? 'Silver' : 'Gold'}
                </Text>
                <ChevronDown color={colors.textMuted} size={14} />
              </BrutalPressable>
            </View>

            {/* SECTION 1: Cash & Liquid Wealth */}
            <SectionHeader title="1. Cash & Bank" />
            <Card style={styles.sectionCard}>
              <PressableScale
                onPress={() => toggleSection('cash')}
                style={styles.sectionHeaderPressable}
              >
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionIconWrap,
                      outline(colors),
                      { backgroundColor: tints.green },
                    ]}
                  >
                    <Wallet color={INK} size={18} strokeWidth={2.4} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Cash & Savings
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                      Cash at home, bank accounts, money owed
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionSubtotalRow}>
                  <Text style={[styles.subtotalText, { color: colors.text }]}>
                    {formatAmount(result.totalCash, symbol)}
                  </Text>
                  {openSections.cash ? (
                    <ChevronUp color={colors.textMuted} size={18} />
                  ) : (
                    <ChevronDown color={colors.textMuted} size={18} />
                  )}
                </View>
              </PressableScale>

              {openSections.cash && (
                <View style={styles.sectionBody}>
                  <InputField
                    label="Cash in Hand & at Home"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.cashInHand ? String(inputs.cashInHand) : ''}
                    onChangeText={(t) => updateNumericField('cashInHand', t)}
                  />
                  <InputField
                    label="Bank Accounts (Savings & Current)"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.bankAccounts ? String(inputs.bankAccounts) : ''}
                    onChangeText={(t) => updateNumericField('bankAccounts', t)}
                  />
                  <InputField
                    label="Money Owed to You (Expected to be repaid)"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.moneyOwedToYou ? String(inputs.moneyOwedToYou) : ''}
                    onChangeText={(t) => updateNumericField('moneyOwedToYou', t)}
                  />
                </View>
              )}
            </Card>

            {/* SECTION 2: Gold & Silver */}
            <SectionHeader title="2. Gold & Silver" />
            <Card style={styles.sectionCard}>
              <PressableScale
                onPress={() => toggleSection('metals')}
                style={styles.sectionHeaderPressable}
              >
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionIconWrap,
                      outline(colors),
                      { backgroundColor: tints.gold },
                    ]}
                  >
                    <Coins color={INK} size={18} strokeWidth={2.4} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Precious Metals
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                      Gold ({symbol} {inputs.goldPricePerGram}/g) · Silver ({symbol} {inputs.silverPricePerGram}/g)
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionSubtotalRow}>
                  <Text style={[styles.subtotalText, { color: colors.text }]}>
                    {formatAmount(result.totalMetals, symbol)}
                  </Text>
                  {openSections.metals ? (
                    <ChevronUp color={colors.textMuted} size={18} />
                  ) : (
                    <ChevronDown color={colors.textMuted} size={18} />
                  )}
                </View>
              </PressableScale>

              {openSections.metals && (
                <View style={styles.sectionBody}>
                  <InputField
                    label={`Gold (in Grams) — Rate: ${symbol} ${inputs.goldPricePerGram}/g`}
                    placeholder="0"
                    symbol="grams"
                    value={inputs.goldGrams ? String(inputs.goldGrams) : ''}
                    onChangeText={(t) => updateNumericField('goldGrams', t)}
                    helper={`Value: ${formatAmount(result.goldValue, symbol)}`}
                  />
                  <InputField
                    label={`Silver (in Grams) — Rate: ${symbol} ${inputs.silverPricePerGram}/g`}
                    placeholder="0"
                    symbol="grams"
                    value={inputs.silverGrams ? String(inputs.silverGrams) : ''}
                    onChangeText={(t) => updateNumericField('silverGrams', t)}
                    helper={`Value: ${formatAmount(result.silverValue, symbol)}`}
                  />
                </View>
              )}
            </Card>

            {/* SECTION 3: Business & Investments */}
            <SectionHeader title="3. Investments & Business" />
            <Card style={styles.sectionCard}>
              <PressableScale
                onPress={() => toggleSection('investments')}
                style={styles.sectionHeaderPressable}
              >
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionIconWrap,
                      outline(colors),
                      { backgroundColor: tints.blue },
                    ]}
                  >
                    <Building2 color={INK} size={18} strokeWidth={2.4} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Trade & Investments
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                      Stocks, inventory, crypto, trade goods
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionSubtotalRow}>
                  <Text style={[styles.subtotalText, { color: colors.text }]}>
                    {formatAmount(result.totalBusinessAndInvestments, symbol)}
                  </Text>
                  {openSections.investments ? (
                    <ChevronUp color={colors.textMuted} size={18} />
                  ) : (
                    <ChevronDown color={colors.textMuted} size={18} />
                  )}
                </View>
              </PressableScale>

              {openSections.investments && (
                <View style={styles.sectionBody}>
                  <InputField
                    label="Stocks / Mutual Funds (Zakatable share value)"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.investments ? String(inputs.investments) : ''}
                    onChangeText={(t) => updateNumericField('investments', t)}
                  />
                  <InputField
                    label="Business Merchandise & Stock for Sale"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.businessInventory ? String(inputs.businessInventory) : ''}
                    onChangeText={(t) => updateNumericField('businessInventory', t)}
                  />
                  <InputField
                    label="Crypto / Digital Currency"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.crypto ? String(inputs.crypto) : ''}
                    onChangeText={(t) => updateNumericField('crypto', t)}
                  />
                  <InputField
                    label="Other Zakatable Income / Savings"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.otherAssets ? String(inputs.otherAssets) : ''}
                    onChangeText={(t) => updateNumericField('otherAssets', t)}
                  />
                </View>
              )}
            </Card>

            {/* SECTION 4: Liabilities & Deductions */}
            <SectionHeader title="4. Deductible Liabilities" />
            <Card style={styles.sectionCard}>
              <PressableScale
                onPress={() => toggleSection('liabilities')}
                style={styles.sectionHeaderPressable}
              >
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionIconWrap,
                      outline(colors),
                      { backgroundColor: tints.rose },
                    ]}
                  >
                    <Receipt color={INK} size={18} strokeWidth={2.4} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Due Debts & Bills
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                      Bills, employee wages, immediate debts due
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionSubtotalRow}>
                  <Text style={[styles.subtotalText, { color: colors.danger }]}>
                    - {formatAmount(result.totalLiabilities, symbol)}
                  </Text>
                  {openSections.liabilities ? (
                    <ChevronUp color={colors.textMuted} size={18} />
                  ) : (
                    <ChevronDown color={colors.textMuted} size={18} />
                  )}
                </View>
              </PressableScale>

              {openSections.liabilities && (
                <View style={styles.sectionBody}>
                  <InputField
                    label="Debts Due Immediately"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.debtsDueNow ? String(inputs.debtsDueNow) : ''}
                    onChangeText={(t) => updateNumericField('debtsDueNow', t)}
                  />
                  <InputField
                    label="Unpaid Bills, Rents & Due Expenses"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.billsDueNow ? String(inputs.billsDueNow) : ''}
                    onChangeText={(t) => updateNumericField('billsDueNow', t)}
                  />
                  <InputField
                    label="Other Immediate Liabilities"
                    placeholder="0"
                    symbol={symbol}
                    value={inputs.otherLiabilities ? String(inputs.otherLiabilities) : ''}
                    onChangeText={(t) => updateNumericField('otherLiabilities', t)}
                  />
                </View>
              )}
            </Card>

            {/* Educational Info Card */}
            <View style={styles.infoCardWrap}>
              <Card style={styles.educationCard}>
                <View
                  style={[
                    styles.educationIcon,
                    outline(colors),
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Sparkles color={INK} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.educationTitle, { color: colors.text }]}>
                    Zakat Purification Principle
                  </Text>
                  <Text style={[styles.educationBody, { color: colors.textSecondary }]}>
                    "Take from their wealth a charity by which you purify them and cause them
                    increase..." [At-Tawbah 9:103].
                  </Text>
                  <Text style={[styles.educationBody, { color: colors.textSecondary, marginTop: 6 }]}>
                    Personal residence, personal vehicles, everyday clothes, and work tools are
                    100% exempt from Zakat.
                  </Text>
                </View>
              </Card>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <PressableScale onPress={() => setShowCurrencyModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>
            <ScrollView style={styles.currencyList}>
              {Object.values(CURRENCIES).map((curr) => {
                const isSelected = inputs.currency === curr.code;
                return (
                  <PressableScale
                    key={curr.code}
                    onPress={() => handleSelectCurrency(curr.code)}
                    style={[
                      styles.currencyRow,
                      {
                        backgroundColor: isSelected ? colors.accentSoft : colors.surfaceAlt,
                        borderColor: colors.ink,
                      },
                    ]}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencyCode, { color: colors.text }]}>
                        {curr.code} ({curr.symbol})
                      </Text>
                      <Text style={[styles.currencyName, { color: colors.textSecondary }]}>
                        {curr.name}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle color={colors.primary} size={20} />}
                  </PressableScale>
                );
              })}
            </ScrollView>
          </BrutalBox>
        </View>
      </Modal>

      {/* Nisab & Rates Modal */}
      <Modal
        visible={showRatesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRatesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Nisab & Metal Rates
              </Text>
              <PressableScale onPress={() => setShowRatesModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>

            <ScrollView>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Nisab is the minimum threshold of wealth required to owe Zakat. Choose your
                standard and adjust the current market metal rates per gram.
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Nisab Standard
              </Text>
              <View style={styles.segmentRow}>
                <PressableScale
                  onPress={() => {
                    haptic.select();
                    setInputs((p) => ({ ...p, nisabStandard: 'silver' }));
                  }}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        inputs.nisabStandard === 'silver' ? colors.primary : colors.surfaceAlt,
                      borderColor: colors.ink,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color:
                          inputs.nisabStandard === 'silver' ? colors.onPrimary : colors.text,
                      },
                    ]}
                  >
                    Silver (612.36g) · Scholarly Choice
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    haptic.select();
                    setInputs((p) => ({ ...p, nisabStandard: 'gold' }));
                  }}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        inputs.nisabStandard === 'gold' ? colors.primary : colors.surfaceAlt,
                      borderColor: colors.ink,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color:
                          inputs.nisabStandard === 'gold' ? colors.onPrimary : colors.text,
                      },
                    ]}
                  >
                    Gold (87.48g)
                  </Text>
                </PressableScale>
              </View>

              <InputField
                label={`Gold Rate per Gram (${inputs.currency})`}
                placeholder="0"
                symbol={symbol}
                value={String(inputs.goldPricePerGram)}
                onChangeText={(t) => updateNumericField('goldPricePerGram', t)}
              />

              <InputField
                label={`Silver Rate per Gram (${inputs.currency})`}
                placeholder="0"
                symbol={symbol}
                value={String(inputs.silverPricePerGram)}
                onChangeText={(t) => updateNumericField('silverPricePerGram', t)}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                Calendar Year Standard
              </Text>
              <View style={styles.segmentRow}>
                <PressableScale
                  onPress={() => {
                    haptic.select();
                    setInputs((p) => ({ ...p, yearType: 'lunar' }));
                  }}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        inputs.yearType === 'lunar' ? colors.primary : colors.surfaceAlt,
                      borderColor: colors.ink,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color:
                          inputs.yearType === 'lunar' ? colors.onPrimary : colors.text,
                      },
                    ]}
                  >
                    Lunar / Hijri (2.5%)
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    haptic.select();
                    setInputs((p) => ({ ...p, yearType: 'solar' }));
                  }}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        inputs.yearType === 'solar' ? colors.primary : colors.surfaceAlt,
                      borderColor: colors.ink,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color:
                          inputs.yearType === 'solar' ? colors.onPrimary : colors.text,
                      },
                    ]}
                  >
                    Solar / Gregorian (2.577%)
                  </Text>
                </PressableScale>
              </View>

              <BrutalPressable
                onPress={() => setShowRatesModal(false)}
                fill={colors.accent}
                radius={16}
                style={styles.modalDoneBtn}
              >
                <Text style={styles.modalDoneBtnText}>Apply Rates</Text>
              </BrutalPressable>
            </ScrollView>
          </BrutalBox>
        </View>
      </Modal>

      {/* Guide & Rules Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BrutalBox fill={colors.surface} radius={28} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Zakat Guidelines</Text>
              <PressableScale onPress={() => setShowInfoModal(false)}>
                <X color={colors.text} size={22} />
              </PressableScale>
            </View>

            <ScrollView style={styles.guideScroll}>
              <Text style={[styles.guideHeading, { color: colors.text }]}>1. What is Nisab?</Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                Nisab is the minimum net threshold of wealth a Muslim must maintain for one
                complete lunar year (Hawl) before Zakat becomes obligatory.
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                2. Gold vs. Silver Nisab
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                Classical scholars set Nisab at 87.48 grams of gold or 612.36 grams of silver.
                Most contemporary scholars recommend using the silver threshold for cash and
                savings because it allows more people in need to benefit.
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                3. What Assets are NOT Zakatable?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                • Your primary home and land lived in{'\n'}
                • Personal vehicles used for daily transportation{'\n'}
                • Household furniture, appliances, and personal clothes{'\n'}
                • Work tools and operational equipment
              </Text>

              <Text style={[styles.guideHeading, { color: colors.text }]}>
                4. Who Qualifies to Receive Zakat?
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                The Quran specifies eight eligible groups (Surah At-Tawbah 9:60): the poor
                (Al-Fuqara), the destitute (Al-Masakin), zakat administrators, those whose
                hearts are inclined, freeing captives, those overwhelmed by debt, in the cause
                of Allah, and travelers in need.
              </Text>
            </ScrollView>
          </BrutalBox>
        </View>
      </Modal>
    </View>
  );
}

function InputField({
  label,
  placeholder,
  symbol,
  value,
  onChangeText,
  helper,
}: {
  label: string;
  placeholder: string;
  symbol: string;
  value: string;
  onChangeText: (text: string) => void;
  helper?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.inputFieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          outline(colors),
          { backgroundColor: colors.surfaceAlt },
        ]}
      >
        <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>{symbol}</Text>
        <TextInput
          style={[styles.inputTextInput, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      {helper ? (
        <Text style={[styles.helperText, { color: colors.primary }]}>{helper}</Text>
      ) : null}
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
  summaryCard: { padding: 18, marginBottom: 14 },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  summaryBigAmount: { fontSize: 32, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: brutal.borderThin,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '900', color: INK },
  netWealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  netWealthCol: { flex: 1 },
  netWealthColRight: { alignItems: 'flex-end' },
  netWealthLabel: { fontSize: 11, fontWeight: '800' },
  netWealthVal: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  progressWrap: { marginVertical: 6 },
  cardActionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '900', color: INK },
  configBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  configChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  configChipText: { fontSize: 12.5, fontWeight: '800' },
  sectionCard: { marginBottom: 14, padding: 14 },
  sectionHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  sectionSubtotalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtotalText: { fontSize: 14, fontWeight: '900' },
  sectionBody: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  inputFieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputPrefix: { fontSize: 13, fontWeight: '800', marginRight: 8 },
  inputTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '800',
    padding: 0,
  },
  helperText: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  infoCardWrap: { marginTop: 4, marginBottom: 20 },
  educationCard: { flexDirection: 'row', gap: 12, padding: 14 },
  educationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  educationTitle: { fontSize: 14, fontWeight: '900' },
  educationBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalSubtitle: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  currencyList: { maxHeight: 380 },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: brutal.borderThin,
    marginBottom: 8,
  },
  currencyInfo: { gap: 2 },
  currencyCode: { fontSize: 15, fontWeight: '900' },
  currencyName: { fontSize: 12, fontWeight: '600' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: brutal.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: { fontSize: 11.5, fontWeight: '800', textAlign: 'center' },
  modalDoneBtn: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  modalDoneBtnText: { fontSize: 15, fontWeight: '900', color: INK },
  guideScroll: { maxHeight: 420 },
  guideHeading: { fontSize: 14, fontWeight: '900', marginTop: 12, marginBottom: 4 },
  guideText: { fontSize: 12.5, lineHeight: 19 },
});
