import React from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';

// Geometry shared by the static logo, the animated splash and the app icons
// (scratch generator mirrors it). The mark is a Rub el Hizb (eight-pointed star) cradling a
// crescent and star, drawn neo-brutalist: flat fills, thick ink outlines, hard offset shadow.
export const LOGO_VIEWBOX = 100;

function starPath(cx: number, cy: number, outer: number, inner: number, points: number, rotationDeg = -90) {
  const step = Math.PI / points;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (rotationDeg * Math.PI) / 180 + i * step;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return d + 'Z';
}

// Two overlapping squares: inner radius = R·cos45°/cos22.5°
export const RUB_EL_HIZB = starPath(50, 50, 46, 46 * 0.7071 / 0.9239, 8, -90);
export const RUB_EL_HIZB_INNER = starPath(50, 50, 37, 37 * 0.7071 / 0.9239, 8, -90);
export const SMALL_STAR = starPath(61, 41, 6, 2.6, 5, -90);
const R = 46, r = 46 * 0.7071 / 0.9239;
/** Perimeter of the star outline, used for the stroke-draw animation */
export const RUB_EL_HIZB_LENGTH = Math.ceil(16 * Math.sqrt(R * R + r * r - 2 * R * r * Math.cos(Math.PI / 8)));

/**
 * Crescent = circle (48,52,r17) minus circle (55,47,r14.5), as a polygon so it can carry an outline
 * (a mask can't be stroked): outer arc counter-clockwise, then the inner arc back clockwise.
 */
function crescentPath(n = 96) {
  const [x1, y1, r1] = [48, 52, 17];
  const [x2, y2, r2] = [55, 47, 14.5];
  const arc = (cx: number, cy: number, rad: number, keep: (x: number, y: number) => boolean) => {
    const pts = Array.from({ length: n }, (_, i) => [cx + rad * Math.cos((2 * Math.PI * i) / n), cy + rad * Math.sin((2 * Math.PI * i) / n)]);
    const k = pts.map(([x, y]) => keep(x, y));
    const start = k.findIndex((v, i) => v && !k[(i - 1 + n) % n]);
    return Array.from({ length: n }, (_, j) => (start + j) % n).filter((i) => k[i]).map((i) => pts[i]);
  };
  const outer = arc(x1, y1, r1, (x, y) => Math.hypot(x - x2, y - y2) > r2);
  const inner = arc(x2, y2, r2, (x, y) => Math.hypot(x - x1, y - y1) < r1).reverse();
  return [...outer, ...inner].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + ' Z';
}
export const CRESCENT = crescentPath();

export const BRAND = {
  ink: '#1C1A17',
  gold: '#F2CF7E',
  green: '#5DB08C',
  cream: '#FFFAF1',
  paper: '#F3EEE4',
} as const;

/** Hard-shadow offset of the mark, in viewBox units */
export const LOGO_SHADOW = 5;
/** viewBox with room for the outline + shadow */
export const LOGO_BOX = '-4 -4 112 112';

interface Props {
  size?: number;
  /** Draw on an outlined cream tile (for headers/avatars) */
  tile?: boolean;
}

export function UmmatiLogo({ size = 64, tile = false }: Props) {
  return (
    <Svg width={size} height={size} viewBox={LOGO_BOX}>
      {tile && <Rect x="-2" y="-2" width="108" height="108" rx="24" fill={BRAND.paper} stroke={BRAND.ink} strokeWidth={3} />}
      <G strokeLinejoin="round" stroke={BRAND.ink}>
        <Path d={RUB_EL_HIZB} fill={BRAND.ink} strokeWidth={0} transform={`translate(${LOGO_SHADOW} ${LOGO_SHADOW})`} />
        <Path d={RUB_EL_HIZB} fill={BRAND.gold} strokeWidth={3.4} />
        <Path d={RUB_EL_HIZB_INNER} fill={BRAND.green} strokeWidth={2.7} />
        <Path d={CRESCENT} fill={BRAND.cream} strokeWidth={2.4} />
        <Path d={SMALL_STAR} fill={BRAND.cream} strokeWidth={1.7} />
      </G>
    </Svg>
  );
}
