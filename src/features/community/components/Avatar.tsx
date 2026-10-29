import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { tints } from '../../../core/theme/palettes';
import type { Role } from '../api/types';

const INK = '#1C1A17';

export const initials = (name?: string | null) =>
  (name || '?').split(/[\s_.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

/** Ink-outlined initials avatar. `anonymous` shows a neutral hands emoji instead. */
export function Avatar({ name, color, size = 40, anonymous }: { name?: string | null; color?: string | null; size?: number; anonymous?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.36, backgroundColor: anonymous ? colors.surfaceAlt : color || tints.green, borderColor: colors.ink }]}>
      <Text style={[styles.text, { fontSize: size * 0.36, color: anonymous ? colors.text : INK }]}>{anonymous ? '🤲' : initials(name)}</Text>
    </View>
  );
}

/** Small "Scholar" / "Admin" badge shown next to a name. */
export function RoleBadge({ role }: { role?: Role | null }) {
  const { colors } = useAppTheme();
  if (role !== 'scholar' && role !== 'admin') return null;
  const scholar = role === 'scholar';
  const Icon = scholar ? BadgeCheck : ShieldCheck;
  return (
    <View style={[styles.badge, { backgroundColor: scholar ? tints.gold : tints.blue, borderColor: colors.ink }]}>
      <Icon color={INK} size={11} strokeWidth={2.8} />
      <Text style={styles.badgeText}>{scholar ? 'Scholar' : 'Admin'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  text: { fontWeight: '900' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, height: 19, borderRadius: 10, borderWidth: 1.5 },
  badgeText: { color: INK, fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
});
