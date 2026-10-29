import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Lock, MessageSquare, ShieldCheck, Users } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable, outline } from '../../../core/components/ui';
import type { CommunityGroup } from '../api/types';
import { initials } from './Avatar';

const INK = '#1C1A17';

export function GroupCard({ group, onPress, onJoin, joining }: {
  group: CommunityGroup;
  onPress: () => void;
  onJoin?: () => void;
  joining?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <BrutalPressable onPress={onPress} radius={22} style={styles.card}>
      <View style={[styles.icon, outline(colors), { backgroundColor: group.tint }]}>
        <Text style={styles.iconText}>{initials(group.name)}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
          {group.is_private ? <Lock color={colors.textMuted} size={14} strokeWidth={2.6} /> : null}
          {group.my_role === 'admin' ? <ShieldCheck color={colors.textMuted} size={14} strokeWidth={2.6} /> : null}
        </View>
        {group.description ? (
          <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>{group.description}</Text>
        ) : null}
        <View style={styles.stats}>
          <Users color={colors.textMuted} size={13} strokeWidth={2.4} />
          <Text style={[styles.stat, { color: colors.textMuted }]}>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</Text>
          <MessageSquare color={colors.textMuted} size={13} strokeWidth={2.4} />
          <Text style={[styles.stat, { color: colors.textMuted }]}>{group.post_count} posts</Text>
        </View>
      </View>
      {!group.is_member && onJoin ? (
        <BrutalPressable onPress={onJoin} disabled={joining} fill={group.tint} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.join}>
          <Text style={styles.joinText}>{joining ? '…' : 'Join'}</Text>
        </BrutalPressable>
      ) : (
        <ChevronRight color={colors.textMuted} size={20} strokeWidth={2.4} />
      )}
    </BrutalPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12 },
  icon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: INK, fontSize: 17, fontWeight: '900' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '900' },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  stat: { fontSize: 12, fontWeight: '700', marginRight: 8 },
  join: { paddingHorizontal: 14, height: 36, alignItems: 'center', justifyContent: 'center' },
  joinText: { color: INK, fontSize: 13.5, fontWeight: '900' },
});
