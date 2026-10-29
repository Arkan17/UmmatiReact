// Islamic reactions: tap = MashaAllah (or remove mine), long-press = pick one of four.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { PressableScale, haptic, outline } from '../../../core/components/ui';
import type { ReactionKind } from '../api/types';

const INK = '#1C1A17';

export const REACTIONS: { kind: ReactionKind; emoji: string; label: string; tint: string }[] = [
  { kind: 'mashallah', emoji: '✨', label: 'MashaAllah', tint: tints.gold },
  { kind: 'subhanallah', emoji: '🌿', label: 'SubhanAllah', tint: tints.green },
  { kind: 'jazakallah', emoji: '🤝', label: 'JazakAllah Khair', tint: tints.blue },
  { kind: 'ameen', emoji: '🤲', label: 'Ameen', tint: tints.rose },
];
export const reactionMeta = (k: ReactionKind) => REACTIONS.find((r) => r.kind === k) ?? REACTIONS[0];

export function ReactionBar({ reactions, total, mine, onReact }: {
  reactions: Partial<Record<ReactionKind, number>>;
  total: number;
  mine: ReactionKind | null;
  onReact: (kind: ReactionKind | null) => void;
}) {
  const { colors } = useAppTheme();
  const [picking, setPicking] = useState(false);
  const scale = useSharedValue(1);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const choose = (kind: ReactionKind | null) => {
    setPicking(false);
    if (kind) {
      haptic.medium();
      scale.value = withSequence(withSpring(1.25, { damping: 5, stiffness: 400 }), withSpring(1, { damping: 8 }));
    } else {
      haptic.light();
    }
    onReact(kind);
  };

  const top = REACTIONS.filter((r) => (reactions[r.kind] ?? 0) > 0)
    .sort((a, b) => (reactions[b.kind] ?? 0) - (reactions[a.kind] ?? 0))
    .slice(0, 3);
  const meta = mine ? reactionMeta(mine) : null;

  return (
    <View style={styles.wrap}>
      {picking ? (
        <Animated.View entering={ZoomIn.duration(180)} style={[styles.picker, outline(colors), { backgroundColor: colors.surface }]}>
          {REACTIONS.map((r) => (
            <PressableScale
              key={r.kind}
              hapticOnPress={false}
              onPress={() => choose(mine === r.kind ? null : r.kind)}
              style={[styles.pickItem, mine === r.kind ? [outline(colors, 1.5), { backgroundColor: r.tint }] : null]}
            >
              <Text style={styles.pickEmoji}>{r.emoji}</Text>
              <Text style={[styles.pickLabel, { color: mine === r.kind ? INK : colors.textSecondary }]} numberOfLines={1}>{r.label}</Text>
            </PressableScale>
          ))}
        </Animated.View>
      ) : null}

      <View style={styles.row}>
        <PressableScale
          hapticOnPress={false}
          onPress={() => choose(mine ? null : 'mashallah')}
          onLongPress={() => { haptic.select(); setPicking((p) => !p); }}
          delayLongPress={280}
          style={[
            styles.mainBtn,
            meta ? [outline(colors), { backgroundColor: meta.tint }] : { borderWidth: brutal.borderThin, borderColor: 'transparent' },
          ]}
        >
          <Animated.Text style={[styles.mainEmoji, pop]}>{meta ? meta.emoji : '🤍'}</Animated.Text>
          <Text style={[styles.mainLabel, { color: meta ? INK : colors.textSecondary }]}>{meta ? meta.label : 'MashaAllah'}</Text>
        </PressableScale>
        <PressableScale hapticOnPress={false} onPress={() => { haptic.select(); setPicking((p) => !p); }} hitSlop={6} style={styles.more}>
          <Text style={[styles.moreText, { color: colors.textMuted }]}>{picking ? '×' : '+'}</Text>
        </PressableScale>
        {total > 0 ? (
          <Animated.View entering={FadeIn} style={styles.counts}>
            <Text style={styles.countEmojis}>{top.map((r) => r.emoji).join('')}</Text>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>{total}</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mainBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 36, borderRadius: 18 },
  mainEmoji: { fontSize: 16 },
  mainLabel: { fontSize: 13, fontWeight: '800' },
  more: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 18, fontWeight: '900', marginTop: -2 },
  counts: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 },
  countEmojis: { fontSize: 12.5 },
  countText: { fontSize: 13, fontWeight: '800' },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 6, borderRadius: 16, marginBottom: 8 },
  pickItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 32, borderRadius: 12 },
  pickEmoji: { fontSize: 15 },
  pickLabel: { fontSize: 12, fontWeight: '800' },
});
