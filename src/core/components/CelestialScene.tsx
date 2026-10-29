// Flat, ink-outlined sky illustration for the current prayer period (neo-brutalist style):
//   fajr    → sun peeking over the horizon + fading moon
//   day     → noon sun with slowly turning rays
//   asr     → low, warm afternoon sun
//   maghrib → striped retro sunset sinking into the horizon
//   isha    → full moon, drifting clouds, twinkling stars
// Everything sits above a mosque skyline silhouette.
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import type { PrayerPeriod } from '../theme/palettes';

interface Props {
  period: PrayerPeriod;
  width: number;
  height: number;
  /** 0–1: vertical position of the horizon (default 0.86) */
  horizon?: number;
  /** Smaller celestial body for compact headers */
  compact?: boolean;
  showSkyline?: boolean;
  /** false pauses every loop (e.g. while the screen is hidden) so they stop costing frames */
  animate?: boolean;
  /** Outline colour */
  ink?: string;
}

// ---------- animation helpers ----------

const AnimateContext = createContext(true);

/** Starts `start()` while the scene is animating and cancels it when paused. */
const usePausable = (v: SharedValue<number>, start: () => void, deps: unknown[]) => {
  const animate = useContext(AnimateContext);
  useEffect(() => {
    if (animate) start();
    else cancelAnimation(v);
    return () => cancelAnimation(v);
  }, [animate, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
};

const useLoop = (duration: number, delay = 0, reverse = true) => {
  const v = useSharedValue(0);
  usePausable(v, () => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, reverse));
  }, [duration, delay, reverse]);
  return v;
};

const useSpin = (duration: number) => {
  const v = useSharedValue(0);
  usePausable(v, () => {
    v.value = withRepeat(withTiming(v.value + 360, { duration, easing: Easing.linear }), -1, false);
  }, [duration]);
  return v;
};

// Animated layers that only move are cached as GPU textures instead of re-drawing their SVG every frame.
const raster = { renderToHardwareTextureAndroid: true, shouldRasterizeIOS: true } as const;

