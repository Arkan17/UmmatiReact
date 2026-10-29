import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Bell, BookOpen, ChevronRight, HandHeart, MessageCircleHeart, ScrollText, ShieldOff, CircleDot, CloudUpload, Flame, LogOut, Moon, Palette as PaletteIcon, Sparkles, Sun, SunMoon, Trophy } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { useProgress } from '../../../core/hooks/useProgress';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { PrayerPeriod, ThemeMode, brutal, palettes, tints } from '../../../core/theme/palettes';
import { supabase } from '../../../core/config/SupabaseClient';
import { BrutalBox, BrutalPressable, Card, PressableScale, ProgressBar, SectionHeader, SkyBackground, haptic, outline } from '../../../core/components/ui';
import { levelFor } from '../../../core/services/progress';
import { Sheet } from '../../community/components/Sheet';
import { GUIDELINES } from '../../community/hooks/useCommunityGate';
import { getAlertsEnabled, setAlertsEnabled } from '../../community/notifications/communityAlerts';

interface Totals { prayers: number; dhikr: number; activeDays: number }

const MODES: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'adaptive', label: 'Prayer time', Icon: SunMoon },
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
];

export function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile } = useAuth();
  const { colors, mode, setMode, period, previewPeriod, setPreviewPeriod } = useAppTheme();
  const { progress, refresh } = useProgress();
  const [totals, setTotals] = useState<Totals>({ prayers: 0, dhikr: 0, activeDays: 0 });
  const [communityAlerts, setCommunityAlerts] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  useEffect(() => { getAlertsEnabled().then(setCommunityAlerts); }, []);

  const loadTotals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_activities')
      .select('activity_type, activity_date, details')
      .eq('user_id', user.id)
      .in('activity_type', ['prayer', 'tasbih']);
    const rows = data ?? [];
    setTotals({
      prayers: rows.filter((r) => r.activity_type === 'prayer')
        .reduce((n, r) => n + Object.values(r.details ?? {}).filter(Boolean).length, 0),
      dhikr: rows.filter((r) => r.activity_type === 'tasbih').reduce((n, r) => n + (r.details?.count ?? 0), 0),
      activeDays: new Set(rows.map((r) => r.activity_date)).size,
    });
  }, [user]);

  useFocusEffect(useCallback(() => { refresh(); loadTotals(); }, [refresh, loadTotals]));

  const { level, intoLevel, progress: lvlProgress } = levelFor(progress.total_xp);

  const achievements = [
    { key: 'first', label: 'First Salah', emoji: '🕌', earned: totals.prayers >= 1 },
    { key: 'p100', label: '100 Prayers', emoji: '💯', earned: totals.prayers >= 100 },
    { key: 's7', label: '7-day streak', emoji: '🔥', earned: progress.best_streak >= 7 },
    { key: 's30', label: '30-day streak', emoji: '🌙', earned: progress.best_streak >= 30 },
    { key: 'd1k', label: '1,000 Dhikr', emoji: '📿', earned: totals.dhikr >= 1000 },
    { key: 'l5', label: 'Level 5', emoji: '⭐', earned: level >= 5 },
    { key: 'khatam', label: 'Khatam', emoji: '📖', earned: progress.khatam_count >= 1 },
  ];

  const confirmLogout = () => {
    Alert.alert(
      user?.is_guest ? 'Sign out of guest account?' : 'Sign out?',
      user?.is_guest
        ? 'Guest progress cannot be recovered after signing out. Create an account first to keep it.'
        : 'Your progress is saved to your account.',
      [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <SkyBackground height={360} horizon={1} style={[styles.hero, { paddingTop: insets.top + 16, borderColor: colors.ink }]}>
        <Animated.View entering={ZoomIn.duration(350)}>
          <BrutalBox fill={user?.avatar_color ?? colors.primary} radius={32} borderWidth={3} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() ?? 'U'}</Text>
          </BrutalBox>
        </Animated.View>
        <Text style={[styles.name, { color: colors.onSky }]}>{user?.username}</Text>
        <Text style={[styles.email, { color: colors.onSkyMuted }]}>{user?.is_guest ? 'Guest account' : `@${user?.username}`}</Text>
        <View style={styles.levelWrap}>
          <View style={styles.levelRow}>
            <Text style={[styles.levelText, { color: colors.onSky }]}>Level {level}</Text>
            <Text style={[styles.levelText, { color: colors.onSkyMuted }]}>{intoLevel}/500 XP</Text>
          </View>
          <ProgressBar value={lvlProgress} color={colors.accent} track={colors.glass} />
        </View>
      </SkyBackground>

      <View style={styles.body}>
        <View style={styles.stats}>
          {[
            { label: 'Prayers', value: totals.prayers, Icon: Sparkles, tint: tints.green },
            { label: 'Streak', value: progress.streak_count, Icon: Flame, tint: tints.orange },
            { label: 'Dhikr', value: totals.dhikr, Icon: CircleDot, tint: tints.violet },
            { label: 'Best', value: progress.best_streak, Icon: Trophy, tint: tints.gold },
          ].map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(i * 60)} style={{ flex: 1 }}>
              <Card style={styles.stat}>
                <View style={[styles.statIcon, outline(colors), { backgroundColor: s.tint }]}>
                  <s.Icon color={colors.ink} size={16} strokeWidth={2.5} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{s.value.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </Card>
            </Animated.View>
          ))}
        </View>

        {user?.is_guest && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <BrutalPressable fill={colors.accentSoft} onPress={() => (navigation as any).navigate('Auth', { mode: 'upgrade' })} style={styles.guestCard}>
                <CloudUpload color={colors.text} size={26} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guestTitle, { color: colors.text }]}>Save your progress</Text>
                  <Text style={[styles.guestBody, { color: colors.textSecondary }]}>
                    Create a username and password so your streaks are never lost.
                  </Text>
                </View>
                <ChevronRight color={colors.text} size={20} />
            </BrutalPressable>
          </Animated.View>
        )}

        <SectionHeader title="Achievements" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
          {achievements.map((a) => (
            <BrutalBox
              key={a.key}
              fill={a.earned ? colors.accentSoft : colors.surfaceAlt}
              offset={a.earned ? brutal.shadowSmall : 0}
              borderWidth={brutal.borderThin}
              radius={20}
              style={[styles.badge, { opacity: a.earned ? 1 : 0.55 }]}
            >
              <Text style={styles.badgeEmoji}>{a.earned ? a.emoji : '🔒'}</Text>
              <Text style={[styles.badgeLabel, { color: colors.text }]}>{a.label}</Text>
            </BrutalBox>
          ))}
        </ScrollView>

        <SectionHeader title="Appearance" />
        <Card>
          <View style={styles.rowHead}>
            <PaletteIcon color={colors.text} size={18} strokeWidth={2.4} />
            <Text style={[styles.rowTitle, { color: colors.text }]}>Theme</Text>
          </View>
          <View style={[styles.segment, outline(colors), { backgroundColor: colors.surfaceAlt }]}>
            {MODES.map(({ mode: m, label, Icon }) => (
              <PressableScale key={m} onPress={() => { haptic.select(); setMode(m); }} hapticOnPress={false} style={[styles.segBtn, mode === m && [outline(colors), { backgroundColor: colors.primary }]]}>
                <Icon color={mode === m ? colors.onPrimary : colors.textSecondary} size={16} />
                <Text style={[styles.segText, { color: mode === m ? colors.onPrimary : colors.textSecondary }]}>{label}</Text>
              </PressableScale>
            ))}
          </View>
          {mode === 'adaptive' && (
            <>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Colours and the sky scene follow the prayer times. Tap one to preview it:
              </Text>
              <View style={styles.previewRow}>
                {(Object.keys(palettes) as PrayerPeriod[]).map((p) => {
                  const active = period === p;
                  return (
                    <PressableScale
                      key={p}
                      onPress={() => setPreviewPeriod(previewPeriod === p ? null : p)}
                      style={[styles.previewChip, { borderColor: active ? colors.ink : 'transparent' }]}
                    >
                      <View style={[styles.previewSwatch, outline(colors), { backgroundColor: palettes[p].sky[0] }]} />
                      <Text style={[styles.previewLabel, { color: active ? colors.text : colors.textSecondary }]}>{palettes[p].label}</Text>
                    </PressableScale>
                  );
                })}
              </View>
              {previewPeriod && (
                <PressableScale onPress={() => setPreviewPeriod(null)} style={styles.previewReset}>
                  <Text style={[styles.previewResetText, { color: colors.text }]}>Back to live sky ↺</Text>
                </PressableScale>
              )}
            </>
          )}
        </Card>

        {/* Developer's note + sadaqah jariyah dedication */}
        <BrutalPressable fill={tints.green} onPress={() => (navigation as any).navigate('DevelopersNote')} style={styles.noteCard}>
          <View style={[styles.noteIcon, { borderColor: colors.ink }]}>
            <HandHeart color="#1C1A17" size={24} strokeWidth={2.3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.noteKicker}>DEVELOPER'S NOTE</Text>
            <Text style={styles.noteTitle}>A sadaqah jariyah</Text>
            <Text style={styles.noteBody}>A letter from Arkan Malik, and a dua for his late family.</Text>
          </View>
          <ChevronRight color="#1C1A17" size={20} strokeWidth={2.6} />
        </BrutalPressable>

        <SectionHeader title="Settings" />
        <Card style={{ paddingVertical: 4 }}>
          <PressableScale onPress={() => (navigation as any).navigate('HomeTab', { screen: 'PrayerTimes' })} style={styles.menuRow}>
            <Bell color={colors.text} size={20} strokeWidth={2.3} />
            <Text style={[styles.menuText, { color: colors.text }]}>Adhan notifications</Text>
            <ChevronRight color={colors.textMuted} size={18} />
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PressableScale onPress={() => navigation.navigate('QuranTab' as never)} style={styles.menuRow}>
            <BookOpen color={colors.text} size={20} strokeWidth={2.3} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              {progress.last_read_surah ? `Continue Surah ${progress.last_read_surah}` : 'Start reading Quran'}
            </Text>
            <ChevronRight color={colors.textMuted} size={18} />
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.menuRow}>
            <MessageCircleHeart color={colors.text} size={20} strokeWidth={2.3} />
            <Text style={[styles.menuText, { color: colors.text }]}>Community notifications</Text>
            <Switch
              value={communityAlerts}
              onValueChange={(v) => { setCommunityAlerts(v); setAlertsEnabled(v); }}
              trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PressableScale onPress={() => (navigation as any).navigate('BlockedUsers')} style={styles.menuRow}>
            <ShieldOff color={colors.text} size={20} strokeWidth={2.3} />
            <Text style={[styles.menuText, { color: colors.text }]}>Blocked users</Text>
            <ChevronRight color={colors.textMuted} size={18} />
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PressableScale onPress={() => setShowGuidelines(true)} style={styles.menuRow}>
            <ScrollText color={colors.text} size={20} strokeWidth={2.3} />
            <Text style={[styles.menuText, { color: colors.text }]}>Community guidelines</Text>
            <ChevronRight color={colors.textMuted} size={18} />
          </PressableScale>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {!user?.is_guest && <View style={styles.menuRow}>
            <Trophy color={colors.text} size={20} strokeWidth={2.3} />
            <Text style={[styles.menuText, { color: colors.text }]}>Show me on leaderboard</Text>
            <Switch
              value={user?.show_on_leaderboard ?? true}
              onValueChange={(v) => { updateProfile({ show_on_leaderboard: v }); }}
              trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
              thumbColor={colors.surface}
            />
          </View>}
          {!user?.is_guest && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <PressableScale onPress={confirmLogout} style={styles.menuRow}>
            <LogOut color={colors.danger} size={20} />
            <Text style={[styles.menuText, { color: colors.danger }]}>Sign out</Text>
          </PressableScale>
        </Card>
      </View>

      <Sheet visible={showGuidelines} onClose={() => setShowGuidelines(false)} title="Community guidelines" subtitle="Adab for a kind, safe community">
        <ScrollView style={styles.guidelines} showsVerticalScrollIndicator={false}>
          {GUIDELINES.map((g, i) => (
            <View key={g.title} style={styles.guideRow}>
              <View style={[styles.guideNum, outline(colors), { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.guideNumText, { color: colors.text }]}>{i + 1}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.guideTitle, { color: colors.text }]}>{g.title}</Text>
                <Text style={[styles.guideBody, { color: colors.textSecondary }]}>{g.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 80, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, borderBottomWidth: brutal.border },
  avatar: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  name: { fontSize: 26, fontWeight: '900', marginTop: 16 },
  email: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  levelWrap: { alignSelf: 'stretch', marginTop: 20 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelText: { fontSize: 13, fontWeight: '800' },
  body: { paddingHorizontal: 18 },
  stats: { flexDirection: 'row', gap: 10, marginTop: -22 },
  stat: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', marginTop: 6 },
  statLabel: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  badgeRow: { gap: 12, paddingRight: 6, paddingBottom: 6 },
  badge: { width: 96, height: 104, alignItems: 'center', justifyContent: 'center', padding: 8 },
  badgeEmoji: { fontSize: 32 },
  badgeLabel: { fontSize: 12, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rowTitle: { fontSize: 16, fontWeight: '900' },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segBtn: { flex: 1, height: 40, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segText: { fontSize: 13, fontWeight: '800' },
  hint: { fontSize: 12, marginTop: 10, lineHeight: 17 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '800' },
  divider: { height: brutal.borderThin, opacity: 0.15 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  previewChip: { alignItems: 'center', borderWidth: brutal.borderThin, borderRadius: 16, padding: 3 },
  previewSwatch: { width: 48, height: 48, borderRadius: 13 },
  previewLabel: { fontSize: 11, fontWeight: '800', marginTop: 4, marginBottom: 2 },
  previewReset: { alignItems: 'center', paddingTop: 12 },
  previewResetText: { fontSize: 13, fontWeight: '800' },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26, padding: 16 },
  noteIcon: { width: 48, height: 48, borderRadius: 16, borderWidth: brutal.borderThin, backgroundColor: '#FFFAF1', alignItems: 'center', justifyContent: 'center' },
  noteKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: 'rgba(28,26,23,0.7)' },
  noteTitle: { fontSize: 17, fontWeight: '900', color: '#1C1A17', marginTop: 2 },
  noteBody: { fontSize: 13, fontWeight: '700', color: 'rgba(28,26,23,0.8)', marginTop: 2, lineHeight: 18 },
  guestCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, padding: 16 },
  guestTitle: { fontSize: 16, fontWeight: '900' },
  guestBody: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  flex: { flex: 1 },
  guidelines: { maxHeight: 460, marginBottom: 8 },
  guideRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  guideNum: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guideNumText: { fontSize: 13, fontWeight: '900' },
  guideTitle: { fontSize: 15, fontWeight: '900' },
  guideBody: { fontSize: 13.5, lineHeight: 19, marginTop: 2 },
});
