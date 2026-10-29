// Progress ring for a group khatam: completed Juz out of 30, with claimed Juz as a lighter arc.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import type { KhatamJuz } from '../api/types';

export const khatamStats = (juz: KhatamJuz[]) => ({
  completed: juz.filter((j) => j.completed).length,
  claimed: juz.filter((j) => j.user_id).length,
});

export function KhatamProgress({ juz, size = 64, color, label = true }: { juz: KhatamJuz[]; size?: number; color?: string; label?: boolean }) {
  const { colors } = useAppTheme();
  const { completed, claimed } = khatamStats(juz);
  const stroke = Math.max(6, size * 0.12);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = (n: number) => `${(n / 30) * c} ${c}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.accentSoft} strokeWidth={stroke} fill="none" strokeDasharray={arc(claimed)} strokeLinecap="round" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color ?? colors.primary} strokeWidth={stroke} fill="none" strokeDasharray={arc(completed)} strokeLinecap="round" />
        <Circle cx={size / 2} cy={size / 2} r={r + stroke / 2} stroke={colors.ink} strokeWidth={1.5} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2} stroke={colors.ink} strokeWidth={1.5} fill="none" />
      </Svg>
      {label ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.big, { color: colors.text, fontSize: size * 0.26 }]}>{completed}</Text>
          <Text style={[styles.small, { color: colors.textMuted, fontSize: Math.max(9, size * 0.13) }]}>/ 30</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: { transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center' },
  big: { fontWeight: '900', lineHeight: undefined },
  small: { fontWeight: '800', marginTop: -2 },
});
