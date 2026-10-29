// Group Khatam: split the 30 Juz among friends and family and finish the Quran together.
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookOpenCheck, CalendarDays, CheckCircle2, KeyRound, Plus, RotateCcw, Users } from 'lucide-react-native';
import type { RootStackParamList } from '../../../../core/navigation/RootNavigator';
import { useAuth } from '../../../../core/hooks/useAuth';
import { useAppTheme } from '../../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../../core/theme/palettes';
import { BrutalPressable, Card, PressableScale, haptic, outline } from '../../../../core/components/ui';
import { createKhatam, fetchMyKhatams, joinKhatam } from '../../api/khatam';
import type { KhatamGroup } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { KhatamProgress, khatamStats } from '../../components/KhatamProgress';
import { Sheet } from '../../components/Sheet';
import { useCommunityGate } from '../../hooks/useCommunityGate';
import { checkContent } from '../../utils/contentFilter';
import type { SectionProps } from './types';

const INK = '#1C1A17';

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const TARGETS: { key: string; label: string; date: () => string | null }[] = [
  { key: 'none', label: 'No deadline', date: () => null },
  { key: '7', label: 'In 7 days', date: () => addDays(7) },
  { key: '30', label: 'In 30 days', date: () => addDays(30) },
  { key: 'jumuah', label: 'By next Friday', date: () => addDays(((5 - new Date().getDay() + 7) % 7) || 7) },
];

