import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Volume2, Search, X, Sparkles, BookOpen } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

export function DuasScreen() {
  const navigation = useNavigation();
  useScreenTime('Duas');
  const { content } = useDynamicContent();
  const [duas, setDuas] = useState<any[]>(content.duas || []);
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const webViewRef = useRef<WebView<{}>>(null);

  // Sync with cached/local fallback data initially
  useEffect(() => {
    if (content.duas && content.duas.length > 0 && duas.length === 0) {
      setDuas(content.duas);
    }
  }, [content]);

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

  const categories = ['All', ...new Set(duas.map(d => d.category))];

  const filteredDuas = duas.filter(d => {
    const matchesCat = activeCategory === 'All' || d.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.translation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
      Home: '🏠 Home'
    };
    return emojis[cat] || `🤲 ${cat}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Duas</Text>
        <View style={styles.placeholderWidth} />
      </View>

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

      {/* Sleek Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search color={Theme.colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search duas, meanings, pronunciations..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X color={Theme.colors.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Slider */}
      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catBadge,
                activeCategory === cat ? styles.activeCatBadge : null,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.catText,
                  activeCategory === cat ? styles.activeCatText : null,
                ]}
              >
                {getCategoryLabel(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Duas List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredDuas.length > 0 ? (
          filteredDuas.map((item) => {
            const isPlaying = playingId === item.id;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleBox}>
                    <View style={styles.cardCategoryBadge}>
                      <Text style={styles.cardCategoryText}>{getCategoryLabel(item.category)}</Text>
                    </View>
                    <Text style={styles.cardTitleText}>{item.title}</Text>
                  </View>
                  {item.audio ? (
                    <TouchableOpacity
                      style={[styles.audioBtn, isPlaying ? styles.audioBtnPlaying : null]}
                      onPress={() => handlePlayAudio(item.id, item.audio)}
                      activeOpacity={0.8}
                    >
                      <Volume2 color={isPlaying ? Theme.colors.white : Theme.colors.primary} size={14} />
                      <Text style={[styles.audioBtnText, isPlaying ? styles.audioBtnTextPlaying : null]}>
                        {isPlaying ? 'Playing' : 'Listen'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {item.arabic ? (
                  <Text style={styles.arabic}>{item.arabic}</Text>
                ) : null}

                {item.transliteration ? (
                  <View style={styles.metaBox}>
                    <View style={styles.metaLabelRow}>
                      <BookOpen color={Theme.colors.accent} size={13} />
                      <Text style={styles.metaLabel}>Pronunciation</Text>
                    </View>
                    <Text style={styles.metaText}>{item.transliteration}</Text>
                  </View>
                ) : null}

                {item.translation ? (
                  <View style={styles.metaBox}>
                    <View style={styles.metaLabelRow}>
                      <Sparkles color={Theme.colors.primary} size={13} />
                      <Text style={styles.metaLabel}>Translation</Text>
                    </View>
                    <Text style={styles.metaText}>{item.translation}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <AlertCircle color={Theme.colors.textMuted} size={48} />
            <Text style={styles.emptyText}>No duas matched your search.</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  placeholderWidth: {
    width: 40,
  },
  searchBarContainer: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 68, 50, 0.03)',
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  catContainer: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  catRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catBadge: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.radius.round,
  },
  activeCatBadge: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  catText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeCatText: {
    color: Theme.colors.white,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleBox: {
    flex: 1,
    paddingRight: 12,
  },
  cardCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  cardCategoryText: {
    color: Theme.colors.primary,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardTitleText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    gap: 6,
  },
  audioBtnPlaying: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  audioBtnText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  audioBtnTextPlaying: {
    color: Theme.colors.white,
  },
  arabic: {
    fontSize: 23,
    color: '#046C4E',
    fontFamily: 'Georgia',
    lineHeight: 44,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  metaBox: {
    backgroundColor: 'rgba(35, 68, 50, 0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderColor: 'rgba(35, 68, 50, 0.04)',
    borderWidth: 1,
  },
  metaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaLabel: {
    color: Theme.colors.accentDark,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaText: {
    color: Theme.colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
  },
});
