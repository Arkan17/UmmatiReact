// Groups: "My groups" first, then public groups to discover. Create a group or join by invite code.
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyRound, Plus, RefreshCw, Search, Users, X } from 'lucide-react-native';
import type { RootStackParamList } from '../../../../core/navigation/RootNavigator';
import { useAuth } from '../../../../core/hooks/useAuth';
import { useAppTheme } from '../../../../core/theme/ThemeProvider';
import { tints } from '../../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, PressableScale, haptic, outline } from '../../../../core/components/ui';
import { fetchGroups, joinGroup } from '../../api/groups';
import type { CommunityGroup } from '../../api/types';
import { GroupCard } from '../../components/GroupCard';
import { GroupCreateSheet, GroupJoinSheet } from '../../components/GroupSheets';
import { useCommunityGate } from '../../hooks/useCommunityGate';
import type { SectionProps } from './types';

const INK = '#1C1A17';

type Row = { type: 'title'; key: string; label: string; count: number } | { type: 'group'; key: string; group: CommunityGroup } | { type: 'hint'; key: string; text: string };

export function GroupsSection({ header, bottomInset }: SectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const gate = useCommunityGate();

  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joiningByCode, setJoiningByCode] = useState(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    setError(null);
    try {
      setGroups(await fetchGroups());
    } catch (e: any) {
      setError(e?.message ?? 'Could not load groups.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Also refreshes after leaving a group in GroupDetail
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (id: string) => navigation.navigate('GroupDetail', { id });

  const join = async (g: CommunityGroup) => {
    if (!user) { navigation.navigate('Auth', { mode: 'signin' }); return; }
    setJoiningId(g.id);
    try {
      await joinGroup({ groupId: g.id });
      haptic.success();
      setGroups((list) => list.map((x) => (x.id === g.id ? { ...x, is_member: true, my_role: 'member', member_count: x.member_count + 1 } : x)));
      open(g.id);
    } catch (e: any) {
      Alert.alert('Could not join', e?.message ?? 'Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  const startCreate = async () => {
    if (await gate.ensureCanPost()) setCreating(true);
  };

  const startJoinByCode = () => {
    if (!user) { navigation.navigate('Auth', { mode: 'signin' }); return; }
    setJoiningByCode(true);
  };

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (g: CommunityGroup) => !q || g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q);
    const mine = groups.filter((g) => g.is_member && match(g));
    const discover = groups.filter((g) => !g.is_member && match(g));
    const out: Row[] = [];
    if (mine.length) {
      out.push({ type: 'title', key: 't-mine', label: 'My groups', count: mine.length });
      mine.forEach((g) => out.push({ type: 'group', key: g.id, group: g }));
    }
    if (discover.length || !q) {
      out.push({ type: 'title', key: 't-discover', label: 'Discover', count: discover.length });
      if (discover.length) discover.forEach((g) => out.push({ type: 'group', key: g.id, group: g }));
      else if (groups.length) out.push({ type: 'hint', key: 'h-joined', text: "You've joined every public group. Create one for your masjid or halaqa!" });
    }
    return out;
  }, [groups, query]);

  const listHeader = (
    <View>
      {header}
      <View style={styles.body}>
        <View style={styles.actions}>
          <BrutalPressable fill={tints.violet} style={styles.action} onPress={startCreate}>
            <Plus color={INK} size={19} strokeWidth={2.8} />
            <Text style={styles.actionText}>Create group</Text>
          </BrutalPressable>
          <BrutalPressable fill={colors.surface} style={styles.action} onPress={startJoinByCode}>
            <KeyRound color={colors.text} size={18} strokeWidth={2.5} />
            <Text style={[styles.actionText, { color: colors.text }]}>Invite code</Text>
          </BrutalPressable>
        </View>
        <View style={[styles.search, outline(colors), { backgroundColor: colors.surface }]}>
          <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search groups"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query ? (
            <PressableScale onPress={() => setQuery('')} hitSlop={10}>
              <X color={colors.textMuted} size={18} />
            </PressableScale>
          ) : null}
        </View>
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
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load groups</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
      <BrutalPressable fill={colors.surface} style={styles.retry} onPress={() => { setLoading(true); load(); }}>
        <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
      </BrutalPressable>
    </Animated.View>
  ) : (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.center}>
      <BrutalBox fill={tints.violet} radius={22} style={styles.emptyIcon}>
        <Users color={INK} size={28} strokeWidth={2.4} />
      </BrutalBox>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{query ? 'No groups found' : 'No groups yet'}</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {query ? 'Try another name, or create the group yourself.' : 'Start one for your masjid, halaqa, study circle or family.'}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={loading || error ? [] : rows.length === 1 && rows[0].type === 'title' && rows[0].count === 0 ? [] : rows}
        keyExtractor={(r) => r.key}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        renderItem={({ item, index }) => {
          if (item.type === 'title') {
            return (
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>{item.label}</Text>
                <View style={[styles.countPill, outline(colors, 1.5), { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.countText, { color: colors.text }]}>{item.count}</Text>
                </View>
              </View>
            );
          }
          if (item.type === 'hint') {
            return <Text style={[styles.hint, { color: colors.textMuted }]}>{item.text}</Text>;
          }
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 320)).duration(350)} style={styles.cardWrap}>
              <GroupCard
                group={item.group}
                onPress={() => open(item.group.id)}
                onJoin={item.group.is_private ? undefined : () => join(item.group)}
                joining={joiningId === item.group.id}
              />
            </Animated.View>
          );
        }}
      />

      <GroupCreateSheet visible={creating} onClose={() => setCreating(false)} onCreated={(id) => { load(); open(id); }} />
      <GroupJoinSheet visible={joiningByCode} onClose={() => setJoiningByCode(false)} onJoined={(id) => { load(); open(id); }} />
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, flexDirection: 'row', gap: 7, height: 50, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: INK, fontSize: 14.5, fontWeight: '900' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 12, height: 48, marginTop: 14 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 20, marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '900', letterSpacing: -0.2 },
  countPill: { paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '900' },
  hint: { fontSize: 13.5, lineHeight: 19, paddingHorizontal: 18 },
  cardWrap: { paddingHorizontal: 18 },
  center: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 36, gap: 10 },
  emptyIcon: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retry: { paddingHorizontal: 20, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  retryText: { fontSize: 14.5, fontWeight: '900' },
});
