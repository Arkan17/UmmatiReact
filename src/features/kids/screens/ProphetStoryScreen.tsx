// Comic-book reader for one Prophet story: swipe (or tap the arrows) through animated panels, with
// narration that types itself in, speech bubbles and Quran boxes, and an XP reward on the last page.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, ViewToken } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BookOpen, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Star, Trophy } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, ProgressBar, haptic, outline, useScreenActive } from '../../../core/components/ui';
import { awardXp, incrementActivity } from '../../../core/services/progress';
import { ComicScene, PANEL_RATIO } from '../components/ComicScene';
import { INK } from '../components/comicProps';
import { findStory, markStoryRead } from '../data/prophetStories';
import type { ComicPanel, ProphetStory } from '../data/types';

const STORY_XP = 50;
const PAPER = '#FFFAF1';
const CAPTION = '#FFF1B8';
const QURAN_GOLD = '#F6E2B6';
const GUTTER = 18;

type Page = { type: 'panel'; panel: ComicPanel; index: number } | { type: 'end' };

/** Narration that reveals itself word by word; tap to show it all at once. */
function TypedText({ text, start, style }: { text: string; start: boolean; style: object }) {
  const words = text.split(' ');
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => setCount((c) => {
      if (c >= words.length) { clearInterval(id); return c; }
      return c + 1;
    }), 55);
    return () => clearInterval(id);
  }, [start, words.length]);
  const shown = words.slice(0, count).join(' ');
  const rest = words.slice(count).join(' ');
  return (
    <Pressable onPress={() => setCount(words.length)}>
      <Text style={style}>
        {shown}{count > 0 && rest ? ' ' : ''}
        <Text style={styles.hidden}>{rest}</Text>
      </Text>
    </Pressable>
  );
}

