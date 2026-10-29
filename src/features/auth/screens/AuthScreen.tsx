import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  useWindowDimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { AtSign, ChevronLeft, Eye, EyeOff, Lock, UserRoundCheck } from 'lucide-react-native';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalBox, BrutalPressable, HeaderButton, PressableScale, SkyBackground, haptic } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';
import { UmmatiLogo } from '../../../core/components/UmmatiLogo';

type Mode = 'signin' | 'signup' | 'upgrade';

function Field({ Icon, right, ...props }: TextInputProps & { Icon: typeof AtSign; right?: React.ReactNode }) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, { backgroundColor: focused ? colors.accentSoft : colors.surfaceAlt, borderColor: colors.ink }]}>
      <Icon color={focused ? colors.text : colors.textMuted} size={19} strokeWidth={2.4} />
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
      />
      {right}
    </View>
  );
}

export function AuthScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, continueAsGuest, upgradeGuest } = useAuth();

  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'man' | 'woman' | null>(null);
  const [busy, setBusy] = useState<'submit' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = mode === 'upgrade';
  const needsProfile = mode !== 'signin';

  const switchMode = (m: Mode) => { haptic.select(); setMode(m); setError(null); };

  const submit = async () => {
    setError(null);
    if (needsProfile && !gender) return setError('Please select Brother or Sister.');

    setBusy('submit');
    const r = mode === 'signin'
      ? await signIn(username, password)
      : mode === 'signup'
        ? await signUp(username, password, gender!)
        : await upgradeGuest(username, password, gender!);
    setBusy(null);

    if (!r.success) { haptic.medium(); return setError(r.error!); }
    haptic.success();
    // Sign-in/up flips RootNavigator to the app; an upgrade returns to where the guest came from
    if (isUpgrade) navigation.goBack();
  };

  const guest = async () => {
    setError(null);
    setBusy('guest');
    const r = await continueAsGuest();
    setBusy(null);
    if (!r.success) { haptic.medium(); setError(r.error!); }
  };

  const title = isUpgrade ? 'Save your progress' : mode === 'signup' ? 'Create your account' : 'Welcome back';
  const subtitle = isUpgrade
    ? 'Pick a username and password. Everything you did as a guest stays with you.'
    : mode === 'signup' ? 'Just a username and password. No email needed.' : 'Sign in with your username to continue your journey.';

  return (
    <SkyBackground style={{ flex: 1 }} height={height}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          {navigation.canGoBack() && (
            <View style={styles.back}>
              <HeaderButton onPress={() => navigation.goBack()}><ChevronLeft color={colors.onSky} size={22} strokeWidth={2.6} /></HeaderButton>
            </View>
          )}

          <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
            <UmmatiLogo size={84} />
            <Text style={[styles.title, { color: colors.onSky }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.onSkyMuted }]}>{subtitle}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(600)} layout={LinearTransition.springify()}>
          <BrutalBox radius={28} style={styles.sheet}>
            {!isUpgrade && (
              <View style={[styles.segment, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                {(['signin', 'signup'] as const).map((m) => (
                  <PressableScale key={m} onPress={() => switchMode(m)} hapticOnPress={false} style={[styles.segmentBtn, mode === m && { backgroundColor: colors.primary, borderColor: colors.ink, borderWidth: brutal.borderThin }]}>
                    <Text style={[styles.segmentText, { color: mode === m ? colors.onPrimary : colors.textSecondary }]}>
                      {m === 'signin' ? 'Sign in' : 'Sign up'}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            )}

            <Field
              Icon={AtSign}
              placeholder="Username"
              value={username}
              onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
              maxLength={20}
            />
            {needsProfile && <Text style={[styles.hint, { color: colors.textMuted }]}>3–20 characters: letters, numbers, _ or .</Text>}

            <Field
              Icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType={needsProfile ? 'newPassword' : 'password'}
              onSubmitEditing={submit}
              right={
                <PressableScale onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                  {showPassword ? <EyeOff color={colors.textMuted} size={19} /> : <Eye color={colors.textMuted} size={19} />}
                </PressableScale>
              }
            />

            {needsProfile && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.genderRow}>
                {(['man', 'woman'] as const).map((g) => (
                  <BrutalPressable
                    key={g}
                    onPress={() => setGender(g)}
                    fill={gender === g ? colors.primarySoft : colors.surfaceAlt}
                    radius={16}
                    offset={gender === g ? brutal.shadowSmall : 0}
                    borderWidth={brutal.borderThin}
                    style={styles.gender}
                  >
                    <Text style={styles.genderEmoji}>{g === 'man' ? '👳‍♂️' : '🧕'}</Text>
                    <Text style={[styles.genderText, { color: gender === g ? colors.text : colors.textSecondary }]}>{g === 'man' ? 'Brother' : 'Sister'}</Text>
                  </BrutalPressable>
                ))}
              </Animated.View>
            )}

            {error && <Animated.Text entering={FadeIn} style={[styles.msg, { color: colors.danger }]}>{error}</Animated.Text>}

            <BrutalPressable onPress={submit} disabled={!!busy} fill={colors.primary} style={[styles.submit, { opacity: busy ? 0.7 : 1 }]}>
              {busy === 'submit' ? <ActivityIndicator color={colors.onPrimary} /> : (
                <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                  {isUpgrade ? 'Save my account' : mode === 'signup' ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </BrutalPressable>

            {!isUpgrade && (
              <>
                <View style={styles.orRow}>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.orText, { color: colors.textMuted }]}>or</Text>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                </View>
                <BrutalPressable onPress={guest} disabled={!!busy} fill={colors.surface} offset={brutal.shadowSmall} style={styles.guest}>
                  {busy === 'guest' ? <ActivityIndicator color={colors.text} /> : (
                    <>
                      <UserRoundCheck color={colors.text} size={19} />
                      <Text style={[styles.guestText, { color: colors.text }]}>Continue as guest</Text>
                    </>
                  )}
                </BrutalPressable>
                <Text style={[styles.hint, { color: colors.textMuted, textAlign: 'center' }]}>
                  You can create an account later and keep your progress.
                </Text>
              </>
            )}
          </BrutalBox>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  back: { alignSelf: 'flex-start' },
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '900', marginTop: 18, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
  sheet: { borderRadius: 28, padding: 20, gap: 12 },
  segment: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 4, borderWidth: brutal.borderThin },
  segmentBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 15, fontWeight: '900' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 56, borderRadius: 16, paddingHorizontal: 16, borderWidth: brutal.borderThin },
  input: { flex: 1, fontSize: 16, fontWeight: '600', height: '100%' },
  hint: { fontSize: 12, marginTop: -4, paddingHorizontal: 4 },
  genderRow: { flexDirection: 'row', gap: 12 },
  gender: { flex: 1, height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  genderEmoji: { fontSize: 24 },
  genderText: { fontSize: 15, fontWeight: '800' },
  msg: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  submit: { height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { fontSize: 17, fontWeight: '900' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: brutal.borderThin },
  orText: { fontSize: 13, fontWeight: '700' },
  guest: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  guestText: { fontSize: 16, fontWeight: '900' },
});
