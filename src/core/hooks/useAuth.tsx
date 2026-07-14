import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/SupabaseClient';
import { AppConfig } from '../config/AppConfig';

export interface UserProfile {
  id: string;
  username: string;
  unique_app_id: string;
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  onboardingCompleted: boolean;
  register: (username: string, pass: string) => Promise<{ success: boolean; error?: string; uniqueAppId?: string }>;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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

  // Check storage for onboarding and active Supabase session
  const checkSession = async () => {
    try {
      // 1. Check onboarding status
      const onboardingStatus = await AsyncStorage.getItem(AppConfig.storageKeys.ONBOARDING_COMPLETED);
      setOnboardingCompleted(onboardingStatus === 'true');

      // 2. Check Supabase active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        // Retrieve profile details
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, username, unique_app_id')
          .eq('id', session.user.id)
          .single();

        if (profile && !error) {
          setUser({
            id: profile.id,
            username: profile.username,
            unique_app_id: profile.unique_app_id,
          });
          setIsAuthenticated(true);
        } else {
          // If profile fetch fails, sign out
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUser(null);
        }
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

  const register = async (username: string, pass: string): Promise<{ success: boolean; error?: string; uniqueAppId?: string }> => {
    setIsLoading(true);
    try {
      const sanitizedUsername = username.trim().toLowerCase();
      const virtualEmail = `${sanitizedUsername}@ummati.app`;
      const uniqueAppId = generateUUID();

      // Check if username is already taken in our profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', sanitizedUsername)
        .maybeSingle();

      if (existingUser) {
        setIsLoading(false);
        return { success: false, error: 'Username is already taken. Please choose another.' };
      }

      // Create authentication account in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: pass,
        options: {
          data: {
            username: sanitizedUsername,
            unique_app_id: uniqueAppId,
          },
        },
      });

      if (authError) {
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      if (authData?.user) {
        // Wait a brief moment for the database trigger to complete inserting the profile
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, unique_app_id')
          .eq('id', authData.user.id)
          .single();

        if (profile && !profileError) {
          setUser({
            id: profile.id,
            username: profile.username,
            unique_app_id: profile.unique_app_id,
          });
          setIsAuthenticated(true);
          setIsLoading(false);
          return { success: true, uniqueAppId };
        } else {
          setIsLoading(false);
          return { success: false, error: profileError?.message || 'Profile creation failed.' };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Failed to create user session.' };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'An error occurred during registration.' };
    }
  };

  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const sanitizedUsername = username.trim().toLowerCase();
      const virtualEmail = `${sanitizedUsername}@ummati.app`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: pass,
      });

      if (authError) {
        setIsLoading(false);
        return { success: false, error: 'Invalid username or password.' };
      }

      if (authData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, unique_app_id')
          .eq('id', authData.user.id)
          .single();

        if (profile && !profileError) {
          setUser({
            id: profile.id,
            username: profile.username,
            unique_app_id: profile.unique_app_id,
          });
          setIsAuthenticated(true);
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return { success: false, error: 'Failed to fetch user profile.' };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Failed to restore session.' };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'An error occurred during login.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
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