export const formatTarget = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function KhatamCard({ group, index, onPress }: { group: KhatamGroup; index: number; onPress: () => void }) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { claimed } = khatamStats(group.juz);
  const mine = group.juz.filter((j) => j.user_id === user?.id);
  const done = !!group.completed_at;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(380)}>
      <BrutalPressable onPress={onPress} radius={22} fill={done ? colors.primarySoft : colors.surface} style={styles.card}>
        <KhatamProgress juz={group.juz} size={70} />
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
          {done ? (
            <View style={[styles.donePill, outline(colors), { backgroundColor: colors.success }]}>
              <CheckCircle2 color={INK} size={13} strokeWidth={2.8} />
              <Text style={styles.donePillText}>Completed ✓</Text>
            </View>
          ) : (
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {claimed}/30 Juz claimed{mine.length ? ` · You: Juz ${mine.map((j) => j.juz).join(', ')}` : ''}
            </Text>
          )}
          <View style={styles.cardFoot}>
            <View style={styles.avatars}>
              {group.members.slice(0, 5).map((m, i) => (
                <View key={m.user_id} style={[styles.avatarStack, { marginLeft: i ? -10 : 0 }]}>
                  <Avatar name={m.username} color={m.avatar_color} size={26} />
                </View>
              ))}
              {group.members.length > 5 ? <Text style={[styles.more, { color: colors.textMuted }]}>+{group.members.length - 5}</Text> : null}
            </View>
            {group.target_date ? (
              <View style={styles.target}>
                <CalendarDays color={colors.textMuted} size={13} />
                <Text style={[styles.targetText, { color: colors.textMuted }]}>{formatTarget(group.target_date)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </BrutalPressable>
    </Animated.View>
  );
}

export function KhatamSection({ header, bottomInset }: SectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const gate = useCommunityGate();

  const [groups, setGroups] = useState<KhatamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('none');
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!user) { setLoading(false); return; }
    if (refresh) setRefreshing(true);
    try {
      setGroups(await fetchMyKhatams());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load your khatams.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refresh whenever we come back from a group screen
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = async () => {
    if (await gate.ensureCanPost()) setCreateOpen(true);
  };

  const create = async () => {
    const check = checkContent(name, { min: 3, max: 60 });
    if (!check.ok) { Alert.alert('Name', check.reason); return; }
    setBusy(true);
    try {
      const id = await createKhatam(name, TARGETS.find((t) => t.key === target)?.date() ?? null);
      haptic.success();
      setCreateOpen(false);
      setName('');
      setTarget('none');
      navigation.navigate('KhatamGroup', { id });
    } catch (e: any) {
      Alert.alert('Could not create', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) { Alert.alert('Invite code', 'Codes are 6 letters and numbers.'); return; }
    setBusy(true);
    try {
      const id = await joinKhatam(c);
      haptic.success();
      setJoinOpen(false);
      setCode('');
      navigation.navigate('KhatamGroup', { id });
    } catch (e: any) {
      Alert.alert('Could not join', /invalid invite/i.test(e?.message ?? '') ? 'That code was not found. Please check it and try again.' : e?.message);
    } finally {
      setBusy(false);
    }
  };

  const listHeader = (
    <View>
      {header}
      <View style={styles.body}>
        <View style={styles.actions}>
          <BrutalPressable fill={tints.teal} radius={18} style={styles.action} onPress={openCreate}>
            <Plus color={INK} size={18} strokeWidth={3} />
            <Text style={styles.actionText}>Start a Khatam</Text>
          </BrutalPressable>
          <BrutalPressable fill={colors.surface} radius={18} style={styles.action} onPress={() => setJoinOpen(true)}>
            <KeyRound color={colors.text} size={17} strokeWidth={2.6} />
            <Text style={[styles.actionText, { color: colors.text }]}>Join with code</Text>
          </BrutalPressable>
        </View>
        {groups.length > 0 ? <Text style={[styles.sectionTitle, { color: colors.text }]}>My khatams</Text> : null}
      </View>
    </View>
  );

  const empty = loading ? (
    <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  ) : error ? (
    <View style={styles.center}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load your khatams</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
      <BrutalPressable fill={colors.surface} style={styles.retry} onPress={() => load()}>
        <RotateCcw color={colors.text} size={16} strokeWidth={2.6} />
        <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
      </BrutalPressable>
    </View>
  ) : (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.itemPad}>
      <Card style={styles.explainer}>
        <View style={[styles.explainerIcon, outline(colors, brutal.border), { backgroundColor: tints.teal }]}>
          <BookOpenCheck color={INK} size={34} strokeWidth={2.2} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Finish the Quran together</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Split the 30 Juz among friends and family and finish the whole Quran together.
        </Text>
        {[
          { Icon: Plus, text: 'Start a khatam and share the invite code' },
          { Icon: Users, text: 'Everyone claims a Juz to read' },
          { Icon: CheckCircle2, text: 'Mark it done — watch the ring fill up' },
        ].map(({ Icon, text }) => (
          <View key={text} style={styles.step}>
            <View style={[styles.stepIcon, outline(colors), { backgroundColor: colors.accentSoft }]}>
              <Icon color={colors.text} size={15} strokeWidth={2.6} />
            </View>
            <Text style={[styles.stepText, { color: colors.text }]}>{text}</Text>
          </View>
        ))}
      </Card>
    </Animated.View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={loading || error ? [] : groups}
        keyExtractor={(g) => g.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        renderItem={({ item, index }) => (
          <View style={styles.itemPad}>
            <KhatamCard group={item} index={index} onPress={() => navigation.navigate('KhatamGroup', { id: item.id })} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
      />

      <Sheet visible={createOpen} onClose={() => setCreateOpen(false)} title="Start a Khatam" subtitle="You can invite others with a code">
        <TextInput
          style={[styles.input, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
          placeholder="e.g. Family Ramadan Khatam"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={60}
          autoFocus
        />
        <Text style={[styles.label, { color: colors.textMuted }]}>TARGET</Text>
        <View style={styles.chips}>
          {TARGETS.map((t) => {
            const on = t.key === target;
            return (
              <PressableScale
                key={t.key}
                onPress={() => setTarget(t.key)}
                style={[styles.chip, outline(colors), { backgroundColor: on ? tints.teal : colors.surface }]}
              >
                <Text style={[styles.chipText, { color: on ? INK : colors.text }]}>{t.label}</Text>
              </PressableScale>
            );
          })}
        </View>
        <BrutalPressable fill={tints.teal} disabled={busy} style={styles.submit} onPress={create}>
          <BookOpenCheck color={INK} size={18} strokeWidth={2.5} />
          <Text style={styles.submitText}>{busy ? 'Creating…' : 'Create khatam'}</Text>
        </BrutalPressable>
      </Sheet>

      <Sheet visible={joinOpen} onClose={() => setJoinOpen(false)} title="Join a Khatam" subtitle="Ask the organiser for their 6-character code">
        <TextInput
          style={[styles.input, styles.codeInput, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
          placeholder="ABC123"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
        />
        <BrutalPressable fill={code.length === 6 ? colors.primary : colors.surfaceAlt} disabled={busy} style={styles.submit} onPress={join}>
          <KeyRound color={colors.onPrimary} size={18} strokeWidth={2.5} />
          <Text style={[styles.submitText, { color: colors.onPrimary }]}>{busy ? 'Joining…' : 'Join'}</Text>
        </BrutalPressable>
      </Sheet>
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 12 },
  itemPad: { paddingHorizontal: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, flexDirection: 'row', gap: 7, height: 52, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: INK, fontSize: 14.5, fontWeight: '900' },
  sectionTitle: { fontSize: 19, fontWeight: '900', marginTop: 22, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardMeta: { fontSize: 13, marginTop: 3, fontWeight: '600' },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, height: 24, borderRadius: 12, marginTop: 4 },
  donePillText: { color: INK, fontSize: 12, fontWeight: '900' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatarStack: { borderRadius: 10 },
  more: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  target: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  targetText: { fontSize: 12, fontWeight: '700' },
  center: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30, gap: 8 },
  emptyTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: { fontSize: 14.5, lineHeight: 21, textAlign: 'center' },
  retry: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, height: 44, alignItems: 'center', marginTop: 8 },
  retryText: { fontSize: 14.5, fontWeight: '900' },
  explainer: { alignItems: 'center', gap: 10, marginTop: 20, borderRadius: 24, padding: 22 },
  explainerIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 4 },
  stepIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, fontSize: 14, fontWeight: '700' },
  input: { borderRadius: 16, paddingHorizontal: 14, height: 52, fontSize: 16 },
  codeInput: { fontSize: 24, fontWeight: '900', letterSpacing: 6, textAlign: 'center', height: 64 },
  label: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.1, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, height: 36, borderRadius: 18, justifyContent: 'center' },
  chipText: { fontSize: 13.5, fontWeight: '800' },
  submit: { flexDirection: 'row', gap: 8, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  submitText: { color: INK, fontSize: 16, fontWeight: '900' },
});