/** Darken a #RRGGBB colour by a fraction. */
const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`;
};

const HERO: Record<PrayerPeriod, string> = {
  fajr: '#4E4478',
  day: '#9CCFC0',
  asr: '#F0C58E',
  maghrib: '#8A4B57',
  isha: '#2C3B62',
};

// ---------- building blocks ----------

function Cloud({ width, fill, ink }: { width: number; fill: string; ink: string }) {
  const h = width * 0.46;
  return (
    <Svg width={width} height={h} viewBox="-3 -3 106 49">
      <Path
        d="M14 42 Q2 42 2 32 Q2 22 14 22 Q16 8 32 8 Q42 0 54 6 Q70 2 74 18 Q90 16 94 28 Q98 42 84 42 Z"
        fill={fill}
        stroke={ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DriftingCloud({ top, width, fill, ink, duration, delay, sceneWidth, startX }: {
  top: number; width: number; fill: string; ink: string; duration: number; delay: number; sceneWidth: number; startX: number;
}) {
  const x = useSharedValue(startX);
  usePausable(x, () => {
    x.value = withDelay(delay, withRepeat(withSequence(
      withTiming(sceneWidth + 20, { duration: duration * ((sceneWidth + 20 - startX) / (sceneWidth + width + 40)), easing: Easing.linear }),
      withTiming(-width - 20, { duration: 0 }),
      withTiming(startX, { duration: duration * ((startX + width + 20) / (sceneWidth + width + 40)), easing: Easing.linear }),
    ), -1));
  }, [delay, duration, sceneWidth, startX, width]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View {...raster} style={[{ position: 'absolute', top, left: 0 }, style]}>
      <Cloud width={width} fill={fill} ink={ink} />
    </Animated.View>
  );
}

/** Four-point sparkle star driven by one shared clock (instead of one animation per star). */
function Twinkle({ x, y, r, phase, clock, color }: { x: number; y: number; r: number; phase: number; clock: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.value * Math.PI * 2 + phase)) }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - r * 2, top: y - r * 2 }, style]}>
      <Sparkle r={r} color={color} />
    </Animated.View>
  );
}

function Sparkle({ r, color }: { r: number; color: string }) {
  const s = r * 4;
  const c = s / 2;
  return (
    <Svg width={s} height={s}>
      <Path d={`M${c} 0 Q${c + r * 0.35} ${c - r * 0.35} ${s} ${c} Q${c + r * 0.35} ${c + r * 0.35} ${c} ${s} Q${c - r * 0.35} ${c + r * 0.35} 0 ${c} Q${c - r * 0.35} ${c - r * 0.35} ${c} 0 Z`} fill={color} />
    </Svg>
  );
}

/** Mosque skyline: domes and minarets along the horizon, outlined in ink. */
function Skyline({ width, height, fill, ink }: { width: number; height: number; fill: string; ink: string }) {
  // Built in a 400×60 space, stretched to fit
  const d = [
    'M0 60 L0 46 Q20 42 40 46 L40 60',
    'M52 60 L52 22 L50 22 L55 10 L60 22 L58 22 L58 60 Z',
    'M70 60 L70 40 Q70 36 74 36 L80 36 Q82 18 104 12 Q126 18 128 36 L134 36 Q138 36 138 40 L138 60 Z',
    'M102 12 L104 4 L106 12 Z',
    'M146 60 L146 44 Q156 32 166 44 L166 60 Z',
    'M176 60 L176 48 Q184 40 192 48 L192 60 Z',
    'M200 60 L200 18 L198 18 L203 4 L208 18 L206 18 L206 60 Z',
    'M220 60 L220 42 Q222 38 226 38 Q230 24 246 20 Q262 24 266 38 Q270 38 272 42 L272 60 Z',
    'M245 20 L246 13 L247 20 Z',
    'M282 60 L282 30 L280 30 L285 18 L290 30 L288 30 L288 60 Z',
    'M300 60 L300 48 L318 48 L318 60 Z',
    'M326 60 L326 44 Q336 36 346 44 L346 60 Z',
    'M352 60 L352 50 L400 46 L400 60 Z',
  ].join(' ');
  return (
    <Svg width={width} height={height} viewBox="0 0 400 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
      <Path d={d} fill={fill} stroke={ink} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </Svg>
  );
}

// ---------- celestial bodies ----------

function Sun({ cx, cy, r, fill, ink, rays }: { cx: number; cy: number; r: number; fill: string; ink: string; rays: boolean }) {
  const spin = useSpin(80000);
  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const box = r * 5;
  const c = box / 2;
  return (
    <View style={{ position: 'absolute', left: cx - c, top: cy - c, width: box, height: box }} pointerEvents="none">
      {rays && (
        <Animated.View {...raster} style={[StyleSheet.absoluteFill, raysStyle]}>
          <Svg width={box} height={box}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              const inner = r * 1.3;
              const outer = r * 1.95;
              const spread = 0.16;
              return (
                <Path
                  key={i}
                  d={`M${c + inner * Math.cos(a - spread)} ${c + inner * Math.sin(a - spread)} L${c + outer * Math.cos(a)} ${c + outer * Math.sin(a)} L${c + inner * Math.cos(a + spread)} ${c + inner * Math.sin(a + spread)} Z`}
                  fill={fill}
                  stroke={ink}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
              );
            })}
          </Svg>
        </Animated.View>
      )}
      <Svg width={box} height={box} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} fill={fill} stroke={ink} strokeWidth={3} />
        {/* Flat highlight */}
        <Path d={`M${c - r * 0.55} ${c - r * 0.1} A${r * 0.6} ${r * 0.6} 0 0 1 ${c - r * 0.05} ${c - r * 0.58}`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

function Moon({ cx, cy, r, ink, fill = '#F3EAD3' }: { cx: number; cy: number; r: number; ink: string; fill?: string }) {
  const bob = useLoop(4200);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value * 3 }] }));
  const box = r * 2 + 8;
  const c = box / 2;
  return (
    <Animated.View {...raster} style={[{ position: 'absolute', left: cx - c, top: cy - c, width: box, height: box }, style]} pointerEvents="none">
      <Svg width={box} height={box}>
        <Circle cx={c} cy={c} r={r} fill={fill} stroke={ink} strokeWidth={3} />
        <G fill={shade(fill, 0.12)} stroke={ink} strokeWidth={1.5}>
          <Circle cx={c - r * 0.32} cy={c - r * 0.18} r={r * 0.2} />
          <Circle cx={c + r * 0.3} cy={c + r * 0.12} r={r * 0.13} />
          <Circle cx={c - r * 0.05} cy={c + r * 0.42} r={r * 0.1} />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Sun partly below the horizon; `stripes` gives the retro sunset look. */
function HorizonSun({ cx, horizonY, r, fill, ink, width, rise, stripes }: { cx: number; horizonY: number; r: number; fill: string; ink: string; width: number; rise: boolean; stripes?: string }) {
  const drift = useLoop(9000);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (rise ? -1 : 1) * drift.value * r * 0.1 }] }));
  const cy = horizonY + r * 0.2;
  const id = `hz-${Math.round(cx)}-${Math.round(r)}`;
  return (
    <Animated.View {...raster} style={[{ position: 'absolute', left: 0, top: 0, width, height: horizonY }, style]} pointerEvents="none">
      {/* Clip at the horizon so the sun looks half-risen / half-set */}
      <View style={{ position: 'absolute', left: 0, top: 0, width, height: horizonY, overflow: 'hidden' }}>
        <Svg width={width} height={horizonY + r}>
          <Defs>
            <ClipPath id={id}><Circle cx={cx} cy={cy} r={r} /></ClipPath>
          </Defs>
          <Circle cx={cx} cy={cy} r={r} fill={fill} stroke={ink} strokeWidth={3} />
          {stripes && (
            <G clipPath={`url(#${id})`}>
              {[0.15, 0.38, 0.6].map((t, i) => (
                <Rect key={i} x={cx - r} y={cy - r * 0.5 + t * r * 0.9} width={r * 2} height={r * (0.07 + i * 0.03)} fill={stripes} />
              ))}
            </G>
          )}
        </Svg>
      </View>
    </Animated.View>
  );
}

