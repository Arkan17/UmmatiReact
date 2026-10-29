// Admin review queue: reported posts, comments, duas and events grouped by target.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ban, Check, Eye, EyeOff, Info, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, Card, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { blockUser, fetchOpenReports, moderate } from '../api/moderation';
import type { OpenReport, ReportReason, ReportTarget } from '../api/types';
import { useMyRole } from '../hooks/useCommunityGate';
import { timeAgo } from '../utils/time';

const INK = '#1C1A17';

const TYPE_META: Record<ReportTarget, { label: string; tint: string }> = {
  post: { label: 'Post', tint: tints.green },
  comment: { label: 'Comment', tint: tints.blue },
  dua: { label: 'Dua', tint: tints.rose },
  event: { label: 'Event', tint: tints.violet },
};

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  offensive: 'Offensive',
  misinformation: 'Wrong info',
  harassment: 'Harassment',
  other: 'Other',
};

type Action = 'hide' | 'restore' | 'delete' | 'dismiss';

function ActionBtn({ label, Icon, fill, onPress }: { label: string; Icon: typeof Eye; fill: string; onPress: () => void }) {
  return (
    <BrutalPressable fill={fill} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} radius={12} style={styles.action} onPress={onPress}>
      <Icon color={INK} size={15} strokeWidth={2.5} />
      <Text style={styles.actionText}>{label}</Text>
    </BrutalPressable>
  );
}

export function ModerationScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const role = useMyRole();
  const [reports, setReports] = useState<OpenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setReports(await fetchOpenReports());
    } catch (e) {
      console.warn('[moderation] load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') load();
    else setLoading(false);
  }, [role, load]);

  const act = async (r: OpenReport, action: Action) => {
    try {
      await moderate(r.target_type, r.target_id, action);
      haptic.success();
      // Every action resolves the reports, so the card leaves the queue
      setReports((prev) => prev.filter((x) => !(x.target_type === r.target_type && x.target_id === r.target_id)));
    } catch (e: any) {
      Alert.alert('Action failed', e?.message ?? 'Please try again.');
    }
  };

  const confirmDelete = (r: OpenReport) => {
    Alert.alert('Delete permanently?', `This ${TYPE_META[r.target_type].label.toLowerCase()} will be removed for everyone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => act(r, 'delete') },
    ]);
  };

  const confirmBlock = (r: OpenReport) => {
    if (!r.author_id) return;
    Alert.alert(`Block ${r.author_name ?? 'this user'}?`, 'This only hides their content from YOUR account. To remove content for everyone, use Hide or Delete.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(r.author_id!);
            haptic.success();
          } catch (e: any) {
            Alert.alert('Could not block', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const helpCard = (
    <Card style={styles.help}>
      <View style={styles.helpHead}>
        <Info color={colors.text} size={16} strokeWidth={2.5} />
        <Text style={[styles.helpTitle, { color: colors.text }]}>Make someone a scholar or admin</Text>
      </View>
      <Text style={[styles.helpBody, { color: colors.textSecondary }]}>
        Run this in Supabase → SQL Editor (use 'admin' for moderators, 'member' to remove a role):
      </Text>
      <View style={[styles.code, outline(colors), { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.codeText, { color: colors.text }]} selectable>
          update public.profiles set role = 'scholar' where username = '...';
        </Text>
      </View>
    </Card>
  );

  if (role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Moderation" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <BrutalBox fill={colors.accentSoft} radius={24} style={styles.emptyIcon}>
            <ShieldAlert color={colors.text} size={30} strokeWidth={2.4} />
          </BrutalBox>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Admins only</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>This area is for community moderators.</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item: r, index }: { item: OpenReport; index: number }) => {
    const meta = TYPE_META[r.target_type];
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 300)).duration(320)}>
        <Card style={styles.card}>
          <View style={styles.cardHead}>
            <View style={[styles.pill, outline({ ink: INK }), { backgroundColor: meta.tint }]}>
              <Text style={styles.pillText}>{meta.label.toUpperCase()}</Text>
            </View>
            <View style={[styles.pill, outline({ ink: INK }), { backgroundColor: colors.danger }]}>
              <Text style={styles.pillText}>{r.report_count} {r.report_count === 1 ? 'REPORT' : 'REPORTS'}</Text>
            </View>
            <View style={styles.flex} />
            <View style={[styles.pill, outline({ ink: INK }), { backgroundColor: r.is_hidden ? colors.surfaceAlt : tints.green }]}>
              {r.is_hidden ? <EyeOff color={INK} size={12} strokeWidth={2.6} /> : <Eye color={INK} size={12} strokeWidth={2.6} />}
              <Text style={styles.pillText}>{r.is_hidden ? 'HIDDEN' : 'VISIBLE'}</Text>
            </View>
          </View>

          <View style={styles.reasons}>
            {r.reasons.map((reason) => (
              <View key={reason} style={[styles.reason, outline(colors, 1.5), { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.reasonText, { color: colors.text }]}>{REASON_LABELS[reason] ?? reason}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.preview, outline(colors, 1.5), { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={6}>
              {r.preview ?? '(content already removed)'}
            </Text>
          </View>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            by {r.author_name ?? 'unknown'} · last reported {timeAgo(r.last_reported_at)}
          </Text>

          {r.details.length ? (
            <View style={styles.details}>
              {r.details.map((d, i) => (
                <Text key={i} style={[styles.detail, { color: colors.textSecondary }]}>• “{d}”</Text>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            {r.is_hidden
              ? <ActionBtn label="Restore" Icon={Eye} fill={tints.green} onPress={() => act(r, 'restore')} />
              : <ActionBtn label="Hide" Icon={EyeOff} fill={tints.gold} onPress={() => act(r, 'hide')} />}
            <ActionBtn label="Delete" Icon={Trash2} fill={colors.danger} onPress={() => confirmDelete(r)} />
            <ActionBtn label="Dismiss" Icon={Check} fill={colors.surface} onPress={() => act(r, 'dismiss')} />
            {r.author_id ? <ActionBtn label="Block author" Icon={Ban} fill={colors.surfaceAlt} onPress={() => confirmBlock(r)} /> : null}
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Moderation" subtitle={`${reports.length} open ${reports.length === 1 ? 'report' : 'reports'}`} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => `${r.target_type}-${r.target_id}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
              <BrutalBox fill={tints.green} radius={24} style={styles.emptyIcon}>
                <ShieldCheck color={INK} size={30} strokeWidth={2.4} />
              </BrutalBox>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All clear ✨</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No open reports. Pull down to refresh.</Text>
            </Animated.View>
          }
          ListFooterComponent={helpCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 18, paddingTop: 18 },
  card: { padding: 14, marginBottom: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 12 },
  pillText: { color: INK, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.6 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  reason: { paddingHorizontal: 9, height: 24, borderRadius: 12, justifyContent: 'center' },
  reasonText: { fontSize: 12, fontWeight: '800' },
  preview: { borderRadius: 12, padding: 12, marginTop: 10 },
  previewText: { fontSize: 14.5, lineHeight: 21 },
  meta: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  details: { marginTop: 6, gap: 2 },
  detail: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 36 },
  actionText: { color: INK, fontSize: 13, fontWeight: '900' },
  help: { padding: 14, marginTop: 10 },
  helpHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpTitle: { fontSize: 14.5, fontWeight: '900' },
  helpBody: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  code: { borderRadius: 10, padding: 10, marginTop: 8 },
  codeText: { fontSize: 12.5, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '900', marginTop: 16 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
});
