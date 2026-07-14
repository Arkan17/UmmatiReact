import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = ['All', 'Morning/Evening', 'Daily Life', 'Travel', 'Protection'];

const DUAS = [
  {
    id: 1,
    category: 'Morning/Evening',
    title: 'Dua upon waking up',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdu lillahil-lazee ahyana ba\'da ma amatana wa-ilaihin-nushoor',
    translation: 'Praise is to Allah Who gave us life after He had caused us to die, and to Him is the resurrection.',
    audio: 'http://www.duas.com/sounds/58.mp3',
  },
  {
    id: 2,
    category: 'Morning/Evening',
    title: 'Dua before sleeping',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amootu wa-ahya',
    translation: 'In Your name, O Allah, I die and I live.',
    audio: 'http://www.duas.com/sounds/57.mp3',
  },
  {
    id: 3,
    category: 'Daily Life',
    title: 'Dua before eating',
    arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ',
    transliteration: 'Bismillahi wa \'ala barakatillah',
    translation: 'In the name of Allah and with the blessings of Allah.',
    audio: 'http://www.duas.com/sounds/48.mp3',
  },
  {
    id: 4,
    category: 'Daily Life',
    title: 'Dua after finishing meal',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    transliteration: 'Alhamdu lillahil-lazee at\'amana wa-saqana wa-ja\'alana muslimeen',
    translation: 'Praise is to Allah Who has fed us and given us drink and made us Muslims.',
    audio: 'http://www.duas.com/sounds/50.mp3',
  },
  {
    id: 5,
    category: 'Travel',
    title: 'Dua for traveling',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: 'Subhanal-lazee sakhkhara lana haza wama kunna lahu muqrineen, wa-inna ila rabbina lamunqaliboon',
    translation: 'Glory is to Him Who has subjected this to us, and we were not able to control it, and indeed to our Lord we will return.',
    audio: 'http://www.duas.com/sounds/104.mp3',
  },
  {
    id: 6,
    category: 'Protection',
    title: 'Dua for protection from harm',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahil-lazee la yadurru ma\'as-mihi shai\'un fil-ardi wala fis-samai wa-huwas-samee\'ul-aleem',
    translation: 'In the name of Allah, with Whose name nothing can cause harm in the earth nor in the heaven, and He is the All-Hearing, the All-Knowing.',
    audio: 'http://www.duas.com/sounds/306.mp3',
  },
];

export function DuasScreen() {
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const webViewRef = useRef<WebView<{}>>(null);

  const filteredDuas = activeCategory === 'All' 
    ? DUAS 
    : DUAS.filter(d => d.category === activeCategory);

  const handlePlayAudio = (id: number, url: string) => {
    if (playingId === id) {
      const script = `document.getElementById("dua-audio").pause();`;
      webViewRef.current?.injectJavaScript(script);
      setPlayingId(null);
    } else {
      setActiveAudioUrl(url);
      setPlayingId(id);
      
      setTimeout(() => {
        const script = `
          const player = document.getElementById("dua-audio");
          player.src = "${url}";
          player.play();
        `;
        webViewRef.current?.injectJavaScript(script);
      }, 300);
    }
  };

  const htmlAudio = `
    <html>
      <body>
        <audio id="dua-audio" src="${activeAudioUrl}"></audio>
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
        />
      </View>

      {/* Category Slider */}
      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((cat) => (
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
                <TouchableOpacity
                  style={[styles.audioBtn, isPlaying ? styles.audioBtnPlaying : null]}
                  onPress={() => handlePlayAudio(item.id, item.audio)}
                >
                  <Volume2 color={isPlaying ? Theme.colors.white : Theme.colors.primary} size={16} />
                  <Text style={[styles.audioBtnText, isPlaying ? styles.audioBtnTextPlaying : null]}>
                    {isPlaying ? 'Playing' : 'Listen'}
                  </Text>
                </TouchableOpacity>
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
