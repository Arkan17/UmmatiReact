// Community notifications inbox: reactions, replies, scholar answers, Ameens and RSVPs.
// New ones arrive live; everything is marked read shortly after the screen opens.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BellOff, CheckCheck, Sparkles, Trash2 } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, HeaderButton, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { clearNotifications, fetchNotifications, markAllRead, subscribeNotifications } from '../api/notifications';
import type { CommunityNotification } from '../api/types';
import { Avatar } from '../components/Avatar';
import { describeNotification, parsePreview } from '../notifications/communityAlerts';
import { timeAgo, useNow } from '../utils/time';

const INK = '#1C1A17';
const MARK_READ_DELAY = 2500;

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [items, setItems] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchNotifications());
    } catch (e) {
      console.warn('[notifications] load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live prepend
  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.id, (n) => setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev])));
  }, [user]);

  // Let the unread dots show for a moment, then mark everything read
  useEffect(() => {
    if (loading || !items.some((n) => !n.is_read)) return;
    const id = setTimeout(() => {
      markAllRead().catch(() => {});
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }, MARK_READ_DELAY);
    return () => clearTimeout(id);
  }, [loading, items]);

  const sections = useMemo(() => {
    const today = items.filter((n) => isToday(n.created_at));
    const earlier = items.filter((n) => !isToday(n.created_at));
    return [
      ...(today.length ? [{ title: 'Today', data: today }] : []),
      ...(earlier.length ? [{ title: 'Earlier', data: earlier }] : []),
    ];
  }, [items]);

  const readAll = () => {
    haptic.light();
    markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const clearAll = () => {
    Alert.alert('Clear notifications?', 'This removes all your community notifications.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearNotifications();
            setItems([]);
            haptic.success();
          } catch (e: any) {
            Alert.alert('Could not clear', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const open = (n: CommunityNotification) => {
    haptic.select();
    if (n.post_id) navigation.navigate('PostDetail', { postId: n.post_id });
    else navigation.navigate('MainApp', { screen: 'CommunityTab' } as never);
  };

  const renderItem = ({ item: n, index }: { item: CommunityNotification; index: number }) => {
    const answer = n.kind === 'answer';
    const { snippet } = parsePreview(n);
    const showSnippet = !!snippet && n.kind !== 'comment' && n.kind !== 'rsvp';
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 320)).duration(320)} style={styles.rowWrap}>
        <BrutalPressable
          onPress={() => open(n)}
          offset={brutal.shadowSmall}
          borderWidth={brutal.borderThin}
          fill={answer ? tints.gold : n.is_read ? colors.surface : colors.primarySoft}
          style={styles.row}
        >
          {answer ? (
            <View style={[styles.answerIcon, outline({ ink: INK }), { backgroundColor: colors.surface }]}>
              <Sparkles color={INK} size={20} strokeWidth={2.4} />
            </View>
          ) : (
            <Avatar name={n.actor_name} size={42} />
          )}
          <View style={styles.flex}>
            <Text style={[styles.title, { color: answer ? INK : colors.text }]} numberOfLines={3}>{describeNotification(n)}</Text>
            {showSnippet ? (
              <Text style={[styles.snippet, { color: answer ? INK : colors.textSecondary }]} numberOfLines={2}>“{snippet}”</Text>
            ) : null}
            <Text style={[styles.time, { color: answer ? INK : colors.textMuted }]}>{timeAgo(n.created_at, now)}</Text>
          </View>
          {!n.is_read ? <View style={[styles.dot, outline({ ink: INK }, 1.5), { backgroundColor: colors.danger }]} /> : null}
        </BrutalPressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Notifications"
        subtitle="Reactions, replies and Ameens"
        onBack={() => navigation.goBack()}
        right={
          items.length ? (
            <View style={styles.headerBtns}>
              <HeaderButton onPress={readAll}><CheckCheck color={colors.onSky} size={19} /></HeaderButton>
              <HeaderButton onPress={clearAll}><Trash2 color={colors.onSky} size={19} /></HeaderButton>
            </View>
          ) : undefined
        }
      />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title.toUpperCase()}</Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
              <BrutalBox fill={colors.primarySoft} radius={24} style={styles.emptyIcon}>
                <BellOff color={colors.text} size={30} strokeWidth={2.4} />
              </BrutalBox>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                When someone reacts, replies or says Ameen, you'll see it here.
              </Text>
              {user?.is_guest ? (
                <Text style={[styles.guestNote, { color: colors.textMuted }]}>
                  You're browsing as a guest. Create a free account to post and get replies.
                </Text>
              ) : null}
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerBtns: { flexDirection: 'row', gap: 10 },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 18, paddingTop: 12 },
  sectionTitle: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.2, marginTop: 14, marginBottom: 10 },
  rowWrap: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  answerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, lineHeight: 20, fontWeight: '800' },
  snippet: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  time: { fontSize: 11.5, fontWeight: '700', marginTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '900', marginTop: 16 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  guestNote: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 14 },
});
