// Animated comic panel: flat sky + halftone dots + ground strip, then each prop as its own animated
// layer. All loops share two clocks and pause when `animate` is false.
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect } from 'react-native-svg';
import type { ComicGround, ComicProp, ComicScene as Scene, ComicSky } from '../data/types';
import { INK, PROPS } from './comicProps';

/** Panel aspect ratio (height / width). */
export const PANEL_RATIO = 0.6875;
const VW = 320;
const VH = 220;
const GROUND_Y = 176;

const SKIES: Record<ComicSky, { bands: string[]; dots: string; night?: boolean }> = {
  day: { bands: ['#8CCBEA', '#A6D8EF', '#C3E5F3'], dots: '#FFFFFF' },
  dawn: { bands: ['#9C86C9', '#C9A3D3', '#F3B9B0'], dots: '#FFFFFF' },
  dusk: { bands: ['#D9675A', '#EE9460', '#F6C27A'], dots: '#FFE2B0' },
  night: { bands: ['#1D274A', '#26335C', '#33406C'], dots: '#4B5A8C', night: true },
  storm: { bands: ['#4B5562', '#5F6B7A', '#77828F'], dots: '#8D97A3' },
  dark: { bands: ['#121117', '#17161D', '#1E1C25'], dots: '#2C2A35', night: true },
  golden: { bands: ['#F3C969', '#F6D88A', '#FBE8B4'], dots: '#FFF6D8' },
  underwater: { bands: ['#1F5E73', '#2A7488', '#3A8C9C'], dots: '#5FB0BE' },
  indoor: { bands: ['#D8B58A', '#E3C49B', '#E8CDA8'], dots: '#F2DCBD' },
};

const BG_STARS = [[30, 24], [74, 52], [120, 18], [168, 40], [214, 22], [262, 48], [298, 16], [48, 88], [190, 78], [280, 96]];

