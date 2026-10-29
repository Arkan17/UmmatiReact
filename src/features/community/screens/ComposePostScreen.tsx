// Write a post / ask a question, optionally into a group and with a shared ayah or dua attached.
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BadgeCheck, Send, Users } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalPressable, PressableScale, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { awardXp } from '../../../core/services/progress';
import { createPost } from '../api/feed';
import type { Attachment, Category } from '../api/types';
import { AttachmentCard } from '../components/AttachmentCard';
import { Avatar } from '../components/Avatar';
import { CATEGORY_META } from '../components/PostCard';
import { useCommunityGate } from '../hooks/useCommunityGate';
import { checkContent } from '../utils/contentFilter';

const INK = '#1C1A17';
const MAX = 2000;
const PICKABLE: Category[] = ['discuss', 'ask', 'event'];

export function ComposePostScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ComposePost'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const gate = useCommunityGate();
  const params = route.params ?? {};

  const [category, setCategory] = useState<Category>(params.category && PICKABLE.includes(params.category) ? params.category : 'discuss');
  const [attachment, setAttachment] = useState<Attachment | null>(params.attachment ?? null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = category === 'ask';
  const remaining = MAX - text.length;
  const canSend = text.trim().length >= 2 && !busy;

  const submit = async () => {
    const check = checkContent(text, { max: MAX });
    if (!check.ok) {
      Alert.alert('Please check your post', check.reason);
      return;
    }
    if (!(await gate.ensureCanPost())) return;
    setBusy(true);
    try {
      await createPost({
        content: text,
        category,
        authorName: user?.username ?? 'Member',
        avatarColor: user?.avatar_color,
        attachment,
        groupId: params.groupId ?? null,
      });
      haptic.success();
      awardXp(5, 'community_post').catch(() => {});
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not post', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={ask ? 'Ask a question' : 'New post'}
        subtitle={params.groupName ? `Posting in ${params.groupName}` : 'Share something beneficial'}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(300)} style={styles.authorRow}>
            <Avatar name={user?.username} color={user?.avatar_color} size={44} />
            <View style={styles.flex}>
              <Text style={[styles.name, { color: colors.text }]}>{user?.username ?? 'You'}</Text>
              {params.groupName ? (
                <View style={[styles.groupPill, outline(colors, 1.5), { backgroundColor: tints.violet }]}>
                  <Users color={INK} size={11} strokeWidth={2.6} />
                  <Text style={styles.groupText} numberOfLines={1}>{params.groupName}</Text>
                </View>
              ) : (
                <Text style={[styles.hint, { color: colors.textMuted }]}>Posting to the whole community</Text>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.cats}>
            {PICKABLE.map((c) => {
              const meta = CATEGORY_META[c];
              const on = c === category;
              return (
                <PressableScale
                  key={c}
                  hapticOnPress={false}
                  onPress={() => { haptic.select(); setCategory(c); }}
                  style={[styles.cat, outline(colors), { backgroundColor: on ? meta.tint : colors.surfaceAlt }]}
                >
                  <meta.Icon color={on ? INK : colors.textMuted} size={16} strokeWidth={2.4} />
                  <Text style={[styles.catText, { color: on ? INK : colors.textSecondary }]}>{meta.label}</Text>
                </PressableScale>
              );
            })}
          </Animated.View>

          {ask ? (
            <Animated.View entering={FadeInDown.duration(250)} style={[styles.askHint, outline(colors), { backgroundColor: colors.accentSoft }]}>
              <BadgeCheck color={INK} size={18} strokeWidth={2.4} />
              <Text style={styles.askHintText}>A verified scholar will answer, insha'Allah. Please keep your question clear and avoid personal details.</Text>
            </Animated.View>
          ) : null}

          <TextInput
            style={[styles.input, outline(colors), { backgroundColor: colors.surface, color: colors.text }]}
            multiline
            autoFocus
            maxLength={MAX}
            placeholder={ask ? 'What would you like to ask?' : "What's on your mind? Share a reminder, a reflection or a question…"}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          <Text style={[styles.counter, { color: remaining < 100 ? colors.danger : colors.textMuted }]}>{remaining}</Text>

          {attachment ? <AttachmentCard attachment={attachment} onRemove={() => setAttachment(null)} /> : null}

          <BrutalPressable
            onPress={submit}
            disabled={!canSend}
            fill={canSend ? colors.primary : colors.surfaceAlt}
            offset={canSend ? brutal.shadow : 0}
            style={styles.submit}
          >
            <Send color={canSend ? colors.onPrimary : colors.textMuted} size={18} strokeWidth={2.5} />
            <Text style={[styles.submitText, { color: canSend ? colors.onPrimary : colors.textMuted }]}>
              {busy ? 'Posting…' : ask ? 'Ask question' : 'Share post'}
            </Text>
          </BrutalPressable>
        </ScrollView>
      </KeyboardAvoidingView>
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  body: { padding: 18 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  name: { fontSize: 16, fontWeight: '900' },
  hint: { fontSize: 13, marginTop: 2 },
  groupPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, marginTop: 4 },
  groupText: { color: INK, fontSize: 11.5, fontWeight: '900', maxWidth: 220 },
  cats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  cat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 14 },
  catText: { fontSize: 13.5, fontWeight: '800' },
  askHint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, marginBottom: 14 },
  askHintText: { flex: 1, color: INK, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  input: { minHeight: 170, borderRadius: 18, padding: 16, fontSize: 16, lineHeight: 23 },
  counter: { alignSelf: 'flex-end', fontSize: 12, fontWeight: '800', marginTop: 6 },
  submit: { flexDirection: 'row', gap: 8, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  submitText: { fontSize: 16.5, fontWeight: '900' },
});
