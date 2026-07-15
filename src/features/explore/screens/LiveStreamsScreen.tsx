import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Tv } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useDynamicContent } from '../../../core/hooks/useDynamicContent';

type StreamType = 'makkah' | 'madina';

export function LiveStreamsScreen() {
  const navigation = useNavigation();
  const { content } = useDynamicContent();
  const [activeStream, setActiveStream] = useState<StreamType>('makkah');
  const [loading, setLoading] = useState(true);

  // YouTube Channel Embed feeds (Makkah Live and Madina Live official feeds)
  const [streamUrls, setStreamUrls] = useState({
    makkah: 'https://www.youtube.com/embed/live_stream?channel=UCE587uE6xy4bO1H9_U0441g',
    madina: 'https://www.youtube.com/embed/live_stream?channel=UC5m_S1kF3mQvH28GZ0t4O7g',
  });

  useEffect(() => {
    if (content.live_streams) {
      setStreamUrls({
        makkah: content.live_streams.makkah || streamUrls.makkah,
        madina: content.live_streams.madina || streamUrls.madina,
      });
    }
  }, [content]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Live Streams</Text>
        <View style={styles.placeholderWidth} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeStream === 'makkah' ? styles.activeTabBtn : null]}
          onPress={() => {
            setActiveStream('makkah');
            setLoading(true);
          }}
        >
          <Tv color={activeStream === 'makkah' ? Theme.colors.white : Theme.colors.textSecondary} size={18} />
          <Text style={[styles.tabBtnText, activeStream === 'makkah' ? styles.activeTabBtnText : null]}>
            Makkah Live
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeStream === 'madina' ? styles.activeTabBtn : null]}
          onPress={() => {
            setActiveStream('madina');
            setLoading(true);
          }}
        >
          <Tv color={activeStream === 'madina' ? Theme.colors.white : Theme.colors.textSecondary} size={18} />
          <Text style={[styles.tabBtnText, activeStream === 'madina' ? styles.activeTabBtnText : null]}>
            Madina Live
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Container */}
      <View style={styles.videoWrapper}>
        <WebView<{}>
          key={activeStream}
          style={styles.webView}
          source={{ uri: streamUrls[activeStream] }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          allowsFullscreenVideo
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loaderText}>Establishing live feed link...</Text>
          </View>
        ) : null}
      </View>

      {/* Warning/Info box */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Note on Live Feeds</Text>
        <Text style={styles.infoDesc}>
          Live streams are sourced directly from YouTube broadcasters. If a channel is temporarily offline or undergoing maintenance, the stream may take a moment to buffer or show as unavailable.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  placeholderWidth: {
    width: 40,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Theme.radius.sm,
    gap: 8,
  },
  activeTabBtn: {
    backgroundColor: Theme.colors.primary,
  },
  tabBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeTabBtnText: {
    color: Theme.colors.white,
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loaderBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    margin: 20,
    padding: 16,
    gap: 6,
  },
  infoTitle: {
    color: Theme.colors.accent,
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
