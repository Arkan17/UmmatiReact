// "Create group" and "Join with invite code" bottom sheets.
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Check, KeyRound, Lock, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { tints } from '../../../core/theme/palettes';
import { BrutalPressable, PressableScale, haptic, outline } from '../../../core/components/ui';
import { createGroup, joinGroup } from '../api/groups';
import { checkContent } from '../utils/contentFilter';
import { Sheet } from './Sheet';

const INK = '#1C1A17';
const SWATCHES = Object.values(tints);

export function GroupCreateSheet({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tint, setTint] = useState<string>(tints.violet);
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => { setName(''); setDescription(''); setTint(tints.violet); setIsPrivate(false); };

  const submit = async () => {
    const n = checkContent(name, { min: 3, max: 60 });
    if (!n.ok) return Alert.alert('Check the name', n.reason);
    if (description.trim()) {
      const d = checkContent(description, { min: 2, max: 300 });
      if (!d.ok) return Alert.alert('Check the description', d.reason);
    }
    setBusy(true);
    try {
      const id = await createGroup({ name, description, tint, isPrivate });
      haptic.success();
      reset();
      onClose();
      onCreated(id);
    } catch (e: any) {
      Alert.alert('Could not create group', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Create a group" subtitle="For your masjid, halaqa, class or family">
      <TextInput
        style={[styles.input, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Group name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        maxLength={60}
      />
      <TextInput
        style={[styles.input, styles.multiline, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="What is this group about? (optional)"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        maxLength={300}
        multiline
      />
      <Text style={[styles.label, { color: colors.textMuted }]}>COLOUR</Text>
      <View style={styles.swatches}>
        {SWATCHES.map((c) => (
          <PressableScale key={c} onPress={() => { haptic.select(); setTint(c); }} style={[styles.swatch, outline(colors), { backgroundColor: c }]}>
            {tint === c ? <Check color={INK} size={18} strokeWidth={3} /> : null}
          </PressableScale>
        ))}
      </View>
      <View style={[styles.privateRow, outline(colors), { backgroundColor: colors.surfaceAlt }]}>
        <Lock color={colors.text} size={18} strokeWidth={2.4} />
        <View style={styles.flex}>
          <Text style={[styles.privateTitle, { color: colors.text }]}>Private group</Text>
          <Text style={[styles.privateDesc, { color: colors.textMuted }]}>Hidden from Discover. People join with your invite code.</Text>
        </View>
        <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: colors.primary, false: colors.surface }} />
      </View>
      <BrutalPressable fill={tint} style={styles.submit} onPress={submit} disabled={busy}>
        <Plus color={INK} size={19} strokeWidth={2.8} />
        <Text style={styles.submitText}>{busy ? 'Creating…' : 'Create group'}</Text>
      </BrutalPressable>
    </Sheet>
  );
}

export function GroupJoinSheet({ visible, onClose, onJoined }: {
  visible: boolean;
  onClose: () => void;
  onJoined: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      const id = await joinGroup({ code: code.trim() });
      haptic.success();
      setCode('');
      onClose();
      onJoined(id);
    } catch (e: any) {
      Alert.alert('Could not join', e?.message ?? 'Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Join with a code" subtitle="Ask the group admin for the 6-letter invite code">
      <TextInput
        style={[styles.codeInput, outline(colors), { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="ABC123"
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        onSubmitEditing={submit}
      />
      <BrutalPressable fill={code.length >= 4 ? colors.primary : colors.surfaceAlt} style={styles.submit} onPress={submit} disabled={busy || code.length < 4}>
        <KeyRound color={code.length >= 4 ? colors.onPrimary : colors.textMuted} size={19} strokeWidth={2.5} />
        <Text style={[styles.submitText, { color: code.length >= 4 ? colors.onPrimary : colors.textMuted }]}>{busy ? 'Joining…' : 'Join group'}</Text>
      </BrutalPressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5, fontWeight: '600', marginBottom: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  label: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.2, marginTop: 4, marginBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, marginTop: 16 },
  privateTitle: { fontSize: 15, fontWeight: '900' },
  privateDesc: { fontSize: 12.5, marginTop: 1 },
  codeInput: { borderRadius: 16, height: 64, textAlign: 'center', fontSize: 28, fontWeight: '900', letterSpacing: 8 },
  submit: { flexDirection: 'row', gap: 8, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  submitText: { color: INK, fontSize: 16, fontWeight: '900' },
});
