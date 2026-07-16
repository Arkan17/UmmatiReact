import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal, Clipboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { User, Lock, Copy, Check, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function RegisterScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal states for generated Unique App ID
  const [showIdModal, setShowIdModal] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegister = async () => {
    setErrorMsg(null);
    
    if (!username.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }
    
    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    
    if (!password) {
      setErrorMsg('Please set a password.');
      return;
    }
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register(username.trim(), password);
    setLoading(false);

    if (result.success && result.uniqueAppId) {
      setGeneratedId(result.uniqueAppId);
      setShowIdModal(true);
    } else {
      setErrorMsg(result.error || 'Failed to register account.');
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(generatedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModalContinue = () => {
    setShowIdModal(false);
    // Session state change in useAuth will automatically re-route RootNavigator to MainApp
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Back to Login Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <ArrowLeft color={Theme.colors.textSecondary} size={24} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Choose a username and password to secure your progression</Text>
        </View>

        {/* Error Indicator */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Inputs Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <User color={Theme.colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pick a Username"
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
              placeholder="Choose Password (min 6 characters)"
              placeholderTextColor={Theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color={Theme.colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Theme.colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Generate Unique App ID</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Switch Auth Redirect Link */}
        <TouchableOpacity style={styles.switchAuthBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchAuthText}>Already have an account? Login</Text>
        </TouchableOpacity>

        {/* Unique App ID Modal Pop-up */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showIdModal}
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🎉 Account Created!</Text>
              <Text style={styles.modalText}>
                We have generated a **Unique App ID** for you. Use this key along with your password to restore your data on other devices.
              </Text>

              {/* Unique ID Box */}
              <View style={styles.idBox}>
                <Text style={styles.idText} numberOfLines={1} selectable>
                  {generatedId}
                </Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                  {copied ? (
                    <Check color={Theme.colors.primary} size={20} />
                  ) : (
                    <Copy color={Theme.colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>
              
              {copied ? (
                <Text style={styles.copiedAlert}>Copied to clipboard!</Text>
              ) : null}

              <Text style={styles.warningNote}>
                ⚠️ Please copy and save this key safely. We do not store email addresses, so this key is the only way to recover your account!
              </Text>

              {/* Continue Button */}
              <TouchableOpacity style={styles.modalBtn} onPress={handleModalContinue}>
                <Text style={styles.modalBtnText}>Continue to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    width: '100%',
    paddingLeft: 16,
    paddingRight: 8,
    height: 52,
    marginBottom: 8,
  },
  idText: {
    flex: 1,
    color: Theme.colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    padding: 10,
  },
  copiedAlert: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginBottom: 16,
  },
  warningNote: {
    fontSize: 12,
    color: '#F87171', // soft red
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
