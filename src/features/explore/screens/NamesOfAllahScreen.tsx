import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Search, Volume2 } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';

// Helper to generate names list statically to avoid network calls
const NAMES = [
  { id: 1, name: 'الرَّحْمَنُ', trans: 'Ar-Rahmaan', meaning: 'The Beneficent / The Compassionate' },
  { id: 2, name: 'الرَّحِيمُ', trans: 'Ar-Raheem', meaning: 'The Merciful' },
  { id: 3, name: 'الْمَلِكُ', trans: 'Al-Malik', meaning: 'The Eternal Lord / The King' },
  { id: 4, name: 'الْقُدُّوسُ', trans: 'Al-Quddus', meaning: 'The Most Sacred / The Pure' },
  { id: 5, name: 'السَّلَامُ', trans: 'As-Salaam', meaning: 'The Source of Peace' },
  { id: 6, name: 'الْمُؤْمِنُ', trans: 'Al-Mu\'min', meaning: 'The Giver of Belief' },
  { id: 7, name: 'الْمُهَيْمِنُ', trans: 'Al-Muhaymin', meaning: 'The Guardian' },
  { id: 8, name: 'الْعَزِيزُ', trans: 'Al-Azeez', meaning: 'The Mighty / The Strong' },
  { id: 9, name: 'الْجَبَّارُ', trans: 'Al-Jabbaar', meaning: 'The Compeller / The Restorer' },
  { id: 10, name: 'الْمُتَكَبِّرُ', trans: 'Al-Mutakabbir', meaning: 'The Supreme / The Majestic' },
  { id: 11, name: 'الْخَالِقُ', trans: 'Al-Khaaliq', meaning: 'The Creator' },
  { id: 12, name: 'الْبَارِئُ', trans: 'Al-Baari\'', meaning: 'The Maker of Order' },
  { id: 13, name: 'الْمُصَوِّرُ', trans: 'Al-Musawwir', meaning: 'The Shaper of Beauty' },
  { id: 14, name: 'الْغَفَّارُ', trans: 'Al-Ghaffaar', meaning: 'The Forgiver' },
  { id: 15, name: 'الْقَهَّارُ', trans: 'Al-Qahhaar', meaning: 'The Subduer' },
  { id: 16, name: 'الْوَهَّابُ', trans: 'Al-Wahhaab', meaning: 'The Bestower' },
  { id: 17, name: 'الرَّزَّاقُ', trans: 'Ar-Razzaaq', meaning: 'The Provider' },
  { id: 18, name: 'الْفَتَّاحُ', trans: 'Al-Fattaah', meaning: 'The Opener / The Arbitrator' },
  { id: 19, name: 'الْعَلِيمُ', trans: 'Al-Aleem', meaning: 'The All-Knowing' },
  { id: 20, name: 'الْقَابِضُ', trans: 'Al-Qaabid', meaning: 'The Constrictor' },
  { id: 21, name: 'الْبَاسِطُ', trans: 'Al-Baasit', meaning: 'The Expander' },
  { id: 22, name: 'الْخَافِضُ', trans: 'Al-Khaafid', meaning: 'The Abaser' },
  { id: 23, name: 'الرَّافِعُ', trans: 'Ar-Raafi\'', meaning: 'The Exalter' },
  { id: 24, name: 'الْمُعِزُّ', trans: 'Al-Mu\'izz', meaning: 'The Giver of Honour' },
  { id: 25, name: 'الْمُذِلُّ', trans: 'Al-Muzil', meaning: 'The Giver of Dishonour' },
  { id: 26, name: 'السَّمِيعُ', trans: 'As-Samee\'', meaning: 'The All-Hearing' },
  { id: 27, name: 'الْبَصِيرُ', trans: 'Al-Baseer', meaning: 'The All-Seeing' },
  { id: 28, name: 'الْحَكَمُ', trans: 'Al-Hakam', meaning: 'The Judge' },
  { id: 29, name: 'الْعَدْلُ', trans: 'Al-Adl', meaning: 'The Utterly Just' },
  { id: 30, name: 'اللَّطِيفُ', trans: 'Al-Lateef', meaning: 'The Gentle / The Subtly Kind' },
  { id: 31, name: 'الْخَبِيرُ', trans: 'Al-Khabeer', meaning: 'The All-Aware' },
  { id: 32, name: 'الْحَلِيمُ', trans: 'Al-Haleem', meaning: 'The Forbearing' },
  { id: 33, name: 'الْعَظِيمُ', trans: 'Al-Azeem', meaning: 'The Magnificent' },
  { id: 34, name: 'الْغَفُورُ', trans: 'Al-Ghafoor', meaning: 'The All-Forgiving' },
  { id: 35, name: 'الشَّكُورُ', trans: 'Ash-Shakoor', meaning: 'The Appreciative' },
  { id: 36, name: 'الْعَلِيُّ', trans: 'Al-Aliyy', meaning: 'The Highest / The Sublime' },
  { id: 37, name: 'الْكَبِيرُ', trans: 'Al-Kabeer', meaning: 'The Great' },
  { id: 38, name: 'الْحَفِيظُ', trans: 'Al-Hafeez', meaning: 'The Preserver' },
  { id: 39, name: 'الْمُقِيتُ', trans: 'Al-Muqeet', meaning: 'The Nourisher' },
  { id: 40, name: 'الْحَسِيبُ', trans: 'Al-Haseeb', meaning: 'The Bringer of Judgment' },
  { id: 41, name: 'الْجَلِيلُ', trans: 'Al-Jaleel', meaning: 'The Majestic' },
  { id: 42, name: 'الْكَرِيمُ', trans: 'Al-Kareem', meaning: 'The Bountiful / The Generous' },
  { id: 43, name: 'الرَّقِيبُ', trans: 'Ar-Raqeeb', meaning: 'The Watchful' },
  { id: 44, name: 'الْمُجِيبُ', trans: 'Al-Mujeeb', meaning: 'The Responsive / The Answerer' },
  { id: 45, name: 'الْوَاسِعُ', trans: 'Al-Waasi\'', meaning: 'The All-Embracing' },
  { id: 46, name: 'الْحَكِيمُ', trans: 'Al-Hakeem', meaning: 'The Wise' },
  { id: 47, name: 'الْوَدُودُ', trans: 'Al-Wadood', meaning: 'The Loving One' },
  { id: 48, name: 'الْمَجِيدُ', trans: 'Al-Majeed', meaning: 'The Most Glorious' },
  { id: 49, name: 'الْبَاعِثُ', trans: 'Al-Baa\'ith', meaning: 'The Resurrector' },
  { id: 50, name: 'الشَّهِيدُ', trans: 'Ash-Shaheed', meaning: 'The Witness' },
  { id: 51, name: 'الْحَقُّ', trans: 'Al-Haqq', meaning: 'The Truth / The Real' },
  { id: 52, name: 'الْوَكِيلُ', trans: 'Al-Wakeel', meaning: 'The Trustee' },
  { id: 53, name: 'الْقَوِيُّ', trans: 'Al-Qawiyy', meaning: 'The Possessor of All Strength' },
  { id: 54, name: 'الْمَتِينُ', trans: 'Al-Mateen', meaning: 'The Firm / The Steadfast' },
  { id: 55, name: 'الْوَلِيُّ', trans: 'Al-Waliyy', meaning: 'The Protecting Friend' },
  { id: 56, name: 'الْحَمِيدُ', trans: 'Al-Hameed', meaning: 'The All-Praiseworthy' },
  { id: 57, name: 'الْمُحْصِي', trans: 'Al-Muhsee', meaning: 'The Appraiser / The Counter' },
  { id: 58, name: 'الْمُبْدِئُ', trans: 'Al-Mubdi\'', meaning: 'The Originator' },
  { id: 59, name: 'الْمُعِيدُ', trans: 'Al-Mu\'eed', meaning: 'The Restorer to Life' },
  { id: 60, name: 'الْمُحْيِي', trans: 'Al-Muhyee', meaning: 'The Giver of Life' },
  { id: 61, name: 'الْمُمِيتُ', trans: 'Al-Mumeet', meaning: 'The Creator of Death' },
  { id: 62, name: 'الْحَيُّ', trans: 'Al-Hayy', meaning: 'The Ever-Living' },
  { id: 63, name: 'الْقَيُّومُ', trans: 'Al-Qayyooh', meaning: 'The Self-Subsisting' },
  { id: 64, name: 'الْوَاجِدُ', trans: 'Al-Waajid', meaning: 'The Finder' },
  { id: 65, name: 'الْمَاجِدُ', trans: 'Al-Maajid', meaning: 'The Illustrious' },
  { id: 66, name: 'الْوَاحِدُ', trans: 'Al-Waahid', meaning: 'The One' },
  { id: 67, name: 'الْأَحَدُ', trans: 'Al-Ahad', meaning: 'The Unique / The Only' },
  { id: 68, name: 'الصَّمَدُ', trans: 'As-Samad', meaning: 'The Self-Sufficient' },
  { id: 69, name: 'الْقَادِرُ', trans: 'Al-Qaadir', meaning: 'The Able / The Capable' },
  { id: 70, name: 'الْمُقْتَدِرُ', trans: 'Al-Muqtadir', meaning: 'The Creator of All Power' },
  { id: 71, name: 'الْمُقَدِّمُ', trans: 'Al-Muqaddim', meaning: 'The Expediter' },
  { id: 72, name: 'الْمُؤَخِّرُ', trans: 'Al-Mu\'akhkhir', meaning: 'The Delayer' },
  { id: 73, name: 'الْأَوَّلُ', trans: 'Al-Awwal', meaning: 'The First' },
  { id: 74, name: 'الْآخِرُ', trans: 'Al-Aakhir', meaning: 'The Last' },
  { id: 75, name: 'الظَّاهِرُ', trans: 'Az-Zaahir', meaning: 'The Manifest' },
  { id: 76, name: 'الْبَاطِنُ', trans: 'Al-Baatin', meaning: 'The Hidden' },
  { id: 77, name: 'الْوَالِي', trans: 'Al-Waali', meaning: 'The Governor' },
  { id: 78, name: 'الْمُتَعَالِي', trans: 'Al-Muta\'aali', meaning: 'The Supreme Exalted' },
  { id: 79, name: 'الْبَرُّ', trans: 'Al-Barr', meaning: 'The Source of All Goodness' },
  { id: 80, name: 'التَّوَّابُ', trans: 'At-Tawwaab', meaning: 'The Acceptor of Repentance' },
  { id: 81, name: 'الْمُنْتَقِمُ', trans: 'Al-Muntaqim', meaning: 'The Avenger' },
  { id: 82, name: 'الْعَفُوُّ', trans: 'Al-Afuww', meaning: 'The Pardoner' },
  { id: 83, name: 'الرَّؤُوفُ', trans: 'Ar-Ra\'oof', meaning: 'The Most Kind' },
  { id: 84, name: 'مَالِكُ الْمُلْكِ', trans: 'Maalik-ul-Mulk', meaning: 'The Owner of All Sovereignty' },
  { id: 85, name: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', trans: 'Dhul-Jalaali Wal-Ikraam', meaning: 'The Lord of Majesty and Generosity' },
  { id: 86, name: 'الْمُقْسِطُ', trans: 'Al-Muqsit', meaning: 'The Equitable' },
  { id: 87, name: 'الْجَامِعُ', trans: 'Al-Jaami\'', meaning: 'The Gatherer' },
  { id: 88, name: 'الْغَنِيُّ', trans: 'Al-Ghaniyy', meaning: 'The Rich / The Independent' },
  { id: 89, name: 'الْمُغْنِي', trans: 'Al-Mughni', meaning: 'The Enricher' },
  { id: 90, name: 'الْمَانِعُ', trans: 'Al-Maani\'', meaning: 'The Preventer / The Shield' },
  { id: 91, name: 'الضَّارُّ', trans: 'Ad-Daarr', meaning: 'The Distresser' },
  { id: 92, name: 'النَّافِعُ', trans: 'An-Naafi\'', meaning: 'The Creator of Good' },
  { id: 93, name: 'النُّورُ', trans: 'An-Noor', meaning: 'The Light' },
  { id: 94, name: 'الْهَادِي', trans: 'Al-Haadi', meaning: 'The Guide' },
  { id: 95, name: 'الْبَدِيعُ', trans: 'Al-Badee\'', meaning: 'The Incomparable Originator' },
  { id: 96, name: 'الْبَاقِي', trans: 'Al-Baaqi', meaning: 'The Everlasting' },
  { id: 97, name: 'الْوَارِثُ', trans: 'Al-Waarith', meaning: 'The Supreme Inheritor' },
  { id: 98, name: 'الرَّشِيدُ', trans: 'Ar-Rasheed', meaning: 'The Guide to the Right Path' },
  { id: 99, name: 'الصَّبُورُ', trans: 'As-Saboor', meaning: 'The Patient' }
];

export function NamesOfAllahScreen() {
  const navigation = useNavigation();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNames, setFilteredNames] = useState(NAMES);
  const webViewRef = useRef<WebView<{}>>(null);

  const handlePlayName = (id: number) => {
    // Standard URL format for IslamicFinder individual name recitations
    const url = `https://www.islamicfinder.org/images/allah-names/audio/${id}.mp3`;
    
    if (playingId === id) {
      const script = `document.getElementById("name-audio").pause();`;
      webViewRef.current?.injectJavaScript(script);
      setPlayingId(null);
    } else {
      setActiveAudioUrl(url);
      setPlayingId(id);
      
      setTimeout(() => {
        const script = `
          const player = document.getElementById("name-audio");
          player.src = "${url}";
          player.play();
        `;
        webViewRef.current?.injectJavaScript(script);
      }, 300);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredNames(NAMES);
      return;
    }
    const lowerText = text.toLowerCase();
    const filtered = NAMES.filter(
      (n) =>
        n.trans.toLowerCase().includes(lowerText) ||
        n.meaning.toLowerCase().includes(lowerText) ||
        n.name.includes(text) ||
        n.id.toString() === text
    );
    setFilteredNames(filtered);
  };

  const htmlAudio = `
    <html>
      <body>
        <audio id="name-audio" src="${activeAudioUrl}"></audio>
        <script>
          const player = document.getElementById("name-audio");
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

  const renderNameCard = ({ item }: { item: typeof NAMES[0] }) => {
    const isPlaying = playingId === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isPlaying ? styles.cardPlaying : null]}
        onPress={() => handlePlayName(item.id)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.indexLabel}>{item.id}</Text>
          <Volume2 color={isPlaying ? Theme.colors.primary : Theme.colors.textMuted} size={16} />
        </View>
        
        <Text style={styles.arabicName}>{item.name}</Text>
        <Text style={styles.transName}>{item.trans}</Text>
        <Text style={styles.meaningName} numberOfLines={2}>{item.meaning}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>99 Names of Allah</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color={Theme.colors.textMuted} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search names or meanings..."
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredNames}
        renderItem={renderNameCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 48,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 15,
  },
  gridContainer: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 14,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    gap: 6,
  },
  cardPlaying: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  indexLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  arabicName: {
    fontSize: 24,
    color: Theme.colors.white,
    fontFamily: 'Georgia',
    marginVertical: 4,
  },
  transName: {
    color: Theme.colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  meaningName: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    height: 30, // constrain height for grid alignment
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
  },
});
