import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent, Platform, TextInput } from 'react-native';
import { Theme } from '../../../core/theme/theme';
import { useAuth } from '../../../core/hooks/useAuth';

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
  },
  {
    title: 'Setup Your Profile',
    type: 'profile_setup'
  }
];

export function OnboardingScreen() {
  const { register } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Profile setup states
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'man' | 'woman' | null>(null);

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
    if (!name.trim() || !gender) return;
    await register(name.trim(), gender);
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
          scrollEnabled={activeIndex < slides.length - 1 || (!!name.trim() && !!gender)}
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
              ) : slide.type === 'profile_setup' ? (
                <View style={styles.profileSetupContainer}>
                  {/* Name Input */}
                  <Text style={styles.label}>What should we call you?</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Enter your name..."
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />

                  {/* Gender Selection */}
                  <Text style={styles.label}>Select Gender</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      style={[
                        styles.genderCard,
                        gender === 'man' ? styles.genderCardActive : null
                      ]}
                      onPress={() => setGender('man')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.genderEmoji}>👨</Text>
                      <Text style={[
                        styles.genderLabel,
                        gender === 'man' ? styles.genderLabelActive : null
                      ]}>Man</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderCard,
                        gender === 'woman' ? styles.genderCardActive : null
                      ]}
                      onPress={() => setGender('woman')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.genderEmoji}>🧕</Text>
                      <Text style={[
                        styles.genderLabel,
                        gender === 'woman' ? styles.genderLabelActive : null
                      ]}>Woman</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.descContainer}>
                  <View style={styles.descIconCircle}>
                    <Text style={styles.descIconText}>{slide.icon}</Text>
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
            <TouchableOpacity
              style={[
                styles.getStartedButton,
                (!name.trim() || !gender) ? styles.getStartedButtonDisabled : null
              ]}
              onPress={handleGetStarted}
              disabled={!name.trim() || !gender}
            >
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
    flex: 1.0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
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
    marginBottom: 5,
    zIndex: 10,
  },
  moonEmoji: {
    fontSize: 40,
    color: Theme.colors.accent,
  },
  mosqueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 80,
    width: '100%',
    marginBottom: 10,
  },
  mosqueBase: {
    width: 90,
    height: 45,
    backgroundColor: '#0F9F68',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mosqueDomeMain: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0E8F5D',
    top: -25,
  },
  mosqueDomeLeft: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10A96E',
    left: -13,
    bottom: 0,
  },
  mosqueDomeRight: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10A96E',
    right: -13,
    bottom: 0,
  },
  mosqueGate: {
    width: 20,
    height: 26,
    backgroundColor: '#E6F4EA',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  minaretLeft: {
    width: 9,
    height: 65,
    backgroundColor: '#0E8F5D',
    marginRight: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  minaretRight: {
    width: 9,
    height: 65,
    backgroundColor: '#0E8F5D',
    marginLeft: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#046C4E',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#0E8F5D',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
  whiteCard: {
    flex: 1.4,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingVertical: 20,
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
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 16,
  },
  bulletsContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 14,
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
    marginBottom: 14,
    borderColor: '#C2E7D9',
    borderWidth: 1,
  },
  descIconText: {
    fontSize: 32,
  },
  descText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileSetupContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 10,
  },
  nameInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Theme.colors.text,
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  genderCardActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#0E9F6E',
    borderWidth: 2,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  genderEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  genderLabelActive: {
    color: '#0E9F6E',
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
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0E9F6E',
    fontSize: 15,
    fontWeight: 'bold',
  },
  getStartedButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 28,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  getStartedButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: 'transparent',
    elevation: 0,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
