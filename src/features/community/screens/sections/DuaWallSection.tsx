// "Pray for me" wall: share a dua request (anonymous by default) and say Ameen for others.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { Ban, CheckCircle2, Flag, HandHeart, MoreHorizontal, Plus, RotateCcw, Send, Trash2 } from 'lucide-react-native';
import type { RootStackParamList } from '../../../../core/navigation/RootNavigator';
import { useAppTheme } from '../../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../../core/theme/palettes';
import { BrutalPressable, Card, PressableScale, haptic, outline } from '../../../../core/components/ui';
import { createDua, deleteDua, fetchDuas, markDuaAnswered, setAmeen } from '../../api/duas';
import { blockUser } from '../../api/moderation';
import type { DuaRequest } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { OptionsSheet } from '../../components/OptionsSheet';
import { ReportSheet } from '../../components/ReportSheet';
import { Sheet } from '../../components/Sheet';
import { useCommunityGate } from '../../hooks/useCommunityGate';
import { checkContent } from '../../utils/contentFilter';
import { timeAgo, useNow } from '../../utils/time';
import type { SectionProps } from './types';

const INK = '#1C1A17';
const MAX = 500;

function AmeenButton({ dua, onPress }: { dua: DuaRequest; onPress: () => void }) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <BrutalPressable
        hapticOnPress={false}
        onPress={() => {
          if (!dua.my_ameen) {
            haptic.success();
            scale.value = withSequence(withSpring(1.12, { damping: 5, stiffness: 400 }), withSpring(1, { damping: 9 }));
          } else {
            haptic.light();
          }
          onPress();
        }}
        fill={dua.my_ameen ? tints.rose : colors.surface}
        offset={dua.my_ameen ? brutal.shadowSmall : brutal.shadow}
        borderWidth={brutal.borderThin}
        radius={16}
        style={styles.ameenBtn}
      >
        <Text style={styles.ameenEmoji}>🤲</Text>
        <Text style={[styles.ameenText, { color: dua.my_ameen ? INK : colors.text }]}>{dua.my_ameen ? 'Ameen said' : 'Ameen'}</Text>
        <View style={[styles.ameenCount, outline(colors, 1.5), { backgroundColor: dua.my_ameen ? colors.surface : colors.accentSoft }]}>
          <Text style={[styles.ameenCountText, { color: colors.text }]}>{dua.ameen_count}</Text>
        </View>
      </BrutalPressable>
    </Animated.View>
  );
}

function DuaCard({ dua, index, now, onAmeen, onMore, onAuthor }: {
  dua: DuaRequest; index: number; now: number; onAmeen: () => void; onMore: () => void; onAuthor: () => void;
}) {
  const { colors } = useAppTheme();
  const name = dua.is_anonymous ? (dua.is_mine ? 'You (anonymous)' : 'Someone in the Ummah') : dua.author_name ?? 'A Muslim';
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 350)).duration(380)}>
      <Card style={styles.card}>
        {dua.answered_at ? (
          <View style={[styles.ribbon, outline(colors), { backgroundColor: colors.success }]}>
            <CheckCircle2 color={INK} size={14} strokeWidth={2.8} />
            <Text style={styles.ribbonText}>Alhamdulillah — answered</Text>
          </View>
        ) : null}
        <View style={styles.cardHead}>
          <PressableScale onPress={onAuthor} disabled={dua.is_anonymous || !dua.user_id} style={styles.author}>
            <Avatar name={dua.author_name} color={dua.avatar_color} size={38} anonymous={dua.is_anonymous} />
            <View style={styles.flex}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(dua.created_at, now)}</Text>
            </View>
          </PressableScale>
          <PressableScale onPress={onMore} hitSlop={10} style={styles.more}>
            <MoreHorizontal color={colors.textMuted} size={20} />
          </PressableScale>
        </View>
        <Text style={[styles.content, { color: colors.text }]}>{dua.content}</Text>
        <AmeenButton dua={dua} onPress={onAmeen} />
      </Card>
    </Animated.View>
  );
}