/** Slow "camera push" on the panel while it is on screen. */
function KenBurns({ active, children }: { active: boolean; children: React.ReactNode }) {
  const z = useSharedValue(1);
  useEffect(() => {
    z.value = active ? withTiming(1.07, { duration: 9000, easing: Easing.out(Easing.quad) }) : 1;
  }, [active, z]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: z.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function PanelPage({ panel, index, total, width, active, tint }: {
  panel: ComicPanel; index: number; total: number; width: number; active: boolean; tint: string;
}) {
  const { colors } = useAppTheme();
  const screenActive = useScreenActive();
  const insets = useSafeAreaInsets();
  // Overlays mount on first view so their entrance animations play when the reader arrives
  const [seen, setSeen] = useState(active);
  useEffect(() => {
    if (active && !seen) setSeen(true);
    if (active && panel.sfx) setTimeout(() => haptic.medium(), 450);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const frameW = width - GUTTER * 2;
  const sceneW = frameW - brutal.border * 2;

  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
      <BrutalBox radius={18} fill={colors.ink} style={styles.frame}>
        <View style={[styles.frameInner, { height: sceneW * PANEL_RATIO }]}>
          <KenBurns active={active}>
            <ComicScene scene={panel.scene} width={sceneW} animate={active && screenActive} />
          </KenBurns>
          <View style={[styles.pageTag, outline({ ink: INK }), { backgroundColor: tint }]}>
            <Text style={styles.pageTagText}>{index + 1} / {total}</Text>
          </View>
          {seen && panel.sfx ? (
            <Animated.View entering={ZoomIn.delay(350).springify().damping(9)} style={styles.sfxWrap}>
              <View style={[styles.sfx, outline({ ink: INK }, brutal.border)]}>
                <Text style={styles.sfxText}>{panel.sfx}</Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </BrutalBox>

      {seen ? (
        <>
          <Animated.View entering={FadeInDown.delay(150).duration(380)}>
            <BrutalBox fill={CAPTION} radius={14} offset={brutal.shadowSmall} style={styles.caption}>
              <TypedText text={panel.caption} start={seen} style={styles.captionText} />
            </BrutalBox>
          </Animated.View>

          {panel.bubble ? (
            <Animated.View entering={ZoomIn.delay(700).springify().damping(12)} style={styles.bubbleWrap}>
              <View style={[styles.bubbleTail, { borderBottomColor: INK }]} />
              <View style={[styles.bubbleTailInner, { borderBottomColor: PAPER }]} />
              <BrutalBox fill={PAPER} radius={22} offset={brutal.shadowSmall} style={styles.bubble}>
                <View style={[styles.speaker, outline({ ink: INK }), { backgroundColor: tint }]}>
                  <Text style={styles.speakerText}>{panel.bubble.speaker}</Text>
                </View>
                <Text style={styles.bubbleText}>“{panel.bubble.text}”</Text>
              </BrutalBox>
            </Animated.View>
          ) : null}

          {panel.quran ? (
            <Animated.View entering={FadeInUp.delay(panel.bubble ? 1000 : 700).duration(450)}>
              <BrutalBox fill={QURAN_GOLD} radius={14} offset={brutal.shadowSmall} style={styles.quran}>
                <View style={styles.quranHead}>
                  <BookOpen color={INK} size={14} strokeWidth={2.6} />
                  <Text style={styles.quranLabel}>THE QURAN · {panel.quran.ref}</Text>
                </View>
                <Text style={styles.quranText}>“{panel.quran.text}”</Text>
              </BrutalBox>
            </Animated.View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function EndPage({ story, width, active, onRestart, onClose }: {
  story: ProphetStory; width: number; active: boolean; onRestart: () => void; onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [reward, setReward] = useState<'pending' | 'earned' | 'already'>('pending');

  useEffect(() => {
    if (!active || reward !== 'pending') return;
    haptic.success();
    (async () => {
      try {
        const first = await markStoryRead(story.id);
        if (first) {
          await awardXp(STORY_XP, 'kids_story');
          await incrementActivity('kids', { stories: 1 });
        }
        setReward(first ? 'earned' : 'already');
      } catch (e) {
        console.warn('Failed to save story progress:', e);
        setReward('already');
      }
    })();
  }, [active, reward, story.id]);

  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
      {active ? (
        <>
          <Animated.View entering={ZoomIn.duration(400)}>
            <BrutalBox fill={story.tint} radius={24} style={styles.endCard}>
              <View style={[styles.trophy, outline({ ink: INK }, brutal.border), { backgroundColor: colors.accent }]}>
                <Trophy color={INK} size={46} strokeWidth={2.2} />
              </View>
              <View style={styles.starsRow}>
                {[0, 1, 2].map((i) => (
                  <Animated.View key={i} entering={ZoomIn.delay(250 + i * 140).springify()}>
                    <Star size={i === 1 ? 40 : 32} color={INK} strokeWidth={2.2} fill={colors.accent} />
                  </Animated.View>
                ))}
              </View>
              <Text style={styles.endTitle}>The End</Text>
              <Text style={styles.endSub}>You finished the story of {story.prophet} ({story.arabic}) — MashaAllah!</Text>
              {reward !== 'pending' ? (
                <Animated.View entering={FadeIn.duration(300)} style={[styles.xpBadge, outline({ ink: INK }), { backgroundColor: PAPER }]}>
                  <Sparkles color={INK} size={16} strokeWidth={2.4} />
                  <Text style={styles.xpText}>{reward === 'earned' ? `+${STORY_XP} XP earned` : 'Read again — great job!'}</Text>
                </Animated.View>
              ) : null}
            </BrutalBox>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <BrutalBox fill={CAPTION} radius={18} offset={brutal.shadowSmall} style={styles.lessons}>
              <Text style={styles.lessonsTitle}>LESSONS TO REMEMBER</Text>
              {story.lessons.map((l, i) => (
                <View key={i} style={styles.lessonRow}>
                  <View style={[styles.lessonDot, outline({ ink: INK }), { backgroundColor: story.tint }]}>
                    <Text style={styles.lessonNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.lessonText}>{l}</Text>
                </View>
              ))}
            </BrutalBox>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(400)}>
            <Text style={[styles.sourcesTitle, { color: colors.textMuted }]}>FOR PARENTS · SOURCES</Text>
            <Text style={[styles.sources, { color: colors.textSecondary }]}>{story.sources.join('  ·  ')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.endBtns}>
            <BrutalPressable fill={colors.surface} style={styles.endBtn} onPress={onRestart}>
              <RotateCcw color={colors.text} size={18} strokeWidth={2.6} />
              <Text style={[styles.endBtnText, { color: colors.text }]}>Read again</Text>
            </BrutalPressable>
            <BrutalPressable fill={colors.primary} style={styles.endBtn} onPress={onClose}>
              <BookOpen color={colors.onPrimary} size={18} strokeWidth={2.6} />
              <Text style={[styles.endBtnText, { color: colors.onPrimary }]}>More stories</Text>
            </BrutalPressable>
          </Animated.View>
        </>
      ) : null}
    </ScrollView>
  );
}

export function ProphetStoryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ProphetStory'>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const story = findStory(route.params.id);
  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(0);

  const pages: Page[] = story ? [...story.panels.map((panel, i) => ({ type: 'panel' as const, panel, index: i })), { type: 'end' }] : [];
  const last = pages.length - 1;

  const goTo = useCallback((i: number) => {
    const next = Math.max(0, Math.min(last, i));
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }, [last]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setIndex((prev) => {
        if (prev !== first.index) haptic.select();
        return first.index!;
      });
    }
  }).current;

  if (!story) return null;

  const atEnd = index === last;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: story.tint, borderColor: INK }]}>
        <View style={styles.headerRow}>
          <BrutalPressable onPress={() => navigation.goBack()} fill={PAPER} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.backBtn}>
            <ChevronLeft color={INK} size={22} strokeWidth={2.6} />
          </BrutalPressable>
          <View style={styles.flex}>
            <Text style={styles.headerKicker} numberOfLines={1}>{story.prophet.toUpperCase()} · {story.arabic}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{story.title}</Text>
          </View>
        </View>
        <View style={styles.progress}>
          <ProgressBar value={(index + 1) / pages.length} color={colors.accent} track={PAPER} />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        renderItem={({ item, index: i }) =>
          item.type === 'panel' ? (
            <PanelPage panel={item.panel} index={item.index} total={story.panels.length} width={width} active={i === index} tint={story.tint} />
          ) : (
            <EndPage story={story} width={width} active={i === index} onRestart={() => goTo(0)} onClose={() => navigation.goBack()} />
          )
        }
      />

      {!atEnd ? (
        <View style={[styles.navBar, { paddingBottom: insets.bottom + 14 }]} pointerEvents="box-none">
          <BrutalPressable
            fill={index === 0 ? colors.surfaceAlt : colors.surface}
            offset={index === 0 ? 0 : brutal.shadow}
            disabled={index === 0}
            style={styles.navBtn}
            onPress={() => goTo(index - 1)}
          >
            <ChevronLeft color={index === 0 ? colors.textMuted : colors.text} size={24} strokeWidth={2.6} />
          </BrutalPressable>
          <BrutalPressable fill={colors.primary} style={styles.nextBtn} onPress={() => goTo(index + 1)}>
            <Text style={[styles.nextText, { color: colors.onPrimary }]}>{index === last - 1 ? 'Finish story' : 'Next page'}</Text>
            <ChevronRight color={colors.onPrimary} size={22} strokeWidth={2.6} />
          </BrutalPressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  hidden: { color: 'transparent' },
  header: { paddingHorizontal: GUTTER, paddingBottom: 14, borderBottomWidth: brutal.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerKicker: { color: INK, fontSize: 11.5, fontWeight: '900', letterSpacing: 1.1, opacity: 0.7 },
  headerTitle: { color: INK, fontSize: 21, fontWeight: '900', letterSpacing: -0.3 },
  progress: { marginTop: 12 },

  page: { paddingHorizontal: GUTTER, paddingTop: 18 },
  frame: { marginBottom: 18 },
  frameInner: { overflow: 'hidden', borderRadius: 15 },
  pageTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, height: 24, borderRadius: 8, justifyContent: 'center' },
  pageTagText: { color: INK, fontSize: 11.5, fontWeight: '900', letterSpacing: 0.6 },
  sfxWrap: { position: 'absolute', top: 12, right: 10, transform: [{ rotate: '-8deg' }] },
  sfx: { backgroundColor: '#FFE066', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, maxWidth: 190 },
  sfxText: { color: INK, fontSize: 18, fontWeight: '900', letterSpacing: 0.5, fontStyle: 'italic' },

  caption: { padding: 16, marginBottom: 18 },
  captionText: { color: INK, fontSize: 16.5, lineHeight: 25, fontWeight: '600' },

  bubbleWrap: { marginBottom: 18, marginTop: 6 },
  bubbleTail: {
    position: 'absolute', top: -14, left: 34, width: 0, height: 0,
    borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  bubbleTailInner: {
    position: 'absolute', top: -9, left: 37, width: 0, height: 0, zIndex: 2,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  bubble: { padding: 16, paddingTop: 14 },
  speaker: { alignSelf: 'flex-start', paddingHorizontal: 10, height: 24, borderRadius: 12, justifyContent: 'center', marginBottom: 8 },
  speakerText: { color: INK, fontSize: 12, fontWeight: '900' },
  bubbleText: { color: INK, fontSize: 17, lineHeight: 25, fontWeight: '800' },

  quran: { padding: 16, marginBottom: 18 },
  quranHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  quranLabel: { color: INK, fontSize: 11.5, fontWeight: '900', letterSpacing: 1 },
  quranText: { color: INK, fontSize: 15.5, lineHeight: 24, fontWeight: '600', fontStyle: 'italic' },

  navBar: { position: 'absolute', left: GUTTER, right: GUTTER, bottom: 0, flexDirection: 'row', gap: 12 },
  navBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flex: 1, height: 56, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontSize: 16.5, fontWeight: '900' },

  endCard: { padding: 24, alignItems: 'center', gap: 10, marginBottom: 18 },
  trophy: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  endTitle: { color: INK, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  endSub: { color: INK, fontSize: 15, lineHeight: 22, textAlign: 'center', fontWeight: '600' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18, marginTop: 4 },
  xpText: { color: INK, fontSize: 14.5, fontWeight: '900' },
  lessons: { padding: 18, marginBottom: 18, gap: 12 },
  lessonsTitle: { color: INK, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  lessonRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  lessonDot: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lessonNum: { color: INK, fontSize: 13, fontWeight: '900' },
  lessonText: { flex: 1, color: INK, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  sourcesTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginBottom: 4 },
  sources: { fontSize: 12.5, lineHeight: 19, marginBottom: 18 },
  endBtns: { flexDirection: 'row', gap: 12 },
  endBtn: { flex: 1, height: 54, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  endBtnText: { fontSize: 15, fontWeight: '900' },
});
