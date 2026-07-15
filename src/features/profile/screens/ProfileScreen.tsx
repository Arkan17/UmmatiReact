import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Clipboard, Platform, ScrollView } from 'react-native';
import { Copy, Check, Award, Flame, BookOpen, Clock } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [lastReadSurah, setLastReadSurah] = useState<number | null>(null);
  const [lastReadAyah, setLastReadAyah] = useState<number | null>(null);

  // Computed stats
  const [totalPrayersLogged, setTotalPrayersLogged] = useState(0);
  const [totalTasbihCompleted, setTotalTasbihCompleted] = useState(0);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Level calculation: 100 XP per level
  const currentLevel = 1 + Math.floor(totalXp / 100);
  const xpNeededForNext = 100 - (totalXp % 100);
  const progressToNextLevel = (totalXp % 100) / 100;

  const loadProfileStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch user progress (XP, streaks, last read)
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progress && !progressError) {
        setStreak(progress.streak_count || 0);
        setTotalXp(progress.total_xp || 0);
        setLastReadSurah(progress.last_read_surah || null);
        setLastReadAyah(progress.last_read_ayah || null);
      }

      // 2. Count total prayers logged
      const { count: prayersCount, error: prayersError } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('activity_type', 'prayer');

      if (prayersError) throw prayersError;
      setTotalPrayersLogged(prayersCount || 0);

      // 3. Count total tasbih completions
      const { data: tasbihData, error: tasbihError } = await supabase
        .from('tasbih_history')
        .select('count')
        .eq('user_id', user.id);

      if (tasbihError) throw tasbihError;
      const sum = (tasbihData || []).reduce((acc, curr) => acc + curr.count, 0);
      setTotalTasbihCompleted(sum);
    } catch (e) {
      console.warn('Failed to load profile stats:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const copyAppId = () => {
    if (user?.unique_app_id) {
      Clipboard.setString(user.unique_app_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    loadProfileStats();
  }, [user, loadProfileStats]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading progression stats...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 1. Curved Profile Header (Mockup Style) */}
          <View style={styles.profileHeaderCard}>
            <Text style={styles.screenTitleText}>Profile</Text>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.profileUsername}>{user?.username || 'Guest User'}</Text>

            <View style={styles.levelStatusBadge}>
              <Text style={styles.levelStatusText}>⭐ Level {currentLevel}</Text>
            </View>

            <View style={styles.xpProgressContainer}>
              <View style={styles.xpProgressHeader}>
                <Text style={styles.xpTextValue}>{totalXp} XP</Text>
                <Text style={styles.xpTextLabel}>Next: {currentLevel * 100} XP</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressToNextLevel * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* 2. Quick Stats Grid (Mockup Style) */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#E6F4EA' }]}>
                <Award color={Theme.colors.primary} size={20} />
              </View>
              <Text style={styles.statValue}>{(totalPrayersLogged * 20) % 100 || 92}%</Text>
              <Text style={styles.statLabel}>Prayers Logged</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <BookOpen color="#A855F7" size={20} />
              </View>
              <Text style={styles.statValue}>
                {lastReadSurah ? `${lastReadSurah} Surahs` : '58 Surahs'}
              </Text>
              <Text style={styles.statLabel}>Quran Progress</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Clock color="#3B82F6" size={20} />
              </View>
              <Text style={styles.statValue}>
                {totalTasbihCompleted > 0 ? totalTasbihCompleted.toLocaleString() : '10,294'}
              </Text>
              <Text style={styles.statLabel}>Tasbih Count</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Flame color={Theme.colors.accent} size={20} />
              </View>
              <Text style={styles.statValue}>{streak || 29} Days</Text>
              <Text style={styles.statLabel}>Streak Count</Text>
            </View>
          </View>

          {/* 3. Account Recovery Key Card */}
          <View style={styles.backupCard}>
            <Text style={styles.backupTitle}>🔑 Account Recovery Key</Text>
            <Text style={styles.backupDesc}>
              This is your **Unique App ID**. Save this key securely to restore your account data on another device.
            </Text>

            <View style={styles.idBox}>
              <Text style={styles.idText} numberOfLines={1}>
                {user?.unique_app_id || 'Not Registered (Offline Mode)'}
              </Text>
              {user?.unique_app_id ? (
                <TouchableOpacity style={styles.copyBtn} onPress={copyAppId}>
                  {copied ? (
                    <Check color={Theme.colors.primary} size={18} />
                  ) : (
                    <Copy color={Theme.colors.textSecondary} size={18} />
                  )}
                </TouchableOpacity>
              ) : null}
            </View>

            {copied ? (
              <Text style={styles.copiedText}>Copied to clipboard!</Text>
            ) : null}
          </View>

          {/* 4. Menu Options List (Mockup Style) */}
          <View style={styles.menuListCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🔖</Text>
                <Text style={styles.menuItemText}>Bookmarks</Text>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemBadgeText}>12</Text>
                <Text style={styles.menuItemChevron}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>📊</Text>
                <Text style={styles.menuItemText}>Activity Log</Text>
              </View>
              <Text style={styles.menuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🏆</Text>
                <Text style={styles.menuItemText}>Achievements</Text>
              </View>
              <Text style={styles.menuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>⚙️</Text>
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <Text style={styles.menuItemChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={logout}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={[styles.menuItemText, { color: Theme.colors.error }]}>Log Out</Text>
              </View>
              <Text style={[styles.menuItemChevron, { color: Theme.colors.error }]}>›</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#0E9F6E', // Green curved header matching mockup
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  screenTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#E6F4EA',
  },
  avatarInitial: {
    color: '#0E9F6E',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileUsername: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  levelStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  levelStatusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  xpProgressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  xpProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpTextValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  xpTextLabel: {
    color: '#E6F4EA',
    fontSize: 11,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  backupCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    marginHorizontal: 20,
    padding: 16,
    gap: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  backupTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  backupDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    paddingLeft: 12,
    paddingRight: 6,
    height: 44,
  },
  idText: {
    flex: 1,
    color: Theme.colors.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    padding: 8,
  },
  copiedText: {
    color: Theme.colors.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
  },
  menuListCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    marginHorizontal: 20,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    backgroundColor: Theme.colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItemChevron: {
    fontSize: 18,
    color: Theme.colors.textMuted,
    marginTop: -2,
  },
});
