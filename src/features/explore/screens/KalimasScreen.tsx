import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

export function KalimasScreen() {
  const navigation = useNavigation();
  const { content } = useDynamicContent();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const webViewRef = useRef<WebView<{}>>(null);

  const kalimas = content.kalimas || [];

  const handlePlayAudio = (index: number, url: string) => {
    if (playingIndex === index) {
      // Pause
      const script = `document.getElementById("kalima-audio").pause();`;
      webViewRef.current?.injectJavaScript(script);
      setPlayingIndex(null);
    } else {
      // Play new
      setPlayingIndex(index);
      const script = `
        const player = document.getElementById("kalima-audio");
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
        <audio id="kalima-audio"></audio>
        <script>
          const player = document.getElementById("kalima-audio");
          player.onended = () => {
            window.ReactNativeWebView.postMessage("ended");
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
        <Text style={styles.title}>6 Kalimas</Text>
        <View style={styles.placeholderWidth} />
      </View>

      {/* Hidden Audio WebView */}
      <View style={styles.hiddenWebView}>
        <WebView<{}>
          ref={webViewRef}
          source={{ html: htmlAudio }}
          onMessage={(event: any) => {
            if (event.nativeEvent.data === 'ended') {
              setPlayingIndex(null);
            }
          }}
          javaScriptEnabled
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {kalimas.map((item, index) => {
          const isCurrentPlaying = playingIndex === index;
          return (
            <View key={item.number} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                
                {/* Audio button */}
                <TouchableOpacity
                  style={[styles.audioBtn, isCurrentPlaying ? styles.audioBtnPlaying : null]}
                  onPress={() => handlePlayAudio(index, item.audio)}
                >
                  <Volume2 color={isCurrentPlaying ? Theme.colors.white : Theme.colors.primary} size={16} />
                  <Text style={[styles.audioBtnText, isCurrentPlaying ? styles.audioBtnTextPlaying : null]}>
                    {isCurrentPlaying ? 'Playing' : 'Listen'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Arabic */}
              <Text style={styles.arabic}>{item.arabic}</Text>

              {/* Transliteration */}
              <View style={styles.metaSection}>
                <Text style={styles.metaLabel}>Pronunciation</Text>
                <Text style={styles.trans}>{item.transliteration}</Text>
              </View>

              {/* Translation */}
              <View style={styles.metaSection}>
                <Text style={styles.metaLabel}>Translation</Text>
                <Text style={styles.trans}>{item.translation}</Text>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(35, 68, 50, 0.2)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardName: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
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
  metaSection: {
    marginBottom: 14,
    gap: 4,
  },
  metaLabel: {
    color: Theme.colors.accent,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trans: {
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
