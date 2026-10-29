import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AlertCircle, BookOpen, ChevronDown, HandHeart, Pause, Play, Search, Share2, Sparkles, X, Star } from 'lucide-react-native';
import { awardXp, incrementActivity } from '../../../core/services/progress';
import { loadFavoriteDuaIds, toggleFavoriteDua, isDuaFavorite } from '../utils/duaFavorites';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { BrutalPressable, PressableScale, ScreenHeader, haptic } from '../../../core/components/ui';
import { brutal, tints } from '../../../core/theme/palettes';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';

const CATEGORY_TINTS: string[] = Object.values(tints);

const tintFor = (cat: string) => {
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) % 1000003;
  return CATEGORY_TINTS[h % CATEGORY_TINTS.length];
};

/** Three bouncing bars shown while a dua is playing. */
function EqualizerBar({ color, delay }: { color: string; delay: number }) {
  const h = useSharedValue(0.35);
  useEffect(() => {
    h.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 320 }), withTiming(0.3, { duration: 320 })), -1, true));
    return () => cancelAnimation(h);
  }, [h, delay]);
  const style = useAnimatedStyle(() => ({ height: 14 * h.value }));
  return <Animated.View style={[styles.eqBar, { backgroundColor: color }, style]} />;
}

function Equalizer({ color }: { color: string }) {
  return (
    <View style={styles.eq}>
      <EqualizerBar color={color} delay={0} />
      <EqualizerBar color={color} delay={140} />
      <EqualizerBar color={color} delay={280} />
    </View>
  );
}

