import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { User, Lock, ArrowLeft, Key } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uniqueAppId, setUniqueAppId] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg(null);
    
    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }
    
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (!uniqueAppId.trim()) {
      setErrorMsg('Please enter your Unique App ID.');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password, uniqueAppId.trim());
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Back to Register Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Register')}>
          <ArrowLeft color={Theme.colors.textSecondary} size={24} />
          <Text style={styles.backButtonText}>Back to Register</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Restore Account</Text>
          <Text style={styles.subtitle}>Enter your username and password to restore your progress and unique App ID</Text>
        </View>

        {/* Error Indicator */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Inputs */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <User color={Theme.colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Theme.colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color={Theme.colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Key color={Theme.colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Unique App ID / Key"
              placeholderTextColor={Theme.colors.textMuted}
              value={uniqueAppId}
              onChangeText={setUniqueAppId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Restore Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Switch Auth Redirect Link */}
        <TouchableOpacity style={styles.switchAuthBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchAuthText}>Don't have an account yet? Register</Text>
        </TouchableOpacity>

        {/* Help Note */}
        <Text style={styles.helpNote}>
          Forgot your credentials? Since we do not ask for email or phone numbers, password recovery is not supported automatically. Please make sure to save your Unique App ID during registration.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    marginLeft: 6,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: Theme.colors.error,
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: Theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpNote: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 40,
    paddingHorizontal: 10,
  },
  switchAuthBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  switchAuthText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
