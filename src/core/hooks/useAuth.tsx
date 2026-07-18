import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../config/AppConfig';

export interface UserProfile {
  id: string;
  username: string;
  gender: string;
  unique_app_id: string;
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  onboardingCompleted: boolean;
  register: (username: string, gender: string) => Promise<{ success: boolean; error?: string; uniqueAppId?: string }>;
  login: (username: string, pass: string, uniqueAppId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate UUID v4 in pure JavaScript
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Check storage for onboarding and active local user session
  const checkSession = async () => {
    try {
      // 1. Check onboarding status
      const onboardingStatus = await AsyncStorage.getItem(AppConfig.storageKeys.ONBOARDING_COMPLETED);
      setOnboardingCompleted(onboardingStatus === 'true');

      // 2. Check local user info
      const username = await AsyncStorage.getItem('local_username');
      const gender = await AsyncStorage.getItem('local_gender');
      const uniqueAppId = await AsyncStorage.getItem('local_unique_app_id');

      if (username && uniqueAppId) {
        setUser({
          id: 'local_user',
          username: username,
          gender: gender || 'man',
          unique_app_id: uniqueAppId,
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (e) {
      console.error('[useAuth] Error checking session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(AppConfig.storageKeys.ONBOARDING_COMPLETED, 'true');
      setOnboardingCompleted(true);
    } catch (e) {
      console.error('[useAuth] Error saving onboarding state:', e);
    }
  };

  const register = async (username: string, gender: string): Promise<{ success: boolean; error?: string; uniqueAppId?: string }> => {
    setIsLoading(true);
    try {
      const sanitizedUsername = username.trim();
      const uniqueAppId = generateUUID();

      // Save user details locally in AsyncStorage
      await AsyncStorage.setItem('local_username', sanitizedUsername);
      await AsyncStorage.setItem('local_gender', gender);
      await AsyncStorage.setItem('local_unique_app_id', uniqueAppId);
      await AsyncStorage.setItem(AppConfig.storageKeys.ONBOARDING_COMPLETED, 'true');

      setUser({
        id: 'local_user',
        username: sanitizedUsername,
        gender: gender,
        unique_app_id: uniqueAppId,
      });
      setOnboardingCompleted(true);
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true, uniqueAppId };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'An error occurred during registration.' };
    }
  };

  const login = async (username: string, pass: string, uniqueAppId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const sanitizedUsername = username.trim();
      const sanitizedId = uniqueAppId.trim().toLowerCase();

      // Restoring/logging in locally
      await AsyncStorage.setItem('local_username', sanitizedUsername);
      await AsyncStorage.setItem('local_unique_app_id', sanitizedId);

      setUser({
        id: 'local_user',
        username: sanitizedUsername,
        gender: 'man', // default
        unique_app_id: sanitizedId,
      });
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'An error occurred during login.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('local_username');
      await AsyncStorage.removeItem('local_gender');
      await AsyncStorage.removeItem('local_unique_app_id');
      setUser(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error('[useAuth] Error logging out:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        onboardingCompleted,
        register,
        login,
        logout,
        completeOnboarding,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
