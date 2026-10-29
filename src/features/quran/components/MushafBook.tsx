// Book-style (Mushaf) reader: continuous Arabic text laid out into fixed pages you swipe through
// right-to-left like a printed Quran. Pages are computed by measuring the real text layout once
// (onTextLayout) and packing whole lines into pages, so nothing is cut off mid-line.
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TextLayoutEventData, View, useWindowDimensions } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { BrutalPressable, haptic } from '../../../core/components/ui';
import { brutal } from '../../../core/theme/palettes';

export interface BookAyah {
  number: number;
  numberInSurah: number;
  textAr: string;
  surahName?: string;
  surahNumber?: number;
}

export interface BookTheme {
  bg: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  border: string;
}

interface Props<T extends BookAyah = BookAyah> {
  ayahs: T[];
  theme: BookTheme;
  fontSize: number;
  /** Outline + hard-shadow colour */
  ink: string;
  /** Used when ayahs don't carry their own surah info (surah mode) */
  fallbackSurahNumber?: number;
  fallbackSurahName?: string;
  /** e.g. "Para 3" / "Surah 2" — shown in the page header */
  contextLabel: string;
  playingAyahId: number | null;
  /** Ayah (global number) to open on; ignored when openAtEnd is set */
  initialAyahNumber?: number | null;
  openAtEnd?: boolean;
  bottomInset: number;
  hasNextSection: boolean;
  hasPrevSection: boolean;
  onAyahPress: (ayah: T) => void;
  /** Fires when the reader settles on a page, with the first ayah on it */
  onPageSettled?: (firstAyah: T) => void;
  onNextSection: () => void;
  onPrevSection: () => void;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[+d]);

const PAGE_MARGIN_H = 12;
const PAGE_MARGIN_TOP = 10;
const PAGE_SHADOW = brutal.shadow;
const OUTER_BORDER = brutal.border;
const INNER_BORDER = 1.5;
const FRAME_GAP = 5;
const INNER_PAD_H = 14;
const INNER_PAD_V = 8;
const HEADER_H = 26;
const FOOTER_H = 24;
const NAV_BAR_H = 48;
const BANNER_H = 96;
const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
const STICKER = '#F6E2B6';
const STICKER_INK = '#1C1A17';

/** Rough "is this a dark surface" check for picking readable highlight colours. */
const isDarkColor = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
};

interface AyahRange { ayah: BookAyah; start: number; markerStart: number; end: number }
interface Block { surahNumber?: number; surahName?: string; banner: boolean; text: string; ranges: AyahRange[] }
interface Segment { block: number; banner: boolean; start: number; end: number }
interface Page { segments: Segment[]; firstAyah: BookAyah; ayahNumbers: Set<number> }

/** The API puts the Bismillah inside ayah 1 of most surahs; the banner already shows it. */
function stripBismillah(ayah: BookAyah, surahNumber?: number) {
  if (ayah.numberInSurah !== 1 || surahNumber === 1 || surahNumber === 9) return ayah.textAr;
  const words = ayah.textAr.split(' ');
  return words[0]?.startsWith('بِسْمِ') && words.length > 4 ? words.slice(4).join(' ') : ayah.textAr;
}

function buildBlocks(ayahs: BookAyah[], fallbackNumber?: number, fallbackName?: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const ayah of ayahs) {
    const surahNumber = ayah.surahNumber ?? fallbackNumber;
    if (!current || current.surahNumber !== surahNumber) {
      current = { surahNumber, surahName: ayah.surahName ?? fallbackName, banner: ayah.numberInSurah === 1, text: '', ranges: [] };
      blocks.push(current);
    }
    const start = current.text.length;
    current.text += stripBismillah(ayah, surahNumber);
    const markerStart = current.text.length;
    current.text += ` ﴿${toArabicDigits(ayah.numberInSurah)}﴾ `;
    current.ranges.push({ ayah, start, markerStart, end: current.text.length });
  }
  return blocks;
}

type MeasuredLine = { length: number; height: number };

