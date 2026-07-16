import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { BookOpen, Smile, Award, CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { Theme } from '../../../core/theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';
import { useNavigation } from '@react-navigation/native';

export function KidsSectionScreen() {
  const { user } = useAuth();
  const { content } = useDynamicContent();
  const navigation = useNavigation();
  
  const kidsData = content.kids || { stories: [], wudu_steps: [], salah_steps: [], words: [], quiz_questions: [] };
  const stories = kidsData.stories || [];
  const wuduSteps = kidsData.wudu_steps || [];
  const salahSteps = kidsData.salah_steps || [];
  const words = kidsData.words || [];
  const quizQuestions = kidsData.quiz_questions || [];

  // Section Navigation ('stories' | 'guide' | 'quiz')
  const [activeTab, setActiveTab] = useState<'stories' | 'guide' | 'quiz'>('stories');
  
  // Stories Slide index
  const [storyIndex, setStoryIndex] = useState(0);

  // Wudu vs Salah Guide Toggle
  const [guideType, setGuideType] = useState<'wudu' | 'salah' | 'words'>('wudu');

  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentStory = stories[storyIndex] || { title: '', moral: '', text: '' };
  const activeQuestion = quizQuestions[currentQIdx] || { q: '', options: [], correct: 0 };

  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedAns !== null) return; // prevent multiple taps
    setSelectedAns(optionIdx);
    if (optionIdx === activeQuestion.correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAns(null);
    if (currentQIdx < quizQuestions.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    } else {
      setQuizFinished(true);
      awardQuizXP();
    }
  };

  const awardQuizXP = async () => {
    if (!user) return;
    const earnedXp = score * 20; // 20 XP per correct answer
    try {
      // 1. Get current XP from local storage
      const storedXp = await AsyncStorage.getItem('user_xp');
      const currentXp = storedXp ? parseInt(storedXp, 10) : 0;
      const newXp = currentXp + earnedXp;

      // 2. Save new XP locally
      await AsyncStorage.setItem('user_xp', newXp.toString());

      // 3. Save quiz activity locally
      const todayStr = new Date().toISOString().split('T')[0];
      const activityKey = `kids_activities_${todayStr}`;
      const existing = await AsyncStorage.getItem(activityKey);
      const list = existing ? JSON.parse(existing) : [];
      list.push({
        activity: 'kids_quiz',
        score: score,
        maxScore: quizQuestions.length,
        xpEarned: earnedXp,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem(activityKey, JSON.stringify(list));
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft color={Theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Kids Islamic Corner</Text>
          <View style={styles.placeholderWidth} />
        </View>
        <Text style={styles.subtitle}>Learn and earn XP through games and stories!</Text>
      </View>

      {/* Tab Selectors */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'stories' ? styles.activeStoriesTab : null]}
          onPress={() => setActiveTab('stories')}
        >
          <BookOpen color={activeTab === 'stories' ? Theme.colors.white : Theme.colors.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'stories' ? styles.activeTabText : null]}>Stories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'guide' ? styles.activeGuideTab : null]}
          onPress={() => setActiveTab('guide')}
        >
          <Smile color={activeTab === 'guide' ? Theme.colors.white : Theme.colors.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'guide' ? styles.activeTabText : null]}>Guides</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'quiz' ? styles.activeQuizTab : null]}
          onPress={() => setActiveTab('quiz')}
        >
          <Award color={activeTab === 'quiz' ? Theme.colors.white : Theme.colors.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'quiz' ? styles.activeTabText : null]}>Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Content Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TAB 1: Islamic Stories */}
        {activeTab === 'stories' ? (
          <View style={styles.storiesBox}>
            <View style={styles.slideCard}>
              <Text style={styles.slideTitle}>{currentStory.title}</Text>
              <Text style={styles.slideBody}>{currentStory.text}</Text>
              
              <View style={styles.moralCard}>
                <Text style={styles.moralTitle}>Moral of the Story</Text>
                <Text style={styles.moralText}>✨ {currentStory.moral}</Text>
              </View>
            </View>

            {/* Stories navigation slider controls */}
            <View style={styles.sliderControls}>
              <TouchableOpacity
                style={[styles.controlBtn, storyIndex === 0 ? styles.controlBtnDisabled : null]}
                onPress={() => setStoryIndex(Math.max(0, storyIndex - 1))}
                disabled={storyIndex === 0}
              >
                <ArrowLeft color={storyIndex === 0 ? Theme.colors.textMuted : Theme.colors.white} size={20} />
              </TouchableOpacity>
              <Text style={styles.indexIndicator}>{stories.length > 0 ? storyIndex + 1 : 0} / {stories.length}</Text>
              <TouchableOpacity
                style={[styles.controlBtn, storyIndex === stories.length - 1 || stories.length === 0 ? styles.controlBtnDisabled : null]}
                onPress={() => setStoryIndex(Math.min(stories.length - 1, storyIndex + 1))}
                disabled={storyIndex === stories.length - 1 || stories.length === 0}
              >
                <ArrowRight color={storyIndex === stories.length - 1 || stories.length === 0 ? Theme.colors.textMuted : Theme.colors.white} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* TAB 2: Beginner Guides */}
        {activeTab === 'guide' ? (
          <View style={styles.guideContainer}>
            {/* Inner Sub Tabs */}
            <View style={styles.guideSubTabs}>
              <TouchableOpacity
                style={[styles.subTab, guideType === 'wudu' ? styles.activeSubTab : null]}
                onPress={() => setGuideType('wudu')}
              >
                <Text style={[styles.subTabText, guideType === 'wudu' ? styles.activeSubTabText : null]}>How to Wudu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTab, guideType === 'salah' ? styles.activeSubTab : null]}
                onPress={() => setGuideType('salah')}
              >
                <Text style={[styles.subTabText, guideType === 'salah' ? styles.activeSubTabText : null]}>How to Pray</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTab, guideType === 'words' ? styles.activeSubTab : null]}
                onPress={() => setGuideType('words')}
              >
                <Text style={[styles.subTabText, guideType === 'words' ? styles.activeSubTabText : null]}>Dhikr Words</Text>
              </TouchableOpacity>
            </View>

            {/* Displaying selected guide */}
            {guideType === 'wudu' ? (
              <View style={styles.guideContentBox}>
                <Text style={styles.guideContentTitle}>Steps for performing Wudu (Ablution)</Text>
                {wuduSteps.map((step, idx) => (
                  <View key={idx} style={styles.guideStepRow}>
                    <Text style={styles.guideStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {guideType === 'salah' ? (
              <View style={styles.guideContentBox}>
                <Text style={styles.guideContentTitle}>Steps for performing Salah (Prayer)</Text>
                {salahSteps.map((step, idx) => (
                  <View key={idx} style={styles.guideStepRow}>
                    <Text style={styles.guideStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {guideType === 'words' ? (
              <View style={styles.wordsContainer}>
                {words.map((w) => (
                  <View key={w.word} style={styles.wordCard}>
                    <Text style={styles.vocabWord}>{w.word}</Text>
                    <Text style={styles.vocabMeaning}>Meaning: "{w.meaning}"</Text>
                    <Text style={styles.vocabWhen}>{w.when}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* TAB 3: Islamic Quiz */}
        {activeTab === 'quiz' ? (
          <View style={styles.quizBox}>
            {!quizStarted && !quizFinished ? (
              <View style={styles.quizStartCard}>
                <Award color={Theme.colors.accent} size={64} style={styles.quizStartIcon} />
                <Text style={styles.quizStartTitle}>Islamic Knowledge Quiz</Text>
                <Text style={styles.quizStartDesc}>
                  Answer {quizQuestions.length} fun questions correctly. You will earn +20 XP points for each correct answer!
                </Text>
                <TouchableOpacity style={styles.startQuizBtn} onPress={() => setQuizStarted(true)}>
                  <Text style={styles.startQuizBtnText}>Start Quiz</Text>
                </TouchableOpacity>
              </View>
            ) : quizStarted && !quizFinished ? (
              <View style={styles.questionCard}>
                {/* Question index progress bar */}
                <View style={styles.progressHeader}>
                  <Text style={styles.qIndexLabel}>Question {currentQIdx + 1} of {quizQuestions.length}</Text>
                  <Text style={styles.scoreCounter}>Score: {score}</Text>
                </View>

                {/* Question Body */}
                <Text style={styles.questionText}>{activeQuestion.q}</Text>

                {/* Question Options */}
                <View style={styles.optionsList}>
                  {(activeQuestion.options || []).map((option, idx) => {
                    const isSelected = selectedAns === idx;
                    const isCorrect = idx === activeQuestion.correct;
                    
                    let optionStyle: any = styles.optionBtn;
                    let optionIcon = null;

                    if (selectedAns !== null) {
                      if (isCorrect) {
                        optionStyle = [styles.optionBtn, styles.optionCorrect];
                        optionIcon = <CheckCircle color={Theme.colors.white} size={18} />;
                      } else if (isSelected) {
                        optionStyle = [styles.optionBtn, styles.optionIncorrect];
                        optionIcon = <XCircle color={Theme.colors.white} size={18} />;
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={optionStyle}
                        onPress={() => handleAnswerSelect(idx)}
                        disabled={selectedAns !== null}
                      >
                        <Text style={[styles.optionText, selectedAns !== null && (isCorrect || isSelected) ? styles.optionTextHighlight : null]}>
                          {option}
                        </Text>
                        {optionIcon}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Next button */}
                {selectedAns !== null ? (
                  <TouchableOpacity style={styles.nextQBtn} onPress={handleNextQuestion}>
                    <Text style={styles.nextQBtnText}>
                      {currentQIdx < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              // Quiz Finished Screen
              <View style={styles.quizStartCard}>
                <Award color={Theme.colors.accent} size={64} style={styles.quizStartIcon} />
                <Text style={styles.quizStartTitle}>MashaAllah! 🎉</Text>
                <Text style={styles.quizStartDesc}>
                  You have completed the quiz!
                </Text>
                <Text style={styles.finalScore}>
                  Final Score: {score} / {quizQuestions.length}
                </Text>
                <Text style={styles.xpEarnedLabel}>
                  🏆 You earned +{score * 20} XP Points!
                </Text>

                <TouchableOpacity style={styles.startQuizBtn} onPress={restartQuiz}>
                  <Text style={styles.startQuizBtnText}>Play Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  placeholderWidth: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: 6,
    marginHorizontal: 20,
    borderRadius: Theme.radius.md,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Theme.radius.sm,
    gap: 6,
  },
  activeStoriesTab: {
    backgroundColor: Theme.colors.primary,
  },
  activeGuideTab: {
    backgroundColor: '#3B82F6', // guide blue
  },
  activeQuizTab: {
    backgroundColor: Theme.colors.accent,
  },
  tabText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: Theme.colors.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  storiesBox: {
    paddingHorizontal: 20,
  },
  slideCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 24,
    minHeight: 280,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.accent,
    marginBottom: 14,
  },
  slideBody: {
    color: Theme.colors.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  moralCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    padding: 14,
  },
  moralTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  moralText: {
    color: Theme.colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnDisabled: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  indexIndicator: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  guideContainer: {
    paddingHorizontal: 20,
  },
  guideSubTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subTab: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  activeSubTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // light blue border
    borderColor: '#3B82F6',
  },
  subTabText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeSubTabText: {
    color: '#3B82F6',
  },
  guideContentBox: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 20,
    gap: 12,
  },
  guideContentTitle: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guideStepRow: {
    backgroundColor: Theme.colors.background,
    padding: 12,
    borderRadius: Theme.radius.sm,
    borderColor: 'rgba(35, 68, 50, 0.4)',
    borderWidth: 1,
  },
  guideStepText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  wordsContainer: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 16,
    gap: 6,
  },
  vocabWord: {
    color: Theme.colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  vocabMeaning: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  vocabWhen: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  quizBox: {
    paddingHorizontal: 20,
  },
  quizStartCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  quizStartIcon: {
    marginBottom: 8,
  },
  quizStartTitle: {
    color: Theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quizStartDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  startQuizBtn: {
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.md,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  startQuizBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 20,
    minHeight: 260,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: 10,
  },
  qIndexLabel: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreCounter: {
    color: Theme.colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  optionCorrect: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  optionIncorrect: {
    backgroundColor: Theme.colors.error,
    borderColor: Theme.colors.error,
  },
  optionText: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  optionTextHighlight: {
    color: Theme.colors.white,
  },
  nextQBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.sm,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextQBtnText: {
    color: Theme.colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  finalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.white,
    marginTop: 10,
  },
  xpEarnedLabel: {
    fontSize: 16,
    color: Theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
