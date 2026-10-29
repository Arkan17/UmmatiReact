// Shared, theme-aware building blocks. Visual language: soft neo-brutalism — flat fills, thick ink
// outlines and hard (unblurred) offset shadows, with rounded corners.
import React, { useContext, useEffect, useState } from 'react';
import { AppState, Pressable, PressableProps, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { NavigationContext } from '@react-navigation/native';
import HapticFeedback from 'react-native-haptic-feedback';
import { useAppTheme } from '../theme/ThemeProvider';
import { brutal, spacing } from '../theme/palettes';
import { CelestialScene } from './CelestialScene';

export const haptic = {
  light: () => HapticFeedback.trigger('impactLight', { enableVibrateFallback: false }),
  medium: () => HapticFeedback.trigger('impactMedium', { enableVibrateFallback: false }),
  success: () => HapticFeedback.trigger('notificationSuccess', { enableVibrateFallback: false }),
  select: () => HapticFeedback.trigger('selection', { enableVibrateFallback: false }),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticOnPress?: boolean;
  children?: React.ReactNode;
}

/** Press feedback (slight sink) with an optional light haptic tap. */
export function PressableScale({ style, scaleTo = 0.96, hapticOnPress = true, onPress, children, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => { scale.value = withSpring(scaleTo, { damping: 18, stiffness: 400 }); rest.onPressIn?.(e); }}
      onPressOut={(e) => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); rest.onPressOut?.(e); }}
      onPress={(e) => { if (hapticOnPress) haptic.light(); onPress?.(e); }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * True while the enclosing screen is focused and the app is in the foreground.
 * Works outside a navigator too (always true there).
 */
export function useScreenActive() {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => navigation?.isFocused() ?? true);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    if (!navigation) return;
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => { offFocus(); offBlur(); };
  }, [navigation]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => setForeground(st === 'active'));
    return () => sub.remove();
  }, []);
  return focused && foreground;
}

// Style keys that position a box in its parent (plus opacity, so face and shadow fade together);
// these stay on the outer wrapper of shadowed boxes.
const OUTER_KEYS = new Set([
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'marginStart', 'marginEnd', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'height',
  'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'position', 'top', 'left', 'right', 'bottom', 'zIndex', 'opacity',
]);

function splitStyle(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, any>;
  const outer: Record<string, any> = {};
  const inner: Record<string, any> = {};
  for (const [k, v] of Object.entries(flat)) (OUTER_KEYS.has(k) ? outer : inner)[k] = v;
  // Let the face fill a wrapper that has an explicit size
  if (outer.flex != null || outer.height != null || outer.flexGrow != null) inner.flex = 1;
  if (outer.minHeight != null) inner.minHeight = outer.minHeight;
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

interface BrutalBoxProps {
  style?: StyleProp<ViewStyle>;
  /** Face fill colour (default: surface) */
  fill?: string;
  radius?: number;
  /** Hard shadow offset; 0 = no shadow */
  offset?: number;
  borderWidth?: number;
  children?: React.ReactNode;
}

/** A flat, ink-outlined box with a hard offset shadow behind it. */
export function BrutalBox({ style, fill, radius: radiusProp, offset = brutal.shadow, borderWidth = brutal.border, children }: BrutalBoxProps) {
  const { colors } = useAppTheme();
  const { outer, inner } = splitStyle(style);
  // A borderRadius in `style` wins so the shadow always matches the face's corners
  const radius = (inner.borderRadius as number | undefined) ?? radiusProp ?? brutal.radius;
  return (
    <View style={outer}>
      {offset > 0 && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius, backgroundColor: colors.ink }]} />
      )}
      <View style={[{ backgroundColor: fill ?? colors.surface, borderRadius: radius, borderWidth, borderColor: colors.ink }, inner]}>
        {children}
      </View>
    </View>
  );
}

/**
 * Tappable brutalist box: the face slides into its shadow while pressed, like a physical button.
 */
export function BrutalPressable({ style, fill, radius: radiusProp, offset = brutal.shadow, borderWidth = brutal.border, onPress, hapticOnPress = true, disabled, children, ...rest }: BrutalBoxProps & Omit<PressableProps, 'style' | 'children'> & { hapticOnPress?: boolean }) {
  const { colors } = useAppTheme();
  const { outer, inner } = splitStyle(style);
  const radius = (inner.borderRadius as number | undefined) ?? radiusProp ?? brutal.radius;
  const pressed = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pressed.value * offset }, { translateY: pressed.value * offset }] }));
  return (
    <View style={outer}>
      {offset > 0 && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius, backgroundColor: colors.ink }]} />
      )}
      <AnimatedPressable
        {...rest}
        disabled={disabled}
        onPressIn={(e) => { pressed.value = withTiming(1, { duration: 70 }); rest.onPressIn?.(e); }}
        onPressOut={(e) => { pressed.value = withTiming(0, { duration: 110 }); rest.onPressOut?.(e); }}
        onPress={(e) => { if (hapticOnPress) haptic.light(); onPress?.(e); }}
        style={[{ backgroundColor: fill ?? colors.surface, borderRadius: radius, borderWidth, borderColor: colors.ink }, inner, faceStyle]}
      >
        {children}
      </AnimatedPressable>
    </View>
  );
}

