import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

export function DuasScreen() {
  const navigation = useNavigation();
  const { content } = useDynamicContent();
  const [duas, setDuas] = useState<any[]>(content.duas || []);
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<number | null>(null);
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

  const filteredDuas = activeCategory === 'All' 
    ? duas 
    : duas.filter(d => d.category === activeCategory);

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
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Duas List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredDuas.map((item) => {
          const isPlaying = playingId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <Text style={styles.cardTitleText}>{item.title}</Text>
                </View>
                {item.audio ? (
                  <TouchableOpacity
                    style={[styles.audioBtn, isPlaying ? styles.audioBtnPlaying : null]}
                    onPress={() => handlePlayAudio(item.id, item.audio)}
                  >
                    <Volume2 color={isPlaying ? Theme.colors.white : Theme.colors.primary} size={16} />
                    <Text style={[styles.audioBtnText, isPlaying ? styles.audioBtnTextPlaying : null]}>
                      {isPlaying ? 'Playing' : 'Listen'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.arabic}>{item.arabic}</Text>

              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Pronunciation</Text>
                <Text style={styles.metaText}>{item.transliteration}</Text>
              </View>

              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Translation</Text>
                <Text style={styles.metaText}>{item.translation}</Text>
              </View>
            </View>
          );
        })}
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
    borderRadius: Theme.radius.lg,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(35, 68, 50, 0.2)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardCategory: {
    color: Theme.colors.accent,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardTitleText: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.sm,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    gap: 4,
  },
  audioBtnPlaying: {
    backgroundColor: Theme.colors.primary,
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
    fontSize: 22,
    color: Theme.colors.white,
    fontFamily: 'Georgia',
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 20,
  },
  metaBox: {
    marginBottom: 14,
    gap: 4,
  },
  metaLabel: {
    color: Theme.colors.accent,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
  },
});
