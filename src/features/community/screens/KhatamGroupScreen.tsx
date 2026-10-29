// One group khatam: claim a Juz, read it, mark it done, and watch the whole Quran get finished
// together (live via Supabase Realtime).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { BookOpen, Check, CheckCircle2, Crown, LogOut, RotateCcw, Share2, Trash2, Undo2, X } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, Card, PressableScale, ProgressBar, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { awardXp } from '../../../core/services/progress';
import { supabase, channelName } from '../api/client';
import { claimJuz, completeJuz, deleteKhatam, fetchKhatam, leaveKhatam } from '../api/khatam';
import type { KhatamGroup, KhatamJuz } from '../api/types';
import { Avatar, initials } from '../components/Avatar';
import { KhatamProgress, khatamStats } from '../components/KhatamProgress';
import { Sheet } from '../components/Sheet';
import { formatTarget } from './sections/KhatamSection';

const INK = '#1C1A17';
const GUTTER = 18;
const COLS = 5;
const JUZ_XP = 30;

export function KhatamGroupScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'KhatamGroup'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const id = route.params.id;

  const [group, setGroup] = useState<KhatamGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const busy = useRef(new Set<number>());

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const g = await fetchKhatam(id);
      setGroup(g);
      setError(g ? null : 'This khatam was not found, or you are no longer a member.');
    } catch (e: any) {
      setError(e?.message ?? 'Could not load this khatam.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Live: refetch whenever anyone claims or completes a Juz in this group
  useEffect(() => {
    const channel = supabase
      .channel(channelName(`khatam-${id}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'khatam_juz', filter: `group_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, load]);

  const memberName = (uid: string | null) => group?.members.find((m) => m.user_id === uid)?.username ?? 'Member';
  const memberColor = (uid: string | null) => group?.members.find((m) => m.user_id === uid)?.avatar_color ?? tints.teal;

  /** Optimistically patch one Juz, run the request, and roll back if it fails. */
  const mutate = async (juz: number, next: Partial<KhatamJuz>, run: () => Promise<void>) => {
    if (!group || busy.current.has(juz)) return false;
    busy.current.add(juz);
    const before = group;
    setGroup({ ...group, juz: group.juz.map((j) => (j.juz === juz ? { ...j, ...next } : j)) });
    try {
      await run();
      return true;
    } catch (e: any) {
      setGroup(before);
      Alert.alert('Could not update', e?.message ?? 'Someone may have just claimed it. Please try again.');
      load();
      return false;
    } finally {
      busy.current.delete(juz);
    }
  };

  const onCell = (j: KhatamJuz) => {
    if (!user) return;
    if (!j.user_id) {
      haptic.success();
      mutate(j.juz, { user_id: user.id, completed: false }, () => claimJuz(id, j.juz, true));
      return;
    }
    if (j.user_id === user.id) {
      haptic.select();
      setSelected(j.juz);
      return;
    }
    haptic.light();
    Alert.alert(`Juz ${j.juz}`, `${memberName(j.user_id)} ${j.completed ? 'has finished this Juz. MashaAllah!' : 'is reading this Juz.'}`);
  };

  const sel = group?.juz.find((j) => j.juz === selected) ?? null;

  const markDone = async (done: boolean) => {
    if (!sel) return;
    const juz = sel.juz;
    setSelected(null);
    const ok = await mutate(juz, { completed: done }, () => completeJuz(id, juz, done));
    if (ok && done) {
      haptic.success();
      // XP once per Juz per group, so undo + re-complete can't farm it
      const key = `khatam_xp_${id}_${juz}`;
      AsyncStorage.getItem(key).then((given) => {
        if (given) return;
        AsyncStorage.setItem(key, '1');
        awardXp(JUZ_XP, 'khatam_juz').catch(() => {});
      }).catch(() => {});
    }
  };

  const release = () => {
    if (!sel) return;
    const juz = sel.juz;
    setSelected(null);
    mutate(juz, { user_id: null, completed: false }, () => claimJuz(id, juz, false));
  };

  const read = () => {
    if (!sel) return;
    const juz = sel.juz;
    setSelected(null);
    navigation.navigate('QuranReading', { juzNumber: juz, juzName: `Juz ${juz}` });
  };

  const share = () => {
    if (!group) return;
    Share.share({ message: `Join my Quran Khatam "${group.name}" on Ummati with code ${group.invite_code}. Let's finish the whole Quran together, insha'Allah!` });
  };

  const leave = () => {
    Alert.alert('Leave this khatam?', 'Your unfinished Juz will be released for others to read.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          try { await leaveKhatam(id); navigation.goBack(); } catch (e: any) { Alert.alert('Could not leave', e?.message); }
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Delete this khatam?', 'It will be removed for every member. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteKhatam(id); navigation.goBack(); } catch (e: any) { Alert.alert('Could not delete', e?.message); }
        },
      },
    ]);
  };

  if (loading || !group) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Group Khatam" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          {loading ? <ActivityIndicator color={colors.primary} /> : (
            <>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
              <BrutalPressable fill={colors.surface} style={styles.retry} onPress={() => { setLoading(true); load(); }}>
                <RotateCcw color={colors.text} size={16} strokeWidth={2.6} />
                <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
              </BrutalPressable>
            </>
          )}
        </View>
      </View>
    );
  }

  const { completed, claimed } = khatamStats(group.juz);
  const isCreator = group.created_by === user?.id;
  const myJuz = group.juz.filter((j) => j.user_id === user?.id);
  const cell = (width - GUTTER * 2 - (COLS - 1) * 10) / COLS;
  const done = !!group.completed_at;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={group.name}
          subtitle={group.target_date ? `Target: ${formatTarget(group.target_date)}` : 'Group Khatam'}
          onBack={() => navigation.goBack()}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <BrutalBox fill={colors.glass} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.hero}>
              <KhatamProgress juz={group.juz} size={92} />
              <View style={styles.flex}>
                <Text style={[styles.heroBig, { color: colors.text }]}>{completed} of 30 Juz read</Text>
                <Text style={[styles.heroSub, { color: colors.textSecondary }]}>{claimed} claimed · {group.members.length} {group.members.length === 1 ? 'member' : 'members'}</Text>
                <View style={styles.progressWrap}>
                  <ProgressBar value={completed / 30} color={colors.primary} track={colors.surfaceAlt} />
                </View>
              </View>
            </BrutalBox>
          </Animated.View>
        </ScreenHeader>

        <View style={styles.body}>
          {done ? (
            <Animated.View entering={ZoomIn.duration(450)}>
              <BrutalBox fill={tints.gold} radius={22} style={styles.celebrate}>
                <Text style={styles.celebrateEmoji}>🎉</Text>
                <Text style={styles.celebrateTitle}>MashaAllah! Khatam complete</Text>
                <Text style={styles.celebrateText}>
                  Together you finished the whole Quran. May Allah accept it from all of you.
                </Text>
                <View style={[styles.duaBox, outline({ ink: INK }), { backgroundColor: '#FFFAF1' }]}>
                  <Text style={styles.duaArabic}>اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً</Text>
                  <Text style={styles.duaText}>“O Allah, have mercy on me through the Quran, and make it for me a guide, a light, a guidance and a mercy.”</Text>
                </View>
              </BrutalBox>
            </Animated.View>
          ) : null}

          {/* Invite */}
          <Card style={styles.invite}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: colors.textMuted }]}>INVITE CODE</Text>
              <Text style={[styles.code, { color: colors.text }]}>{group.invite_code}</Text>
            </View>
            <BrutalPressable fill={tints.teal} radius={16} offset={brutal.shadowSmall} style={styles.shareBtn} onPress={share}>
              <Share2 color={INK} size={17} strokeWidth={2.6} />
              <Text style={styles.shareText}>Share</Text>
            </BrutalPressable>
          </Card>

          {myJuz.length === 0 && !done ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>Tap any free Juz below to claim it for yourself.</Text>
          ) : null}

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { c: colors.surface, t: 'Free' },
              { c: tints.gold, t: 'Mine' },
              { c: colors.accentSoft, t: 'Claimed' },
              { c: colors.success, t: 'Done' },
            ].map((l) => (
              <View key={l.t} style={styles.legendItem}>
                <View style={[styles.legendDot, outline(colors, 1.5), { backgroundColor: l.c }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{l.t}</Text>
              </View>
            ))}
          </View>

          {/* 30 Juz grid */}
          <View style={styles.grid}>
            {group.juz.map((j, i) => {
              const mine = j.user_id === user?.id;
              const fill = j.completed ? colors.success : mine ? tints.gold : j.user_id ? colors.accentSoft : colors.surface;
              return (
                <Animated.View key={j.juz} entering={FadeInDown.delay(Math.min(i * 15, 400)).duration(300)}>
                  <BrutalPressable
                    hapticOnPress={false}
                    onPress={() => onCell(j)}
                    fill={fill}
                    radius={14}
                    offset={mine ? brutal.shadow : brutal.shadowSmall}
                    borderWidth={mine ? brutal.border : brutal.borderThin}
                    style={{ width: cell, height: cell * 1.05 }}
                  >
                    <View style={styles.cellInner}>
                      <Text style={[styles.cellNum, { color: j.completed || j.user_id ? INK : colors.text }]}>{j.juz}</Text>
                      {j.user_id ? (
                        <View style={styles.cellWho}>
                          {j.completed ? <Check color={INK} size={12} strokeWidth={3.2} /> : null}
                          <Text style={styles.cellInitials} numberOfLines={1}>{mine ? 'You' : initials(memberName(j.user_id))}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.cellFree, { color: colors.textMuted }]}>free</Text>
                      )}
                    </View>
                  </BrutalPressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Members */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Members</Text>
          {group.members.map((m) => {
            const theirs = group.juz.filter((j) => j.user_id === m.user_id);
            const finished = theirs.filter((j) => j.completed).length;
            return (
              <PressableScale key={m.user_id} onPress={() => m.user_id !== user?.id && navigation.navigate('UserProfile', { userId: m.user_id })}>
                <Card style={styles.member}>
                  <Avatar name={m.username} color={m.avatar_color ?? memberColor(m.user_id)} size={40} />
                  <View style={styles.flex}>
                    <View style={styles.memberRow}>
                      <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>{m.user_id === user?.id ? 'You' : m.username}</Text>
                      {m.user_id === group.created_by ? <Crown color={colors.accent} size={15} strokeWidth={2.6} /> : null}
                    </View>
                    <Text style={[styles.memberMeta, { color: colors.textMuted }]}>
                      {theirs.length ? `Juz ${theirs.map((j) => j.juz).join(', ')} · ${finished}/${theirs.length} done` : 'No Juz claimed yet'}
                    </Text>
                  </View>
                </Card>
              </PressableScale>
            );
          })}

          <View style={styles.danger}>
            <BrutalPressable fill={colors.surface} style={styles.dangerBtn} onPress={leave}>
              <LogOut color={colors.text} size={17} strokeWidth={2.6} />
              <Text style={[styles.dangerText, { color: colors.text }]}>Leave</Text>
            </BrutalPressable>
            {isCreator ? (
              <BrutalPressable fill={colors.danger} style={styles.dangerBtn} onPress={remove}>
                <Trash2 color={INK} size={17} strokeWidth={2.6} />
                <Text style={[styles.dangerText, { color: INK }]}>Delete</Text>
              </BrutalPressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Sheet
        visible={!!sel}
        onClose={() => setSelected(null)}
        title={sel ? `Juz ${sel.juz}` : ''}
        subtitle={sel?.completed ? 'You finished this Juz — MashaAllah!' : 'Claimed by you'}
      >
        <View style={styles.sheetList}>
          <BrutalPressable fill={colors.primary} style={styles.sheetBtn} onPress={read}>
            <BookOpen color={colors.onPrimary} size={19} strokeWidth={2.5} />
            <Text style={[styles.sheetBtnText, { color: colors.onPrimary }]}>Read Juz {sel?.juz}</Text>
          </BrutalPressable>
          {sel?.completed ? (
            <BrutalPressable fill={colors.surface} style={styles.sheetBtn} onPress={() => markDone(false)}>
              <Undo2 color={colors.text} size={19} strokeWidth={2.5} />
              <Text style={[styles.sheetBtnText, { color: colors.text }]}>Undo — not finished yet</Text>
            </BrutalPressable>
          ) : (
            <>
              <BrutalPressable fill={colors.success} style={styles.sheetBtn} onPress={() => markDone(true)}>
                <CheckCircle2 color={INK} size={19} strokeWidth={2.5} />
                <Text style={[styles.sheetBtnText, { color: INK }]}>Mark as completed · +{JUZ_XP} XP</Text>
              </BrutalPressable>
              <BrutalPressable fill={colors.surface} style={styles.sheetBtn} onPress={release}>
                <X color={colors.text} size={19} strokeWidth={2.5} />
                <Text style={[styles.sheetBtnText, { color: colors.text }]}>Release this Juz</Text>
              </BrutalPressable>
            </>
          )}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 },
  errorText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retry: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, height: 44, alignItems: 'center' },
  retryText: { fontSize: 14.5, fontWeight: '900' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, marginTop: 16 },
  heroBig: { fontSize: 18, fontWeight: '900' },
  heroSub: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  progressWrap: { marginTop: 10 },
  body: { paddingHorizontal: GUTTER, paddingTop: 20 },
  celebrate: { padding: 20, alignItems: 'center', gap: 8, marginBottom: 18 },
  celebrateEmoji: { fontSize: 40 },
  celebrateTitle: { color: INK, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  celebrateText: { color: INK, fontSize: 14.5, lineHeight: 21, textAlign: 'center', fontWeight: '600' },
  duaBox: { borderRadius: 14, padding: 14, marginTop: 6, gap: 8 },
  duaArabic: { color: INK, fontSize: 20, lineHeight: 34, textAlign: 'center', writingDirection: 'rtl' },
  duaText: { color: INK, fontSize: 13.5, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  code: { fontSize: 26, fontWeight: '900', letterSpacing: 5, marginTop: 2 },
  shareBtn: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, height: 46, alignItems: 'center' },
  shareText: { color: INK, fontSize: 14.5, fontWeight: '900' },
  hint: { fontSize: 14, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 18, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 14, height: 14, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cellInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  cellNum: { fontSize: 20, fontWeight: '900' },
  cellWho: { flexDirection: 'row', alignItems: 'center', gap: 2, maxWidth: '90%' },
  cellInitials: { color: INK, fontSize: 10.5, fontWeight: '900' },
  cellFree: { fontSize: 10, fontWeight: '700' },
  sectionTitle: { fontSize: 19, fontWeight: '900', marginTop: 26, marginBottom: 12 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, marginBottom: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 15, fontWeight: '900', flexShrink: 1 },
  memberMeta: { fontSize: 12.5, marginTop: 2 },
  danger: { flexDirection: 'row', gap: 12, marginTop: 18 },
  dangerBtn: { flex: 1, flexDirection: 'row', gap: 6, height: 50, alignItems: 'center', justifyContent: 'center' },
  dangerText: { fontSize: 15, fontWeight: '900' },
  sheetList: { gap: 10, marginBottom: 6 },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 56 },
  sheetBtnText: { fontSize: 15.5, fontWeight: '900' },
});
