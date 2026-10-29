import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  BRAND, CRESCENT, LOGO_BOX, LOGO_SHADOW, RUB_EL_HIZB, RUB_EL_HIZB_INNER, RUB_EL_HIZB_LENGTH, SMALL_STAR,
} from './UmmatiLogo';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: W } = Dimensions.get('window');
const LOGO = Math.min(W * 0.46, 190);
const TITLE = 'UMMATI'.split('');
const TILE = Math.min(Math.floor((W - 64) / TITLE.length) - 8, 46);
const TILE_FILLS = ['#8FD1B0', '#F2CF7E', '#9DC3E6', '#F0B3C8', '#C2B4EC', '#F4B48A'];
const SHADOW = 4;

/** One letter of the wordmark as an outlined sticker tile that drops in with a hard shadow. */
function LetterTile({ ch, index }: { ch: string; index: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(1150 + index * 80, withSpring(1, { damping: 12, stiffness: 180 }));
  }, [index, p]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 2),
    transform: [{ translateY: (1 - p.value) * -36 }, { rotate: `${(1 - p.value) * (index % 2 ? 14 : -14)}deg` }],
  }));
  return (
    <Animated.View style={[{ width: TILE, height: TILE + 6 }, style]}>
      <View style={[styles.tileShadow, { width: TILE, height: TILE }]} />
      <View style={[styles.tile, { width: TILE, height: TILE, backgroundColor: TILE_FILLS[index % TILE_FILLS.length] }]}>
        <Text style={[styles.tileText, { fontSize: TILE * 0.56 }]}>{ch}</Text>
      </View>
    </Animated.View>
  );
}

interface Props {
  /** Becomes true when the app is ready to show content */
  ready: boolean;
  onFinish: () => void;
}

/**
 * Brand intro (neo-brutalist): the Rub el Hizb outline draws itself in ink, the mark stamps down
 * with its hard shadow, the crescent pops in, then the wordmark drops in as sticker tiles.
 */
export function AnimatedSplash({ ready, onFinish }: Props) {
  const draw = useSharedValue(0);
  const stamp = useSharedValue(0);
  const crescent = useSharedValue(0);
  const tagline = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    draw.value = withTiming(1, { duration: 750, easing: Easing.inOut(Easing.cubic) });
    stamp.value = withDelay(650, withSpring(1, { damping: 13, stiffness: 170 }));
    crescent.value = withDelay(900, withSpring(1, { damping: 10, stiffness: 160 }));
    tagline.value = withDelay(1750, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.6)) }));
  }, [draw, stamp, crescent, tagline]);

  // Exit once both the intro has played and the app is ready
  const [canExit, setCanExit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanExit(true), 2300);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (ready && canExit) {
      exit.value = withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(onFinish)();
      });
    }
  }, [ready, canExit, exit, onFinish]);

  const outlineProps = useAnimatedProps(() => ({
    strokeDashoffset: RUB_EL_HIZB_LENGTH * (1 - draw.value),
  }));
  // Fill "stamps" down: starts lifted and large, lands on its shadow
  const fillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stamp.value * 3),
    transform: [{ scale: 1.25 - stamp.value * 0.25 }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stamp.value * 3),
    transform: [{ translateX: stamp.value * (LOGO * LOGO_SHADOW / 112) }, { translateY: stamp.value * (LOGO * LOGO_SHADOW / 112) }],
  }));
  const crescentStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, crescent.value * 2),
    transform: [{ scale: 0.3 + crescent.value * 0.7 }, { rotate: `${(1 - crescent.value) * -50}deg` }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ scale: 0.8 + tagline.value * 0.2 }],
  }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: exit.value * 24 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, containerStyle]} pointerEvents="none">
      {/* Corner stickers */}
      <View style={[styles.corner, styles.cornerTL, { backgroundColor: '#F2CF7E' }]} />
      <View style={[styles.corner, styles.cornerBR, { backgroundColor: '#9DC3E6' }]} />

      <View style={styles.center}>
        <View style={{ width: LOGO, height: LOGO }}>
          {/* Hard shadow slides out from under the mark */}
          <Animated.View style={[StyleSheet.absoluteFill, shadowStyle]}>
            <Svg width={LOGO} height={LOGO} viewBox={LOGO_BOX}>
              <Path d={RUB_EL_HIZB} fill={BRAND.ink} />
            </Svg>
          </Animated.View>

          {/* Gold star + green core */}
          <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
            <Svg width={LOGO} height={LOGO} viewBox={LOGO_BOX}>
              <G stroke={BRAND.ink} strokeLinejoin="round">
                <Path d={RUB_EL_HIZB} fill={BRAND.gold} strokeWidth={3.4} />
                <Path d={RUB_EL_HIZB_INNER} fill={BRAND.green} strokeWidth={2.7} />
              </G>
            </Svg>
          </Animated.View>

          {/* Ink outline drawing itself on top */}
          <Svg width={LOGO} height={LOGO} viewBox={LOGO_BOX} style={StyleSheet.absoluteFill}>
            <AnimatedPath
              d={RUB_EL_HIZB}
              stroke={BRAND.ink}
              strokeWidth={3.4}
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={RUB_EL_HIZB_LENGTH}
              animatedProps={outlineProps}
            />
          </Svg>

          {/* Crescent + star pop in */}
          <Animated.View style={[StyleSheet.absoluteFill, crescentStyle]}>
            <Svg width={LOGO} height={LOGO} viewBox={LOGO_BOX}>
              <G stroke={BRAND.ink} strokeLinejoin="round">
                <Path d={CRESCENT} fill={BRAND.cream} strokeWidth={2.4} />
                <Path d={SMALL_STAR} fill={BRAND.cream} strokeWidth={1.7} />
              </G>
            </Svg>
          </Animated.View>
        </View>

        <View style={styles.titleRow}>
          {TITLE.map((ch, i) => <LetterTile key={i} ch={ch} index={i} />)}
        </View>

        <Animated.View style={[styles.taglineWrap, taglineStyle]}>
          <Text style={styles.arabic}>أُمَّتِي</Text>
          <View style={styles.pill}>
            <Text style={styles.tagline}>Your companion for Deen & Duniya</Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BRAND.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 140, height: 140, borderRadius: 40, borderWidth: 3, borderColor: BRAND.ink },
  cornerTL: { top: -60, left: -50, transform: [{ rotate: '18deg' }] },
  cornerBR: { bottom: -56, right: -48, transform: [{ rotate: '-14deg' }] },
  titleRow: { flexDirection: 'row', gap: 8, marginTop: 40 },
  tile: {
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileShadow: { position: 'absolute', top: SHADOW, left: SHADOW, borderRadius: 12, backgroundColor: BRAND.ink },
  tileText: { color: BRAND.ink, fontWeight: '900' },
  taglineWrap: { alignItems: 'center', marginTop: 18 },
  arabic: { color: BRAND.ink, fontSize: 28, fontFamily: 'Georgia', fontWeight: '700' },
  pill: { marginTop: 10, backgroundColor: BRAND.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  tagline: { color: BRAND.paper, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
});
