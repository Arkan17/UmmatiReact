// Developer's Note: a letter from the developer and a sadaqah jariyah dedication to his late family.
// The memorial sits on a calm, flat-illustrated meadow (their resting place, at peace), drawn in the
// app's soft neo-brutalist style.
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  SharedValue,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { BookOpen, Heart, HandHeart } from 'lucide-react-native';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, ScreenHeader, SectionHeader, haptic, useScreenActive } from '../../../core/components/ui';
import { BRAND, RUB_EL_HIZB } from '../../../core/components/UmmatiLogo';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INK = BRAND.ink;

interface Marhoom {
  relation: string;
  english: string;
  name: string;
  female?: boolean;
}

const MARHOOMEEN: Marhoom[] = [
  { relation: 'Dada', english: 'Grandfather', name: 'Malik Mohammed Parande' },
  { relation: 'Dadi', english: 'Grandmother', name: 'Qulsumbi Malik Mohammed Parande', female: true },
  { relation: 'Abba', english: 'Father', name: 'Abdul Kader Malik Mohammed Parande' },
  { relation: 'Chacha', english: 'Uncle', name: 'Abdul Hamid Malik Mohammed Parande' },
];

const SURAHS = [
  { number: 1, name: 'Al-Fatiha', fill: tints.gold },
  { number: 36, name: 'Ya-Sin', fill: tints.green },
  { number: 67, name: 'Al-Mulk', fill: tints.blue },
];

// ---------- the resting place: a calm meadow at first light ----------

const MEADOW_TOP = 236; // y where the front meadow starts; the plaques stand on it

const SCENE = {
  sky: '#E4EEEA',
  sun: '#FFF4D6',
  farHill: '#CFE2D6',
  midHill: '#B2D2BD',
  meadow: '#97C3A5',
  tree: '#5E9C7A',
  treeDark: '#4E8A69',
  mosque: '#E9F0EA',
};

/** Rising motes of light (noor), all driven by one shared clock. */
function Mote({ x, y, phase, clock }: { x: number; y: number; phase: number; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = (clock.value + phase) % 1;
    return { opacity: Math.sin(t * Math.PI) * 0.9, transform: [{ translateY: -t * 70 }, { translateX: Math.sin(t * Math.PI * 2) * 6 }] };
  });
  return <Animated.View style={[styles.mote, { left: x, top: y }, style]} />;
}