/** Play button with a pulsing halo while audio is playing. */
function PlayButton({ playing, onPress }: { playing: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (playing) {
      pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [playing, pulse]);
  const halo = useAnimatedStyle(() => ({
    opacity: playing ? 0.45 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));
  return (
    <PressableScale onPress={onPress} hitSlop={6} style={styles.playWrap}>
      <Animated.View style={[styles.playHalo, { backgroundColor: colors.primary }, halo]} />
      <View style={[styles.playBtn, { backgroundColor: playing ? colors.primary : colors.accentSoft, borderColor: colors.ink }]}>
        {playing ? <Pause color={colors.onPrimary} size={18} fill={colors.onPrimary} /> : <Play color={colors.ink} size={18} fill={colors.ink} style={styles.playIconNudge} />}
      </View>
    </PressableScale>
  );
}

export function DuasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useScreenTime('Duas');
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { content } = useDynamicContent();
  const [duas, setDuas] = useState<any[]>(content.duas || []);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const webViewRef = useRef<WebView<{}>>(null);

  // Load favorites from AsyncStorage
  useEffect(() => {
    loadFavoriteDuaIds().then(setFavoriteIds);
  }, []);

  // Sync with cached/local fallback data initially
  useEffect(() => {
    if (content.duas && content.duas.length > 0 && duas.length === 0) {
      setDuas(content.duas);
    }
  }, [content, duas.length]);

  // Fetch live duas from Naikiyah API
  useEffect(() => {
    const fetchLiveDuas = async () => {
      try {
        const res = await fetch('https://dua-data-api.vercel.app/api/usefulDuas');
        if (res.ok) {
          const json = await res.json();
          if (json && json.length > 0) {
            const mapped = json.map((item: any) => {
              const categoryPretty = item.category
                ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
                : 'General';

              return {
                id: item.id,
                category: categoryPretty,
                title: item.title || 'Dua',
                arabic: item.dua || '',
                transliteration: item.transliteration || '',
                translation: item.description || '',
                audio: item.audio || null,
              };
            });
            setDuas(mapped);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch live duas from Naikiyah API:', e);
      }
    };
    fetchLiveDuas();
  }, []);

  const rawCategories = Array.from(new Set(duas.map(d => d.category)));
  const categories = ['All', 'Favorites', ...rawCategories];

  const filteredDuas = duas.filter(d => {
    const matchesCat =
      activeCategory === 'All'
        ? true
        : activeCategory === 'Favorites'
        ? isDuaFavorite(d.id, favoriteIds)
        : d.category === activeCategory;
    const matchesSearch = !searchQuery.trim() ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.translation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleFavorite = async (id: number) => {
    const currentlyFav = isDuaFavorite(id, favoriteIds);
    if (!currentlyFav) {
      haptic.success();
      awardXp(5, 'dua_bookmark');
      incrementActivity('dua', { bookmarks: 1 });
    } else {
      haptic.select();
    }
    const res = await toggleFavoriteDua(id, favoriteIds);
    setFavoriteIds(res.newFavorites);
  };

  const handlePlayAudio = (id: number, url: string) => {
    if (playingId === id) {
      const script = `document.getElementById("dua-audio").pause();`;
      webViewRef.current?.injectJavaScript(script);
      setPlayingId(null);
    } else {
      setPlayingId(id);
      const script = `
        const player = document.getElementById("dua-audio");
        if (player.src !== "${url}") {
          player.src = "${url}";
        }
        player.play();
      `;
      webViewRef.current?.injectJavaScript(script);
    }
  };

  const toggleExpanded = (id: number) => {
    haptic.select();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const htmlAudio = `
    <html>
      <body>
        <audio id="dua-audio"></audio>
        <script>
          const player = document.getElementById("dua-audio");
          player.onended = () => {
            window.ReactNativeWebView.postMessage("ended");
          };
          player.onerror = () => {
            window.ReactNativeWebView.postMessage("error");
          };
        </script>
      </body>
    </html>
  `;

  const getCategoryLabel = (cat: string) => {
    const emojis: Record<string, string> = {
      All: '✨ All',
      Favorites: `⭐ Favorites${favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ''}`,
      Morning: '🌅 Morning',
      Evening: '🌙 Evening',
      Food: '🍽️ Food',
      Meal: '🍽️ Meal',
      Travel: '✈️ Travel',
      Traveling: '✈️ Travel',
      Protection: '🛡️ Protection',
      Waking: '👀 Waking Up',
      Sleeping: '🛌 Sleeping',
      Mosque: '🕌 Mosque',
      Home: '🏠 Home',
    };
    return emojis[cat] || `🤲 ${cat}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hidden Audio Player */}
      <View style={styles.hiddenWebView}>
        <WebView<{}>
          ref={webViewRef}
          source={{ html: htmlAudio }}
          onMessage={(event: any) => {
            if (event.nativeEvent.data === 'ended') {
              setPlayingId(null);
            }
          }}
          javaScriptEnabled
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>

      <ScrollView
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <ScreenHeader
          title="Daily Duas"
          subtitle={`${duas.length} supplications for every moment`}
          onBack={() => navigation.goBack()}
        >
          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: colors.glass, borderColor: colors.ink }]}>
            <Search color={colors.onSkyMuted} size={18} />
            <TextInput
              style={[styles.searchInput, { color: colors.onSky }]}
              placeholder="Search duas, meanings, pronunciations..."
              placeholderTextColor={colors.onSkyMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={colors.onSky}
            />
            {searchQuery.length > 0 && (
              <PressableScale onPress={() => setSearchQuery('')} style={[styles.clearSearchBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]} hitSlop={8}>
                <X color={colors.onSky} size={14} />
              </PressableScale>
            )}
          </View>
        </ScreenHeader>

        {/* Category Slider (sticky) */}
        <View style={[styles.catContainer, { backgroundColor: colors.background }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <PressableScale
                  key={cat}
                  onPress={() => { haptic.select(); setActiveCategory(cat); }}
                  hapticOnPress={false}
                  style={[
                    styles.catChip,
                    { borderColor: colors.ink, backgroundColor: active ? colors.primary : colors.surface },
                  ]}
                >
                  <Text style={[styles.catText, { color: active ? colors.onPrimary : colors.textSecondary }]}>
                    {getCategoryLabel(cat)}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>

        {/* Duas List */}
        <View style={styles.listContainer}>
          {filteredDuas.length > 0 ? (
            filteredDuas.map((item, idx) => {
              const isPlaying = playingId === item.id;
              const isFav = isDuaFavorite(item.id, favoriteIds);
              const expanded = expandedIds.has(item.id);
              const tint = tintFor(item.category);
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(Math.min(idx * 40, 400))}
                  layout={LinearTransition.springify().damping(18)}
                >
                  <BrutalPressable
                    onPress={() => toggleExpanded(item.id)}
                    hapticOnPress={false}
                    radius={24}
                    fill={isPlaying ? colors.primarySoft : colors.surface}
                    style={styles.card}
                  >
                      <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: tint, borderColor: colors.ink }]}>
                          <HandHeart color={colors.ink} size={20} strokeWidth={2.4} />
                        </View>
                        <View style={styles.cardTitleBox}>
                          <Text style={[styles.cardCategoryText, { color: colors.textSecondary }]}>{item.category?.toUpperCase()}</Text>
                          <Text style={[styles.cardTitleText, { color: colors.text }]} numberOfLines={expanded ? undefined : 2}>
                            {item.title}
                          </Text>
                        </View>
                        <View style={styles.cardActionsGroup}>
                          {isPlaying ? <Equalizer color={colors.primary} /> : null}
                          {item.audio ? (
                            <PlayButton playing={isPlaying} onPress={() => handlePlayAudio(item.id, item.audio)} />
                          ) : null}
                          <PressableScale
                            onPress={() => handleToggleFavorite(item.id)}
                            hitSlop={8}
                            style={styles.starWrap}
                          >
                            <View
                              style={[
                                styles.starBtn,
                                {
                                  backgroundColor: isFav ? colors.accent : colors.surfaceAlt,
                                  borderColor: colors.ink,
                                },
                              ]}
                            >
                              <Star
                                color={colors.ink}
                                size={17}
                                fill={isFav ? colors.ink : 'transparent'}
                                strokeWidth={2.4}
                              />
                            </View>
                          </PressableScale>
                        </View>
                      </View>

                      {item.arabic ? (
                        <View style={[styles.arabicBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                          <Text style={[styles.arabic, { color: colors.text }]} numberOfLines={expanded ? undefined : 2}>
                            {item.arabic}
                          </Text>
                        </View>
                      ) : null}

                      {expanded ? (
                        <Animated.View entering={FadeIn.duration(250)}>
                          {item.transliteration ? (
                            <View style={styles.metaBox}>
                              <View style={styles.metaLabelRow}>
                                <BookOpen color={colors.accent} size={13} />
                                <Text style={[styles.metaLabel, { color: colors.accent }]}>PRONUNCIATION</Text>
                              </View>
                              <Text style={[styles.metaText, styles.translit, { color: colors.textSecondary }]}>{item.transliteration}</Text>
                            </View>
                          ) : null}

                          {item.translation ? (
                            <View style={styles.metaBox}>
                              <View style={styles.metaLabelRow}>
                                <Sparkles color={colors.primary} size={13} />
                                <Text style={[styles.metaLabel, { color: colors.primary }]}>TRANSLATION</Text>
                              </View>
                              <Text style={[styles.metaText, { color: colors.text }]}>{item.translation}</Text>
                            </View>
                          ) : null}

                          <PressableScale
                            onPress={() => navigation.navigate('ComposePost', {
                              category: 'discuss',
                              attachment: { type: 'dua', arabic: item.arabic || '', translation: item.translation || '', ref: item.title },
                            })}
                            style={[styles.shareBtn, { backgroundColor: colors.accentSoft, borderColor: colors.ink }]}
                          >
                            <Share2 color={colors.ink} size={15} strokeWidth={2.5} />
                            <Text style={[styles.shareText, { color: colors.ink }]}>Share to Community</Text>
                          </PressableScale>
                        </Animated.View>
                      ) : null}

                      {item.transliteration || item.translation ? (
                        <View style={[styles.expandRow, { borderTopColor: colors.ink }]}>
                          <Text style={[styles.expandText, { color: colors.textMuted }]}>
                            {expanded ? 'Show less' : 'Pronunciation & meaning'}
                          </Text>
                          <ChevronDown
                            color={colors.textMuted}
                            size={16}
                            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                          />
                        </View>
                      ) : null}
                  </BrutalPressable>
                </Animated.View>
              );
            })
          ) : activeCategory === 'Favorites' ? (
            <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft, borderColor: colors.ink }]}>
                <Star color={colors.ink} size={36} fill={colors.accent} strokeWidth={2.4} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorite Duas Yet</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Tap the star icon on any supplication to save it here for daily recitation.
              </Text>
              <PressableScale
                onPress={() => setActiveCategory('All')}
                style={[styles.browseAllBtn, { backgroundColor: colors.primary, borderColor: colors.ink }]}
              >
                <Text style={[styles.browseAllText, { color: colors.onPrimary }]}>Browse All Duas</Text>
              </PressableScale>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}>
                <AlertCircle color={colors.textMuted} size={36} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No duas matched your search.</Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: brutal.borderThin,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 0 },
  clearSearchBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: brutal.borderThin,
  },
  catContainer: { paddingVertical: 14 },
  catRow: { paddingHorizontal: 18, gap: 8 },
  catChip: { borderWidth: brutal.borderThin, paddingHorizontal: 14, height: 38, borderRadius: 19, justifyContent: 'center' },
  catText: { fontSize: 13.5, fontWeight: '800' },
  listContainer: { paddingHorizontal: 18, paddingTop: 2 },
  card: { padding: 16, marginBottom: 16, marginRight: brutal.shadow },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  cardTitleBox: { flex: 1 },
  cardCategoryText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
  cardTitleText: { fontSize: 16.5, fontWeight: '900', letterSpacing: -0.2 },
  cardActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  starBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: brutal.borderThin,
  },
  browseAllBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: brutal.borderThin,
  },
  browseAllText: { fontSize: 14, fontWeight: '900' },
  playWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  playHalo: { position: 'absolute', width: 44, height: 44, borderRadius: 22 },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  playIconNudge: { marginLeft: 2 },
  eq: { flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: 14 },
  eqBar: { width: 3, borderRadius: 2 },
  arabicBox: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginTop: 14, borderWidth: brutal.borderThin },
  arabic: { fontSize: 25, fontFamily: 'Georgia', lineHeight: 46, textAlign: 'right', writingDirection: 'rtl' },
  metaBox: { marginTop: 14 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: brutal.borderThin, marginTop: 14 },
  shareText: { fontSize: 13, fontWeight: '900' },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  metaText: { fontSize: 14.5, lineHeight: 22 },
  translit: { fontStyle: 'italic' },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: brutal.borderThin,
  },
  expandText: { fontSize: 12.5, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: brutal.borderThin },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  hiddenWebView: { width: 0, height: 0, position: 'absolute', opacity: 0 },
});
