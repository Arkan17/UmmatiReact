import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Award, BookOpen, CheckCircle, ChevronRight, Droplets, Heart, MessageCircle,
  Smile, Sparkles, Star, Trophy, XCircle,
} from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { awardXp, incrementActivity } from '../../../core/services/progress';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalPressable, Card, PressableScale, ProgressBar, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { brutal, tints } from '../../../core/theme/palettes';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { ComicScene, PANEL_RATIO } from '../components/ComicScene';
import { INK } from '../components/comicProps';
import { PROPHET_STORIES, getReadStories } from '../data/prophetStories';
import type { ProphetStory } from '../data/types';

type TabKey = 'stories' | 'guide' | 'quiz';
type GuideKey = 'wudu' | 'salah' | 'words';

const TABS: { key: TabKey; label: string; Icon: typeof BookOpen; tint: string }[] = [
  { key: 'stories', label: 'Stories', Icon: BookOpen, tint: tints.green },
  { key: 'guide', label: 'Guides', Icon: Smile, tint: tints.blue },
  { key: 'quiz', label: 'Quiz', Icon: Award, tint: tints.gold },
];

const GUIDES: { key: GuideKey; label: string; Icon: typeof BookOpen; tint: string }[] = [
  { key: 'wudu', label: 'How to Wudu', Icon: Droplets, tint: tints.blue },
  { key: 'salah', label: 'How to Pray', Icon: Heart, tint: tints.violet },
  { key: 'words', label: 'Dhikr Words', Icon: MessageCircle, tint: tints.rose },
];

const STEP_TINTS = [tints.green, tints.blue, tints.violet, tints.rose, tints.orange, tints.gold, tints.teal, tints.indigo];
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Quiz answer that springs on reveal: pops when correct, shakes when wrong. */
function QuizOption({ label, letter, state, disabled, onPress }: {
  label: string;
  letter: string;
  state: 'idle' | 'correct' | 'wrong' | 'dim';
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (state === 'correct') {
      scale.value = withSequence(withSpring(1.05, { damping: 6, stiffness: 300 }), withSpring(1));
    } else if (state === 'wrong') {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 70 }),
        withTiming(-6, { duration: 70 }),
        withTiming(6, { duration: 70 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [state, scale, shake]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: shake.value }] }));

  // Flat fills with ink content on every state
  const bg = state === 'correct' ? colors.success : state === 'wrong' ? colors.danger : colors.surface;
  const fg = state === 'correct' || state === 'wrong' ? colors.ink : colors.text;
  const badgeBg = state === 'correct' || state === 'wrong' ? colors.surface : colors.accentSoft;

  return (
    <Animated.View style={[animated, { opacity: state === 'dim' ? 0.55 : 1 }]}>
      <BrutalPressable
        onPress={onPress}
        disabled={disabled}
        hapticOnPress={false}
        fill={bg}
        offset={state === 'dim' ? 0 : brutal.shadowSmall}
        borderWidth={brutal.borderThin}
        style={styles.option}
      >
        <View style={[styles.optionLetter, outline(colors), { backgroundColor: badgeBg }]}>
          <Text style={[styles.optionLetterText, { color: colors.text }]}>{letter}</Text>
        </View>
        <Text style={[styles.optionText, { color: fg }]}>{label}</Text>
        {state === 'correct' ? <CheckCircle color={colors.ink} size={22} strokeWidth={2.5} /> : null}
        {state === 'wrong' ? <XCircle color={colors.ink} size={22} strokeWidth={2.5} /> : null}
      </BrutalPressable>
    </Animated.View>
  );
}

/** Comic-book cover for one Prophet story in the library grid. */
function StoryCover({ story, number, width, read, onPress }: {
  story: ProphetStory; number: number; width: number; read: boolean; onPress: () => void;
}) {
  const sceneW = width - brutal.border * 2;
  return (
    <BrutalPressable onPress={onPress} fill={story.tint} radius={18} offset={brutal.shadowSmall} style={{ width }}>
      <View style={[styles.coverArt, { height: sceneW * PANEL_RATIO }]}>
        {/* Covers stay still: 25 looping scenes at once would cost too many frames */}
        <ComicScene scene={story.cover} width={sceneW} animate={false} />
        <View style={[styles.coverNum, outline({ ink: INK })]}>
          <Text style={styles.coverNumText}>{number}</Text>
        </View>
        {read ? (
          <View style={[styles.coverRead, outline({ ink: INK })]}>
            <CheckCircle color={INK} size={14} strokeWidth={2.8} />
          </View>
        ) : null}
      </View>
      <View style={[styles.coverBody, { borderTopColor: INK }]}>
        <View style={styles.rowBetween}>
          <Text style={styles.coverProphet} numberOfLines={1}>{story.prophet.replace('Prophet ', '')}</Text>
          <Text style={styles.coverArabic}>{story.arabic}</Text>
        </View>
        <Text style={styles.coverTitle} numberOfLines={2}>{story.title}</Text>
        <Text style={styles.coverPages}>{story.panels.length} pages</Text>
      </View>
    </BrutalPressable>
  );
}

