// Weekly community challenges: join, log progress, and earn XP (awarded server-side) on completion.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { RefreshCw, Timer, Trophy } from 'lucide-react-native';
import type { RootStackParamList } from '../../../../core/navigation/RootNavigator';
import { useAuth } from '../../../../core/hooks/useAuth';
import { fetchProgress } from '../../../../core/services/progress';
import { useAppTheme } from '../../../../core/theme/ThemeProvider';
import { tints } from '../../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, haptic, outline } from '../../../../core/components/ui';
import { fetchChallenges, logChallenge } from '../../api/challenges';
import type { Challenge } from '../../api/types';
import { ChallengeCard } from '../../components/ChallengeCard';
import { useNow } from '../../utils/time';
import type { SectionProps } from './types';

const INK = '#1C1A17';

/** Challenges run through the end of `ends_on` (local time). */
const endOf = (endsOn: string) => {
  const [y, m, d] = endsOn.split('-').map(Number);
  return new Date(y, m - 1, d + 1);
};

const countdown = (ms: number) => {
  if (ms <= 0) return 'ending now';
  const h = Math.floor(ms / 3_600_000);
  const days = Math.floor(h / 24);
  if (days > 0) return `${days}d ${h % 24}h left`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${mins}m left`;
};

export function ChallengesSection({ header, bottomInset }: SectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const now = useNow();

  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<{ id: string; n: number } | null>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (celebrateTimer.current) clearTimeout(celebrateTimer.current); }, []);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    setError(null);
    try {
      setItems(await fetchChallenges());
    } catch (e: any) {
      setError(e?.message ?? 'Could not load challenges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const patch = (id: string, fn: (c: Challenge) => Challenge) => setItems((list) => list.map((c) => (c.id === id ? fn(c) : c)));

  const join = async (c: Challenge) => {
    if (!user) { navigation.navigate('Auth', { mode: 'signin' }); return; }
    setBusyId(c.id);
    try {
      await logChallenge(c.id, 0);
      haptic.success();
      patch(c.id, (x) => ({ ...x, joined: true, participants: x.participants + 1 }));
    } catch (e: any) {
      Alert.alert('Could not join', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const log = async (c: Challenge, amount: number) => {
    if (amount <= 0) return;
    const before = c;
    haptic.light();
    // Optimistic; the server clamps to the goal and decides completion
    patch(c.id, (x) => ({ ...x, my_progress: Math.min(x.goal, x.my_progress + amount) }));
    setBusyId(c.id);
    try {
      const res = await logChallenge(c.id, amount);
      const justCompleted = !!res.completed_at && !before.my_completed_at;
      patch(c.id, (x) => ({
        ...x,
        my_progress: res.progress,
        my_completed_at: res.completed_at,
        completed_count: x.completed_count + (justCompleted ? 1 : 0),
      }));
      if (justCompleted) {
        haptic.success();
        setCelebrate({ id: c.id, n: Date.now() });
        if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
        celebrateTimer.current = setTimeout(() => setCelebrate(null), 2600);
        fetchProgress().catch(() => {});
      }
    } catch (e: any) {
      patch(c.id, () => before);
      Alert.alert('Could not save progress', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const endsAt = items.length ? endOf(items[0].ends_on) : null;
  const completed = items.filter((c) => c.my_completed_at).length;

  const listHeader = (
    <View>
      {header}
      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <BrutalBox fill={tints.gold} radius={22} style={styles.weekCard}>
            <View style={[styles.weekIcon, outline({ ink: INK }), { backgroundColor: colors.surface }]}>
              <Trophy color={INK} size={24} strokeWidth={2.4} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.weekLabel}>
                THIS WEEK{endsAt ? ` · ENDS ${new Date(endsAt.getTime() - 1).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}` : ''}
              </Text>
              <Text style={styles.weekTitle}>
                {items.length ? `${completed} of ${items.length} completed` : 'Grow together'}
              </Text>
              {endsAt ? (
                <View style={styles.countdown}>
                  <Timer color={INK} size={13} strokeWidth={2.6} />
                  <Text style={styles.countdownText}>{countdown(endsAt.getTime() - now)}</Text>
                </View>
              ) : null}
            </View>
          </BrutalBox>
        </Animated.View>
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Log honestly — Allah sees what is hidden. New challenges arrive every Monday.
        </Text>
      </View>
    </View>
  );

  const empty = loading ? (
    <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  ) : error ? (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.center}>
      <BrutalBox fill={colors.danger} radius={22} style={styles.emptyIcon}>
        <RefreshCw color={INK} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load challenges</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
      <BrutalPressable fill={colors.surface} style={styles.retry} onPress={() => { setLoading(true); load(); }}>
        <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
      </BrutalPressable>
    </Animated.View>
  ) : (
    <View style={styles.center}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No challenges this week</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Pull down to check again.</Text>
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(350)} style={styles.cardWrap}>
          <ChallengeCard
            challenge={item}
            index={index}
            busy={busyId === item.id}
            celebrate={celebrate?.id === item.id ? celebrate.n : 0}
            onJoin={() => join(item)}
            onLog={(n) => log(item, n)}
          />
        </Animated.View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 12 },
  weekCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  weekIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weekLabel: { color: INK, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, opacity: 0.75 },
  weekTitle: { color: INK, fontSize: 19, fontWeight: '900', letterSpacing: -0.2, marginTop: 2 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  countdownText: { color: INK, fontSize: 12.5, fontWeight: '800' },
  note: { fontSize: 12.5, lineHeight: 18, marginTop: 12, marginBottom: 16, textAlign: 'center' },
  cardWrap: { paddingHorizontal: 18 },
  center: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 36, gap: 10 },
  emptyIcon: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retry: { paddingHorizontal: 20, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  retryText: { fontSize: 14.5, fontWeight: '900' },
});
