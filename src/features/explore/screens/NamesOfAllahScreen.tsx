import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Pause, Search, Volume2, X } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { GlassCard, PressableScale, ScreenHeader, haptic } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';

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

type NameItem = typeof NAMES[0];

/** Small eight-pointed star badge holding the name's number. */
function StarBadge({ n }: { n: number }) {
  const { colors } = useAppTheme();
  const square = { borderColor: colors.ink, backgroundColor: colors.accent };
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeSquare, square, styles.badgeRotated]} />
      <View style={[styles.badgeSquare, square]} />
      <Text style={[styles.badgeText, { color: colors.ink }]}>{n}</Text>
    </View>
  );
}

const NameCard = React.memo(function NameCardInner({ item, index, isPlaying, onPlay }: {
  item: NameItem;
  index: number;
  isPlaying: boolean;
  onPlay: (id: number) => void;
}) {
  const { colors } = useAppTheme();
  const [flipped, setFlipped] = useState(false);
  const flip = useSharedValue(0);

  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    flip.value = withTiming(next ? 1 : 0, { duration: 420 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
  }));

  const faceBase = [
    styles.face,
    {
      backgroundColor: isPlaying ? colors.accentSoft : colors.surface,
      borderColor: colors.ink,
    },
  ];

  const playButton = (
    <PressableScale
      onPress={() => onPlay(item.id)}
      hitSlop={8}
      style={[styles.playBtn, { backgroundColor: isPlaying ? colors.primary : colors.primarySoft, borderColor: colors.ink }]}
    >
      {isPlaying ? <Pause color={colors.onPrimary} size={14} /> : <Volume2 color={colors.ink} size={14} strokeWidth={2.4} />}
    </PressableScale>
  );

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 360)).duration(380)} style={styles.cell}>
      <PressableScale onPress={toggle} scaleTo={0.97} style={styles.cardPress}>
        {/* Hard offset shadow shared by both faces */}
        <View pointerEvents="none" style={[styles.hardShadow, { backgroundColor: colors.ink }]} />
        <Animated.View style={[faceBase, frontStyle]} pointerEvents={flipped ? 'none' : 'auto'}>
          <View style={styles.cardTop}>
            <StarBadge n={item.id} />
            {playButton}
          </View>
          <Text style={[styles.arabicName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {item.name}
          </Text>
          <Text style={[styles.transName, { color: colors.text }]} numberOfLines={1}>{item.trans}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>Tap for meaning</Text>
        </Animated.View>

        <Animated.View
          style={[faceBase, styles.faceBack, { backgroundColor: colors.surfaceAlt }, backStyle]}
          pointerEvents={flipped ? 'auto' : 'none'}
        >
          <View style={styles.cardTop}>
            <StarBadge n={item.id} />
            {playButton}
          </View>
          <Text style={[styles.backTrans, { color: colors.textSecondary }]} numberOfLines={1}>{item.trans}</Text>
          <Text style={[styles.meaning, { color: colors.text }]} numberOfLines={4}>{item.meaning}</Text>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
});

export function NamesOfAllahScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [namesOfAllah, setNamesOfAllah] = useState(NAMES);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const webViewRef = useRef<WebView<{}>>(null);

  useEffect(() => {
    const fetchLiveNames = async () => {
      try {
        const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && json.data.length > 0) {
            const mapped = json.data.map((item: any) => ({
              id: item.number,
              name: item.name,
              trans: item.transliteration,
              meaning: item.en.meaning,
            }));
            setNamesOfAllah(mapped);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch Names of Allah live:', e);
      }
    };
    fetchLiveNames();
  }, []);

  const filteredNames = searchQuery.trim() === ''
    ? namesOfAllah
    : namesOfAllah.filter(
        (n) =>
          n.trans.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.name.includes(searchQuery) ||
          n.id.toString() === searchQuery
      );

  const handlePlayName = useCallback((id: number) => {
    // Standard URL format for IslamicFinder individual name recitations
    const url = `https://www.islamicfinder.org/images/allah-names/audio/${id}.mp3`;

    if (playingId === id) {
      webViewRef.current?.injectJavaScript('document.getElementById("name-audio").pause(); true;');
      setPlayingId(null);
    } else {
      setPlayingId(id);
      const script = `
        const player = document.getElementById("name-audio");
        if (player.src !== "${url}") {
          player.src = "${url}";
        }
        player.play();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [playingId]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const htmlAudio = `
    <html>
      <body>
        <audio id="name-audio"></audio>
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

  const renderNameCard = ({ item, index }: { item: NameItem; index: number }) => (
    <NameCard item={item} index={index} isPlaying={playingId === item.id} onPlay={handlePlayName} />
  );

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

      <FlatList
        data={filteredNames}
        renderItem={renderNameCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={[styles.gridContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <ScreenHeader
            title="99 Names of Allah"
            subtitle="Asma ul-Husna · tap a card to reveal its meaning"
            onBack={() => navigation.goBack()}
            style={styles.header}
          >
            <GlassCard style={styles.searchBox}>
              <Search color={colors.onSky} size={18} />
              <TextInput
                style={[styles.searchInput, { color: colors.onSky }]}
                placeholder="Search names or meanings..."
                placeholderTextColor={colors.onSkyMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <PressableScale onPress={() => { haptic.select(); setSearchQuery(''); }} hitSlop={10}>
                  <X color={colors.onSky} size={18} />
                </PressableScale>
              )}
            </GlassCard>
            <Text style={[styles.count, { color: colors.onSkyMuted }]}>
              {filteredNames.length} of {namesOfAllah.length} names
            </Text>
          </ScreenHeader>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>No names match “{searchQuery}”.</Text>
        }
      />
    </View>
  );
}

const CARD_HEIGHT = 178;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginHorizontal: -14, marginBottom: 18 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 14, marginTop: 18 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', height: 44 },
  count: { fontSize: 12, fontWeight: '700', marginTop: 10, letterSpacing: 0.3 },
  gridContainer: { paddingHorizontal: 14 },
  rowWrapper: { gap: 14, marginBottom: 16 },
  cell: { flex: 1 },
  cardPress: { height: CARD_HEIGHT, marginRight: brutal.shadow },
  hardShadow: { position: 'absolute', top: brutal.shadow, left: brutal.shadow, right: -brutal.shadow, bottom: -brutal.shadow, borderRadius: 22 },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: brutal.border,
  },
  faceBack: { justifyContent: 'flex-start' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  badge: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  badgeSquare: { position: 'absolute', width: 22, height: 22, borderWidth: 1.5, borderRadius: 4 },
  badgeRotated: { transform: [{ rotate: '45deg' }] },
  badgeText: { fontSize: 10, fontWeight: '900' },
  playBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: brutal.borderThin },
  arabicName: { fontSize: 32, lineHeight: 56, fontFamily: 'Georgia', marginTop: 6, textAlign: 'center', alignSelf: 'stretch' },
  transName: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  hint: { fontSize: 11, fontWeight: '700', marginTop: 'auto' },
  backTrans: { fontSize: 14, fontWeight: '900', marginTop: 14 },
  meaning: { fontSize: 15, fontWeight: '700', lineHeight: 21, textAlign: 'center', marginTop: 8 },
  empty: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 40 },
  hiddenWebView: { width: 0, height: 0, position: 'absolute', opacity: 0 },
});
