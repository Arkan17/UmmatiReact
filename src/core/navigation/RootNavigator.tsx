import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, Compass, User, HelpCircle } from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth';
import { Theme } from '../theme/theme';

// Skeletons / Features imports (will be created in subsequent steps)
import { OnboardingScreen } from '../../features/onboarding/screens/OnboardingScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { SurahListScreen } from '../../features/quran/screens/SurahListScreen';
import { QuranReadingScreen } from '../../features/quran/screens/QuranReadingScreen';
import { QiblaScreen } from '../../features/qibla/screens/QiblaScreen';
import { TasbihScreen } from '../../features/tasbih/screens/TasbihScreen';
import { MosqueScreen } from '../../features/mosques/screens/MosqueScreen';
import { ExploreScreen } from '../../features/explore/screens/ExploreScreen';
import { KidsSectionScreen } from '../../features/kids/screens/KidsSectionScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';

// Sub Explore Screens
import { KalimasScreen } from '../../features/explore/screens/KalimasScreen';
import { NamesOfAllahScreen } from '../../features/explore/screens/NamesOfAllahScreen';
import { DuasScreen } from '../../features/explore/screens/DuasScreen';
import { LiveStreamsScreen } from '../../features/explore/screens/LiveStreamsScreen';
import { NaatsScreen } from '../../features/explore/screens/NaatsScreen';
import { CalendarScreen } from '../../features/explore/screens/CalendarScreen';

// Types defining navigation routes
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  QuranReading: { surahNumber: number; surahName: string; translationName: string };
  Qibla: undefined;
  Tasbih: undefined;
  Mosque: undefined;
  Kalimas: undefined;
  NamesOfAllah: undefined;
  Duas: undefined;
  LiveStreams: undefined;
  Naats: undefined;
  Calendar: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  QuranTab: undefined;
  ExploreTab: undefined;
  KidsTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 1. Bottom Tab Navigation for Logged-In App Context
function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="QuranTab"
        component={SurahListScreen}
        options={{
          tabBarLabel: 'Quran',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="KidsTab"
        component={KidsSectionScreen}
        options={{
          tabBarLabel: 'Kids',
          tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// 2. Custom Splash Screen displayed during boot/session check
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>أمتي</Text>
      </View>
      <Text style={styles.splashTitle}>Ummati</Text>
      <Text style={styles.splashSubtitle}>Your Daily Islamic Companion</Text>
      <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.spinner} />
    </View>
  );
}

// 3. Root Navigation Manager
export default function RootNavigator() {
  const { isLoading, isAuthenticated, onboardingCompleted } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted ? (
          // Onboarding Flow
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Logged-in App Stack (Bypassing Login/Register screens)
          <>
            {/* Login and Register screens are bypassed/commented out */}
            {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
            {/* <Stack.Screen name="Register" component={RegisterScreen} /> */}
            
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen name="QuranReading" component={QuranReadingScreen} />
            <Stack.Screen name="Qibla" component={QiblaScreen} />
            <Stack.Screen name="Tasbih" component={TasbihScreen} />
            <Stack.Screen name="Mosque" component={MosqueScreen} />
            
            {/* Explore Sub-Screens */}
            <Stack.Screen name="Kalimas" component={KalimasScreen} />
            <Stack.Screen name="NamesOfAllah" component={NamesOfAllahScreen} />
            <Stack.Screen name="Duas" component={DuasScreen} />
            <Stack.Screen name="LiveStreams" component={LiveStreamsScreen} />
            <Stack.Screen name="Naats" component={NaatsScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
    letterSpacing: 1.5,
  },
  splashSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 8,
  },
  spinner: {
    marginTop: 40,
  },
});
