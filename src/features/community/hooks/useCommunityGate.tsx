// Before someone posts: guests are asked to create an account, and first-time posters
// read and accept the community guidelines once.
//
//   const gate = useCommunityGate();
//   if (!(await gate.ensureCanPost())) return;
//   ...
//   return <>{...}{gate.modal}</>;
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HeartHandshake } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalPressable, outline } from '../../../core/components/ui';
import { acceptGuidelines, fetchMyRole } from '../api/moderation';
import type { Role } from '../api/types';
import { Sheet } from '../components/Sheet';

export const GUIDELINES: { title: string; body: string }[] = [
  { title: 'Speak good or stay silent', body: 'Be kind, gentle and respectful — even when you disagree. No insults, mockery or backbiting.' },
  { title: 'No fatwas without knowledge', body: 'Share what you know with its source. For rulings, use "Ask" so a verified scholar can answer.' },
  { title: 'Verify before sharing', body: 'Only share Quran and authentic hadith with references. Avoid weak or fabricated narrations.' },
  { title: 'Protect privacy', body: "Don't share personal details, phone numbers or other people's private matters." },
  { title: 'No spam, ads or links', body: 'Links are disabled. Posts selling things or repeating content will be removed.' },
  { title: 'Report, don\'t argue', body: 'If something is harmful, report it. Three reports hide a post until a moderator reviews it.' },
];

let roleCache: { role: Role; accepted: boolean } | null = null;

/** My community role ('member' | 'scholar' | 'admin'), cached for the session. */
export function useMyRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(roleCache?.role ?? 'member');
  useEffect(() => {
    if (!user) return;
    fetchMyRole().then((r) => {
      roleCache = { role: r.role as Role, accepted: r.acceptedGuidelines };
      setRole(roleCache.role);
    }).catch(() => {});
  }, [user]);
  return role;
}

export function useCommunityGate() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ensureCanPost = useCallback(async (): Promise<boolean> => {
    if (!user) {
      navigation.navigate('Auth', { mode: 'signin' });
      return false;
    }
    if (user.is_guest) {
      Alert.alert(
        'Create a free account',
        'Guests can read and react. To post, comment or share a dua, create an account — your progress is kept.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Create account', onPress: () => navigation.navigate('Auth', { mode: 'upgrade' }) }],
      );
      return false;
    }
    if (!roleCache) {
      const r = await fetchMyRole().catch(() => ({ role: 'member', acceptedGuidelines: false }));
      roleCache = { role: r.role as Role, accepted: r.acceptedGuidelines };
    }
    if (roleCache.accepted) return true;
    setVisible(true);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, [user, navigation]);

  const finish = async (ok: boolean) => {
    setVisible(false);
    if (ok) {
      await acceptGuidelines().catch(() => {});
      if (roleCache) roleCache.accepted = true;
    }
    resolver.current?.(ok);
    resolver.current = null;
  };

  const modal = (
    <Sheet visible={visible} onClose={() => finish(false)} title="Community guidelines" subtitle="Please read once before your first post">
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {GUIDELINES.map((g, i) => (
          <View key={g.title} style={styles.row}>
            <View style={[styles.num, outline(colors), { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.numText, { color: colors.text }]}>{i + 1}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: colors.text }]}>{g.title}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{g.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <BrutalPressable fill={colors.primary} style={styles.btn} onPress={() => finish(true)}>
        <HeartHandshake color={colors.onPrimary} size={19} strokeWidth={2.5} />
        <Text style={[styles.btnText, { color: colors.onPrimary }]}>I agree, insha'Allah</Text>
      </BrutalPressable>
    </Sheet>
  );

  return { ensureCanPost, modal };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { maxHeight: 420 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  num: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 13, fontWeight: '900' },
  title: { fontSize: 15, fontWeight: '900' },
  body: { fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  btn: { flexDirection: 'row', gap: 8, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '900' },
});