function DriftCloud({ top, startX, width, sceneW, duration, active }: { top: number; startX: number; width: number; sceneW: number; duration: number; active: boolean }) {
  const x = useSharedValue(startX);
  useEffect(() => {
    if (!active) { cancelAnimation(x); return; }
    x.value = withRepeat(withSequence(
      withTiming(sceneW + 10, { duration: duration * ((sceneW + 10 - startX) / (sceneW + width + 20)), easing: Easing.linear }),
      withTiming(-width - 10, { duration: 0 }),
      withTiming(startX, { duration: duration * ((startX + width + 10) / (sceneW + width + 20)), easing: Easing.linear }),
    ), -1);
    return () => cancelAnimation(x);
  }, [active, x, startX, sceneW, width, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View renderToHardwareTextureAndroid shouldRasterizeIOS style={[{ position: 'absolute', top, left: 0 }, style]}>
      <Svg width={width} height={width * 0.46} viewBox="-3 -3 106 49">
        <Path d="M14 42 Q2 42 2 32 Q2 22 14 22 Q16 8 32 8 Q42 0 54 6 Q70 2 74 18 Q90 16 94 28 Q98 42 84 42 Z" fill="#FFFAF1" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function Cypress({ x, base, h, fill }: { x: number; base: number; h: number; fill: string }) {
  const w = h * 0.32;
  return (
    <G>
      <Rect x={x - 2} y={base - 8} width={4} height={10} fill="#7A5C3E" stroke={INK} strokeWidth={1.5} />
      <Path d={`M${x} ${base - h} Q${x + w} ${base - h * 0.45} ${x + w * 0.55} ${base - 6} L${x - w * 0.55} ${base - 6} Q${x - w} ${base - h * 0.45} ${x} ${base - h} Z`} fill={fill} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
    </G>
  );
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Path d={`M${x} ${y} L${x} ${y + 9}`} stroke={INK} strokeWidth={1.5} />
      <Circle cx={x} cy={y} r={4} fill={color} stroke={INK} strokeWidth={1.5} />
      <Circle cx={x} cy={y} r={1.3} fill={INK} />
    </G>
  );
}

function PeacefulMeadow({ width, height }: { width: number; height: number }) {
  const active = useScreenActive();
  const w = width;
  const clock = useSharedValue(0);
  useEffect(() => {
    if (active) clock.value = withRepeat(withTiming(clock.value + 1, { duration: 7000, easing: Easing.linear }), -1, false);
    else cancelAnimation(clock);
    return () => cancelAnimation(clock);
  }, [active, clock]);

  const flowers = useMemo(() => {
    const colors = [tints.rose, tints.gold, '#FFFAF1', tints.violet];
    return Array.from({ length: 22 }, (_, i) => ({
      x: 14 + ((i * 73.7) % (w - 28)),
      y: MEADOW_TOP + 18 + ((i * 131.3) % Math.max(40, height - MEADOW_TOP - 40)),
      color: colors[i % colors.length],
    }));
  }, [w, height]);
  const motes = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    x: 20 + ((i * 97) % (w - 40)),
    y: MEADOW_TOP + 40 + ((i * 61) % 160),
    phase: i / 7,
  })), [w]);

  // Far hill with a small mosque on its crest
  const farHill = `M0 ${MEADOW_TOP - 40} Q${w * 0.22} ${MEADOW_TOP - 92} ${w * 0.5} ${MEADOW_TOP - 70} Q${w * 0.78} ${MEADOW_TOP - 48} ${w} ${MEADOW_TOP - 86} L${w} ${height} L0 ${height} Z`;
  const midHill = `M0 ${MEADOW_TOP - 18} Q${w * 0.35} ${MEADOW_TOP - 54} ${w * 0.62} ${MEADOW_TOP - 30} Q${w * 0.85} ${MEADOW_TOP - 12} ${w} ${MEADOW_TOP - 34} L${w} ${height} L0 ${height} Z`;
  const meadow = `M0 ${MEADOW_TOP} Q${w * 0.5} ${MEADOW_TOP - 22} ${w} ${MEADOW_TOP} L${w} ${height} L0 ${height} Z`;
  const mx = w * 0.5;
  const my = MEADOW_TOP - 70;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={height} style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={w} height={height} fill={SCENE.sky} />
        {/* Soft morning light */}
        <Circle cx={w * 0.8} cy={58} r={52} fill="none" stroke={INK} strokeWidth={1.5} strokeDasharray="3 7" opacity={0.5} />
        <Circle cx={w * 0.8} cy={58} r={34} fill={SCENE.sun} stroke={INK} strokeWidth={2.5} />
        {/* Birds */}
        <G stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round">
          <Path d={`M${w * 0.18} 62 q6 -6 12 0 q6 -6 12 0`} />
          <Path d={`M${w * 0.3} 44 q4 -4 8 0 q4 -4 8 0`} />
          <Path d={`M${w * 0.58} 78 q4 -4 8 0 q4 -4 8 0`} />
        </G>
        <Path d={farHill} fill={SCENE.farHill} stroke={INK} strokeWidth={2} />
        {/* Mosque on the far hill */}
        <G stroke={INK} strokeWidth={1.8} strokeLinejoin="round" fill={SCENE.mosque}>
          <Rect x={mx - 26} y={my - 14} width={52} height={22} />
          <Path d={`M${mx - 16} ${my - 14} Q${mx - 16} ${my - 38} ${mx} ${my - 42} Q${mx + 16} ${my - 38} ${mx + 16} ${my - 14} Z`} />
          <Path d={`M${mx} ${my - 42} L${mx} ${my - 50}`} fill="none" />
          <Rect x={mx + 30} y={my - 40} width={7} height={48} />
          <Path d={`M${mx + 29} ${my - 40} L${mx + 33.5} ${my - 50} L${mx + 38} ${my - 40} Z`} />
          <Path d={`M${mx - 6} ${my + 8} L${mx - 6} ${my - 2} Q${mx} ${my - 8} ${mx + 6} ${my - 2} L${mx + 6} ${my + 8}`} fill={SCENE.farHill} />
        </G>
        <Path d={midHill} fill={SCENE.midHill} stroke={INK} strokeWidth={2} />
        <Cypress x={w * 0.08} base={MEADOW_TOP - 6} h={70} fill={SCENE.tree} />
        <Cypress x={w * 0.16} base={MEADOW_TOP - 2} h={52} fill={SCENE.treeDark} />
        <Cypress x={w * 0.9} base={MEADOW_TOP - 4} h={64} fill={SCENE.tree} />
        <Path d={meadow} fill={SCENE.meadow} stroke={INK} strokeWidth={2.5} />
        {/* Grass tufts */}
        <G stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none">
          {flowers.map((f, i) => i % 2 ? <Path key={i} d={`M${f.x + 14} ${f.y + 12} l-3 -7 M${f.x + 14} ${f.y + 12} l0 -8 M${f.x + 14} ${f.y + 12} l3 -7`} /> : null)}
        </G>
        {flowers.map((f, i) => <Flower key={i} {...f} />)}
      </Svg>
      <DriftCloud top={30} startX={w * 0.05} width={92} sceneW={w} duration={90000} active={active} />
      <DriftCloud top={96} startX={w * 0.55} width={64} sceneW={w} duration={120000} active={active} />
      {motes.map((m, i) => <Mote key={i} {...m} clock={clock} />)}
    </View>
  );
}

