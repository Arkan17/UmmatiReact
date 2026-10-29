import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Share,
  Linking,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  SlideInDown,
} from 'react-native-reanimated';
import {
  Play,
  X,
  Share2,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import {
  BrutalBox,
  BrutalPressable,
  PressableScale,
  haptic,
} from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';

export interface HaramainStream {
  id: string;
  title: string;
  arabicName: string;
  subtitle: string;
  location: string;
  channel: string;
  channelId: string;
  embedUrl: string;
  videoId: string;
  watchUrl: string;
  badge: string;
  accentColor: string;
  cardBg: string;
  virtueText: string;
  reference: string;
}

export const HARAMAIN_STREAMS: HaramainStream[] = [
  {
    id: 'makkah',
    title: 'Makkah Live',
    arabicName: 'الكعبة المشرفة • مكة المكرمة',
    subtitle: 'Holy Kaaba • 24/7',
    location: 'Masjid Al-Haram, Makkah Al-Mukarramah',
    channel: 'Saudi Quran TV (Official)',
    channelId: 'UCos52azQNBgW63_9uDJoPDA',
    videoId: 'eC4LfEVxvKg',
    watchUrl: 'https://www.youtube.com/watch?v=eC4LfEVxvKg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCos52azQNBgW63_9uDJoPDA&autoplay=1&mute=0&playsinline=1',
    badge: 'KAABA LIVE',
    accentColor: '#F59E0B',
    cardBg: '#1C1917',
    virtueText: 'One prayer in the Sacred Mosque is better than 100,000 prayers performed elsewhere.',
    reference: 'Musnad Ahmad & Ibn Majah',
  },
  {
    id: 'madinah',
    title: 'Madinah Live',
    arabicName: 'المسجد النبوي • المدينة المنورة',
    subtitle: 'Prophet’s Mosque • 24/7',
    location: 'Masjid An-Nabawi, Madinah Al-Munawwarah',
    channel: 'Saudi Sunnah TV (Official)',
    channelId: 'UCROKYPep-UuODNwyipe6JMw',
    videoId: 'Rs7St51oDDc',
    watchUrl: 'https://www.youtube.com/watch?v=Rs7St51oDDc',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCROKYPep-UuODNwyipe6JMw&autoplay=1&mute=0&playsinline=1',
    badge: 'RAWDAH LIVE',
    accentColor: '#10B981',
    cardBg: '#064E3B',
    virtueText: 'One prayer in my mosque is better than 1,000 prayers elsewhere, except the Sacred Mosque.',
    reference: 'Sahih Al-Bukhari & Muslim',
  },
];

/** Live pulsing red dot indicator */
export function LiveBadge() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.liveBadgeContainer}>
      <Animated.View style={[styles.liveDot, dotStyle]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </View>
  );
}

/** Formats current Saudi Arabia (Makkah) local time (UTC+3) */
export function getMakkahTime(): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Riyadh',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return '';
  }
}

/**
 * YouTube requires embeds inside a native WebView to identify the app via an
 * `https://<app-id>` Referer/origin. Loading the player HTML with a youtube.com
 * baseUrl (or via youtube-nocookie) is rejected with "Error 152-4".
 */
const PLAYER_ORIGIN = 'https://com.ummati';

