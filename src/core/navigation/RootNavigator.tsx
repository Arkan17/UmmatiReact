import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, Compass, User, HelpCircle, Users } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

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
  QuranReading: { surahNumber?: number; surahName?: string; translationName?: string; juzNumber?: number; juzName?: string };
  Qibla: undefined;
  Tasbih: undefined;
  Mosque: undefined;
  Kalimas: undefined;
  NamesOfAllah: undefined;
  Duas: undefined;
  LiveStreams: undefined;
  Naats: undefined;
  Calendar: undefined;
  KidsSection: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  QuranTab: undefined;
  MosqueTab: undefined;
  CommunityTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Custom Mosque outline icon for floating action button
const MosqueSvg = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3c-.15 0-.27.12-.27.27v1.09c-1.38.16-2.45 1.33-2.45 2.76h5.45c0-1.43-1.07-2.6-2.45-2.76V3.27c0-.15-.12-.27-.27-.27Z"
      fill={color}
    />
    <Path
      d="M3 19h18M5 19v-6.5a1.5 1.5 0 011.5-1.5h11a1.5 1.5 0 011.5 1.5V19M8 19v-4a2 2 0 014 0v4M12 11V8M8 11V9.5M16 11V9.5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom Profile Icon with Green Active Dot
function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size + 6, height: size + 6, justifyContent: 'center', alignItems: 'center' }}>
      <User color={color} size={size} />
      <View
        style={{
          position: 'absolute',
          right: 2,
          top: 2,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#0E9F6E',
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

// Custom Tab Bar component to match the mockup exactly
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'MosqueTab') {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.fabTabButton}
              activeOpacity={0.85}
            >
              <View style={styles.fabCircle}>
                <MosqueSvg color="#FFFFFF" size={26} />
              </View>
            </TouchableOpacity>
          );
        }

        let IconComponent: any;
        let tabLabel = '';

        if (route.name === 'HomeTab') {
          IconComponent = Home;
          tabLabel = 'Home';
        } else if (route.name === 'QuranTab') {
          IconComponent = BookOpen;
          tabLabel = 'Quran';
        } else if (route.name === 'CommunityTab') {
          IconComponent = Users;
          tabLabel = 'Community';
        } else if (route.name === 'ProfileTab') {
          IconComponent = ProfileTabIcon;
          tabLabel = 'Profile';
        }

        const tintColor = isFocused ? '#0E9F6E' : '#94A3B8';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconWrapper,
              isFocused ? styles.iconWrapperActive : styles.iconWrapperInactive
            ]}>
              {route.name === 'ProfileTab' ? (
                <ProfileTabIcon color={tintColor} size={20} />
              ) : (
                <IconComponent color={tintColor} size={20} />
              )}
            </View>
            <Text style={[
              styles.tabBarLabel,
              { color: tintColor }
            ]}>
              {tabLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 1. Bottom Tab Navigation for Logged-In App Context
function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="QuranTab" component={SurahListScreen} />
      <Tab.Screen name="MosqueTab" component={MosqueScreen} />
      <Tab.Screen name="CommunityTab" component={ExploreScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
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

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Onboarding Flow
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Logged-in App Stack
          <>
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
            <Stack.Screen name="KidsSection" component={KidsSectionScreen} />
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
  fabContainer: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0E9F6E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 4,
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: '#E6F4EA',
  },
  iconWrapperInactive: {
    backgroundColor: 'transparent',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  fabTabButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