/** Thick ink outline for ad-hoc boxes: `style={[styles.x, outline(colors)]}` */
export const outline = (colors: { ink: string }, width: number = brutal.borderThin) => ({ borderWidth: width, borderColor: colors.ink });

/**
 * The time-of-day hero: flat period colour + flat illustrated scene (sun/moon, clouds, stars, skyline).
 * `scene="compact"` uses a smaller sun/moon for short headers; `scene={false}` is colour only.
 */
export function SkyBackground({ style, height, horizon, scene = true, children }: {
  style?: StyleProp<ViewStyle>;
  height?: number;
  horizon?: number;
  scene?: boolean | 'compact';
  children?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [measured, setMeasured] = useState(height ?? 320);
  // Sky loops pause while this screen is covered by another one (they'd otherwise keep eating frames)
  const active = useScreenActive();
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors.sky[0] }, style]} onLayout={(e) => setMeasured(e.nativeEvent.layout.height)}>
      {scene && (
        <CelestialScene
          period={colors.period}
          width={width}
          height={measured}
          horizon={horizon}
          compact={scene === 'compact'}
          animate={active}
          ink={colors.ink}
        />
      )}
      {children}
    </View>
  );
}

/**
 * Standard screen header: hero block + scene, back button, title/subtitle, optional right action.
 * Put extra hero content (search box, stats) in `children`.
 */
export function ScreenHeader({ title, subtitle, onBack, right, children, style }: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <SkyBackground scene="compact" horizon={1} style={[styles.header, { paddingTop: insets.top + 8, borderColor: colors.ink }, style]}>
      <View style={styles.headerTop}>
        {onBack ? <HeaderButton onPress={onBack}><ChevronLeft color={colors.onSky} size={22} strokeWidth={2.6} /></HeaderButton> : <View style={styles.headerBtnSpacer} />}
        <View style={styles.headerRight}>{right}</View>
      </View>
      <Animated.View entering={FadeInDown.duration(350)}>
        <Text style={[styles.headerTitle, { color: colors.onSky }]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSubtitle, { color: colors.onSkyMuted }]}>{subtitle}</Text> : null}
      </Animated.View>
      {children}
    </SkyBackground>
  );
}

/** Square-ish icon button for use inside ScreenHeader's `right` slot. */
export function HeaderButton({ onPress, children }: { onPress?: () => void; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <BrutalPressable onPress={onPress} fill={colors.glass} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.headerBtn}>
      {children}
    </BrutalPressable>
  );
}

/** Solid card for use on top of the hero colour. */
export function GlassCard({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <BrutalBox fill={colors.glass} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={[{ padding: spacing.lg }, style]}>
      {children}
    </BrutalBox>
  );
}

/** Solid surface card: ink outline + hard shadow. */
export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return <BrutalBox style={[{ padding: spacing.lg }, style]}>{children}</BrutalBox>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10} style={[styles.sectionActionPill, { backgroundColor: colors.accentSoft, borderColor: colors.ink }]}>
          <Text style={[styles.sectionAction, { color: colors.text }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Animated horizontal progress bar with an ink outline. */
export function ProgressBar({ value, color, track, height = 10 }: { value: number; color: string; track: string; height?: number }) {
  const { colors } = useAppTheme();
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 600 }); }, [value, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  const outer = Math.max(height, 6) + 4;
  return (
    <View style={{ height: outer, borderRadius: outer, backgroundColor: track, overflow: 'hidden', borderWidth: brutal.borderThin, borderColor: colors.ink }}>
      <Animated.View style={[{ height: '100%', borderRadius: outer, backgroundColor: color, borderRightWidth: brutal.borderThin, borderColor: colors.ink }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, minHeight: 170, borderBottomWidth: brutal.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerBtnSpacer: { width: 42, height: 42 },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  headerSubtitle: { fontSize: 14, fontWeight: '700', marginTop: 4, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  sectionActionPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: brutal.borderThin },
  sectionAction: { fontSize: 13, fontWeight: '800' },
});
