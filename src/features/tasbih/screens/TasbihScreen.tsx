import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ActivityIndicator, Platform, ScrollView, Animated, TextInput, Modal } from 'react-native';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trash, Plus, Check, X, Sparkles } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../../core/hooks/useAuth';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export function TasbihScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  useScreenTime('Tasbih');

  const [activeCategory, setActiveCategory] = useState<'daily' | 'wazifa' | 'custom'>('daily');
  const [customDhikrs, setCustomDhikrs] = useState<DhikrItem[]>([]);
  const [activeDhikr, setActiveDhikr] = useState<DhikrItem>(STATIC_DHIKR_DATA[0]);
  const [count, setCount] = useState(0);
  const [totalDhikrSession, setTotalDhikrSession] = useState(0);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // History list
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Animation Refs
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  // SVG Circle Constants for circular loader
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = target > 0
    ? circumference - (Math.min(count, target) / target) * circumference
    : 0;

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

    // Touch feedback bounce scale
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Short vibration pulse
    if (hapticEnabled) {
      Vibration.vibrate(Platform.OS === 'android' ? 40 : [0, 20]);
    }

    // Check if target reached
    if (target > 0 && nextCount === target) {
      // Long double vibration
      if (hapticEnabled) {
        Vibration.vibrate(Platform.OS === 'android' ? [0, 80, 50, 80] : [0, 80, 50, 80]);
      }

      // Auto save session target reach
      saveDhikrRecord(activeDhikr.phrase, target);
      setCount(0);
      setShowCelebrationModal(true);
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
      // 1. Award XP (+10 XP per completion)
      const storedXp = await AsyncStorage.getItem('user_xp');
      const currentXp = storedXp ? parseInt(storedXp, 10) : 0;
      const newXp = currentXp + 10;
      await AsyncStorage.setItem('user_xp', newXp.toString());

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

      // 3. Log user activity locally
      const todayStr = new Date().toISOString().split('T')[0];
      const activityKey = `tasbih_activities_${todayStr}`;
      const existingAct = await AsyncStorage.getItem(activityKey);
      const actList = existingAct ? JSON.parse(existingAct) : [];
      actList.push({
        phrase,
        count: recordCount,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem(activityKey, JSON.stringify(actList));

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



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Tasbih Counter</Text>
        <TouchableOpacity onPress={() => setHapticEnabled(!hapticEnabled)} style={styles.backBtn}>
          {hapticEnabled ? (
            <Volume2 color={Theme.colors.primary} size={22} />
          ) : (
            <VolumeX color={Theme.colors.textMuted} size={22} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeCategory === 'daily' && styles.tabBtnActive]}
            onPress={() => {
              setActiveCategory('daily');
              handleDhikrSelect(STATIC_DHIKR_DATA.find(d => d.category === 'daily')!);
            }}
          >
            <Text style={[styles.tabBtnText, activeCategory === 'daily' && styles.tabBtnTextActive]}>
              ⚡ Daily Azkar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeCategory === 'wazifa' && styles.tabBtnActive]}
            onPress={() => {
              setActiveCategory('wazifa');
              handleDhikrSelect(STATIC_DHIKR_DATA.find(d => d.category === 'wazifa')!);
            }}
          >
            <Text style={[styles.tabBtnText, activeCategory === 'wazifa' && styles.tabBtnTextActive]}>
              🌟 Wazifas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeCategory === 'custom' && styles.tabBtnActive]}
            onPress={() => {
              setActiveCategory('custom');
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
            }}
          >
            <Text style={[styles.tabBtnText, activeCategory === 'custom' && styles.tabBtnTextActive]}>
              🛠️ Custom
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preset list badges */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {activeCategory === 'custom' && (
            <TouchableOpacity
              style={[styles.presetBadge, { borderColor: Theme.colors.primary, borderStyle: 'dashed' }]}
              onPress={() => setShowAddCustomModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Plus color={Theme.colors.primary} size={14} />
                <Text style={[styles.presetText, { color: Theme.colors.primary }]}>Create Dhikr</Text>
              </View>
            </TouchableOpacity>
          )}
          {(activeCategory === 'custom' ? customDhikrs : STATIC_DHIKR_DATA.filter(d => d.category === activeCategory)).map((dhikr) => (
            <TouchableOpacity
              key={dhikr.phrase}
              style={[
                styles.presetBadge,
                activeDhikr.phrase === dhikr.phrase ? styles.activePresetBadge : null,
              ]}
              onPress={() => handleDhikrSelect(dhikr)}
            >
              <Text
                style={[
                  styles.presetText,
                  activeDhikr.phrase === dhikr.phrase ? styles.activePresetText : null,
                ]}
              >
                {dhikr.phrase}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Counter Circle Display */}
        <View style={styles.counterSection}>
          <Text style={styles.phraseAr} numberOfLines={1}>{activeDhikr.arabic}</Text>
          <Text style={styles.phraseEn}>{activeDhikr.phrase}</Text>

          <TouchableOpacity style={styles.incrementArea} onPress={handleIncrement} activeOpacity={0.95}>
            <Animated.View style={[styles.circleContainer, { transform: [{ scale: scaleAnim }] }]}>
              <Svg width={size} height={size}>
                {/* Background Ring */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={Theme.colors.border}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Colored Progress Ring */}
                {target > 0 ? (
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Theme.colors.primary}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                  />
                ) : null}
              </Svg>
              <View style={styles.countTextOverlay}>
                <Text style={styles.countNumber}>{count}</Text>
                {target > 0 ? (
                  <Text style={styles.targetLabel}>Target: {target}</Text>
                ) : (
                  <Text style={styles.targetLabel}>Free Counter</Text>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Dashboard Counter Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.circleActionBtn} onPress={handleReset}>
            <RotateCcw color={Theme.colors.text} size={20} />
            <Text style={styles.actionText}>Reset</Text>
          </TouchableOpacity>

          <View style={styles.sessionBox}>
            <Text style={styles.sessionLabel}>Session Dhikr</Text>
            <Text style={styles.sessionValue}>{totalDhikrSession}</Text>
          </View>
        </View>

        {/* Detailed Dhikr Info & Virtue (Fazilat) Display Card */}
        <View style={styles.virtueSection}>
          <View style={[styles.virtueCard, { borderColor: activeCategory === 'wazifa' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)' }]}>
            <View style={styles.virtueCardHeader}>
              <Sparkles color={activeCategory === 'wazifa' ? Theme.colors.accent : Theme.colors.primary} size={18} />
              <Text style={styles.virtueCardTitle}>Pronunciation & Virtues</Text>
              {activeCategory === 'custom' && activeDhikr.phrase !== 'Custom Dhikr' && (
                <TouchableOpacity
                  style={styles.deleteDhikrBtn}
                  onPress={() => handleDeleteCustomDhikr(activeDhikr.phrase)}
                  activeOpacity={0.7}
                >
                  <Trash color={Theme.colors.error} size={16} />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.pronounceText}>"{activeDhikr.transliteration}"</Text>
            
            <View style={styles.detailDivider} />
            
            <View style={styles.virtueRow}>
              <Text style={styles.detailLabel}>Meaning:</Text>
              <Text style={styles.detailValue}>{activeDhikr.translation}</Text>
            </View>
            
            <View style={styles.virtueRow}>
              <Text style={styles.detailLabel}>Reward / Reward Benefit:</Text>
              <Text style={[styles.detailValue, { fontWeight: '600', color: Theme.colors.text }]}>
                {activeDhikr.virtue}
              </Text>
            </View>

            {target > 0 && (
              <View style={styles.virtueRow}>
                <Text style={styles.detailLabel}>Recommended Daily Count:</Text>
                <Text style={[styles.detailValue, { color: Theme.colors.primary, fontWeight: '700' }]}>
                  {target} Times
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Counter History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Counter History</Text>
            {history.length > 0 ? (
              <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
                <Trash color={Theme.colors.error} size={16} />
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {historyLoading ? (
            <ActivityIndicator size="small" color={Theme.colors.primary} style={styles.spinner} />
          ) : history.length > 0 ? (
            <View style={styles.historyList}>
              {history.map((record) => {
                const date = new Date(record.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View key={record.id} style={styles.historyItem}>
                    <View>
                      <Text style={styles.recordPhrase}>{record.phrase}</Text>
                      <Text style={styles.recordTime}>{date}</Text>
                    </View>
                    <View style={styles.recordRight}>
                      <Text style={styles.recordCount}>+{record.count}</Text>
                      <Text style={styles.recordXp}>+10 XP</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No tasbih records completed yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* Celebration Modal when Target Reached */}
      <Modal
        visible={showCelebrationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCelebrationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconContainer}>
              <Sparkles color="#FFFFFF" size={32} />
            </View>
            <Text style={styles.celebrationTitle}>Mubarak!</Text>
            <Text style={styles.celebrationSubtitle}>Target Completed successfully</Text>
            
            <Text style={styles.celebrationDetails}>
              You have completed {target} counts of "{activeDhikr.phrase}"! May Allah accept your remembrance.
            </Text>

            <View style={styles.xpRewardBadge}>
              <Check color="#059669" size={16} />
              <Text style={styles.xpRewardText}>+10 XP GAINED</Text>
            </View>

            <TouchableOpacity
              style={styles.closeCelebrateBtn}
              onPress={() => setShowCelebrationModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeCelebrateBtnText}>Alhamdulillah</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Custom Dhikr Modal */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddCustomModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalSheet} 
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Create Custom Dhikr</Text>
              <TouchableOpacity onPress={() => setShowAddCustomModal(false)} style={styles.closeBtn}>
                <X color={Theme.colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dhikr Name (Transliteration)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Subhanallahi wa bihamdihi"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={newPhrase}
                  onChangeText={setNewPhrase}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Arabic Text (Optional)</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'right', fontFamily: 'Georgia' }]}
                  placeholder="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={newArabic}
                  onChangeText={setNewArabic}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phonetic / Pronunciation Help</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Subhan-Allahi wa bi-hamdihi"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={newTransliteration}
                  onChangeText={setNewTransliteration}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translation / English Meaning</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Glory be to Allah and praise be to Him"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={newTranslation}
                  onChangeText={setNewTranslation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Count (0 for free counter)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 100"
                  placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="numeric"
                  value={newTarget}
                  onChangeText={setNewTarget}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Virtues / Rewards (Fazilat)</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="e.g. Forgiveness of all sins..."
                  placeholderTextColor={Theme.colors.textMuted}
                  multiline
                  value={newVirtue}
                  onChangeText={setNewVirtue}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddCustomDhikr}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Create Dhikr</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  scrollContent: {
    paddingBottom: 40,
  },
  presetRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  presetBadge: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.round,
  },
  activePresetBadge: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  presetText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activePresetText: {
    color: Theme.colors.white,
  },
  counterSection: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  phraseAr: {
    fontSize: 32,
    color: Theme.colors.text,
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 8,
  },
  phraseEn: {
    fontSize: 16,
    color: Theme.colors.accentDark,
    fontWeight: 'bold',
    marginBottom: 28,
  },
  incrementArea: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 54,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  targetLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 32,
  },
  circleActionBtn: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  sessionBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    width: 140,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  sessionLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  sessionValue: {
    color: Theme.colors.accent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  historySection: {
    paddingHorizontal: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    color: Theme.colors.error,
    fontSize: 13,
  },
  spinner: {
    marginVertical: 20,
  },
  historyList: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(35, 68, 50, 0.2)',
  },
  recordPhrase: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordTime: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordCount: {
    color: Theme.colors.accent,
    fontSize: 15,
    fontWeight: 'bold',
  },
  recordXp: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(35, 68, 50, 0.05)',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: Theme.radius.lg,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Theme.radius.md,
  },
  tabBtnActive: {
    backgroundColor: Theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Theme.colors.primary,
  },
  virtueSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  virtueCard: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  virtueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  virtueCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  deleteDhikrBtn: {
    padding: 4,
  },
  pronounceText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginBottom: 12,
  },
  virtueRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginBottom: 16,
  },
  celebrationDetails: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 24,
  },
  xpRewardText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeCelebrateBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  closeCelebrateBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalSheet: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(35, 68, 50, 0.03)',
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 44,
    paddingHorizontal: 12,
    color: Theme.colors.text,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