function Ground({ kind }: { kind: ComicGround }) {
  const g = GROUND_Y;
  switch (kind) {
    case 'desert':
      return <Path d={`M0 ${g} Q80 ${g - 8} 160 ${g} T320 ${g} L320 ${VH} L0 ${VH} Z`} fill="#E9C98B" stroke={INK} strokeWidth={2.5} />;
    case 'dunes':
      return (
        <G stroke={INK} strokeWidth={2.5}>
          <Path d={`M0 ${g - 10} Q70 ${g - 34} 150 ${g - 6} Q230 ${g - 30} 320 ${g - 14} L320 ${VH} L0 ${VH} Z`} fill="#E3B873" />
          <Path d={`M0 ${g + 6} Q110 ${g - 14} 200 ${g + 4} Q270 ${g - 8} 320 ${g + 2} L320 ${VH} L0 ${VH} Z`} fill="#EFD39A" />
        </G>
      );
    case 'grass':
    case 'garden':
      return (
        <G>
          <Path d={`M0 ${g} Q80 ${g - 10} 160 ${g - 2} T320 ${g} L320 ${VH} L0 ${VH} Z`} fill="#8FCB7A" stroke={INK} strokeWidth={2.5} />
          {kind === 'garden' && [[24, 196], [70, 206], [118, 192], [176, 204], [228, 194], [280, 206], [300, 188]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={4} fill={['#F0B3C8', '#F6D86B', '#FFFFFF'][i % 3]} stroke={INK} strokeWidth={1.5} />
          ))}
        </G>
      );
    case 'sea':
      return (
        <G stroke={INK} strokeWidth={2.5}>
          <Path d={`M0 ${g} Q20 ${g - 6} 40 ${g} T80 ${g} T120 ${g} T160 ${g} T200 ${g} T240 ${g} T280 ${g} T320 ${g} L320 ${VH} L0 ${VH} Z`} fill="#4F9CC9" />
          <Path d={`M30 ${g + 18} q10 -5 20 0 M140 ${g + 28} q10 -5 20 0 M250 ${g + 16} q10 -5 20 0`} fill="none" stroke="#BFE0F5" />
        </G>
      );
    case 'flood':
      return (
        <G stroke={INK} strokeWidth={2.5}>
          <Path d={`M0 130 Q30 104 60 126 Q90 100 120 124 Q150 98 180 122 Q210 100 240 124 Q270 102 300 122 Q312 112 320 116 L320 ${VH} L0 ${VH} Z`} fill="#3D7FB3" />
          <Path d={`M0 160 Q40 142 80 158 Q120 140 160 156 Q200 140 240 156 Q280 140 320 154 L320 ${VH} L0 ${VH} Z`} fill="#336E9E" />
          <Path d="M50 120 q8 -6 16 0 M168 116 q8 -6 16 0 M290 118 q8 -6 16 0" fill="none" stroke="#FFFFFF" />
        </G>
      );
    case 'river':
      return (
        <G stroke={INK} strokeWidth={2.5}>
          <Rect x={-4} y={g - 6} width={VW + 8} height={VH} fill="#C9DC8E" />
          <Path d={`M0 ${g + 8} Q80 ${g + 2} 160 ${g + 10} T320 ${g + 8} L320 ${g + 34} Q240 ${g + 28} 160 ${g + 36} T0 ${g + 32} Z`} fill="#4F9CC9" />
        </G>
      );
    case 'mountains':
      return (
        <G stroke={INK} strokeWidth={2.5}>
          <Path d={`M0 ${g} L40 ${g - 60} L80 ${g - 20} L130 ${g - 80} L190 ${g - 16} L240 ${g - 66} L290 ${g - 24} L320 ${g - 44} L320 ${g} Z`} fill="#9A94A8" />
          <Path d={`M0 ${g} Q160 ${g - 8} 320 ${g} L320 ${VH} L0 ${VH} Z`} fill="#C9B48E" />
        </G>
      );
    case 'city':
      return (
        <G stroke={INK} strokeWidth={2}>
          {[[8, 34, 30], [44, 28, 46], [80, 38, 28], [128, 30, 40], [168, 36, 54], [214, 30, 34], [250, 38, 46], [292, 30, 30]].map(([x, w, h], i) => (
            <G key={i}>
              <Rect x={x} y={g - h} width={w} height={h} fill={i % 2 ? '#E9CFA3' : '#DDBB88'} />
              <Rect x={x + w / 2 - 4} y={g - h + 10} width={8} height={8} fill="#5A4636" />
            </G>
          ))}
          <Path d={`M0 ${g} L320 ${g} L320 ${VH} L0 ${VH} Z`} fill="#E9C98B" strokeWidth={2.5} />
        </G>
      );
    case 'floor':
      return (
        <G stroke={INK} strokeWidth={2}>
          <Rect x={-4} y={g} width={VW + 8} height={VH - g + 4} fill="#C9A27A" strokeWidth={2.5} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Line key={i} x1={i * 46 - 20} y1={VH} x2={i * 40 + 10} y2={g} />)}
          <Line x1={0} y1={g + 22} x2={VW} y2={g + 22} />
        </G>
      );
    case 'seabed':
      return (
        <G stroke={INK} strokeWidth={2.5}>
          <Path d={`M0 ${g} Q80 ${g - 8} 160 ${g} T320 ${g} L320 ${VH} L0 ${VH} Z`} fill="#D9C08A" />
          {[30, 120, 210, 290].map((x) => <Path key={x} d={`M${x} ${g} q-8 -16 0 -30 q8 -14 0 -28`} fill="none" stroke="#3E8E5E" strokeWidth={5} />)}
        </G>
      );
    default:
      return null;
  }
}

const RASTER = { renderToHardwareTextureAndroid: true, shouldRasterizeIOS: true } as const;