function paginate(blocks: Block[], lines: MeasuredLine[][], available: number): Page[] {
  const pages: Page[] = [];
  let segments: Segment[] = [];
  let used = 0;
  const flush = () => {
    if (!segments.length) return;
    const ayahNumbers = new Set<number>();
    let firstAyah: BookAyah | undefined;
    for (const seg of segments) {
      for (const r of blocks[seg.block].ranges) {
        if (r.end > seg.start && r.start < seg.end) {
          ayahNumbers.add(r.ayah.number);
          firstAyah ??= r.ayah;
        }
      }
    }
    if (firstAyah) pages.push({ segments, firstAyah, ayahNumbers });
    segments = [];
    used = 0;
  };

  blocks.forEach((block, b) => {
    const blockLines = lines[b];
    let offset = 0;
    let seg: Segment | null = null;
    const firstLineH = blockLines[0]?.height ?? 0;
    // Keep a banner together with at least the first line of its surah
    if (block.banner && used > 0 && used + BANNER_H + firstLineH > available) flush();
    if (block.banner) used += BANNER_H;
    blockLines.forEach((line, i) => {
      if (used > 0 && used + line.height > available && seg) {
        flush();
        seg = null;
      }
      if (!seg) {
        seg = { block: b, banner: block.banner && i === 0, start: offset, end: offset };
        segments.push(seg);
      }
      offset += line.length;
      // Last line always runs to the end so no characters are lost if lengths disagree
      seg.end = i === blockLines.length - 1 ? block.text.length : offset;
      used += line.height;
    });
  });
  flush();
  return pages;
}

/** Flat pastel surah header with a thick ink outline (fixed height; pagination reserves BANNER_H). */
function SurahBanner({ name, number, ink }: { name?: string; number?: number; ink: string }) {
  const showBismillah = number !== 1 && number !== 9;
  return (
    <View style={[styles.banner, { borderColor: ink, backgroundColor: STICKER }]}>
      <View style={[styles.bannerInner, { borderColor: ink }]}>
        <Text style={[styles.bannerName, { color: STICKER_INK }]} numberOfLines={1}>
          {name ? `سورة ${name}` : 'سورة'}
          <Text style={[styles.bannerNum, { color: STICKER_INK }]}>{number ? `  ·  ${name ?? ''} ${number}` : ''}</Text>
        </Text>
        {showBismillah && <Text style={[styles.bismillah, { color: STICKER_INK }]}>{BISMILLAH}</Text>}
      </View>
    </View>
  );
}

