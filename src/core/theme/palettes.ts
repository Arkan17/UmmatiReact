// Time-adaptive palettes in a soft neo-brutalist style: flat colour blocks, thick ink outlines and
// hard offset shadows, with rounded corners. Fills stay muted/pastel so nothing glares.
// The hero colour still follows the prayer period: dawn → day → asr → sunset → night.

export type PrayerPeriod = 'fajr' | 'day' | 'asr' | 'maghrib' | 'isha';
export type ThemeMode = 'adaptive' | 'light' | 'dark';

export interface Palette {
  period: PrayerPeriod;
  label: string;
  isDark: boolean;
  /** Hero colour (all three stops equal → flat block; kept as a tuple for gradient call sites) */
  sky: readonly [string, string, string];
  background: string;
  surface: string;
  surfaceAlt: string;
  /** Solid chip/card fill used on top of the hero */
  glass: string;
  glassBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Outline colour for cards, inputs and dividers (same as ink) */
  border: string;
  /** Thick outlines + hard shadows */
  ink: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  success: string;
  danger: string;
  /** Text/icon colour on top of `sky` */
  onSky: string;
  onSkyMuted: string;
  tabBar: string;
  statusBar: 'light-content' | 'dark-content';
}

const flat = (c: string) => [c, c, c] as const;

const LIGHT_INK = '#1C1A17';
const DARK_INK = '#000000';

const lightBase = {
  isDark: false,
  background: '#F3EEE4',
  surface: '#FFFAF1',
  surfaceAlt: '#ECE4D5',
  glass: '#FFFAF1',
  glassBorder: LIGHT_INK,
  text: LIGHT_INK,
  textSecondary: '#4B463E',
  textMuted: '#857D70',
  border: LIGHT_INK,
  ink: LIGHT_INK,
  primary: '#5DB08C',
  primarySoft: '#CFEADB',
  onPrimary: LIGHT_INK,
  accent: '#E6AE4C',
  accentSoft: '#F6E2B6',
  success: '#5DB08C',
  danger: '#E07A6E',
  onSky: LIGHT_INK,
  onSkyMuted: 'rgba(28,26,23,0.66)',
  tabBar: '#FFFAF1',
  statusBar: 'dark-content' as const,
};

const darkBase = {
  isDark: true,
  background: '#1F2029',
  surface: '#32333F',
  surfaceAlt: '#3C3D4B',
  glassBorder: DARK_INK,
  text: '#EFE9DD',
  textSecondary: '#C4BDB0',
  textMuted: '#8D877C',
  border: DARK_INK,
  ink: DARK_INK,
  primary: '#6FC29E',
  primarySoft: '#2E4A3F',
  onPrimary: DARK_INK,
  accent: '#E8B65A',
  accentSoft: '#4A3F2A',
  success: '#6FC29E',
  danger: '#E58A7F',
  onSky: '#F3EDE2',
  onSkyMuted: 'rgba(243,237,226,0.72)',
  tabBar: '#32333F',
  statusBar: 'light-content' as const,
};

export const palettes: Record<PrayerPeriod, Palette> = {
  fajr: { ...darkBase, period: 'fajr', label: 'Dawn', sky: flat('#4E4478'), glass: '#5E5489' },
  day: { ...lightBase, period: 'day', label: 'Day', sky: flat('#9CCFC0') },
  asr: { ...lightBase, period: 'asr', label: 'Afternoon', sky: flat('#F0C58E'), background: '#F5EEE2' },
  maghrib: { ...darkBase, period: 'maghrib', label: 'Sunset', sky: flat('#8A4B57'), glass: '#9A5A66' },
  isha: { ...darkBase, period: 'isha', label: 'Night', sky: flat('#2C3B62'), glass: '#3A4A74' },
};

/** Neo-brutalist shape tokens: thick outline, hard (unblurred) offset shadow, rounded corners. */
export const brutal = {
  border: 2.5,
  borderThin: 2,
  shadow: 4,
  shadowSmall: 3,
  radius: 18,
  radiusSm: 12,
} as const;

/** Flat pastel category fills for icon tiles and cards (used with ink outlines + ink icons). */
export const tints = {
  green: '#8FD1B0',
  blue: '#9DC3E6',
  violet: '#C2B4EC',
  gold: '#F2CF7E',
  rose: '#F0B3C8',
  teal: '#8ED3CB',
  indigo: '#AEB6EE',
  orange: '#F4B48A',
} as const;

/** Fixed palettes used when the user opts out of the adaptive theme. */
export const fixedPalette = (mode: Exclude<ThemeMode, 'adaptive'>): Palette =>
  mode === 'dark' ? palettes.isha : palettes.day;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, xl: 28, round: 9999 };
export const type = {
  hero: { fontSize: 44, fontWeight: '900' as const, letterSpacing: -1 },
  title: { fontSize: 26, fontWeight: '900' as const, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '800' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6 },
  arabic: { fontFamily: 'Georgia' },
};
