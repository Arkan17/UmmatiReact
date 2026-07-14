import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';
import { Theme } from '../../../core/theme/theme';
import { useAuth } from '../../../core/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    title: 'A better you,\nEvery single day',
    type: 'bullets',
    bullets: [
      { text: 'Read Quran & Earn Rewards', icon: '📖' },
      { text: 'Never Miss Your Prayers', icon: '⏰' },
      { text: 'Track Your Deen Progress', icon: '📈' },
      { text: 'Learn, Grow & Stay Motivated', icon: '💡' },
    ]
  },
  {
    title: 'Quran & Daily Duas',
    type: 'description',
    description: 'Read the Holy Quran with Arabic script and English translations. Complete with audio recitations and a daily library of categorized Duas.',
    icon: '📖'
  },
  {
    title: 'Prayer & Qibla Direction',
    type: 'description',
    description: 'Get precise prayer times for your current location. Find nearby mosques, check jamaat times, and locate the Qibla using our interactive compass.',
    icon: '🧭'
  },
  {
    title: 'Interactive Kids Zone',
    type: 'description',
    description: 'Teach kids about Islamic stories, learn how to perform Wudu and Salah step-by-step, and test their knowledge with fun, reward-based quizzes.',
    icon: '👶'
  }
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const { completeOnboarding, register } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleGetStarted = async () => {
    // 1. Mark onboarding completed
    await completeOnboarding();

    // 2. Register guest session under the hood
    try {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const guestUsername = `guest_${randomId}`;
      const guestPassword = `Pass_${randomId}_Secure`;
      
      await register(guestUsername, guestPassword);
    } catch (e) {
      console.warn('Background guest registration failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Graphic Header with Mosque illustration */}
      <View style={styles.graphicHeader}>
        <View style={styles.ambientLight} />
        <View style={styles.moonGraphic}>
          <Text style={styles.moonEmoji}>🌙</Text>
        </View>
        
        {/* Styled Mosque vector construction */}
        <View style={styles.mosqueContainer}>
          <View style={styles.minaretLeft} />
          <View style={styles.mosqueBase}>
            <View style={styles.mosqueDomeMain} />
            <View style={styles.mosqueDomeLeft} />
            <View style={styles.mosqueDomeRight} />
            <View style={styles.mosqueGate} />
          </View>
          <View style={styles.minaretRight} />
        </View>
        
        <Text style={styles.brandTitle}>UMMATI</Text>
        <Text style={styles.brandSubtitle}>Your Daily Companion{"\n"}For Deen & Duniya</Text>
      </View>

      {/* 2. White Slider Card Container */}
      <View style={styles.whiteCard}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slider}
        >
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              
              {slide.type === 'bullets' ? (
                <View style={styles.bulletsContainer}>
                  {slide.bullets?.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <View style={styles.bulletIconBg}>
                        <Text style={styles.bulletIconText}>{bullet.icon}</Text>
                      </View>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.descContainer}>
                  <View style={styles.descIconCircle}>
                    <Text style={{ fontSize: 36 }}>{slide.icon}</Text>
                  </View>
                  <Text style={styles.descText}>{slide.description}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* 3. Pagination Dots & Next/Get Started Button */}
        <View style={styles.bottomActions}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index ? styles.activeDot : null,
                ]}
              />
            ))}
          </View>

          {activeIndex < slides.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4EA', // Light mint green tint background
  },
  graphicHeader: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    position: 'relative',
  },
  ambientLight: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    top: -50,
  },
  moonGraphic: {
    marginBottom: 10,
    zIndex: 10,
  },
  moonEmoji: {
    fontSize: 48,
    color: Theme.colors.accent,
  },
  mosqueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 90,
    width: '100%',
    marginBottom: 20,
  },
  mosqueBase: {
    width: 100,
    height: 50,
    backgroundColor: '#0F9F68',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mosqueDomeMain: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0E8F5D',
    top: -30,
  },
  mosqueDomeLeft: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10A96E',
    left: -15,
    bottom: 0,
  },
  mosqueDomeRight: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10A96E',
    right: -15,
    bottom: 0,
  },
  mosqueGate: {
    width: 24,
    height: 30,
    backgroundColor: '#E6F4EA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  minaretLeft: {
    width: 10,
    height: 75,
    backgroundColor: '#0E8F5D',
    marginRight: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  minaretRight: {
    width: 10,
    height: 75,
    backgroundColor: '#0E8F5D',
    marginLeft: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#046C4E',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#0E8F5D',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  bulletsContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  bulletIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletIconText: {
    fontSize: 16,
  },
  bulletText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  descContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  descIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderColor: '#C2E7D9',
    borderWidth: 1,
  },
  descText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomActions: {
    paddingHorizontal: 24,
    marginTop: 10,
    gap: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0E9F6E',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0E9F6E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  getStartedButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 28,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
