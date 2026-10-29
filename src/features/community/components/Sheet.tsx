// Bottom sheet used across the community screens (ink outline, drag handle, keyboard aware).
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { PressableScale } from '../../../core/components/ui';

export function Sheet({ visible, onClose, title, subtitle, children, style }: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.ink, paddingBottom: insets.bottom + 18 }, style]}>
          <View style={[styles.handle, { backgroundColor: colors.ink }]} />
          {title ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
              </View>
              <PressableScale onPress={onClose} style={[styles.close, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                <X color={colors.text} size={18} />
              </PressableScale>
            </View>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: brutal.border, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 10, maxHeight: '90%' },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14, opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  title: { fontSize: 21, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  close: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
});