function PropLayer({ prop, index, width, height, osc, slow }: {
  prop: ComicProp; index: number; width: number; height: number; osc: SharedValue<number>; slow: SharedValue<number>;
}) {
  const size = (prop.scale ?? 1) * width * 0.3;
  const left = prop.x * width - size / 2;
  const top = prop.y * height - size;
  const phase = index * 1.37;
  const anim = prop.anim ?? 'none';

  const style = useAnimatedStyle(() => {
    const s = Math.sin(osc.value * Math.PI * 2 + phase);
    switch (anim) {
      case 'bob': return { transform: [{ translateY: s * size * 0.05 }] };
      case 'sway': return { transform: [{ rotate: `${s * 5}deg` }] };
      case 'drift': return { transform: [{ translateX: s * width * 0.05 }] };
      case 'pulse': return { transform: [{ scale: 1 + s * 0.07 }] };
      case 'flicker': {
        const f = Math.sin(osc.value * Math.PI * 6 + phase);
        return { transform: [{ translateY: -f * size * 0.03 }, { scaleY: 1 + f * 0.08 }, { scaleX: 1 - f * 0.04 }] };
      }
      case 'shake': return { transform: [{ translateX: Math.sin(osc.value * Math.PI * 24 + phase) * 2.5 }] };
      case 'rise': return { transform: [{ translateY: -(s + 1) * height * 0.04 }] };
      case 'sink': return { transform: [{ translateY: (s + 1) * height * 0.04 }] };
      case 'spin': return { transform: [{ rotate: `${osc.value * 360}deg` }] };
      case 'twinkle': return { opacity: 0.35 + 0.65 * (0.5 + 0.5 * s) };
      case 'fly': {
        const t = (slow.value + index * 0.23) % 1;
        return { transform: [{ translateX: t * (width + size * 2) - size - left }, { translateY: s * size * 0.08 }] };
      }
      default: return {};
    }
  });

  return (
    <Animated.View {...RASTER} pointerEvents="none" style={[{ position: 'absolute', left, top, width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-4 -4 108 108" style={prop.flip ? styles.flip : undefined}>
        <G stroke={INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
          {PROPS[prop.kind]?.(prop.color)}
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Rain falling across the whole panel. */
function RainOverlay({ width, height, osc }: { width: number; height: number; osc: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ((osc.value * 3) % 1) * height - height }] }));
  const drops = useMemo(() => Array.from({ length: 36 }, (_, i) => [(i * 47) % VW, (i * 83) % (VH * 2)]), []);
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height: height * 2 }, style]}>
      <Svg width={width} height={height * 2} viewBox={`0 0 ${VW} ${VH * 2}`} preserveAspectRatio="none">
        {drops.map(([x, y], i) => <Line key={i} x1={x} y1={y} x2={x - 5} y2={y + 16} stroke="#CFE6F5" strokeWidth={2} opacity={0.8} />)}
      </Svg>
    </Animated.View>
  );
}

export function ComicScene({ scene, width, animate = true }: { scene: Scene; width: number; animate?: boolean }) {
  const height = width * PANEL_RATIO;
  const sky = SKIES[scene.sky] ?? SKIES.day;
  const osc = useSharedValue(0);
  const slow = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      osc.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.linear }), -1, false);
      slow.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(osc);
      cancelAnimation(slow);
    }
    return () => { cancelAnimation(osc); cancelAnimation(slow); };
  }, [animate, osc, slow]);

  const hasRain = scene.props.some((p) => p.kind === 'rain');
  const props = scene.props.filter((p) => p.kind !== 'rain');
  const bandH = VH / sky.bands.length;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="halftone" width={10} height={10} patternUnits="userSpaceOnUse">
            <Circle cx={5} cy={5} r={1.4} fill={sky.dots} />
          </Pattern>
        </Defs>
        {sky.bands.map((c, i) => <Rect key={c} x={0} y={i * bandH} width={VW} height={bandH + 1} fill={c} />)}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#halftone)" opacity={0.5} />
        {sky.night && BG_STARS.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 3 ? 1.4 : 2.2} fill="#F4E7B5" />)}
        {scene.sky === 'golden' && Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (i * Math.PI) / 8;
          return <Path key={i} d={`M160 -10 L${160 + 400 * Math.cos(a - 0.06)} ${-10 - 400 * Math.sin(a - 0.06)} L${160 + 400 * Math.cos(a + 0.06)} ${-10 - 400 * Math.sin(a + 0.06)} Z`} fill="#FFF3C4" opacity={0.45} />;
        })}
        <Ground kind={scene.ground} />
        {scene.action && Array.from({ length: 22 }, (_, i) => {
          const a = (i * Math.PI * 2) / 22;
          return (
            <Line key={i} x1={160 + Math.cos(a) * 150} y1={110 + Math.sin(a) * 100} x2={160 + Math.cos(a) * 260} y2={110 + Math.sin(a) * 200} stroke={INK} strokeWidth={i % 2 ? 1.5 : 3} opacity={0.35} />
          );
        })}
      </Svg>
      {props.map((p, i) => <PropLayer key={`${p.kind}-${i}`} prop={p} index={i} width={width} height={height} osc={osc} slow={slow} />)}
      {hasRain && <RainOverlay width={width} height={height} osc={osc} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flip: { transform: [{ scaleX: -1 }] },
});
