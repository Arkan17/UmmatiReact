// Generic "…" action menu: a list of tappable rows in a bottom sheet.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable } from '../../../core/components/ui';
import { Sheet } from './Sheet';

export interface OptionItem {
  label: string;
  Icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  onPress: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

export function OptionsSheet({ visible, onClose, title, options }: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: OptionItem[];
}) {
  const { colors } = useAppTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title ?? 'Options'}>
      <View style={styles.list}>
        {options.filter((o) => !o.hidden).map((o) => (
          <BrutalPressable
            key={o.label}
            onPress={() => { onClose(); setTimeout(o.onPress, 250); }}
            offset={brutal.shadowSmall}
            borderWidth={brutal.borderThin}
            fill={o.destructive ? colors.danger : colors.surface}
            style={styles.row}
          >
            <o.Icon color={o.destructive ? colors.ink : colors.text} size={19} strokeWidth={2.4} />
            <Text style={[styles.label, { color: o.destructive ? colors.ink : colors.text }]}>{o.label}</Text>
          </BrutalPressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 54 },
  label: { fontSize: 15.5, fontWeight: '800' },
});