export function KidsSectionScreen() {
  const { user } = useAuth();
  const { content } = useDynamicContent();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const kidsData = content.kids || { stories: [], wudu_steps: [], salah_steps: [], words: [], quiz_questions: [] };
  const wuduSteps = kidsData.wudu_steps || [];
  const salahSteps = kidsData.salah_steps || [];
  const words = kidsData.words || [];
  const quizQuestions = kidsData.quiz_questions || [];

  // Section Navigation ('stories' | 'guide' | 'quiz')
  const [activeTab, setActiveTab] = useState<TabKey>('stories');

  // Finished Prophet stories (refreshed whenever the reader returns here)
  const [readIds, setReadIds] = useState<string[]>([]);
  useFocusEffect(useCallback(() => { getReadStories().then(setReadIds); }, []));
  const coverW = (width - 18 * 2 - 14) / 2;

  // Wudu vs Salah Guide Toggle
  const [guideType, setGuideType] = useState<GuideKey>('wudu');

  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const activeQuestion = quizQuestions[currentQIdx] || { q: '', options: [], correct: 0 };

  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedAns !== null) return; // prevent multiple taps
    setSelectedAns(optionIdx);
    if (optionIdx === activeQuestion.correct) {
      haptic.success();
      setScore(score + 1);
    } else {
      haptic.medium();
    }
  };

  const handleNextQuestion = () => {
    setSelectedAns(null);
    if (currentQIdx < quizQuestions.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    } else {
      setQuizFinished(true);
      haptic.success();
      awardQuizXP();
    }
  };

  const awardQuizXP = async () => {
    if (!user) return;
    const earnedXp = score * 20; // 20 XP per correct answer
    try {
      await awardXp(earnedXp, 'kids_quiz');
      await incrementActivity('kids', { quizzes: 1, correct: score, questions: quizQuestions.length });
    } catch (e) {
      console.warn('Failed to save kids quiz XP locally:', e);
    }
  };

  const restartQuiz = () => {
    setCurrentQIdx(0);
    setSelectedAns(null);
    setScore(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  const guideSteps = guideType === 'wudu' ? wuduSteps : salahSteps;
  const activeGuide = GUIDES.find((g) => g.key === guideType)!;
  const pct = quizQuestions.length > 0 ? score / quizQuestions.length : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Kids Islamic Corner"
        subtitle="Learn and earn XP through games and stories!"
        onBack={() => navigation.goBack()}
      >
        {/* Tab Selectors */}
        <View style={[styles.tabsRow, { backgroundColor: colors.glass, borderColor: colors.ink }]}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <PressableScale
                key={t.key}
                onPress={() => { haptic.select(); setActiveTab(t.key); }}
                hapticOnPress={false}
                style={[styles.tabBtn, active ? [outline(colors), { backgroundColor: t.tint }] : null]}
              >
                <t.Icon color={active ? colors.ink : colors.onSky} size={17} strokeWidth={2.4} />
                <Text style={[styles.tabText, { color: active ? colors.ink : colors.onSky }]}>{t.label}</Text>
              </PressableScale>
            );
          })}
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: Stories of the Prophets (comic library) */}
        {activeTab === 'stories' ? (
          <View>
            <Animated.View entering={FadeInDown.duration(350)}>
              <Card style={styles.libraryHero}>
                <View style={styles.rowBetween}>
                  <View style={[styles.pill, outline(colors), { backgroundColor: tints.green }]}>
                    <BookOpen color={colors.ink} size={13} strokeWidth={2.5} />
                    <Text style={[styles.pillText, { color: colors.ink }]}>COMIC STORIES</Text>
                  </View>
                  <Sparkles color={colors.text} fill={colors.accent} size={20} />
                </View>
                <Text style={[styles.libraryTitle, { color: colors.text }]}>Stories of the Prophets</Text>
                <Text style={[styles.libraryDesc, { color: colors.textSecondary }]}>
                  All {PROPHET_STORIES.length} Prophets named in the Quran, from Adam (AS) to Muhammad ﷺ. Finish a story to earn +50 XP!
                </Text>
                <View style={styles.progressWrap}>
                  <ProgressBar value={readIds.length / PROPHET_STORIES.length} color={colors.primary} track={colors.surfaceAlt} />
                </View>
                <Text style={[styles.libraryCount, { color: colors.textMuted }]}>{readIds.length} OF {PROPHET_STORIES.length} READ</Text>
              </Card>
            </Animated.View>

            <View style={styles.coverGrid}>
              {PROPHET_STORIES.map((story, i) => (
                <Animated.View key={story.id} entering={FadeInDown.delay(Math.min(i * 40, 480)).duration(350)}>
                  <StoryCover
                    story={story}
                    number={i + 1}
                    width={coverW}
                    read={readIds.includes(story.id)}
                    onPress={() => navigation.navigate('ProphetStory', { id: story.id })}
                  />
                </Animated.View>
              ))}
            </View>
            <Text style={[styles.libraryNote, { color: colors.textMuted }]}>
              Out of respect, the Prophets and angels (peace be upon them) are never drawn — the scenes tell the story.
            </Text>
          </View>
        ) : null}

        {/* TAB 2: Beginner Guides */}
        {activeTab === 'guide' ? (
          <View>
            {/* Inner Sub Tabs */}
            <View style={styles.guideTiles}>
              {GUIDES.map((g, i) => {
                const active = guideType === g.key;
                return (
                  <Animated.View key={g.key} entering={FadeInDown.delay(i * 60)} style={styles.guideTileWrap}>
                    <BrutalPressable
                      onPress={() => setGuideType(g.key)}
                      fill={active ? g.tint : colors.surface}
                      offset={active ? brutal.shadow : brutal.shadowSmall}
                      radius={22}
                      style={styles.guideTile}
                    >
                      <View style={[styles.guideTileIcon, outline(colors), { backgroundColor: active ? colors.surface : g.tint }]}>
                        <g.Icon color={colors.ink} size={22} strokeWidth={2.4} />
                      </View>
                      <Text style={[styles.guideTileText, { color: active ? colors.ink : colors.text }]} numberOfLines={2}>{g.label}</Text>
                    </BrutalPressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Displaying selected guide */}
            {guideType === 'wudu' || guideType === 'salah' ? (
              <View key={guideType}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {guideType === 'wudu' ? 'Steps for performing Wudu (Ablution)' : 'Steps for performing Salah (Prayer)'}
                </Text>
                {guideSteps.map((step, idx) => {
                  const tint = STEP_TINTS[idx % STEP_TINTS.length];
                  return (
                    <Animated.View key={idx} entering={FadeInDown.delay(Math.min(idx * 50, 400))}>
                      <Card style={styles.stepCard}>
                        <View style={[styles.stepBadge, outline(colors), { backgroundColor: tint }]}>
                          <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                      </Card>
                    </Animated.View>
                  );
                })}
              </View>
            ) : null}

            {guideType === 'words' ? (
              <View key="words">
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Beautiful words to say</Text>
                {words.map((w, idx) => (
                  <Animated.View key={w.word} entering={FadeInDown.delay(Math.min(idx * 50, 400))}>
                    <Card style={styles.wordCard}>
                      <View style={[styles.wordAccent, outline(colors), { backgroundColor: activeGuide.tint }]} />
                      <View style={styles.flex}>
                        <Text style={[styles.vocabWord, { color: colors.text }]}>{w.word}</Text>
                        <Text style={[styles.vocabMeaning, { color: colors.text }]}>“{w.meaning}”</Text>
                        <View style={[styles.whenBox, outline(colors, 1.5), { backgroundColor: colors.surfaceAlt }]}>
                          <Text style={[styles.vocabWhen, { color: colors.textSecondary }]}>{w.when}</Text>
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* TAB 3: Islamic Quiz */}
        {activeTab === 'quiz' ? (
          <View>
            {!quizStarted && !quizFinished ? (
              <Animated.View entering={FadeInDown.duration(350)}>
                <Card style={styles.centerCard}>
                  <View style={[styles.bigIcon, outline(colors, brutal.border), { backgroundColor: colors.accent }]}>
                    <Award color={colors.ink} size={52} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.centerTitle, { color: colors.text }]}>Islamic Knowledge Quiz</Text>
                  <Text style={[styles.centerDesc, { color: colors.textSecondary }]}>
                    Answer {quizQuestions.length} fun questions correctly. You will earn +20 XP points for each correct answer!
                  </Text>
                  <View style={styles.statRow}>
                    <View style={[styles.statChip, outline(colors), { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.statChipText, { color: colors.text }]}>{quizQuestions.length} questions</Text>
                    </View>
                    <View style={[styles.statChip, outline(colors), { backgroundColor: colors.accentSoft }]}>
                      <Text style={[styles.statChipText, { color: colors.text }]}>+20 XP each</Text>
                    </View>
                  </View>
                  <BrutalPressable fill={colors.accent} style={styles.bigBtn} onPress={() => setQuizStarted(true)}>
                    <Text style={[styles.bigBtnText, { color: colors.ink }]}>Start Quiz</Text>
                  </BrutalPressable>
                </Card>
              </Animated.View>
            ) : quizStarted && !quizFinished ? (
              <Animated.View key={`q-${currentQIdx}`} entering={FadeInDown.duration(320)}>
                <Card style={styles.questionCard}>
                  {/* Question index progress bar */}
                  <View style={styles.rowBetween}>
                    <Text style={[styles.qIndexLabel, { color: colors.textMuted }]}>
                      QUESTION {currentQIdx + 1} OF {quizQuestions.length}
                    </Text>
                    <View style={[styles.pill, outline(colors), { backgroundColor: colors.accentSoft }]}>
                      <Star color={colors.text} fill={colors.accent} size={12} />
                      <Text style={[styles.pillText, { color: colors.text }]}>{score}</Text>
                    </View>
                  </View>
                  <View style={styles.progressWrap}>
                    <ProgressBar
                      value={(currentQIdx + (selectedAns !== null ? 1 : 0)) / Math.max(1, quizQuestions.length)}
                      color={colors.accent}
                      track={colors.surfaceAlt}
                    />
                  </View>

                  {/* Question Body */}
                  <Text style={[styles.questionText, { color: colors.text }]}>{activeQuestion.q}</Text>

                  {/* Question Options */}
                  <View style={styles.optionsList}>
                    {(activeQuestion.options || []).map((option, idx) => {
                      const isSelected = selectedAns === idx;
                      const isCorrect = idx === activeQuestion.correct;
                      const state = selectedAns === null
                        ? 'idle'
                        : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dim';
                      return (
                        <QuizOption
                          key={idx}
                          label={option}
                          letter={OPTION_LETTERS[idx] ?? String(idx + 1)}
                          state={state}
                          disabled={selectedAns !== null}
                          onPress={() => handleAnswerSelect(idx)}
                        />
                      );
                    })}
                  </View>

                  {/* Next button */}
                  {selectedAns !== null ? (
                    <Animated.View entering={FadeInDown.duration(250)}>
                      <BrutalPressable fill={colors.primary} style={styles.bigBtn} onPress={handleNextQuestion}>
                        <Text style={[styles.bigBtnText, { color: colors.onPrimary }]}>
                          {currentQIdx < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Text>
                        <ChevronRight color={colors.onPrimary} size={20} strokeWidth={2.6} />
                      </BrutalPressable>
                    </Animated.View>
                  ) : null}
                </Card>
              </Animated.View>
            ) : (
              // Quiz Finished Screen
              <Animated.View entering={ZoomIn.duration(350)}>
                <Card style={styles.centerCard}>
                  <View style={[styles.bigIcon, outline(colors, brutal.border), { backgroundColor: colors.accent }]}>
                    <Trophy color={colors.ink} size={52} strokeWidth={2.2} />
                  </View>
                  <View style={styles.starsRow}>
                    {[0, 1, 2].map((i) => (
                      <Animated.View key={i} entering={ZoomIn.delay(200 + i * 120).springify()}>
                        <Star
                          size={i === 1 ? 40 : 32}
                          color={colors.ink}
                          strokeWidth={2.2}
                          fill={i < stars ? colors.accent : 'transparent'}
                        />
                      </Animated.View>
                    ))}
                  </View>
                  <Text style={[styles.centerTitle, { color: colors.text }]}>MashaAllah! 🎉</Text>
                  <Text style={[styles.centerDesc, { color: colors.textSecondary }]}>You have completed the quiz!</Text>
                  <Text style={[styles.finalScore, { color: colors.text }]}>
                    {score} <Text style={{ color: colors.textMuted }}>/ {quizQuestions.length}</Text>
                  </Text>
                  <View style={[styles.xpBadge, outline(colors), { backgroundColor: colors.primarySoft }]}>
                    <Sparkles color={colors.text} size={16} strokeWidth={2.4} />
                    <Text style={[styles.xpText, { color: colors.text }]}>+{score * 20} XP earned</Text>
                  </View>
                  <BrutalPressable fill={colors.accent} style={styles.bigBtn} onPress={restartQuiz}>
                    <Text style={[styles.bigBtnText, { color: colors.ink }]}>Play Again</Text>
                  </BrutalPressable>
                </Card>
              </Animated.View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  tabsRow: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 18,
    borderWidth: brutal.borderThin,
    gap: 6,
    marginTop: 18,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 14,
    gap: 6,
  },
  tabText: { fontSize: 13.5, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  pillText: { fontSize: 11.5, fontWeight: '900', letterSpacing: 0.8 },

  libraryHero: { borderRadius: 26, padding: 20 },
  libraryTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3, marginTop: 14, marginBottom: 6 },
  libraryDesc: { fontSize: 14.5, lineHeight: 21 },
  libraryCount: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.1, marginTop: 8 },
  libraryNote: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 22, paddingHorizontal: 10 },
  coverGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 20 },
  coverArt: { overflow: 'hidden', borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  coverNum: { position: 'absolute', top: 8, left: 8, minWidth: 26, height: 26, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAF1' },
  coverNumText: { color: INK, fontSize: 12.5, fontWeight: '900' },
  coverRead: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8FD1B0' },
  coverBody: { padding: 11, borderTopWidth: brutal.borderThin },
  coverProphet: { flex: 1, color: INK, fontSize: 15, fontWeight: '900' },
  coverArabic: { color: INK, fontSize: 15, fontWeight: '700' },
  coverTitle: { color: INK, fontSize: 12.5, lineHeight: 16, fontWeight: '700', opacity: 0.8, marginTop: 3, minHeight: 32 },
  coverPages: { color: INK, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8, opacity: 0.6, marginTop: 4 },

  guideTiles: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  guideTileWrap: { flex: 1 },
  guideTile: { padding: 14, alignItems: 'flex-start', minHeight: 112 },
  guideTileIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  guideTileText: { fontSize: 13.5, fontWeight: '900', lineHeight: 18 },
  sectionTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.2, marginTop: 20, marginBottom: 12 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, marginBottom: 12 },
  stepBadge: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { color: '#1C1A17', fontSize: 16, fontWeight: '900' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  wordCard: { flexDirection: 'row', gap: 14, borderRadius: 22, marginBottom: 14, overflow: 'hidden' },
  wordAccent: { width: 8, borderRadius: 4 },
  vocabWord: { fontSize: 21, fontWeight: '900', letterSpacing: -0.2 },
  vocabMeaning: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  whenBox: { borderRadius: 12, padding: 10, marginTop: 10 },
  vocabWhen: { fontSize: 13, lineHeight: 19, fontWeight: '500' },

  centerCard: { borderRadius: 28, padding: 26, alignItems: 'center', gap: 12 },
  bigIcon: { width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  centerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3, textAlign: 'center' },
  centerDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  statChip: { paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: 'center' },
  statChipText: { fontSize: 12.5, fontWeight: '800' },
  bigBtn: {
    flexDirection: 'row',
    gap: 6,
    height: 56,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  bigBtnText: { fontSize: 16.5, fontWeight: '900' },

  questionCard: { borderRadius: 26, padding: 20 },
  qIndexLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 },
  progressWrap: { marginTop: 12 },
  questionText: { fontSize: 20, fontWeight: '900', lineHeight: 28, letterSpacing: -0.2, marginTop: 20, marginBottom: 20 },
  optionsList: { gap: 10, marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 58,
  },
  optionLetter: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 14, fontWeight: '900' },
  optionText: { flex: 1, fontSize: 15.5, fontWeight: '700' },

  starsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  finalScore: { fontSize: 46, fontWeight: '900', letterSpacing: -1 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18 },
  xpText: { fontSize: 14.5, fontWeight: '900' },
});
