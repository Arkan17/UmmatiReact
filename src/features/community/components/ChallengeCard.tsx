// One weekly challenge: progress toward the goal, quick "+N" logging, and a star burst on completion.
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Book, BookOpen, CircleCheck, Gift, Heart, Star, Sunrise, Users } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalPressable, Card, ProgressBar, outline } from '../../../core/components/ui';
import type { Challenge } from '../api/types';

const INK = '#1C1A17';

export const CHALLENGE_ICONS: Record<string, typeof Star> = {
  book: Book,
  'book-open': BookOpen,
  heart: Heart,
  sunrise: Sunrise,
  gift: Gift,
  star: Star,
};
const TINTS = [tints.gold, tints.rose, tints.teal, tints.orange, tints.green, tints.violet, tints.blue];

/** "+N" buttons that make sense for the goal size. */
export const quickSteps = (c: Challenge) => {
  if (c.goal >= 100) return [10, 33, 100];
  if (c.goal >= 10) return [1, 5];
  return [1];
};

const BURST = 12;

function BurstStar({ index, color }: { index: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 900 + (index % 3) * 120, easing: Easing.out(Easing.cubic) });
  }, [p, index]);
  const angle = (index / BURST) * Math.PI * 2;
  const dist = 70 + (index % 3) * 22;
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: Math.cos(angle) * dist * p.value },
      { translateY: Math.sin(angle) * dist * p.value },
      { scale: 0.6 + p.value * 0.8 },
      { rotate: `${p.value * 180}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.burstStar, style]}>
      <Star color={INK} fill={color} size={18} strokeWidth={2} />
    </Animated.View>
  );
}

export function ChallengeCard({ challenge, index, busy, celebrate, onJoin, onLog }: {
  challenge: Challenge;
  index: number;
  busy: boolean;
  /** Changes (to a new number) each time this card should play its completion burst. */
  celebrate: number;
  onJoin: () => void;
  onLog: (amount: number) => void;
}) {
  const { colors } = useAppTheme();
  const c = challenge;
  const tint = TINTS[index % TINTS.length];
  const Icon = CHALLENGE_ICONS[c.icon] ?? Star;
  const done = !!c.my_completed_at;
  const remaining = Math.max(0, c.goal - c.my_progress);

  return (
    <Card style={[styles.card, done ? { backgroundColor: colors.primarySoft } : null]}>
      <View style={styles.top}>
        <View style={[styles.icon, outline(colors), { backgroundColor: tint }]}>
          <Icon color={INK} size={24} strokeWidth={2.4} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.text }]}>{c.title}</Text>
          {c.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{c.description}</Text> : null}
        </View>
        <View style={[styles.xp, outline(colors, 1.5), { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.xpText, { color: colors.text }]}>+{c.xp} XP</Text>
        </View>
      </View>

      {c.joined ? (
        <View style={styles.progress}>
          <View style={styles.progressHead}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {c.my_progress.toLocaleString()} <Text style={{ color: colors.textMuted }}>/ {c.goal.toLocaleString()} {c.unit}</Text>
            </Text>
            {done ? (
              <View style={styles.doneRow}>
                <CircleCheck color={colors.text} size={16} strokeWidth={2.6} />
                <Text style={[styles.doneText, { color: colors.text }]}>Completed</Text>
              </View>
            ) : (
              <Text style={[styles.left, { color: colors.textMuted }]}>{remaining.toLocaleString()} to go</Text>
            )}
          </View>
          <ProgressBar value={c.my_progress / c.goal} color={done ? colors.primary : tint} track={colors.surfaceAlt} height={12} />
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.people}>
          <Users color={colors.textMuted} size={14} strokeWidth={2.4} />
          <Text style={[styles.peopleText, { color: colors.textMuted }]}>{c.participants} joined · {c.completed_count} completed</Text>
        </View>
      </View>

      {!c.joined ? (
        <BrutalPressable fill={tint} style={styles.joinBtn} onPress={onJoin} disabled={busy}>
          <Text style={styles.joinText}>{busy ? 'Joining…' : 'Join challenge'}</Text>
        </BrutalPressable>
      ) : !done ? (
        <View style={styles.steps}>
          {quickSteps(c).map((n) => (
            <BrutalPressable
              key={n}
              fill={n === 1 ? tint : colors.surface}
              offset={brutal.shadowSmall}
              borderWidth={brutal.borderThin}
              style={styles.step}
              onPress={() => onLog(Math.min(n, remaining))}
              disabled={busy}
            >
              <Text style={[styles.stepText, { color: n === 1 ? INK : colors.text }]}>+{n}</Text>
            </BrutalPressable>
          ))}
          {c.goal > 1 && remaining > 1 ? (
            <BrutalPressable fill={colors.surface} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={[styles.step, styles.stepWide]} onPress={() => onLog(remaining)} disabled={busy}>
              <Text style={[styles.stepText, { color: colors.text }]}>Done all</Text>
            </BrutalPressable>
          ) : null}
        </View>
      ) : null}

      {celebrate > 0 ? (
        <View key={celebrate} pointerEvents="none" style={styles.burst}>
          {Array.from({ length: BURST }, (_, i) => <BurstStar key={i} index={i} color={i % 2 ? colors.accent : tint} />)}
          <Animated.View entering={ZoomIn.springify().damping(10)} style={[styles.toast, outline(colors, brutal.border), { backgroundColor: colors.accent }]}>
            <Animated.Text entering={FadeIn.delay(150)} style={styles.toastText}>MashaAllah! +{c.xp} XP</Animated.Text>
          </Animated.View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: 24, marginBottom: 16, overflow: 'visible' },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
  desc: { fontSize: 13.5, lineHeight: 19, marginTop: 3 },
  xp: { paddingHorizontal: 8, height: 26, borderRadius: 13, justifyContent: 'center' },
  xpText: { fontSize: 12, fontWeight: '900' },
  progress: { marginTop: 16, gap: 8 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 15, fontWeight: '900' },
  left: { fontSize: 12.5, fontWeight: '800' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontSize: 13, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  people: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  peopleText: { fontSize: 12.5, fontWeight: '700' },
  joinBtn: { height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  joinText: { color: INK, fontSize: 15.5, fontWeight: '900' },
  steps: { flexDirection: 'row', gap: 10, marginTop: 14 },
  step: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  stepWide: { flex: 1.4 },
  stepText: { fontSize: 15, fontWeight: '900' },
  burst: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  burstStar: { position: 'absolute' },
  toast: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18 },
  toastText: { color: INK, fontSize: 17, fontWeight: '900' },
});
