import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { AppConfig } from '../config/AppConfig';
import { supabase } from '../config/SupabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  gender: 'man' | 'woman' | null;
  unique_app_id: string;
  avatar_color: string;
  show_on_leaderboard: boolean;
  /** Guest account created with "Continue as guest" */
  is_guest: boolean;
}

type Result = { success: boolean; error?: string };
type Gender = 'man' | 'woman';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  onboardingCompleted: boolean;
  signUp: (username: string, password: string, gender: Gender) => Promise<Result>;
  signIn: (username: string, password: string) => Promise<Result>;
  continueAsGuest: () => Promise<Result>;
  /** Turn the current guest into a full account, keeping all progress */
  upgradeGuest: (username: string, password: string, gender: Gender) => Promise<Result>;
  updateProfile: (changes: Partial<Pick<UserProfile, 'username' | 'gender' | 'avatar_color' | 'show_on_leaderboard'>>) => Promise<Result>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Supabase Auth needs an email, so usernames map to an internal address nobody sees.
const LOGIN_DOMAIN = 'users.ummati.app';
export const USERNAME_RULE = /^[a-zA-Z0-9_.]{3,20}$/;
const loginEmail = (username: string) => `${username.trim().toLowerCase()}@${LOGIN_DOMAIN}`;

const friendlyError = (message?: string, status?: number) => {
  if (status === 500 || /database error/i.test(message ?? '')) {
    return 'The server could not create your account. Please re-run supabase_schema.sql and try again.';
  }
  if (!message || message === '{}') return 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'Incorrect username or password.';
  if (/already (registered|been registered)|already exists/i.test(message)) return 'That username is taken. Try another one.';
  if (/email not confirmed/i.test(message)) return 'Sign-in is blocked: turn off "Confirm email" in Supabase Auth settings.';
  if (/anonymous sign-ins are disabled/i.test(message)) return 'Guest mode is disabled: enable "Anonymous sign-ins" in Supabase Auth settings.';
  if (/signups not allowed/i.test(message)) return 'New sign-ups are currently disabled.';
  if (/network request failed/i.test(message)) return 'No internet connection.';
  return message;
};

async function fetchProfile(session: Session): Promise<UserProfile> {
  const { data } = await supabase
    .from('profiles')
    .select('username, gender, unique_app_id, avatar_color, show_on_leaderboard')
    .eq('id', session.user.id)
    .maybeSingle();

  const meta = session.user.user_metadata ?? {};
  const isGuest = !!session.user.is_anonymous;
  return {
    id: session.user.id,
    username: isGuest ? 'Guest' : data?.username ?? meta.username ?? 'Friend',
    gender: data?.gender ?? meta.gender ?? null,
    unique_app_id: data?.unique_app_id ?? session.user.id,
    avatar_color: data?.avatar_color ?? '#8FD1B0',
    show_on_leaderboard: data?.show_on_leaderboard ?? !isGuest,
    is_guest: isGuest,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session) {
      setUser(null);
      return;
    }
    try {
      setUser(await fetchProfile(session));
    } catch (e) {
      console.warn('[useAuth] Failed to load profile:', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const done = await AsyncStorage.getItem(AppConfig.storageKeys.ONBOARDING_COMPLETED);
        setOnboardingCompleted(done === 'true');
        const { data } = await supabase.auth.getSession();
        await applySession(data.session);
      } catch (e) {
        console.error('[useAuth] Error checking session:', e);
      } finally {
        setIsLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION is handled above; avoid a duplicate profile fetch
      if (event === 'INITIAL_SESSION') return;
      // Never await Supabase calls inside this callback: supabase-js holds its auth lock
      // here, so a query would deadlock. Defer the profile fetch until after it returns.
      setTimeout(() => applySession(session), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [applySession]);

  const completeOnboarding = async () => {
    setOnboardingCompleted(true);
    await AsyncStorage.setItem(AppConfig.storageKeys.ONBOARDING_COMPLETED, 'true').catch(() => {});
  };

  const validate = (username: string, password: string): string | null => {
    if (!USERNAME_RULE.test(username.trim())) return 'Username must be 3–20 letters, numbers, _ or .';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const signUp: AuthContextType['signUp'] = async (username, password, gender) => {
    const invalid = validate(username, password);
    if (invalid) return { success: false, error: invalid };
    const { data, error } = await supabase.auth.signUp({
      email: loginEmail(username),
      password,
      options: { data: { username: username.trim(), gender } },
    });
    if (error) return { success: false, error: friendlyError(error.message, error.status) };
    // Supabase hides duplicate sign-ups by returning a user with no identities
    if (data.user && data.user.identities?.length === 0) {
      return { success: false, error: friendlyError('already registered') };
    }
    if (!data.session) return { success: false, error: friendlyError('email not confirmed') };
    await completeOnboarding();
    await applySession(data.session);
    return { success: true };
  };

  const signIn: AuthContextType['signIn'] = async (username, password) => {
    if (!username.trim() || !password) return { success: false, error: 'Enter your username and password.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail(username), password });
    if (error) return { success: false, error: friendlyError(error.message, error.status) };
    await completeOnboarding();
    await applySession(data.session);
    return { success: true };
  };

  const continueAsGuest: AuthContextType['continueAsGuest'] = async () => {
    const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { username: 'Guest' } } });
    if (error) return { success: false, error: friendlyError(error.message, error.status) };
    await completeOnboarding();
    await applySession(data.session);
    return { success: true };
  };

  const upgradeGuest: AuthContextType['upgradeGuest'] = async (username, password, gender) => {
    const invalid = validate(username, password);
    if (invalid) return { success: false, error: invalid };
    // Supabase links the identity first, then allows setting a password on it
    const { data, error } = await supabase.auth.updateUser({
      email: loginEmail(username),
      data: { username: username.trim(), gender },
    });
    if (error) return { success: false, error: friendlyError(error.message, error.status) };
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) return { success: false, error: friendlyError(pwError.message, pwError.status) };
    // Same user id, so all XP/streaks/logs carry over; just fill in the profile
    await supabase
      .from('profiles')
      .update({ username: username.trim(), gender, show_on_leaderboard: true, updated_at: new Date().toISOString() })
      .eq('id', data.user.id);
    const { data: refreshed } = await supabase.auth.refreshSession();
    await applySession(refreshed.session);
    return { success: true };
  };

  const updateProfile: AuthContextType['updateProfile'] = async (changes) => {
    if (!user) return { success: false, error: 'Not signed in.' };
    const { error } = await supabase
      .from('profiles')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) return { success: false, error: friendlyError(error.message) };
    setUser({ ...user, ...changes });
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: !!user,
        user,
        onboardingCompleted,
        signUp,
        signIn,
        continueAsGuest,
        upgradeGuest,
        updateProfile,
        logout,
        completeOnboarding,
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