// ---------- scene ----------

export function CelestialScene({ period, width, height, horizon = 0.86, compact = false, showSkyline = true, animate = true, ink = '#1C1A17' }: Props) {
  const horizonY = height * horizon;
  const bodyR = compact ? 20 : 32;
  // Keep the sun/moon clear of the header row in full-size heroes
  const bodyY = compact ? 46 : Math.min(150, height * 0.34);
  const skylineH = compact ? 30 : 48;
  const hero = HERO[period];
  const cloudFill = period === 'day' || period === 'asr' ? '#FFFAF1' : shade(hero, -0.35);

  const stars = useMemo(
    () => Array.from({ length: compact ? 7 : 12 }, (_, i) => ({
      x: (i * 97.3 + 23) % width,
      y: ((i * 53.7 + 14) % (horizonY * 0.65)),
      r: 2.2 + (i % 3) * 0.9,
      phase: (i * 1.7) % (Math.PI * 2),
    })),
    [width, horizonY, compact],
  );
  const showStars = period === 'isha' || period === 'fajr' || period === 'maghrib';
  const starClock = useSharedValue(0);
  useEffect(() => {
    if (animate && showStars) starClock.value = withRepeat(withTiming(starClock.value + 1, { duration: 2600, easing: Easing.linear }), -1, false);
    else cancelAnimation(starClock);
    return () => cancelAnimation(starClock);
  }, [animate, showStars, starClock]);

  return (
    <AnimateContext.Provider value={animate}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
        {showStars &&
          stars.slice(0, period === 'isha' ? stars.length : Math.ceil(stars.length / 2)).map((s, i) => (
            <Twinkle key={i} {...s} clock={starClock} color="#F3EAD3" />
          ))}

        {period === 'isha' && (
          <>
            <Moon cx={width * 0.8} cy={bodyY} r={bodyR} ink={ink} />
            <DriftingCloud top={bodyY + (compact ? 6 : 18)} width={compact ? 70 : 110} fill={cloudFill} ink={ink} duration={70000} delay={0} sceneWidth={width} startX={width * 0.5} />
          </>
        )}

        {period === 'fajr' && (
          <>
            <Moon cx={width * 0.16} cy={compact ? 40 : 70} r={bodyR * 0.5} ink={ink} fill="#E6DCF0" />
            <HorizonSun cx={width * 0.74} horizonY={horizonY} r={bodyR * 1.3} fill="#F2A57E" ink={ink} width={width} rise />
            <DriftingCloud top={horizonY * 0.5} width={compact ? 70 : 104} fill={cloudFill} ink={ink} duration={90000} delay={0} sceneWidth={width} startX={width * 0.05} />
          </>
        )}

        {period === 'day' && (
          <>
            <Sun cx={width * 0.82} cy={bodyY} r={bodyR} fill="#F6CF5F" ink={ink} rays />
            <DriftingCloud top={bodyY + (compact ? 8 : 30)} width={compact ? 80 : 124} fill={cloudFill} ink={ink} duration={70000} delay={0} sceneWidth={width} startX={width * 0.12} />
            <DriftingCloud top={compact ? 18 : 44} width={compact ? 54 : 80} fill={cloudFill} ink={ink} duration={95000} delay={0} sceneWidth={width} startX={width * 0.45} />
          </>
        )}

        {period === 'asr' && (
          <>
            <Sun cx={width * 0.8} cy={bodyY + (compact ? 4 : 24)} r={bodyR * 1.05} fill="#F4A960" ink={ink} rays={false} />
            <DriftingCloud top={bodyY + (compact ? 12 : 40)} width={compact ? 76 : 116} fill={cloudFill} ink={ink} duration={85000} delay={0} sceneWidth={width} startX={width * 0.2} />
          </>
        )}

        {period === 'maghrib' && (
          <>
            <HorizonSun cx={width * 0.7} horizonY={horizonY} r={bodyR * 1.5} fill="#EE9466" ink={ink} width={width} rise={false} stripes={hero} />
            <DriftingCloud top={horizonY * 0.38} width={compact ? 64 : 96} fill={cloudFill} ink={ink} duration={100000} delay={0} sceneWidth={width} startX={width * 0.1} />
          </>
        )}

        {showSkyline && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: horizonY - skylineH, height: skylineH }}>
            <Skyline width={width} height={skylineH} fill={shade(hero, 0.28)} ink={ink} />
          </View>
        )}
      </View>
    </AnimateContext.Provider>
  );
}

