import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';

const KALIMAS = [
  {
    number: 1,
    name: 'First Kalima - Tayyabah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ مُحَمَّدٌ رَّسُولُ ٱللَّٰهِ',
    transliteration: 'La ilaha illallah Muhammadu Rasoolullah',
    translation: 'There is no deity but Allah, and Muhammad is the messenger of Allah.',
    audio: 'https://www.islamicfinder.org/images/kalmas/audio/kalma-1.mp3',
  },
  {
    number: 2,
    name: 'Second Kalima - Shahadah',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'Ashhadu al-la ilaha illallahu wahdahu la shareeka lahu wa-ashhadu anna Muhammadan abduhu wa Rasooluhu',
    translation: 'I bear witness that there is no deity but Allah, alone, without partner, and I bear witness that Muhammad is His servant and His messenger.',
    audio: 'https://www.islamicfinder.org/images/kalmas/audio/kalma-2.mp3',
  },
  {
    number: 3,
    name: 'Third Kalima - Tamjeed',
    arabic: 'سُبْحَانَ ٱللَّٰهِ وَٱلْحَمْدُ لِلَّٰهِ وَلَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَٱللَّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ ٱلْعَلِيِّ ٱلْعَظِيمِ',
    transliteration: 'Subhanallahi wal hamdulillahi wala ilaha illallahu wallahu akbar, wala hawla wala quwwata illa billahil aliyyil azeem',
    translation: 'Glory be to Allah, and praise be to Allah, and there is no deity but Allah, and Allah is most great. And there is no power and no strength except in Allah, the Most High, the Most Great.',
    audio: 'https://www.islamicfinder.org/images/kalmas/audio/kalma-3.mp3',
  },
  {
    number: 4,
    name: 'Fourth Kalima - Tauheed',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ، يُحْيِي وَيُمِيتُ، بِيَدِهِ ٱلْخَيْرُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illallahu wahdahu la shareeka lahu, lahul mulku walahul hamdu, yuhyi wa yumeetu, biyadihil khairu, wahuwa ala kulli shayin qadeer',
    translation: 'There is no deity but Allah, alone, without partner. His is the sovereignty, and His is the praise. He gives life and causes death. In His hand is goodness, and He has power over all things.',
    audio: 'https://www.islamicfinder.org/images/kalmas/audio/kalma-4.mp3',
  },
  {
    number: 5,
    name: 'Fifth Kalima - Astaghfar',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً سِرًّا أَوْ عَلَانِيَةً وَأَتُوبُ إِلَيْهِ مِنَ ٱلذَّنْبِ ٱلَّذِي أَعْلَمُ وَمِنَ ٱلذَّنْبِ ٱلَّذِي لَا أَعْلَمُ، إِنَّكَ أَنْتَ عَلَّامُ ٱلْغُيُوبِ وَسَتَّارُ ٱلْعُيُوبِ وَغَفَّارُ ٱلذُّنُوبِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ ٱلْعَلِيِّ ٱلْعَظِيمِ',
    transliteration: 'Astaghfirullaha rabbi min kulli zambin aznabtuhu amadan aw khata-an sirran aw alaniyatan wa-atoobu ilaihi minaz-zambillazi a-alamu wa minaz-zambillazi la a-alamu, innaka anta allamul ghuyoobi wa sattarul uyoobi wa ghaffaruz zunoobi wala hawla wala quwwata illa billahil aliyyil azeem',
    translation: 'I seek forgiveness from Allah, my Lord, for every sin I committed knowingly or unknowingly, secretly or openly, and I turn to Him in repentance for the sin that I know and for the sin that I do not know. Indeed, You are the Knower of the unseen, the Coverer of faults, and the Forgiver of sins. And there is no power and no strength except in Allah, the Most High, the Most Great.',
    audio: 'https://www.islamicfinder.org/images/kalmas/audio/kalma-5.mp3',
  },
  {
    number: 6,
    name: 'Sixth Kalima - Radde Kufr',
    arabic: 'ٱللَّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْءٍ وَأَنَا أَعْلَمُ بِهِ، وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ بِهِ، تُبْتُ عَنْهُ وَتَبَرَّأْتُ مِنَ ٱلْكُفْرِ وَٱلشِّرْكِ وَٱلْكِذْبِ وَٱلْغِيبَةِ وَٱلْبِدْعَةِ وَٱلنَّمِيمَةِ وَٱلْفَوَاحِشِ وَٱلْبُهْتَانِ وَٱلْمَعَاصِي كُلِّهَا، وَأَسْلَمْتُ وَأَقُولُ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ مُحَمَّدٌ رَّسُولُ ٱللَّٰهِ',
    transliteration: 'Allahumma inni a-oozubika min an ushrika bika shai-an wa-ana a-alamu bihi, wa-astaghfiruka lima la a-alamu bihi, tubtu anhu wa tabarratu minal kufri wash-shirki wal kizbi wal gheebati wal bid-ati wan-nameemati wal fawahishi wal buhtani wal ma-asi kulliha, wa-aslamtu wa-aqoolu La ilaha illallahu Muhammadu Rasoolullah',
    translation: 'O Allah! I seek protection in You from associating partners with You knowingly, and I seek Your forgiveness for what I do not know. I repent from it and free myself from disbelief, polytheism, falsehood, backbiting, innovation, slander, lewdness, calumny, and all disobedience. I submit, and I say: There is no deity but Allah, and Muhammad is the messenger of Allah.',
    audio: 'https://www.islamicfinder.org/images/kalmas/audio/kalma-6.mp3',
  },
];

export function KalimasScreen() {
  const navigation = useNavigation();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const webViewRef = useRef<WebView<{}>>(null);

  const handlePlayAudio = (index: number, url: string) => {
    if (playingIndex === index) {
      // Pause
      const script = `document.getElementById("kalima-audio").pause();`;
      webViewRef.current?.injectJavaScript(script);
      setPlayingIndex(null);
    } else {
      // Play new
      setActiveAudioUrl(url);
      setPlayingIndex(index);
      
      // Delay slightly for HTML source update if changed
      setTimeout(() => {
        const script = `
          const player = document.getElementById("kalima-audio");
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
        <audio id="kalima-audio" src="${activeAudioUrl}"></audio>
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
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {KALIMAS.map((item, index) => {
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