const BookPage = memo(function BookPage({
  page, index, blocks, textStyle, theme, ink, markerColor, highlight, playingAyahId, contextLabel, width, scrollX, onAyahPress,
}: {
  page: Page; index: number; blocks: Block[]; textStyle: object; theme: BookTheme; ink: string; markerColor: string; highlight: string;
  playingAyahId: number | null; contextLabel: string; width: number; scrollX: SharedValue<number>; onAyahPress: (a: BookAyah) => void;
}) {
  // Pages slide over each other with a slight sink + shade, like turning a leaf
  const turnStyle = useAnimatedStyle(() => {
    const p = (scrollX.value - index * width) / width;
    return { transform: [{ scale: interpolate(Math.abs(p), [0, 1], [1, 0.93], 'clamp') }] };
  });
  const shadeStyle = useAnimatedStyle(() => {
    const p = Math.abs((scrollX.value - index * width) / width);
    return { opacity: interpolate(p, [0, 1], [0, 0.35], 'clamp') };
  });

  const head = page.firstAyah;
  const headSurah = blocks[page.segments[0].block];
  return (
    <View style={{ width, flex: 1 }}>
      <Animated.View style={[styles.paperFrame, turnStyle]}>
        {/* Hard offset shadow behind the page */}
        <View pointerEvents="none" style={[styles.paperShadow, { backgroundColor: ink }]} />
        <View style={[styles.paperOuter, { backgroundColor: theme.cardBg, borderColor: ink }]}>
        <View style={[styles.paperInner, { borderColor: theme.border }]}>
          {/* Flat spine strip on the binding side */}
          <View pointerEvents="none" style={[styles.spine, index % 2 ? styles.spineLeft : styles.spineRight, { backgroundColor: theme.border }]} />
          <View style={styles.pageHeader}>
            <Text style={[styles.pageHeaderText, { color: theme.textSecondary }]} numberOfLines={1}>
              {headSurah.surahName ?? head.surahName ?? ''}
            </Text>
            <Text style={[styles.pageHeaderText, { color: theme.textSecondary }]}>{contextLabel}</Text>
          </View>
          <View style={[styles.headerRule, { backgroundColor: theme.border }]} />

          {/* ScrollView only as a safety net: measured pages normally fit exactly and don't scroll */}
          <ScrollView style={styles.pageBody} contentContainerStyle={styles.pageBodyContent} showsVerticalScrollIndicator={false} bounces={false} nestedScrollEnabled>
            {page.segments.map((seg, i) => {
              const block = blocks[seg.block];
              return (
                <View key={i}>
                  {seg.banner && <SurahBanner name={block.surahName} number={block.surahNumber} ink={ink} />}
                  <Text style={textStyle}>
                    {block.ranges.filter((r) => r.end > seg.start && r.start < seg.end).map((r) => {
                      const playing = r.ayah.number === playingAyahId;
                      const from = Math.max(r.start, seg.start);
                      const to = Math.min(r.end, seg.end);
                      const markerFrom = Math.max(r.markerStart, from);
                      return (
                        <Text key={r.ayah.number} onPress={() => onAyahPress(r.ayah)} style={playing ? { backgroundColor: highlight } : undefined}>
                          {markerFrom > from ? block.text.slice(from, markerFrom) : ''}
                          {to > markerFrom ? <Text style={{ color: markerColor }}>{block.text.slice(markerFrom, to)}</Text> : null}
                        </Text>
                      );
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.pageFooter}>
            <Text style={[styles.pageNumber, { color: theme.textSecondary }]}>﴾ {toArabicDigits(index + 1)} ﴿</Text>
          </View>
        </View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade, shadeStyle]} />
        </View>
      </Animated.View>
    </View>
  );
});

function MushafBookImpl(props: Props) {
  const {
    ayahs, theme, fontSize, ink, fallbackSurahNumber, fallbackSurahName, contextLabel,
    playingAyahId, initialAyahNumber, openAtEnd, bottomInset, hasNextSection, hasPrevSection,
  } = props;
  const { width } = useWindowDimensions();
  const [areaHeight, setAreaHeight] = useState(0);
  const [measured, setMeasured] = useState<{ sig: string; lines: Record<number, MeasuredLine[]> }>({ sig: '', lines: {} });
  const [pageIndex, setPageIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Latest callbacks without re-rendering pages when the parent re-creates them
  const cb = useRef(props);
  cb.current = props;
  const onAyahPress = useCallback((a: BookAyah) => cb.current.onAyahPress(a), []);

  const blocks = useMemo(() => buildBlocks(ayahs, fallbackSurahNumber, fallbackSurahName), [ayahs, fallbackSurahNumber, fallbackSurahName]);
  const lineHeight = Math.round(fontSize * 1.9);
  const textStyle = useMemo(() => ({
    fontFamily: 'Georgia', fontSize, lineHeight, color: theme.text, textAlign: 'justify' as const, writingDirection: 'rtl' as const,
  }), [fontSize, lineHeight, theme.text]);

  const darkPaper = isDarkColor(theme.cardBg);
  const markerColor = darkPaper ? '#E8B65A' : '#A86F12';
  const highlight = darkPaper ? '#4A3F2A' : STICKER;

  // Must mirror the paper styles below: margins (+ shadow on the right), outer/inner borders, gaps, padding
  const textWidth = width - 2 * PAGE_MARGIN_H - PAGE_SHADOW - 2 * (OUTER_BORDER + FRAME_GAP + INNER_BORDER + INNER_PAD_H);
  const textHeight = areaHeight - PAGE_MARGIN_TOP - NAV_BAR_H - bottomInset - 2 * (OUTER_BORDER + FRAME_GAP + INNER_BORDER) - HEADER_H - FOOTER_H - 2 * INNER_PAD_V - 1;

  // Measurements are only valid for the text, size and width they were taken with
  const sig = `${fontSize}|${textWidth}|${blocks.map((b) => b.text.length).join(',')}`;
  const lines = measured.sig === sig ? measured.lines : {};
  const allMeasured = blocks.length > 0 && blocks.every((_, i) => lines[i]);
  const pages = useMemo(
    () => (allMeasured && textHeight > lineHeight ? paginate(blocks, blocks.map((_, i) => lines[i]), textHeight) : []),
    [allMeasured, blocks, measured, textHeight, lineHeight], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Open on the requested page once pages exist
  const opened = useRef(false);
  const anchorAyah = useRef<number | null>(null);
  useEffect(() => {
    if (!pages.length || opened.current) return;
    opened.current = true;
    let target = 0;
    if (openAtEnd) target = pages.length - 1;
    else if (initialAyahNumber != null) target = Math.max(0, pages.findIndex((p) => p.ayahNumbers.has(initialAyahNumber)));
    setPageIndex(target);
    anchorAyah.current = pages[target].firstAyah.number;
    if (target > 0) requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: target, animated: false }));
  }, [pages, openAtEnd, initialAyahNumber]);

  // Text size changes repaginate: keep the reader near the same ayah
  useEffect(() => {
    if (!pages.length || !opened.current || anchorAyah.current == null) return;
    const target = Math.max(0, pages.findIndex((p) => p.ayahNumbers.has(anchorAyah.current!)));
    setPageIndex(target);
    requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: target, animated: false }));
  }, [pages]);

  // Follow the recitation onto the next page
  useEffect(() => {
    if (playingAyahId == null || !pages.length) return;
    const target = pages.findIndex((p) => p.ayahNumbers.has(playingAyahId));
    if (target >= 0 && target !== pageIndex) {
      setPageIndex(target);
      anchorAyah.current = pages[target].firstAyah.number;
      listRef.current?.scrollToIndex({ index: target, animated: true });
    }
  }, [playingAyahId, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollHandler = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx === pageIndex || !pages[idx]) return;
    haptic.select();
    setPageIndex(idx);
    anchorAyah.current = pages[idx].firstAyah.number;
    cb.current.onPageSettled?.(pages[idx].firstAyah);
  };

  const turn = (dir: 1 | -1) => {
    const target = pageIndex + dir;
    if (target < 0) return cb.current.onPrevSection();
    if (target >= pages.length) return cb.current.onNextSection();
    setPageIndex(target);
    anchorAyah.current = pages[target].firstAyah.number;
    cb.current.onPageSettled?.(pages[target].firstAyah);
    listRef.current?.scrollToIndex({ index: target, animated: true });
  };

  const onMeasure = (i: number) => (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const measuredLines = e.nativeEvent.lines.map((l) => ({ length: l.text.length, height: l.height || lineHeight }));
    setMeasured((m) => (m.sig === sig ? { sig, lines: { ...m.lines, [i]: measuredLines } } : { sig, lines: { [i]: measuredLines } }));
  };

  const renderPage = useCallback(({ item, index }: { item: Page; index: number }) => (
    <BookPage
      page={item} index={index} blocks={blocks} textStyle={textStyle} theme={theme} ink={ink} markerColor={markerColor} highlight={highlight}
      playingAyahId={item.ayahNumbers.has(playingAyahId ?? -1) ? playingAyahId : null}
      contextLabel={contextLabel} width={width} scrollX={scrollX} onAyahPress={onAyahPress}
    />
  ), [blocks, textStyle, theme, ink, markerColor, highlight, playingAyahId, contextLabel, width, scrollX, onAyahPress]);

  const canNext = pageIndex < pages.length - 1 || hasNextSection;
  const canPrev = pageIndex > 0 || hasPrevSection;

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setAreaHeight(e.nativeEvent.layout.height)}>
      {/* Invisible measuring pass: same width + style as a real page */}
      {!allMeasured && textWidth > 0 && (
        <View pointerEvents="none" style={[styles.measure, { width: textWidth }]}>
          {blocks.map((b, i) => <Text key={`${i}-${sig}`} style={textStyle} onTextLayout={onMeasure(i)}>{b.text}</Text>)}
        </View>
      )}

      {pages.length > 0 && (
        <Animated.FlatList
          ref={listRef as any}
          data={pages}
          renderItem={renderPage}
          keyExtractor={(_, i) => String(i)}
          horizontal
          inverted
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          initialNumToRender={2}
          windowSize={5}
          maxToRenderPerBatch={2}
          style={{ marginBottom: bottomInset }}
        />
      )}

      {pages.length > 0 && (
        <View style={[styles.navBar, { bottom: bottomInset }]}>
          {/* RTL book: the next page is on the left */}
          {/* Opacity on a wrapper so the hard shadow fades with the button */}
          <View style={{ opacity: canNext ? 1 : 0.35 }}>
          <BrutalPressable disabled={!canNext} onPress={() => turn(1)} fill={theme.cardBg} radius={13} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.navBtn}>
            <ChevronLeft color={theme.text} size={20} strokeWidth={2.8} />
          </BrutalPressable>
          </View>
          <Text style={[styles.navText, { color: theme.textSecondary }]}>
            Page {pageIndex + 1} of {pages.length}
            {pageIndex === pages.length - 1 && hasNextSection ? '  ·  tap ‹ for next' : ''}
          </Text>
          <View style={{ opacity: canPrev ? 1 : 0.35 }}>
          <BrutalPressable disabled={!canPrev} onPress={() => turn(-1)} fill={theme.cardBg} radius={13} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.navBtn}>
            <ChevronRight color={theme.text} size={20} strokeWidth={2.8} />
          </BrutalPressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  measure: { position: 'absolute', top: 0, left: 0, opacity: 0 },
  paperFrame: {
    flex: 1,
    marginLeft: PAGE_MARGIN_H,
    marginRight: PAGE_MARGIN_H + PAGE_SHADOW,
    marginTop: PAGE_MARGIN_TOP,
    marginBottom: NAV_BAR_H,
  },
  paperShadow: { position: 'absolute', top: PAGE_SHADOW, left: PAGE_SHADOW, right: -PAGE_SHADOW, bottom: -PAGE_SHADOW, borderRadius: 16 },
  paperOuter: {
    flex: 1,
    borderWidth: OUTER_BORDER,
    borderRadius: 16,
    padding: FRAME_GAP,
    overflow: 'hidden',
  },
  paperInner: { flex: 1, borderWidth: INNER_BORDER, borderRadius: 11, paddingHorizontal: INNER_PAD_H, paddingVertical: INNER_PAD_V },
  spine: { position: 'absolute', top: 0, bottom: 0, width: 3 },
  spineLeft: { left: 0 },
  spineRight: { right: 0 },
  shade: { backgroundColor: '#000', borderRadius: 16 },
  pageHeader: { height: HEADER_H - 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageHeaderText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6, maxWidth: '60%', textTransform: 'uppercase' },
  headerRule: { height: 1 },
  pageBody: { flex: 1 },
  pageBodyContent: { flexGrow: 1 },
  pageFooter: { height: FOOTER_H, alignItems: 'center', justifyContent: 'flex-end' },
  pageNumber: { fontSize: 13, fontFamily: 'Georgia', fontWeight: '700' },
  banner: { height: BANNER_H - 8, marginVertical: 4, borderWidth: brutal.border, borderRadius: 14, padding: 3 },
  bannerInner: { flex: 1, borderWidth: 1.5, borderRadius: 10, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  bannerName: { fontSize: 19, fontFamily: 'Georgia', fontWeight: '700', textAlign: 'center' },
  bannerNum: { fontSize: 11, fontWeight: '900', fontFamily: undefined },
  bismillah: { fontSize: 18, fontFamily: 'Georgia', marginTop: 4, textAlign: 'center' },
  navBar: { position: 'absolute', left: 16, right: 16, height: NAV_BAR_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 12, fontWeight: '900' },
});

/** Callbacks receive the same ayah objects that were passed in. */
export const MushafBook = memo(MushafBookImpl) as <T extends BookAyah>(props: Props<T>) => React.JSX.Element;
