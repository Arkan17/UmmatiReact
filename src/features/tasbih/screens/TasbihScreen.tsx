import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trash } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../../core/hooks/useAuth';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';
import { useNavigation } from '@react-navigation/native';

const PRESETS = [
  { phrase: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ', target: 33 },
  { phrase: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
  { phrase: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', target: 34 },
  { phrase: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', target: 100 },
  { phrase: 'Custom Tasbih', arabic: 'ذِكْر', target: 0 },
];

export function TasbihScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [activeIndex, setActiveIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [totalDhikrSession, setTotalDhikrSession] = useState(0);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  
  // History list
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const currentPreset = PRESETS[activeIndex];
  const target = currentPreset.target;

  // SVG Circle Constants for circular loader
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = target > 0 
    ? circumference - (Math.min(count, target) / target) * circumference 
    : 0;

  const handleIncrement = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    setTotalDhikrSession(totalDhikrSession + 1);

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
      saveDhikrRecord(currentPreset.phrase, target);
      setCount(0);
    }
  };

  const handleReset = () => {
    if (count > 0) {
      if (target === 0) {
        // Save custom before reset
        saveDhikrRecord('Custom Tasbih', count);
      }
      setCount(0);
    }
  };

  const handlePresetSelect = (index: number) => {
    if (count > 0 && target === 0) {
      saveDhikrRecord('Custom Tasbih', count);
    }
    setActiveIndex(index);
    setCount(0);
  };

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasbih_history')
        .select('id, phrase, count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && !error) {
        setHistory(data);
      }
    } catch (e) {
      console.warn('Failed to load Tasbih history:', e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const saveDhikrRecord = async (phrase: string, recordCount: number) => {
    if (!user || recordCount === 0) return;
    try {
      // 1. Insert history row
      const { error } = await supabase.from('tasbih_history').insert({
        user_id: user.id,
        phrase: phrase,
        count: recordCount,
      });

      if (error) throw error;

      // 2. Fetch and award XP (+10 XP per completion)
      const { data: progress } = await supabase
        .from('user_progress')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();
        
      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            total_xp: progress.total_xp + 10,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // 3. Log user activity
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('user_activities').insert({
        user_id: user.id,
        activity_type: 'tasbih',
        activity_date: todayStr,
        details: { phrase, count: recordCount }
      });

      fetchHistory();
    } catch (e) {
      console.warn('Failed to save Tasbih logs:', e);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    try {
      await supabase
        .from('tasbih_history')
        .delete()
        .eq('user_id', user.id);
      setHistory([]);
    } catch (e) {
      console.warn('Failed to delete history:', e);
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
        {/* Preset Selector horizontal slides */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={preset.phrase}
              style={[
                styles.presetBadge,
                activeIndex === index ? styles.activePresetBadge : null,
              ]}
              onPress={() => handlePresetSelect(index)}
            >
              <Text
                style={[
                  styles.presetText,
                  activeIndex === index ? styles.activePresetText : null,
                ]}
              >
                {preset.phrase}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Counter Circle Display */}
        <View style={styles.counterSection}>
          <Text style={styles.phraseAr}>{currentPreset.arabic}</Text>
          <Text style={styles.phraseEn}>{currentPreset.phrase}</Text>
          
          <TouchableOpacity style={styles.incrementArea} onPress={handleIncrement} activeOpacity={0.8}>
            <View style={styles.circleContainer}>
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
            </View>
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
});
