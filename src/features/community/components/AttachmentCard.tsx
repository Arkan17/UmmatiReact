// A shared ayah or dua, shown as a gold card inside posts and the composer.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, HandHeart, X } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { PressableScale, outline } from '../../../core/components/ui';
import type { Attachment } from '../api/types';

const INK = '#1C1A17';
const GOLD = '#F6E2B6';

export function AttachmentCard({ attachment, onRemove, compact }: { attachment: Attachment; onRemove?: () => void; compact?: boolean }) {
  const { colors } = useAppTheme();
  const Icon = attachment.type === 'ayah' ? BookOpen : HandHeart;
  return (
    <View style={[styles.card, outline(colors), { backgroundColor: GOLD }]}>
      <View style={styles.head}>
        <Icon color={INK} size={13} strokeWidth={2.6} />
        <Text style={styles.label} numberOfLines={1}>{attachment.type === 'ayah' ? 'QURAN' : 'DUA'} · {attachment.ref}</Text>
        {onRemove ? (
          <PressableScale onPress={onRemove} hitSlop={8} style={[styles.remove, outline(colors, 1.5)]}>
            <X color={INK} size={13} strokeWidth={2.8} />
          </PressableScale>
        ) : null}
      </View>
      {attachment.arabic ? (
        <Text style={styles.arabic} numberOfLines={compact ? 3 : undefined}>{attachment.arabic}</Text>
      ) : null}
      {attachment.translation ? (
        <Text style={styles.translation} numberOfLines={compact ? 4 : undefined}>“{attachment.translation}”</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { flex: 1, color: INK, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  remove: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAF1' },
  arabic: { color: INK, fontSize: 22, lineHeight: 40, textAlign: 'right', writingDirection: 'rtl', marginTop: 8, fontFamily: 'Georgia' },
  translation: { color: INK, fontSize: 14.5, lineHeight: 21, fontWeight: '600', fontStyle: 'italic', marginTop: 6 },
});
