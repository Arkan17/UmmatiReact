// Report a post / comment / dua / event, with an optional "also block this person".
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Flag } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable, PressableScale, haptic, outline } from '../../../core/components/ui';
import { blockUser, reportContent } from '../api/moderation';
import type { ReportReason, ReportTarget } from '../api/types';
import { Sheet } from './Sheet';

const REASONS: { key: ReportReason; label: string; desc: string }[] = [
  { key: 'spam', label: 'Spam', desc: 'Ads, scams or repeated posts' },
  { key: 'offensive', label: 'Offensive', desc: 'Rude, hateful or inappropriate' },
  { key: 'misinformation', label: 'Wrong information', desc: 'False religious rulings or fake hadith' },
  { key: 'harassment', label: 'Harassment', desc: 'Bullying or targeting someone' },
  { key: 'other', label: 'Something else', desc: 'Tell us more below' },
];

export function ReportSheet({ visible, onClose, target, authorId, authorName, onDone }: {
  visible: boolean;
  onClose: () => void;
  target: { type: ReportTarget; id: string } | null;
  authorId?: string | null;
  authorName?: string | null;
  /** Called after reporting (and blocking, if chosen) so the caller can hide the item. */
  onDone?: (blocked: boolean) => void;
}) {
  const { colors } = useAppTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => { setReason(null); setDetails(''); setBlock(false); onClose(); };

  const submit = async () => {
    if (!target || !reason) return;
    setBusy(true);
    try {
      await reportContent(target.type, target.id, reason, details);
      if (block && authorId) await blockUser(authorId);
      haptic.success();
      onDone?.(block && !!authorId);
      close();
      Alert.alert('JazakAllahu khairan', 'Thank you for keeping the community safe. Our moderators will review this.');
    } catch (e: any) {
      Alert.alert('Could not report', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title="Report" subtitle="Reports are anonymous.">
      <View style={styles.list}>
        {REASONS.map((r) => {
          const active = reason === r.key;
          return (
            <PressableScale
              key={r.key}
              onPress={() => { haptic.select(); setReason(r.key); }}
              hapticOnPress={false}
              style={[styles.reason, outline(colors), { backgroundColor: active ? colors.accentSoft : colors.surface }]}
            >
              <View style={[styles.radio, outline(colors), { backgroundColor: active ? colors.accent : colors.surface }]} />
              <View style={styles.flex}>
                <Text style={[styles.reasonLabel, { color: colors.text }]}>{r.label}</Text>
                <Text style={[styles.reasonDesc, { color: colors.textMuted }]}>{r.desc}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
      <TextInput
        style={[styles.input, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Details (optional)"
        placeholderTextColor={colors.textMuted}
        value={details}
        onChangeText={setDetails}
        maxLength={300}
      />
      {authorId && authorName ? (
        <PressableScale onPress={() => setBlock(!block)} style={styles.blockRow}>
          <View style={[styles.check, outline(colors), { backgroundColor: block ? colors.danger : colors.surface }]}>
            {block ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={[styles.blockText, { color: colors.text }]}>Also block {authorName} — you won't see their posts</Text>
        </PressableScale>
      ) : null}
      <BrutalPressable
        fill={reason ? colors.danger : colors.surfaceAlt}
        offset={reason ? brutal.shadow : 0}
        disabled={!reason || busy}
        onPress={submit}
        style={styles.submit}
      >
        <Flag color={colors.ink} size={18} strokeWidth={2.5} />
        <Text style={[styles.submitText, { color: colors.ink }]}>{busy ? 'Sending…' : 'Send report'}</Text>
      </BrutalPressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 8 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  radio: { width: 20, height: 20, borderRadius: 10 },
  reasonLabel: { fontSize: 15, fontWeight: '800' },
  reasonDesc: { fontSize: 12.5, marginTop: 1 },
  input: { borderRadius: 14, paddingHorizontal: 14, height: 46, marginTop: 12, fontSize: 15 },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  check: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 13, fontWeight: '900', color: '#1C1A17' },
  blockText: { flex: 1, fontSize: 14, fontWeight: '700' },
  submit: { flexDirection: 'row', gap: 8, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitText: { fontSize: 16, fontWeight: '900' },
});
