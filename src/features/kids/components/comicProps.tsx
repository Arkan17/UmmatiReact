// Flat, ink-outlined drawings for every ComicPropKind. Each is drawn in a 100×100 box whose bottom
// edge (y = 100) sits on the prop's anchor point. No people, prophets or angels are ever drawn.
import React from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { ComicPropKind } from '../data/types';

export const INK = '#1C1A17';

type Draw = (fill?: string) => React.ReactElement;

const star5 = (cx: number, cy: number, R: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    return `${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
};

const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx + r * 0.2} ${cy - r * 0.2} ${cx + r} ${cy} Q${cx + r * 0.2} ${cy + r * 0.2} ${cx} ${cy + r} Q${cx - r * 0.2} ${cy + r * 0.2} ${cx - r} ${cy} Q${cx - r * 0.2} ${cy - r * 0.2} ${cx} ${cy - r} Z`;

/** Four legs hanging down from a body. */
const legs = (xs: number[], top: number, bottom: number, w = 6, fill = '#000') =>
  xs.map((x) => <Rect key={x} x={x} y={top} width={w} height={bottom - top} rx={2} fill={fill} />);

export const PROPS: Record<ComicPropKind, Draw> = {
  // ---------- sky & weather ----------
  sun: (f = '#F6C84C') => (
    <G>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        const p = (r: number, d: number) => `${50 + r * Math.cos(a + d)} ${50 + r * Math.sin(a + d)}`;
        return <Path key={i} d={`M${p(30, -0.2)} L${p(46, 0)} L${p(30, 0.2)} Z`} fill={f} />;
      })}
      <Circle cx={50} cy={50} r={25} fill={f} />
    </G>
  ),
  moon: (f = '#F4E7B5') => <Path d="M58 14 A36 36 0 1 0 82 74 A30 30 0 1 1 58 14 Z" fill={f} />,
  star: (f = '#F6D86B') => <Path d={star5(50, 55, 40, 17)} fill={f} />,
  cloud: (f = '#FFFFFF') => (
    <Path d="M14 92 Q0 92 2 78 Q4 64 18 66 Q20 46 40 46 Q52 34 66 44 Q84 40 86 60 Q100 62 98 78 Q96 92 82 92 Z" fill={f} />
  ),
  rain: (f = '#BFE0F5') => (
    <G>
      {[10, 30, 50, 70, 90].map((x, i) => <Line key={x} x1={x} y1={10 + (i % 2) * 20} x2={x - 6} y2={40 + (i % 2) * 20} stroke={f} strokeWidth={4} />)}
      {[20, 40, 60, 80].map((x, i) => <Line key={x} x1={x} y1={55 + (i % 2) * 10} x2={x - 6} y2={85 + (i % 2) * 10} stroke={f} strokeWidth={4} />)}
    </G>
  ),
  lightning: (f = '#FFE066') => <Path d="M58 2 L28 56 L48 56 L36 98 L76 40 L56 40 L70 2 Z" fill={f} />,
  wind: (f = '#FFFFFF') => (
    <G fill="none" stroke={f} strokeWidth={6}>
      <Path d="M6 40 L62 40 Q78 40 78 28 Q78 16 66 18" />
      <Path d="M14 60 L80 60 Q94 60 94 72 Q94 84 82 82" />
      <Path d="M4 80 L48 80" />
    </G>
  ),
  sparkles: (f = '#FFE58A') => (
    <G>
      <Path d={sparkle(34, 54, 26)} fill={f} />
      <Path d={sparkle(74, 30, 15)} fill={f} />
      <Path d={sparkle(76, 80, 12)} fill={f} />
    </G>
  ),
  light: (f = '#FFE9A8') => (
    <G>
      <Path d="M38 0 L62 0 L96 100 L4 100 Z" fill={f} opacity={0.55} stroke="none" />
      <Path d="M44 0 L56 0 L74 100 L26 100 Z" fill="#FFF8DC" opacity={0.7} stroke="none" />
    </G>
  ),

  // ---------- birds & animals ----------
  birds: (f = INK) => (
    <G fill="none" stroke={f} strokeWidth={4}>
      <Path d="M10 40 Q20 28 30 40 Q40 28 50 40" />
      <Path d="M54 22 Q62 12 70 22 Q78 12 86 22" />
      <Path d="M48 70 Q56 60 64 70 Q72 60 80 70" />
    </G>
  ),
  dove: (f = '#FFFFFF') => (
    <G>
      <Path d="M16 66 Q30 44 58 52 Q70 40 82 46 L94 44 L84 52 Q82 70 60 76 Q40 82 16 66 Z" fill={f} />
      <Path d="M34 58 Q44 22 70 26 Q60 44 56 60 Z" fill="#E8EEF5" />
      <Circle cx={80} cy={48} r={2.5} fill={INK} stroke="none" />
      <Path d="M90 50 Q96 62 88 70" fill="none" stroke="#5E9B4D" strokeWidth={3} />
    </G>
  ),
  hoopoe: (f = '#E0A060') => (
    <G>
      <Path d="M30 42 L22 14 L34 36 L36 8 L44 34 L52 10 L52 38 Z" fill={f} />
      <Path d="M22 14 L26 22 M36 8 L38 18 M52 10 L50 20" stroke={INK} strokeWidth={4} />
      <Path d="M18 72 Q20 46 46 40 Q58 38 62 50 L92 54 L62 58 Q60 82 38 84 Q24 84 18 72 Z" fill={f} />
      <Path d="M24 70 Q36 60 52 66 Q40 80 24 70 Z" fill="#FFFFFF" />
      <Path d="M28 72 L46 70 M30 77 L46 74" stroke={INK} strokeWidth={3} />
      <Circle cx={50} cy={48} r={2.5} fill={INK} stroke="none" />
      {legs([34, 44], 82, 98, 3, INK)}
    </G>
  ),
  crow: (f = '#2D2B33') => (
    <G>
      <Path d="M12 70 Q20 46 46 46 Q56 34 70 38 L90 44 L72 50 Q76 74 52 80 L8 86 Z" fill={f} />
      <Path d="M30 62 Q46 52 62 62 Q46 74 30 62 Z" fill="#45434D" />
      <Circle cx={68} cy={42} r={2.5} fill="#FFFFFF" stroke="none" />
      {legs([40, 50], 79, 98, 3, INK)}
    </G>
  ),
  whale: (f = '#6C8FB8') => (
    <G>
      <Path d="M48 30 Q46 18 40 14 M52 30 Q54 18 60 14 M50 30 L50 12" fill="none" stroke="#BFE0F5" strokeWidth={4} />
      <Path d="M6 66 Q8 34 50 34 Q82 34 86 58 L98 42 L96 76 L84 70 Q70 92 40 92 Q8 92 6 66 Z" fill={f} />
      <Path d="M10 74 Q40 86 78 70 Q66 90 40 90 Q14 90 10 74 Z" fill="#DCE8F2" />
      <Circle cx={26} cy={58} r={4} fill={INK} stroke="none" />
      <Path d="M44 74 Q50 82 58 74" fill="none" />
    </G>
  ),
  fish: (f = '#F4A261') => (
    <G>
      <Path d="M10 60 Q36 30 70 60 Q36 90 10 60 Z" fill={f} />
      <Path d="M68 60 L94 42 L90 60 L94 78 Z" fill={f} />
      <Circle cx={26} cy={56} r={3.5} fill={INK} stroke="none" />
      <Path d="M44 46 Q50 60 44 74" fill="none" />
    </G>
  ),
  camel: (f = '#D9A86C') => (
    <G>
      {legs([24, 34, 58, 68], 64, 98, 6, f)}
      <Path d="M16 68 Q14 50 26 44 Q34 26 44 42 Q52 22 62 40 Q72 44 74 56 L84 30 Q86 20 96 22 L98 30 L90 32 L80 66 Q50 74 16 68 Z" fill={f} />
      <Circle cx={92} cy={26} r={1.8} fill={INK} stroke="none" />
      <Path d="M16 62 Q8 66 10 76" fill="none" />
    </G>
  ),
  sheep: (f = '#FBF7EE') => (
    <G>
      {legs([28, 38, 58, 68], 70, 98, 6, INK)}
      <Path d="M18 66 Q8 58 16 48 Q14 36 28 36 Q34 26 46 32 Q56 24 66 32 Q80 30 80 44 Q90 52 82 64 Q80 76 66 74 Q56 82 44 76 Q30 82 24 72 Q14 74 18 66 Z" fill={f} />
      <Path d="M80 42 Q96 40 96 54 Q96 64 86 64 Q78 62 80 42 Z" fill="#3A3633" />
      <Circle cx={90} cy={50} r={2} fill="#FFFFFF" stroke="none" />
    </G>
  ),
  cow: (f = '#F2E6D8') => (
    <G>
      {legs([22, 32, 62, 72], 70, 98, 7, f)}
      <Rect x={14} y={40} width={70} height={36} rx={14} fill={f} />
      <Path d="M30 42 Q40 50 34 60 Q24 58 26 46 Z M58 56 Q68 52 70 64 Q60 70 56 62 Z" fill="#8A6A52" />
      <Path d="M78 36 Q92 34 96 46 Q98 62 86 64 Q76 62 76 48 Z" fill={f} />
      <Path d="M80 36 Q76 26 70 28 M92 38 Q98 28 100 32" fill="none" />
      <Circle cx={88} cy={46} r={2} fill={INK} stroke="none" />
      <Path d="M14 50 Q4 56 8 70" fill="none" />
    </G>
  ),
  ram: (f = '#F3EBDD') => (
    <G>
      {legs([28, 38, 58, 68], 70, 98, 6, INK)}
      <Path d="M18 66 Q8 58 16 48 Q14 36 28 36 Q34 26 46 32 Q56 24 66 32 Q80 30 80 44 Q90 52 82 64 Q80 76 66 74 Q56 82 44 76 Q30 82 24 72 Q14 74 18 66 Z" fill={f} />
      <Path d="M78 40 Q96 38 96 54 Q96 66 86 66 Q76 62 78 40 Z" fill="#EADFC9" />
      <Path d="M80 40 Q70 26 82 22 Q94 22 92 34 Q88 40 82 36" fill="#C9A66B" strokeWidth={3} />
      <Circle cx={90} cy={50} r={2} fill={INK} stroke="none" />
    </G>
  ),
  ant: (f = '#5A3B2A') => (
    <G>
      <Path d="M30 72 L18 92 M42 72 L42 94 M54 72 L66 92 M34 70 L20 60 M50 70 L64 58" fill="none" strokeWidth={3} />
      <Ellipse cx={22} cy={70} rx={14} ry={11} fill={f} />
      <Ellipse cx={46} cy={70} rx={9} ry={8} fill={f} />
      <Ellipse cx={68} cy={66} rx={11} ry={10} fill={f} />
      <Path d="M74 58 Q80 42 90 40 M70 58 Q72 44 80 38" fill="none" strokeWidth={3} />
      <Circle cx={72} cy={64} r={2} fill="#FFFFFF" stroke="none" />
    </G>
  ),
  snake: (f = '#7FB069') => (
    <G>
      <Path d="M8 94 Q30 70 50 88 Q70 104 82 76 Q88 60 76 50" fill="none" stroke={INK} strokeWidth={16} />
      <Path d="M8 94 Q30 70 50 88 Q70 104 82 76 Q88 60 76 50" fill="none" stroke={f} strokeWidth={10} />
      <Ellipse cx={74} cy={44} rx={14} ry={10} fill={f} />
      <Circle cx={78} cy={41} r={2.2} fill={INK} stroke="none" />
      <Path d="M62 44 L54 42 M56 42 L52 38 M56 42 L52 46" fill="none" stroke="#D84A4A" strokeWidth={2} />
    </G>
  ),
  horse: (f = '#A8744F') => (
    <G>
      {legs([22, 32, 60, 70], 64, 98, 6, f)}
      <Path d="M14 70 Q10 46 30 44 L64 44 Q70 30 78 20 Q90 16 96 28 L92 34 L84 34 L78 60 Q74 72 60 72 Z" fill={f} />
      <Path d="M70 26 Q66 38 62 46 L68 48 Q72 36 78 22 Z" fill="#4A2E1F" />
      <Path d="M14 52 Q2 60 6 82" fill="none" stroke="#4A2E1F" strokeWidth={5} />
      <Circle cx={86} cy={26} r={2} fill={INK} stroke="none" />
    </G>
  ),
  spider: (f = '#3A3633') => (
    <G>
      {[-1, 1].map((s) => (
        <G key={s} fill="none" strokeWidth={3}>
          <Path d={`M50 60 Q${50 + s * 26} 40 ${50 + s * 40} 56`} />
          <Path d={`M50 62 Q${50 + s * 28} 54 ${50 + s * 44} 70`} />
          <Path d={`M50 64 Q${50 + s * 26} 70 ${50 + s * 40} 86`} />
          <Path d={`M50 66 Q${50 + s * 20} 82 ${50 + s * 28} 96`} />
        </G>
      ))}
      <Ellipse cx={50} cy={66} rx={14} ry={16} fill={f} />
      <Circle cx={50} cy={48} r={8} fill={f} />
      <Circle cx={47} cy={46} r={1.8} fill="#FFFFFF" stroke="none" />
      <Circle cx={53} cy={46} r={1.8} fill="#FFFFFF" stroke="none" />
      <Line x1={50} y1={40} x2={50} y2={0} strokeWidth={1.5} />
    </G>
  ),
  elephant: (f = '#9DA3AE') => (
    <G>
      {legs([18, 32, 52, 64], 66, 98, 11, f)}
      <Path d="M8 70 Q4 36 40 34 Q70 32 76 50 Q90 52 92 70 Q94 88 86 96 L80 94 Q84 80 78 72 L74 74 Q60 78 8 70 Z" fill={f} />
      <Path d="M54 42 Q46 60 58 70 Q72 72 70 52 Z" fill="#B7BCC5" />
      <Circle cx={76} cy={52} r={2.4} fill={INK} stroke="none" />
      <Path d="M78 62 Q84 66 90 62" fill="#FFFFFF" />
    </G>
  ),
  wolf: (f = '#8A8D96') => (
    <G>
      {legs([24, 34, 58, 68], 66, 98, 6, f)}
      <Path d="M14 70 Q12 50 30 48 L62 48 L70 34 L72 20 L78 30 L84 22 L84 36 L98 46 L84 52 Q78 66 66 70 Z" fill={f} />
      <Path d="M14 56 Q0 54 2 40 Q10 50 18 50" fill={f} />
      <Circle cx={80} cy={40} r={2} fill={INK} stroke="none" />
    </G>
  ),
  donkey: (f = '#9C8E80') => (
    <G>
      {legs([22, 32, 58, 68], 66, 98, 6, f)}
      <Path d="M14 70 Q10 48 30 46 L62 46 Q70 34 80 32 Q94 32 96 46 Q96 56 86 56 L76 56 Q72 70 60 72 Z" fill={f} />
      <Path d="M74 34 L70 10 L80 30 Z M80 32 L82 8 L86 32 Z" fill={f} />
      <Path d="M14 54 Q6 62 8 76" fill="none" />
      <Circle cx={84} cy={42} r={2} fill={INK} stroke="none" />
    </G>
  ),

  // ---------- nature ----------
  palm: (f = '#5E9B4D') => (
    <G>
      <Path d="M46 100 Q44 70 50 40 L56 40 Q52 70 56 100 Z" fill="#A9784A" />
      <Path d="M50 40 Q30 26 6 38 Q28 30 50 44 Z M52 40 Q70 22 96 32 Q72 30 54 44 Z M50 40 Q36 14 18 12 Q38 22 50 42 Z M54 40 Q66 12 86 10 Q66 22 54 42 Z M52 40 Q52 20 52 6 Q56 22 54 40 Z" fill={f} />
      <Circle cx={48} cy={44} r={4} fill="#8B4E2A" />
      <Circle cx={56} cy={45} r={4} fill="#8B4E2A" />
    </G>
  ),
  tree: (f = '#6FB36A') => (
    <G>
      <Path d="M44 100 L46 62 L54 62 L56 100 Z" fill="#9A6B43" />
      <Path d="M20 62 Q6 52 16 38 Q14 20 34 18 Q44 4 62 12 Q82 10 84 30 Q98 40 88 56 Q86 70 66 68 Q50 76 36 68 Q24 72 20 62 Z" fill={f} />
    </G>
  ),
  flower: (f = '#F0B3C8') => (
    <G>
      <Path d="M50 100 L50 56" fill="none" stroke="#5E9B4D" strokeWidth={4} />
      <Path d="M50 80 Q36 70 30 78 Q40 86 50 82" fill="#8FCB7A" />
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse key={a} cx={50} cy={36} rx={9} ry={14} fill={f} transform={`rotate(${a} 50 50)`} />
      ))}
      <Circle cx={50} cy={50} r={8} fill="#F6C84C" />
    </G>
  ),
  mountain: (f = '#9A94A8') => (
    <G>
      <Path d="M2 100 L48 12 L98 100 Z" fill={f} />
      <Path d="M36 34 L48 12 L60 34 L54 30 L48 38 L42 30 Z" fill="#FFFFFF" />
    </G>
  ),
  cave: (f = '#A08C7A') => (
    <G>
      <Path d="M2 100 Q4 30 50 22 Q96 30 98 100 Z" fill={f} />
      <Path d="M30 100 Q30 58 50 56 Q70 58 70 100 Z" fill="#221E1C" />
      <Path d="M14 70 L22 66 M78 52 L86 58 M60 36 L68 38" fill="none" />
    </G>
  ),
  web: (f = '#FFFFFF') => (
    <G fill="none" stroke={f} strokeWidth={2}>
      {[0, 45, 90, 135].map((a) => <Line key={a} x1={50} y1={10} x2={50} y2={90} transform={`rotate(${a} 50 50)`} />)}
      {[12, 24, 36].map((r) => (
        <Path key={r} d={Array.from({ length: 9 }, (_, i) => `${i ? 'L' : 'M'}${50 + r * Math.cos((i * Math.PI) / 4)} ${50 + r * Math.sin((i * Math.PI) / 4)}`).join(' ')} />
      ))}
    </G>
  ),
  fire: (f = '#F28C38') => (
    <G>
      <Path d="M50 4 Q64 26 72 30 Q78 18 78 12 Q98 40 92 70 Q88 98 50 98 Q12 98 8 70 Q4 46 24 26 Q26 40 34 44 Q36 22 50 4 Z" fill={f} />
      <Path d="M50 36 Q62 54 70 56 Q76 72 70 84 Q62 96 50 96 Q36 96 30 84 Q24 70 34 58 Q38 66 44 66 Q42 50 50 36 Z" fill="#FFD25A" />
      <Path d="M50 66 Q60 78 58 88 Q54 96 50 96 Q44 96 42 88 Q42 78 50 66 Z" fill="#FFF3C4" />
    </G>
  ),
  wave: (f = '#4F9CC9') => (
    <G>
      <Path d="M2 100 Q4 40 50 24 Q84 16 96 38 Q78 30 68 40 Q84 44 82 60 Q70 50 58 56 Q50 80 98 100 Z" fill={f} />
      <Path d="M50 24 Q84 16 96 38 Q78 30 68 40 Q60 34 50 24 Z" fill="#FFFFFF" />
    </G>
  ),
  spring: (f = '#6CC3E8') => (
    <G>
      <Ellipse cx={50} cy={88} rx={46} ry={11} fill="#B9A58A" />
      <Ellipse cx={50} cy={86} rx={36} ry={7} fill={f} />
      <Path d="M50 84 Q44 50 30 40 M50 84 Q50 40 50 20 M50 84 Q56 50 70 40" fill="none" stroke={f} strokeWidth={6} />
      <Circle cx={28} cy={36} r={4} fill={f} />
      <Circle cx={50} cy={14} r={4} fill={f} />
      <Circle cx={72} cy={36} r={4} fill={f} />
    </G>
  ),
  rock: (f = '#A6A1A9') => (
    <G>
      <Path d="M6 100 Q2 70 20 56 Q30 30 56 36 Q86 34 92 64 Q100 84 94 100 Z" fill={f} />
      <Path d="M30 62 L40 70 M64 50 L70 60" fill="none" />
    </G>
  ),
  gourd: (f = '#6FB36A') => (
    <G>
      <Path d="M4 100 Q30 76 50 84 Q74 72 96 100 Z" fill="#7E9E57" />
      {[[22, 66], [50, 50], [78, 64], [36, 40], [66, 34]].map(([x, y]) => (
        <Path key={`${x}-${y}`} d={`M${x} ${y + 26} Q${x - 22} ${y + 6} ${x} ${y - 6} Q${x + 22} ${y + 6} ${x} ${y + 26} Z`} fill={f} />
      ))}
      <Ellipse cx={58} cy={88} rx={14} ry={9} fill="#E2D27A" />
    </G>
  ),

  // ---------- buildings & places ----------
  ark: (f = '#A0673D') => (
    <G>
      <Rect x={30} y={24} width={40} height={30} rx={3} fill="#C99460" />
      <Path d="M26 26 L50 10 L74 26 Z" fill="#7A4B2A" />
      <Rect x={38} y={32} width={9} height={9} fill="#FFE9A8" />
      <Rect x={53} y={32} width={9} height={9} fill="#FFE9A8" />
      <Path d="M2 52 L98 52 L86 90 Q50 98 14 90 Z" fill={f} />
      <Path d="M8 66 L92 66 M12 78 L88 78" fill="none" />
      <Circle cx={24} cy={59} r={3} fill="#FFE9A8" />
      <Circle cx={76} cy={59} r={3} fill="#FFE9A8" />
    </G>
  ),
  boat: (f = '#B07A4A') => (
    <G>
      <Line x1={50} y1={8} x2={50} y2={70} strokeWidth={4} />
      <Path d="M52 10 Q84 34 86 64 L52 64 Z" fill="#FBF7EE" />
      <Path d="M48 18 Q26 40 22 64 L48 64 Z" fill="#F4E1BE" />
      <Path d="M6 70 L94 70 L80 94 L20 94 Z" fill={f} />
    </G>
  ),
  kaaba: (f = '#1E1C1F') => (
    <G>
      <Path d="M8 34 L58 24 L94 32 L94 92 L58 100 L8 92 Z" fill={f} />
      <Path d="M58 24 L58 100" fill="none" stroke="#3A363B" />
      <Path d="M8 46 L58 37 L94 44 L94 52 L58 46 L8 54 Z" fill="#D4A63E" />
      <Path d="M68 66 L82 64 L82 96 L68 98 Z" fill="#D4A63E" />
      <Path d="M8 34 L58 24 L94 32" fill="none" />
    </G>
  ),
  house: (f = '#E9CFA3') => (
    <G>
      <Rect x={14} y={36} width={72} height={64} fill={f} />
      <Rect x={10} y={30} width={80} height={10} fill="#D2B07D" />
      <Path d="M42 100 L42 72 Q50 62 58 72 L58 100 Z" fill="#7A4B2A" />
      <Rect x={22} y={50} width={12} height={12} fill="#5A4636" />
      <Rect x={66} y={50} width={12} height={12} fill="#5A4636" />
    </G>
  ),
  palace: (f = '#F1DDB2') => (
    <G>
      <Rect x={4} y={44} width={92} height={56} fill={f} />
      <Path d="M28 44 Q28 18 50 12 Q72 18 72 44 Z" fill="#7FB3C9" />
      <Line x1={50} y1={12} x2={50} y2={2} />
      <Rect x={2} y={22} width={14} height={78} fill={f} />
      <Rect x={84} y={22} width={14} height={78} fill={f} />
      <Path d="M2 22 L9 10 L16 22 Z M84 22 L91 10 L98 22 Z" fill="#7FB3C9" />
      <Path d="M40 100 L40 74 Q50 62 60 74 L60 100 Z" fill="#8A5A34" />
      {[24, 70].map((x) => <Path key={x} d={`M${x} 82 L${x} 66 Q${x + 4} 60 ${x + 8} 66 L${x + 8} 82 Z`} fill="#5A4636" />)}
    </G>
  ),
  throne: (f = '#E6AE4C') => (
    <G>
      <Path d="M24 10 Q50 0 76 10 L76 60 L24 60 Z" fill={f} />
      <Rect x={32} y={18} width={36} height={36} rx={6} fill="#B5413F" />
      <Rect x={14} y={56} width={72} height={14} rx={3} fill={f} />
      <Rect x={18} y={70} width={10} height={30} fill={f} />
      <Rect x={72} y={70} width={10} height={30} fill={f} />
      <Path d={star5(50, 8, 7, 3)} fill="#FFF3C4" />
    </G>
  ),
  tent: (f = '#D98B5F') => (
    <G>
      <Path d="M2 100 L50 18 L98 100 Z" fill={f} />
      <Path d="M26 60 L74 60 M14 80 L86 80" fill="none" stroke="#F4E1BE" strokeWidth={5} />
      <Path d="M2 100 L50 18 L98 100" fill="none" />
      <Path d="M40 100 L50 66 L60 100 Z" fill="#3A2A22" />
    </G>
  ),
  well: (f = '#B9A58A') => (
    <G>
      <Line x1={18} y1={14} x2={18} y2={66} strokeWidth={5} />
      <Line x1={82} y1={14} x2={82} y2={66} strokeWidth={5} />
      <Path d="M10 18 L50 4 L90 18 Z" fill="#8A5A34" />
      <Line x1={50} y1={18} x2={50} y2={42} strokeWidth={2} />
      <Path d="M42 42 L58 42 L56 54 L44 54 Z" fill="#A0673D" />
      <Rect x={10} y={62} width={80} height={38} rx={4} fill={f} />
      <Path d="M10 76 L90 76 M10 88 L90 88 M30 62 L30 76 M60 62 L60 76 M44 76 L44 88 M74 76 L74 88" fill="none" strokeWidth={2} />
    </G>
  ),
  pyramid: (f = '#E3B873') => (
    <G>
      <Path d="M2 100 L50 12 L98 100 Z" fill={f} />
      <Path d="M50 12 L66 100 L98 100 Z" fill="#C99A55" />
      <Path d="M28 60 L72 60 M16 80 L84 80" fill="none" strokeWidth={2} />
    </G>
  ),
  prison: (f = '#8E8A93') => (
    <G>
      <Rect x={4} y={14} width={92} height={86} fill={f} />
      <Path d="M4 34 L96 34 M4 56 L96 56 M4 78 L96 78 M30 14 L30 34 M66 14 L66 34 M18 34 L18 56 M50 34 L50 56 M82 34 L82 56 M34 78 L34 100 M70 78 L70 100" fill="none" strokeWidth={2} />
      <Rect x={32} y={38} width={36} height={32} fill="#221E1C" />
      {[40, 50, 60].map((x) => <Line key={x} x1={x} y1={38} x2={x} y2={70} strokeWidth={4} />)}
    </G>
  ),
  gate: (f = '#C9A27A') => (
    <G>
      <Path d="M4 100 L4 24 L96 24 L96 100 L70 100 L70 60 Q50 30 30 60 L30 100 Z" fill={f} />
      <Path d="M4 24 L4 12 L14 12 L14 20 L26 20 L26 12 L38 12 L38 20 L62 20 L62 12 L74 12 L74 20 L86 20 L86 12 L96 12 L96 24 Z" fill={f} />
    </G>
  ),
  wall: (f = '#C27C5A') => (
    <G>
      <Rect x={2} y={30} width={96} height={70} fill={f} />
      {[30, 44, 58, 72, 86].map((y, i) => (
        <G key={y}>
          <Line x1={2} y1={y} x2={98} y2={y} strokeWidth={2} />
          {[0, 1, 2, 3].map((j) => <Line key={j} x1={(i % 2 ? 14 : 26) + j * 24} y1={y} x2={(i % 2 ? 14 : 26) + j * 24} y2={y + 14} strokeWidth={2} />)}
        </G>
      ))}
    </G>
  ),
  idol: (f = '#A6A1A9') => (
    <G>
      <Rect x={22} y={88} width={56} height={12} fill="#8E8A93" />
      <Path d="M32 88 L34 30 Q50 14 66 30 L68 88 Z" fill={f} />
      <Path d="M38 44 L62 44 M38 60 L62 60 M44 72 L56 72" fill="none" strokeWidth={2.5} />
      <Path d="M42 52 L46 50 M54 50 L58 52" fill="none" strokeWidth={2.5} />
    </G>
  ),
  mosque: (f = '#FBF2DF') => (
    <G>
      <Rect x={14} y={56} width={64} height={44} fill={f} />
      <Path d="M22 56 Q22 28 46 24 Q70 28 70 56 Z" fill="#5DB08C" />
      <Line x1={46} y1={24} x2={46} y2={12} />
      <Path d="M43 12 Q46 6 49 12" fill="none" />
      <Rect x={82} y={20} width={10} height={80} fill={f} />
      <Path d="M80 20 L87 6 L94 20 Z" fill="#5DB08C" />
      <Path d="M38 100 L38 78 Q46 70 54 78 L54 100 Z" fill="#7A4B2A" />
    </G>
  ),
  mihrab: (f = '#E9CFA3') => (
    <G>
      <Rect x={6} y={10} width={88} height={90} fill={f} />
      <Path d="M24 100 L24 46 Q24 22 50 16 Q76 22 76 46 L76 100 Z" fill="#5DB08C" />
      <Path d="M32 100 L32 50 Q32 32 50 26 Q68 32 68 50 L68 100 Z" fill="#CFEADB" />
      <Line x1={50} y1={26} x2={50} y2={44} strokeWidth={2} />
      <Path d="M42 44 L58 44 L54 58 L46 58 Z" fill="#E6AE4C" />
      <Path d="M48 58 Q50 66 52 58" fill="#FFD25A" />
    </G>
  ),

  // ---------- objects ----------
  staff: (f = '#A0673D') => (
    <G>
      <Path d="M46 100 L48 30 Q48 8 66 8 Q80 10 78 24" fill="none" stroke={INK} strokeWidth={11} />
      <Path d="M46 100 L48 30 Q48 8 66 8 Q80 10 78 24" fill="none" stroke={f} strokeWidth={6} />
    </G>
  ),
  tablet: (f = '#C9C3B6') => (
    <G>
      {[8, 52].map((x) => (
        <G key={x}>
          <Path d={`M${x} 100 L${x} 28 Q${x} 8 ${x + 20} 8 Q${x + 40} 8 ${x + 40} 28 L${x + 40} 100 Z`} fill={f} />
          {[34, 48, 62, 76].map((y) => <Line key={y} x1={x + 9} y1={y} x2={x + 31} y2={y} strokeWidth={2.5} />)}
        </G>
      ))}
    </G>
  ),
  scroll: (f = '#F4E1BE') => (
    <G>
      <Rect x={18} y={20} width={64} height={66} fill={f} />
      <Rect x={10} y={12} width={80} height={12} rx={6} fill="#C99460" />
      <Rect x={10} y={82} width={80} height={12} rx={6} fill="#C99460" />
      {[36, 48, 60, 72].map((y) => <Line key={y} x1={28} y1={y} x2={72} y2={y} strokeWidth={2.5} />)}
    </G>
  ),
  lamp: (f = '#E6AE4C') => (
    <G>
      <Path d="M50 40 Q42 30 50 14 Q58 30 50 40 Z" fill="#FFD25A" />
      <Path d="M10 66 Q14 50 50 50 Q80 50 84 62 L98 54 L92 68 Q80 84 50 84 Q16 84 10 66 Z" fill={f} />
      <Rect x={36} y={84} width={28} height={10} rx={3} fill={f} />
      <Path d="M44 50 L50 40 L56 50" fill="none" />
    </G>
  ),
  axe: (f = '#A6A1A9') => (
    <G>
      <Line x1={30} y1={98} x2={64} y2={16} stroke={INK} strokeWidth={10} />
      <Line x1={30} y1={98} x2={64} y2={16} stroke="#A0673D" strokeWidth={6} />
      <Path d="M56 22 Q66 4 92 12 Q86 34 70 44 Z" fill={f} />
    </G>
  ),
  wheat: (f = '#E6B84C') => (
    <G>
      {[30, 50, 70].map((x, i) => (
        <G key={x}>
          <Path d={`M${x} 100 Q${x + (i - 1) * 4} 60 ${x + (i - 1) * 10} 20`} fill="none" stroke="#B88A3A" strokeWidth={3} />
          {[0, 1, 2, 3].map((k) => (
            <G key={k}>
              <Ellipse cx={x + (i - 1) * 8 - 5} cy={26 + k * 10} rx={4} ry={7} fill={f} transform={`rotate(-25 ${x + (i - 1) * 8 - 5} ${26 + k * 10})`} />
              <Ellipse cx={x + (i - 1) * 8 + 5} cy={26 + k * 10} rx={4} ry={7} fill={f} transform={`rotate(25 ${x + (i - 1) * 8 + 5} ${26 + k * 10})`} />
            </G>
          ))}
        </G>
      ))}
    </G>
  ),
  basket: (f = '#C99A55') => (
    <G>
      <Path d="M30 60 Q50 44 70 60" fill="#FBF7EE" />
      <Path d="M4 60 L96 60 Q90 96 50 96 Q10 96 4 60 Z" fill={f} />
      <Path d="M10 72 L90 72 M16 84 L84 84 M30 60 L32 94 M50 60 L50 96 M70 60 L68 94" fill="none" strokeWidth={2} />
    </G>
  ),
  shirt: (f = '#9DC3E6') => (
    <G>
      <Path d="M36 10 Q50 20 64 10 L94 26 L84 46 L74 40 L74 98 L26 98 L26 40 L16 46 L6 26 Z" fill={f} />
      <Path d="M36 10 Q50 26 64 10" fill="none" />
    </G>
  ),
  crown: (f = '#E6AE4C') => (
    <G>
      <Path d="M8 90 L8 34 L30 58 L50 22 L70 58 L92 34 L92 90 Z" fill={f} />
      <Rect x={8} y={78} width={84} height={12} fill="#C98F2E" />
      <Circle cx={50} cy={60} r={6} fill="#D84A4A" />
      <Circle cx={26} cy={68} r={4} fill="#5DB08C" />
      <Circle cx={74} cy={68} r={4} fill="#5DB08C" />
    </G>
  ),
  scales: (f = '#E6AE4C') => (
    <G>
      <Line x1={50} y1={14} x2={50} y2={92} strokeWidth={5} />
      <Rect x={30} y={90} width={40} height={8} rx={3} fill={f} />
      <Line x1={12} y1={26} x2={88} y2={26} strokeWidth={5} />
      <Path d="M14 26 L4 60 M14 26 L24 60 M86 26 L76 60 M86 26 L96 60" fill="none" strokeWidth={1.5} />
      <Path d="M2 60 Q14 74 26 60 Z M74 60 Q86 74 98 60 Z" fill={f} />
      <Circle cx={50} cy={12} r={5} fill={f} />
    </G>
  ),
  armor: (f = '#A6A9B4') => (
    <G>
      <Path d="M30 8 Q50 18 70 8 L92 22 L84 46 L78 42 L80 96 L20 96 L22 42 L16 46 L8 22 Z" fill={f} />
      {[30, 44, 58, 72, 86].map((y) => (
        <G key={y}>{[32, 44, 56, 68].map((x) => <Circle key={x} cx={x + (y % 28 ? 0 : 6)} cy={y} r={4} fill="none" strokeWidth={1.8} />)}</G>
      ))}
    </G>
  ),
  dates: (f = '#8B4E2A') => (
    <G>
      <Path d="M50 4 L50 30 M50 30 Q30 40 26 60 M50 30 Q70 40 74 60 M50 30 L50 64" fill="none" stroke="#C99A55" strokeWidth={3} />
      {[[26, 66], [40, 74], [50, 66], [60, 78], [74, 66], [34, 88], [52, 90], [66, 92], [44, 56], [58, 54]].map(([x, y]) => (
        <Ellipse key={`${x}-${y}`} cx={x} cy={y} rx={6} ry={9} fill={f} />
      ))}
    </G>
  ),
  bread: (f = '#D9A55E') => (
    <G>
      <Path d="M8 88 Q4 54 50 50 Q96 54 92 88 Z" fill={f} />
      <Path d="M30 62 L36 72 M48 58 L54 70 M66 62 L72 72" fill="none" strokeWidth={2.5} />
    </G>
  ),
  cup: (f = '#E6AE4C') => (
    <G>
      <Path d="M20 20 L80 20 Q80 60 50 64 Q20 60 20 20 Z" fill={f} />
      <Ellipse cx={50} cy={20} rx={30} ry={6} fill="#FFFFFF" />
      <Rect x={46} y={62} width={8} height={24} fill={f} />
      <Path d="M28 98 Q28 86 50 86 Q72 86 72 98 Z" fill={f} />
    </G>
  ),
  jar: (f = '#C27C5A') => (
    <G>
      <Path d="M36 10 L64 10 L60 24 Q88 36 84 68 Q80 98 50 98 Q20 98 16 68 Q12 36 40 24 Z" fill={f} />
      <Path d="M22 56 Q50 64 78 56" fill="none" strokeWidth={2.5} />
    </G>
  ),
  heart: (f = '#F07A8A') => (
    <Path d="M50 92 Q6 62 8 36 Q10 12 32 12 Q46 12 50 28 Q54 12 68 12 Q90 12 92 36 Q94 62 50 92 Z" fill={f} />
  ),
  footprints: (f = '#B88A5A') => (
    <G>
      {[[24, 84, -10], [48, 60, 10], [64, 32, -10], [84, 10, 10]].map(([x, y, r]) => (
        <G key={`${x}`} transform={`rotate(${r} ${x} ${y})`}>
          <Ellipse cx={x} cy={y + 6} rx={6} ry={9} fill={f} stroke="none" />
          <Circle cx={x - 3} cy={y - 6} r={2} fill={f} stroke="none" />
          <Circle cx={x + 3} cy={y - 7} r={2} fill={f} stroke="none" />
        </G>
      ))}
    </G>
  ),
  stones: (f = '#8E8A93') => (
    <G>
      <Ellipse cx={24} cy={88} rx={16} ry={10} fill={f} />
      <Ellipse cx={58} cy={90} rx={20} ry={9} fill="#A6A1A9" />
      <Ellipse cx={42} cy={72} rx={12} ry={8} fill="#B7B2BA" />
      <Ellipse cx={80} cy={84} rx={10} ry={7} fill={f} />
    </G>
  ),
  cradle: (f = '#C99460') => (
    <G>
      <Path d="M10 46 L90 46 Q90 82 50 82 Q10 82 10 46 Z" fill={f} />
      <Path d="M10 46 Q10 22 34 20 L34 46" fill="#F4E1BE" />
      <Path d="M6 92 Q50 104 94 92" fill="none" strokeWidth={5} />
      <Line x1={30} y1={80} x2={24} y2={94} strokeWidth={4} />
      <Line x1={70} y1={80} x2={76} y2={94} strokeWidth={4} />
      <Path d="M40 46 Q50 36 70 40" fill="#FBF7EE" />
    </G>
  ),
  ring: (f = '#E6AE4C') => (
    <G>
      <Circle cx={50} cy={64} r={28} fill="none" stroke={INK} strokeWidth={14} />
      <Circle cx={50} cy={64} r={28} fill="none" stroke={f} strokeWidth={8} />
      <Path d="M36 30 L50 14 L64 30 L50 42 Z" fill="#7FC8E8" />
    </G>
  ),
};
