import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, LayoutChangeEvent } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Home, BookOpen, User, Users } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { AnimatedSplash } from '../components/AnimatedSplash';
import { BRAND } from '../components/UmmatiLogo';
import { BrutalPressable, PressableScale, haptic } from '../components/ui';
import { brutal } from '../theme/palettes';
import { schedulePrayerNotifications } from '../notifications/prayerNotifications';

import { OnboardingScreen } from '../../features/onboarding/screens/OnboardingScreen';
import { AuthScreen } from '../../features/auth/screens/AuthScreen';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { PrayerTimesScreen } from '../../features/home/screens/PrayerTimesScreen';
import { SurahListScreen } from '../../features/quran/screens/SurahListScreen';
import { QuranReadingScreen } from '../../features/quran/screens/QuranReadingScreen';
import { QiblaScreen } from '../../features/qibla/screens/QiblaScreen';
import { TasbihScreen } from '../../features/tasbih/screens/TasbihScreen';
import { MosqueScreen } from '../../features/mosques/screens/MosqueScreen';
import { CommunityScreen } from '../../features/community/screens/CommunityScreen';
import { ComposePostScreen } from '../../features/community/screens/ComposePostScreen';
import { PostDetailScreen } from '../../features/community/screens/PostDetailScreen';
import { UserProfileScreen } from '../../features/community/screens/UserProfileScreen';
import { NotificationsScreen } from '../../features/community/screens/NotificationsScreen';
import { ModerationScreen } from '../../features/community/screens/ModerationScreen';
import { BlockedUsersScreen } from '../../features/community/screens/BlockedUsersScreen';
import { KhatamGroupScreen } from '../../features/community/screens/KhatamGroupScreen';
import { GroupDetailScreen } from '../../features/community/screens/GroupDetailScreen';
import { CreateEventScreen } from '../../features/community/screens/CreateEventScreen';
import { CommunityAlertsListener } from '../../features/community/notifications/CommunityAlertsListener';
import type { Attachment, Category } from '../../features/community/api/types';
import { KidsSectionScreen } from '../../features/kids/screens/KidsSectionScreen';
import { ProphetStoryScreen } from '../../features/kids/screens/ProphetStoryScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { DevelopersNoteScreen } from '../../features/profile/screens/DevelopersNoteScreen';

// Sub Explore Screens
import { KalimasScreen } from '../../features/explore/screens/KalimasScreen';
import { NamesOfAllahScreen } from '../../features/explore/screens/NamesOfAllahScreen';
import { DuasScreen } from '../../features/explore/screens/DuasScreen';
import { LiveStreamsScreen } from '../../features/explore/screens/LiveStreamsScreen';
import { NaatsScreen } from '../../features/explore/screens/NaatsScreen';
import { CalendarScreen } from '../../features/explore/screens/CalendarScreen';
import { ZakatCalculatorScreen } from '../../features/zakat/screens/ZakatCalculatorScreen';
import { QadaTrackerScreen } from '../../features/qada/screens/QadaTrackerScreen';
import { FastingHubScreen } from '../../features/fasting/screens/FastingHubScreen';

// Types defining navigation routes
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: { mode?: 'signin' | 'signup' | 'upgrade' } | undefined;
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
  ZakatCalculator: undefined;
  QadaTracker: undefined;
  FastingHub: undefined;
  KidsSection: undefined;
  ProphetStory: { id: string };
  ComposePost: { category?: Category; groupId?: string; groupName?: string; attachment?: Attachment } | undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  CommunityNotifications: undefined;
  Moderation: undefined;
  BlockedUsers: undefined;
  KhatamGroup: { id: string };
  GroupDetail: { id: string };
  CreateEvent: { groupId?: string } | undefined;
  DevelopersNote: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  PrayerTimes: undefined;
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
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
    </HomeStack.Navigator>
  );
}

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

const TABS: Record<keyof TabParamList, { label: string; Icon?: typeof Home }> = {
  HomeTab: { label: 'Home', Icon: Home },
  QuranTab: { label: 'Quran', Icon: BookOpen },
  MosqueTab: { label: 'Mosques' },
  CommunityTab: { label: 'Community', Icon: Users },
  ProfileTab: { label: 'Profile', Icon: User },
};

// Floating tab bar with a spring-animated pill that slides to the active tab
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = useState(0);
  const pillX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth) pillX.value = withSpring(state.index * tabWidth, { damping: 22, stiffness: 260 });
  }, [state.index, tabWidth, pillX]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));
  const onLayout = (e: LayoutChangeEvent) => setTabWidth((e.nativeEvent.layout.width - 16 - 2 * brutal.border) / state.routes.length);
  const activeIsFab = state.routes[state.index]?.name === 'MosqueTab';

  return (
    <View style={[styles.tabBarWrap, { bottom: Math.max(insets.bottom, 12) }]}>
    {/* Hard offset shadow */}
    <View pointerEvents="none" style={[styles.tabBarShadow, { backgroundColor: colors.ink }]} />
    <View
      onLayout={onLayout}
      style={[styles.tabBar, { backgroundColor: colors.tabBar, borderColor: colors.ink }]}
    >
      {tabWidth > 0 && !activeIsFab && (
        <Animated.View style={[styles.pill, { width: tabWidth - 12, backgroundColor: colors.accentSoft, borderColor: colors.ink }, pillStyle]} />
      )}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TABS[route.name as keyof TabParamList];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            haptic.select();
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'MosqueTab') {
          return (
            <View key={route.key} style={styles.tabButton}>
              <BrutalPressable onPress={onPress} hapticOnPress={false} fill={colors.primary} radius={20} offset={brutal.shadowSmall} style={styles.fab}>
                <MosqueSvg color={colors.onPrimary} size={26} />
              </BrutalPressable>
            </View>
          );
        }

        const tint = isFocused ? colors.text : colors.textMuted;
        const Icon = tab.Icon!;
        return (
          <PressableScale key={route.key} onPress={onPress} hapticOnPress={false} style={styles.tabButton} accessibilityRole="button" accessibilityState={{ selected: isFocused }}>
            <Icon color={tint} size={21} strokeWidth={isFocused ? 2.6 : 2} />
            <Text style={[styles.tabLabel, { color: tint, fontWeight: isFocused ? '900' : '700' }]}>{tab.label}</Text>
          </PressableScale>
        );
      })}
    </View>
    </View>
  );
}