/** Mihrab-shaped name plaque (arched top), outlined in ink with a hard shadow. */
function ArchPlaque({ person, width, index }: { person: Marhoom; width: number; index: number }) {
  const arch = { borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 };
  const innerW = width - 16;
  const innerArch = { borderTopLeftRadius: innerW / 2, borderTopRightRadius: innerW / 2, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 };
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 120).duration(450)} style={{ width }}>
      <View style={[StyleSheet.absoluteFill, arch, styles.plaqueShadow]} />
      <View style={[styles.plaque, arch]}>
        <View style={[styles.plaqueInner, innerArch]}>
          <Svg width={26} height={26} viewBox="0 0 100 100">
            <Path d={RUB_EL_HIZB} fill={BRAND.gold} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          </Svg>
          <View style={styles.relationChip}>
            <Text style={styles.relationText}>{person.relation.toUpperCase()}</Text>
          </View>
          <Text style={styles.relationEnglish}>{person.english}</Text>
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.rahimahullah}>{person.female ? 'رَحِمَهَا اللّٰهُ' : 'رَحِمَهُ اللّٰهُ'}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------- screen ----------

export function DevelopersNoteScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [sceneH, setSceneH] = useState(760);
  const [ameen, setAmeen] = useState(false);

  const cardW = width - 36 - brutal.shadow;
  const plaqueW = Math.floor((cardW - 18 * 2 - 16) / 2);

  const heart = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + heart.value * 0.35 }] }));
  const sayAmeen = () => {
    haptic.success();
    setAmeen(true);
    heart.value = withSequence(withSpring(1, { damping: 6 }), withSpring(0));
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Developer's Note"
        subtitle="A letter, and a sadaqah jariyah"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* ── The letter ── */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <BrutalBox fill={BRAND.cream} radius={22} style={styles.letter}>
            <View style={styles.letterHead}>
              <BrutalBox fill={tints.green} radius={30} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.avatar}>
                <Text style={styles.avatarText}>AM</Text>
              </BrutalBox>
              <View style={styles.flex}>
                <Text style={styles.devName}>Arkan Malik</Text>
                <View style={styles.roleChip}><Text style={styles.roleText}>DEVELOPER · UMMATI</Text></View>
              </View>
            </View>
            <View style={styles.rule} />
            <Text style={styles.salam}>Assalamu Alaikum wa Rahmatullah,</Text>
            <Text style={styles.letterText}>
              I'm Arkan Malik, and I built Ummati with one simple intention: to make it a little easier for all of us to
              stay close to Allah, to never miss a Salah, to open the Quran more often, and to remember Him throughout our day.
            </Text>
            <Text style={styles.letterText}>
              This app is also my sadaqah jariyah for the people who raised me and shaped my Deen. They are no longer with
              us, but I pray that every ayah read here, every dhikr counted and every dua made becomes a light in their graves.
            </Text>
            <Text style={styles.letterText}>
              If Ummati benefits you in any way, I ask only one thing: please remember them, and me, in your duas.
            </Text>
            <Text style={styles.signoff}>JazakAllahu Khairan,</Text>
            <Text style={styles.signature}>— Arkan Malik</Text>
          </BrutalBox>
        </Animated.View>

        {/* ── In loving memory: their resting place, at peace ── */}
        <SectionHeader title="In Loving Memory" />
        <Animated.View entering={FadeInDown.delay(120).duration(450)}>
          <BrutalBox radius={26} style={styles.sceneCard}>
            <View style={styles.sceneClip} onLayout={(e) => setSceneH(e.nativeEvent.layout.height)}>
              <PeacefulMeadow width={cardW - brutal.border * 2} height={sceneH} />

              <View style={styles.sceneTitle}>
                <Text style={styles.inna}>إِنَّا لِلّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</Text>
                <View style={styles.memoryChip}><Text style={styles.memoryChipText}>RESTING IN PEACE</Text></View>
              </View>

              <View style={[styles.plaques, { marginTop: MEADOW_TOP - 150 }]}>
                {MARHOOMEEN.map((p, i) => <ArchPlaque key={p.name} person={p} width={plaqueW} index={i} />)}
              </View>

              <BrutalBox fill={BRAND.cream} radius={18} offset={brutal.shadowSmall} style={styles.duaBox}>
                <Text style={styles.duaArabic}>اللَّهُمَّ اغْفِرْ لَهُمْ وَارْحَمْهُمْ وَأَدْخِلْهُمُ الْفِرْدَوْسَ الْأَعْلَى</Text>
                <Text style={styles.duaEnglish}>
                  O Allah, forgive them, have mercy on them, make their graves gardens of peace and grant them Jannatul Firdaus.
                </Text>
              </BrutalBox>
            </View>
          </BrutalBox>
        </Animated.View>

        {/* ── Sadaqah jariyah ── */}
        <SectionHeader title="Sadaqah Jariyah" />
        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <BrutalBox fill={tints.gold} radius={22} style={styles.hadithCard}>
            <HandHeart color={INK} size={26} strokeWidth={2.3} />
            <Text style={styles.hadith}>
              “When a person dies, all their deeds come to an end except three: a continuing charity, knowledge that
              benefits others, or a righteous child who prays for them.”
            </Text>
            <Text style={styles.hadithRef}>Sahih Muslim 1631</Text>
          </BrutalBox>
        </Animated.View>

        <BrutalBox radius={22} style={styles.intentCard}>
          <Text style={[styles.intentText, { color: colors.text }]}>
            Whenever you read the Quran in Ummati, even a single ayah, I humbly ask Allah to send its reward to my Dada,
            Dadi, Abba and Chacha. Take a moment and recite something for them:
          </Text>
          <View style={styles.surahRow}>
            {SURAHS.map((s) => (
              <BrutalPressable
                key={s.number}
                fill={s.fill}
                radius={16}
                offset={brutal.shadowSmall}
                style={styles.surahBtn}
                onPress={() => navigation.navigate('QuranReading', { surahNumber: s.number, surahName: s.name })}
              >
                <BookOpen color={INK} size={18} strokeWidth={2.4} />
                <Text style={styles.surahText}>{s.name}</Text>
              </BrutalPressable>
            ))}
          </View>

          <BrutalPressable fill={ameen ? tints.rose : BRAND.cream} radius={18} style={styles.ameenBtn} onPress={sayAmeen}>
            <Animated.View style={heartStyle}>
              <Heart color={INK} fill={ameen ? INK : 'transparent'} size={20} strokeWidth={2.4} />
            </Animated.View>
            <Text style={styles.ameenText}>{ameen ? 'Ameen. JazakAllahu Khairan for your dua' : 'Make dua for them · Ameen'}</Text>
          </BrutalPressable>
        </BrutalBox>

        {ameen && (
          <Animated.Text entering={ZoomIn.duration(300)} style={[styles.thanks, { color: colors.textSecondary }]}>
            May Allah reward you and your loved ones as well. 🤲
          </Animated.Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 22, paddingRight: 18 + brutal.shadow },

  letter: { padding: 20 },
  letterHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900', color: INK },
  devName: { fontSize: 22, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  roleChip: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: INK, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { color: BRAND.cream, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  rule: { height: 2, backgroundColor: INK, opacity: 0.15, marginVertical: 16, borderRadius: 1 },
  salam: { fontSize: 16, fontWeight: '900', color: INK, marginBottom: 10 },
  letterText: { fontSize: 15, lineHeight: 24, fontWeight: '600', color: '#3A352E', marginBottom: 12 },
  signoff: { fontSize: 15, fontWeight: '800', color: INK, marginTop: 4 },
  signature: { fontSize: 22, fontFamily: 'Georgia', fontStyle: 'italic', color: INK, marginTop: 4 },

  sceneCard: { padding: 0, overflow: 'hidden' },
  sceneClip: { borderRadius: 23, overflow: 'hidden', paddingBottom: 18 },
  sceneTitle: { paddingHorizontal: 18, paddingTop: 22, height: 150 },
  inna: { fontSize: 22, fontFamily: 'Georgia', color: INK, lineHeight: 38, maxWidth: '72%' },
  memoryChip: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: BRAND.cream, borderWidth: brutal.borderThin, borderColor: INK, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  memoryChipText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: INK },
  plaques: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18, paddingHorizontal: 18, paddingRight: 18 + 4 },
  plaqueShadow: { top: 4, left: 4, right: -4, bottom: -4, backgroundColor: INK },
  plaque: { backgroundColor: BRAND.cream, borderWidth: brutal.border, borderColor: INK, padding: 6 },
  plaqueInner: { borderWidth: 1.5, borderColor: INK, borderStyle: 'dashed', alignItems: 'center', paddingTop: 22, paddingBottom: 14, paddingHorizontal: 8, minHeight: 190 },
  relationChip: { marginTop: 8, backgroundColor: INK, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  relationText: { color: BRAND.cream, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  relationEnglish: { fontSize: 11, fontWeight: '800', color: '#5A5348', marginTop: 4 },
  personName: { fontSize: 15, fontWeight: '900', color: INK, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  rahimahullah: { fontSize: 17, fontFamily: 'Georgia', color: '#3F7A5F', marginTop: 8 },
  mote: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFF4D6', borderWidth: 1, borderColor: 'rgba(28,26,23,0.4)' },
  duaBox: { marginHorizontal: 18, marginTop: 22, marginRight: 18 + 4, padding: 16 },
  duaArabic: { fontSize: 20, lineHeight: 36, fontFamily: 'Georgia', color: INK, textAlign: 'center' },
  duaEnglish: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: '#4B463E', textAlign: 'center', marginTop: 8 },

  hadithCard: { padding: 18, gap: 10 },
  hadith: { fontSize: 15, lineHeight: 23, fontWeight: '700', color: INK, fontStyle: 'italic' },
  hadithRef: { fontSize: 12, fontWeight: '900', color: INK, letterSpacing: 0.6 },
  intentCard: { padding: 18, marginTop: 18 },
  intentText: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  surahRow: { flexDirection: 'row', gap: 12, marginTop: 16, paddingRight: 4 },
  surahBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  surahText: { fontSize: 13, fontWeight: '900', color: INK },
  ameenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 12, marginTop: 18, marginRight: 4 },
  ameenText: { fontSize: 14, fontWeight: '900', color: INK, flexShrink: 1 },
  thanks: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 16 },
});