export function DuaWallSection({ header, bottomInset }: SectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const gate = useCommunityGate();
  const now = useNow();

  const [mine, setMine] = useState(false);
  const [duas, setDuas] = useState<DuaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [composer, setComposer] = useState(false);
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [posting, setPosting] = useState(false);

  const [menuFor, setMenuFor] = useState<DuaRequest | null>(null);
  const [reportFor, setReportFor] = useState<DuaRequest | null>(null);
  const inFlight = useRef(new Set<string>());

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    try {
      const rows = await fetchDuas({ mine });
      setDuas(rows);
      setHasMore(rows.length >= 20);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load duas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mine]);

  useEffect(() => { load('initial'); }, [load]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || loading || duas.length === 0) return;
    setLoadingMore(true);
    try {
      const rows = await fetchDuas({ mine, before: duas[duas.length - 1].created_at });
      setDuas((prev) => [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))]);
      setHasMore(rows.length >= 20);
    } catch {
      // keep what we have; user can pull to refresh
    } finally {
      setLoadingMore(false);
    }
  };

  const patch = (id: string, fn: (d: DuaRequest) => DuaRequest) => setDuas((prev) => prev.map((d) => (d.id === id ? fn(d) : d)));

  const toggleAmeen = async (dua: DuaRequest) => {
    if (inFlight.current.has(dua.id)) return;
    inFlight.current.add(dua.id);
    const on = !dua.my_ameen;
    patch(dua.id, (d) => ({ ...d, my_ameen: on, ameen_count: Math.max(0, d.ameen_count + (on ? 1 : -1)) }));
    try {
      await setAmeen(dua.id, on);
    } catch (e: any) {
      patch(dua.id, (d) => ({ ...d, my_ameen: !on, ameen_count: Math.max(0, d.ameen_count + (on ? -1 : 1)) }));
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      inFlight.current.delete(dua.id);
    }
  };

  const openComposer = async () => {
    if (await gate.ensureCanPost()) setComposer(true);
  };

  const submit = async () => {
    const check = checkContent(text, { min: 5, max: MAX });
    if (!check.ok) { Alert.alert('Not quite', check.reason); return; }
    setPosting(true);
    try {
      await createDua(text, anonymous);
      haptic.success();
      setText('');
      setComposer(false);
      load('refresh');
    } catch (e: any) {
      Alert.alert('Could not share', e?.message ?? 'Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const toggleAnswered = async (dua: DuaRequest) => {
    const answered = !dua.answered_at;
    const prev = dua.answered_at;
    patch(dua.id, (d) => ({ ...d, answered_at: answered ? new Date().toISOString() : null }));
    try {
      await markDuaAnswered(dua.id, answered);
      if (answered) haptic.success();
    } catch (e: any) {
      patch(dua.id, (d) => ({ ...d, answered_at: prev }));
      Alert.alert('Could not update', e?.message ?? 'Please try again.');
    }
  };

  const remove = (dua: DuaRequest) => {
    Alert.alert('Delete this dua request?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const snapshot = duas;
          setDuas((p) => p.filter((d) => d.id !== dua.id));
          try { await deleteDua(dua.id); } catch (e: any) {
            setDuas(snapshot);
            Alert.alert('Could not delete', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const block = (dua: DuaRequest) => {
    if (!dua.user_id) return;
    Alert.alert(`Block ${dua.author_name ?? 'this person'}?`, "You won't see their posts or duas.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          try {
            await blockUser(dua.user_id!);
            setDuas((p) => p.filter((d) => d.user_id !== dua.user_id));
          } catch (e: any) {
            Alert.alert('Could not block', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const listHeader = (
    <View>
      {header}
      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(380)}>
          <Card style={[styles.tip, { backgroundColor: colors.accentSoft }]}>
            <HandHeart color={colors.text} size={22} strokeWidth={2.4} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              “The dua of a Muslim for his brother in his absence is answered.”{'\n'}
              <Text style={[styles.tipSource, { color: colors.textSecondary }]}>— Sahih Muslim 2733</Text>
            </Text>
          </Card>
        </Animated.View>

        <View style={[styles.toggle, outline(colors), { backgroundColor: colors.surface }]}>
          {(['all', 'mine'] as const).map((k) => {
            const on = (k === 'mine') === mine;
            return (
              <PressableScale
                key={k}
                hapticOnPress={false}
                onPress={() => { haptic.select(); setMine(k === 'mine'); }}
                style={[styles.toggleBtn, on ? [outline(colors), { backgroundColor: tints.rose }] : null]}
              >
                <Text style={[styles.toggleText, { color: on ? INK : colors.textSecondary }]}>{k === 'all' ? 'All duas' : 'My duas'}</Text>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );

  const empty = loading ? (
    <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  ) : error ? (
    <View style={styles.center}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load the Dua Wall</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
      <BrutalPressable fill={colors.surface} style={styles.retry} onPress={() => load('initial')}>
        <RotateCcw color={colors.text} size={16} strokeWidth={2.6} />
        <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
      </BrutalPressable>
    </View>
  ) : (
    <View style={styles.center}>
      <Text style={styles.emptyEmoji}>🤲</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{mine ? 'You have not asked for duas yet' : 'No dua requests yet'}</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Share what is in your heart, and the Ummah will say Ameen.</Text>
    </View>
  );

  const menuOptions = menuFor ? (menuFor.is_mine ? [
    { label: menuFor.answered_at ? 'Unmark as answered' : 'Mark as answered — Alhamdulillah', Icon: CheckCircle2, onPress: () => toggleAnswered(menuFor) },
    { label: 'Delete', Icon: Trash2, destructive: true, onPress: () => remove(menuFor) },
  ] : [
    { label: 'Report', Icon: Flag, onPress: () => setReportFor(menuFor) },
    { label: `Block ${menuFor.author_name ?? ''}`.trim(), Icon: Ban, destructive: true, hidden: !menuFor.user_id, onPress: () => block(menuFor) },
  ]) : [];

  return (
    <View style={styles.flex}>
      <FlatList
        data={loading || error ? [] : duas}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
        renderItem={({ item, index }) => (
          <View style={styles.itemPad}>
            <DuaCard
              dua={item}
              index={index}
              now={now}
              onAmeen={() => toggleAmeen(item)}
              onMore={() => setMenuFor(item)}
              onAuthor={() => item.user_id && navigation.navigate('UserProfile', { userId: item.user_id })}
            />
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.fabWrap, { bottom: bottomInset }]}>
        <BrutalPressable onPress={openComposer} fill={tints.rose} radius={27} style={styles.fab}>
          <Plus color={INK} size={20} strokeWidth={3} />
          <Text style={styles.fabText}>Request dua</Text>
        </BrutalPressable>
      </View>

      <Sheet visible={composer} onClose={() => setComposer(false)} title="Request a dua" subtitle="Your brothers and sisters will say Ameen">
        <TextInput
          style={[styles.input, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
          multiline
          maxLength={MAX}
          placeholder="e.g. Please make dua for my mother's recovery…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          autoFocus
        />
        <Text style={[styles.counter, { color: colors.textMuted }]}>{text.length} / {MAX}</Text>
        <View style={styles.anonRow}>
          <View style={styles.flex}>
            <Text style={[styles.anonTitle, { color: colors.text }]}>Post anonymously</Text>
            <Text style={[styles.anonDesc, { color: colors.textMuted }]}>Shown as "Someone in the Ummah"</Text>
          </View>
          <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ true: colors.primary, false: colors.surfaceAlt }} />
        </View>
        <BrutalPressable
          fill={text.trim().length >= 5 ? tints.rose : colors.surfaceAlt}
          disabled={posting}
          style={styles.submit}
          onPress={submit}
        >
          <Send color={INK} size={18} strokeWidth={2.5} />
          <Text style={styles.submitText}>{posting ? 'Sharing…' : 'Share dua request'}</Text>
        </BrutalPressable>
      </Sheet>

      <OptionsSheet visible={!!menuFor} onClose={() => setMenuFor(null)} title="Dua request" options={menuOptions} />
      <ReportSheet
        visible={!!reportFor}
        onClose={() => setReportFor(null)}
        target={reportFor ? { type: 'dua', id: reportFor.id } : null}
        authorId={reportFor?.user_id}
        authorName={reportFor?.author_name}
        onDone={(blocked) => {
          const target = reportFor;
          if (!target) return;
          setDuas((p) => p.filter((d) => d.id !== target.id && !(blocked && target.user_id && d.user_id === target.user_id)));
        }}
      />
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 12 },
  itemPad: { paddingHorizontal: 18 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  tipSource: { fontSize: 12.5, fontWeight: '700' },
  toggle: { flexDirection: 'row', padding: 4, borderRadius: 16, gap: 4, marginTop: 16, marginBottom: 14 },
  toggleBtn: { flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14, fontWeight: '900' },
  card: { borderRadius: 22, marginBottom: 14, padding: 16 },
  ribbon: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, borderRadius: 13, marginBottom: 10 },
  ribbonText: { color: INK, fontSize: 12, fontWeight: '900' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 15, fontWeight: '900' },
  time: { fontSize: 12, marginTop: 1 },
  more: { padding: 4 },
  content: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 12, marginBottom: 14 },
  ameenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50 },
  ameenEmoji: { fontSize: 20 },
  ameenText: { fontSize: 16, fontWeight: '900' },
  ameenCount: { minWidth: 30, height: 26, borderRadius: 13, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  ameenCountText: { fontSize: 13, fontWeight: '900' },
  center: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyText: { fontSize: 14.5, lineHeight: 21, textAlign: 'center' },
  retry: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, height: 44, alignItems: 'center', marginTop: 8 },
  retryText: { fontSize: 14.5, fontWeight: '900' },
  footer: { marginVertical: 16 },
  fabWrap: { position: 'absolute', right: 18 },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, height: 54 },
  fabText: { color: INK, fontSize: 15.5, fontWeight: '900' },
  input: { borderRadius: 16, padding: 14, minHeight: 130, fontSize: 16, lineHeight: 22, textAlignVertical: 'top' },
  counter: { fontSize: 12, textAlign: 'right', marginTop: 6 },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  anonTitle: { fontSize: 15, fontWeight: '900' },
  anonDesc: { fontSize: 12.5, marginTop: 1 },
  submit: { flexDirection: 'row', gap: 8, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitText: { color: INK, fontSize: 16, fontWeight: '900' },
});