const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

function BottomTabNavigator() {
  return (
    <>
      {/* Signed-in only: turns live community activity into local alerts */}
      <CommunityAlertsListener />
      <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false, animation: 'shift', freezeOnBlur: true }}>
        <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
        <Tab.Screen name="QuranTab" component={SurahListScreen} />
        <Tab.Screen name="MosqueTab" component={MosqueScreen} />
        <Tab.Screen name="CommunityTab" component={CommunityScreen} />
        <Tab.Screen name="ProfileTab" component={ProfileScreen} />
      </Tab.Navigator>
    </>
  );
}

export default function RootNavigator() {
  const { isLoading, isAuthenticated, onboardingCompleted } = useAuth();
  const { colors } = useAppTheme();
  const [splashVisible, setSplashVisible] = useState(true);
  const hideSplash = useCallback(() => setSplashVisible(false), []);

  // Keep the next week of Adhan notifications queued whenever a user is signed in
  useEffect(() => {
    if (isAuthenticated) schedulePrayerNotifications();
  }, [isAuthenticated]);

  const navTheme = {
    ...(colors.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(colors.isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.paper }}>
      <StatusBar barStyle={splashVisible ? 'dark-content' : colors.statusBar} translucent backgroundColor="transparent" />
      {!isLoading && (
        <NavigationContainer theme={navTheme}>
          {/* freezeOnBlur: screens hidden under the stack stop re-rendering until they're visible again */}
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
            {!isAuthenticated ? (
              <>
                {!onboardingCompleted && <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />}
                {/* `Auth` exists in both branches; a different navigationKey per branch makes React Navigation
                    drop the open Auth route on sign-in/out instead of keeping the user on it */}
                <Stack.Screen navigationKey="signed-out" name="Auth" component={AuthScreen} options={{ animation: 'fade_from_bottom' }} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainApp" component={BottomTabNavigator} options={{ animation: 'fade' }} />
                <Stack.Screen name="QuranReading" component={QuranReadingScreen} />
                <Stack.Screen name="Qibla" component={QiblaScreen} />
                <Stack.Screen name="Tasbih" component={TasbihScreen} />
                <Stack.Screen name="Mosque" component={MosqueScreen} />
                <Stack.Screen name="Kalimas" component={KalimasScreen} />
                <Stack.Screen name="NamesOfAllah" component={NamesOfAllahScreen} />
                <Stack.Screen name="Duas" component={DuasScreen} />
                <Stack.Screen name="LiveStreams" component={LiveStreamsScreen} />
                <Stack.Screen name="Naats" component={NaatsScreen} />
                <Stack.Screen name="Calendar" component={CalendarScreen} />
                <Stack.Screen name="ZakatCalculator" component={ZakatCalculatorScreen} />
                <Stack.Screen name="QadaTracker" component={QadaTrackerScreen} />
                <Stack.Screen name="FastingHub" component={FastingHubScreen} />
                <Stack.Screen name="KidsSection" component={KidsSectionScreen} />
                <Stack.Screen name="ProphetStory" component={ProphetStoryScreen} />
                <Stack.Screen name="ComposePost" component={ComposePostScreen} options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                <Stack.Screen name="CommunityNotifications" component={NotificationsScreen} />
                <Stack.Screen name="Moderation" component={ModerationScreen} />
                <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
                <Stack.Screen name="KhatamGroup" component={KhatamGroupScreen} />
                <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
                <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="DevelopersNote" component={DevelopersNoteScreen} />
                {/* Lets a guest turn their session into a full account */}
                <Stack.Screen navigationKey="signed-in" name="Auth" component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      )}
      {splashVisible && <AnimatedSplash ready={!isLoading} onFinish={hideSplash} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: { position: 'absolute', left: 14, right: 18, height: 68 },
  tabBarShadow: { position: 'absolute', top: brutal.shadow, left: brutal.shadow, right: -brutal.shadow, bottom: -brutal.shadow, borderRadius: 26 },
  tabBar: {
    flex: 1,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: brutal.border,
  },
  pill: {
    position: 'absolute',
    left: 14,
    height: 50,
    borderRadius: 16,
    borderWidth: brutal.borderThin,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabLabel: { fontSize: 10.5, marginTop: 4, letterSpacing: 0.2 },
  fab: {
    width: 58,
    height: 58,
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