/** Builds strict origin-compliant HTML for WebView video player */
const getPlayerHtml = (stream: HaramainStream) => {
  const params = `autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(PLAYER_ORIGIN)}&widget_referrer=${encodeURIComponent(PLAYER_ORIGIN)}`;
  const embedSrc = stream.videoId
    ? `https://www.youtube.com/embed/${stream.videoId}?${params}`
    : `https://www.youtube.com/embed/live_stream?channel=${stream.channelId}&${params}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; background:#000; overflow:hidden; }
          html, body { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; }
          iframe { width:100%; height:100%; border:0; }
        </style>
      </head>
      <body>
        <iframe
          src="${embedSrc}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;
};

/** In-app YouTube player for a Haramain stream (shared by Home and the Live Streams screen). */
export function HaramainPlayer({ stream, style, onLoadStart, onLoadEnd }: {
  stream: HaramainStream;
  style?: StyleProp<ViewStyle>;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}) {
  return (
    <WebView
      key={`${stream.id}-${stream.videoId}`}
      source={{ html: getPlayerHtml(stream), baseUrl: PLAYER_ORIGIN }}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      allowsInlineMediaPlayback={true}
      allowsFullscreenVideo={true}
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      style={[styles.webView, style]}
    />
  );
}

/**
 * Small, cute Haramain Live preview cards to be rendered inside the Hero (first half of the screen).
 * Tapping any card expands the full In-App Live Player Modal.
 */
export function HaramainHeroCards() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeStream, setActiveStream] = useState<HaramainStream | null>(null);
  const [makkahTime, setMakkahTime] = useState(getMakkahTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setMakkahTime(getMakkahTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenStream = (stream: HaramainStream) => {
    haptic.medium();
    setActiveStream(stream);
  };

  const handleShareStream = () => {
    if (!activeStream) return;
    Share.share({
      message: `Watch ${activeStream.title} (${activeStream.location}) Live 24/7 Broadcast from the Holy Sanctuary.\n\nShared via Ummati App: ${activeStream.watchUrl}`,
    });
  };

  const handleOpenYouTubeApp = () => {
    if (!activeStream) return;
    Linking.openURL(activeStream.watchUrl).catch(() => {});
  };

  return (
    <View style={styles.heroSectionWrap}>
      {/* Mini Section Label inside Hero */}
      <View style={styles.heroLabelRow}>
        <View style={styles.heroLabelLeft}>
          <LiveBadge />
          <Text style={[styles.heroLabelText, { color: colors.onSky }]}>HARAMAIN 24/7</Text>
        </View>
        {makkahTime ? (
          <Text style={[styles.heroLabelHint, { color: colors.onSkyMuted }]}>Makkah {makkahTime}</Text>
        ) : null}
      </View>

      {/* Equal-width stream cards */}
      <View style={styles.heroCardsRow}>
        {HARAMAIN_STREAMS.map((stream) => (
          <PressableScale
            key={stream.id}
            onPress={() => handleOpenStream(stream)}
            style={styles.cuteCardWrapper}
          >
            <BrutalBox
              fill={stream.cardBg}
              radius={16}
              borderWidth={brutal.borderThin}
              style={styles.cuteCardBox}
            >
              {/* Card Top Row */}
              <View style={styles.cuteCardTopRow}>
                <View style={styles.cuteBadgeRow}>
                  <View style={[styles.miniRedDot]} />
                  <Text style={styles.cuteBadgeText}>{stream.badge}</Text>
                </View>
                <View style={[styles.cutePlayCircle, { backgroundColor: stream.accentColor }]}>
                  <Play color="#1C1A17" size={9} fill="#1C1A17" style={{ marginLeft: 1 }} />
                </View>
              </View>

              {/* Card Bottom Row */}
              <View style={styles.cuteCardBottom}>
                <Text style={styles.cuteCardTitle} numberOfLines={1}>
                  {stream.title}
                </Text>
                <Text style={styles.cuteCardSubtitle} numberOfLines={1}>
                  {stream.subtitle}
                </Text>
              </View>
            </BrutalBox>
          </PressableScale>
        ))}
      </View>

      {/* Expanded In-App Live Stream Player Modal */}
      <Modal
        visible={activeStream !== null}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setActiveStream(null)}
      >
        <View style={styles.modalRoot}>
          <PressableScale
            onPress={() => setActiveStream(null)}
            style={styles.modalBackdrop}
          />
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(180)}
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.ink,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            {/* Modal Drag Handle */}
            <View style={[styles.modalDragHandle, { backgroundColor: colors.ink }]} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <View style={styles.modalLiveRow}>
                  <LiveBadge />
                  <Text style={[styles.modalHeaderLocation, { color: colors.textMuted }]}>
                    {activeStream?.location}
                  </Text>
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {activeStream?.title}
                </Text>
              </View>
              <PressableScale
                onPress={() => setActiveStream(null)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.ink }]}
              >
                <X color={colors.text} size={18} strokeWidth={2.6} />
              </PressableScale>
            </View>

            {/* In-App Live Video Player Frame (Referer + BaseURL Verified) */}
            <View style={[styles.videoContainer, { borderColor: colors.ink }]}>
              {activeStream ? <HaramainPlayer key={activeStream.id} stream={activeStream} /> : null}
            </View>

            {/* Quick Actions & Stream Switcher */}
            <View style={styles.modalActionsRow}>
              <View style={styles.switcherRow}>
                {HARAMAIN_STREAMS.map((s) => {
                  const isCurrent = activeStream?.id === s.id;
                  return (
                    <PressableScale
                      key={s.id}
                      onPress={() => {
                        haptic.select();
                        setActiveStream(s);
                      }}
                      style={[
                        styles.switcherPill,
                        {
                          borderColor: colors.ink,
                          backgroundColor: isCurrent ? colors.primary : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text style={[styles.switcherPillText, { color: isCurrent ? colors.onPrimary : colors.text }]}>
                        {s.id === 'makkah' ? '🕋 Makkah' : '🕌 Madinah'}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <BrutalPressable
                fill="#EF4444"
                radius={12}
                offset={2}
                borderWidth={brutal.borderThin}
                style={styles.openYtBtn}
                onPress={handleOpenYouTubeApp}
              >
                <ExternalLink color="#FFFFFF" size={13} strokeWidth={2.5} />
                <Text style={styles.openYtBtnText}>YouTube</Text>
              </BrutalPressable>
            </View>

            {/* Virtues & Info Card */}
            {activeStream ? (
              <BrutalBox
                fill={colors.surfaceAlt}
                radius={16}
                borderWidth={brutal.borderThin}
                style={styles.virtueBox}
              >
                <View style={styles.virtueHeader}>
                  <Sparkles color={colors.accent} size={14} strokeWidth={2.4} />
                  <Text style={[styles.virtueHeading, { color: colors.text }]}>Virtue of this Sanctuary</Text>
                </View>
                <Text style={[styles.virtueText, { color: colors.textSecondary }]}>
                  "{activeStream.virtueText}"
                </Text>
                <View style={styles.virtueFooter}>
                  <Text style={[styles.virtueRef, { color: colors.textMuted }]}>
                    — {activeStream.reference}
                  </Text>
                  <BrutalPressable
                    fill={colors.accent}
                    radius={10}
                    offset={2}
                    borderWidth={brutal.borderThin}
                    style={styles.shareBtn}
                    onPress={handleShareStream}
                  >
                    <Share2 color="#1C1A17" size={12} strokeWidth={2.4} />
                    <Text style={styles.shareBtnText}>Share</Text>
                  </BrutalPressable>
                </View>
              </BrutalBox>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

/** Backward compatible alias for any legacy imports */
export function HaramainLiveSection() {
  return <HaramainHeroCards />;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Hero compact cards styles
  heroSectionWrap: {
    marginTop: 2,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  heroLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  heroLabelHint: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  heroCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cuteCardWrapper: {
    flex: 1,
  },
  cuteCardBox: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 74,
    justifyContent: 'space-between',
  },
  cuteCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cuteBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  cuteBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  cutePlayCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1C1A17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuteCardBottom: {
    gap: 1,
  },
  cuteCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cuteCardSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },

  // Live badge
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // Modal styles
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  modalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderWidth: brutal.border,
    borderBottomWidth: 0,
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 10,
  },
  modalLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  modalHeaderLocation: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: brutal.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    height: (SCREEN_WIDTH - 32) * (9 / 16),
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: brutal.border,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  switcherPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: brutal.borderThin,
  },
  switcherPillText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  openYtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openYtBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  virtueBox: {
    marginTop: 12,
    padding: 10,
  },
  virtueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  virtueHeading: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  virtueText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  virtueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  virtueRef: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  shareBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#1C1A17',
  },
});
