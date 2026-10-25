import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AnnouncementImageViewer } from '@/components/announcements/AnnouncementImageViewer';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { BRAND } from '@/lib/ui/theme';

type Props = {
  urls: string[];
  /** Accessibility label prefix, e.g. announcement title. */
  title?: string;
};

type ImageSize = { width: number; height: number };

const SIDE_PAD = 20;
const GAP = 12;
/** Fallback aspect while natural size loads (≈ 4:5 poster). */
const FALLBACK_ASPECT = 4 / 5;
const MIN_CARD_H = 160;
const MAX_CARD_H_RATIO = 0.55;

/** Card width stays full band; height follows the image’s real aspect (clamped). */
function cardHeightForAspect(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
): number {
  if (naturalW <= 0 || naturalH <= 0) {
    return Math.round(maxW / FALLBACK_ASPECT);
  }
  const aspect = naturalW / naturalH;
  const height = Math.round(maxW / aspect);
  return Math.min(maxH, Math.max(MIN_CARD_H, height));
}

/**
 * Multi-image campaign gallery — natural aspect cards, tap to open fullscreen viewer.
 */
export function AnnouncementGalleryCarousel({ urls, title }: Props) {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [sizes, setSizes] = useState<Record<string, ImageSize>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const maxCardW = Math.min(windowW - SIDE_PAD * 2, windowW * 0.9);
  const maxCardH = Math.round(windowH * MAX_CARD_H_RATIO);

  useEffect(() => {
    let cancelled = false;
    urls.forEach((uri) => {
      if (sizes[uri]) return;
      Image.getSize(
        uri,
        (width, height) => {
          if (cancelled) return;
          setSizes((prev) => (prev[uri] ? prev : { ...prev, [uri]: { width, height } }));
        },
        () => {
          if (cancelled) return;
          setSizes((prev) =>
            prev[uri] ? prev : { ...prev, [uri]: { width: 4, height: 5 } },
          );
        },
      );
    });
    return () => {
      cancelled = true;
    };
    // Only re-run when the URL list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sizes intentionally omitted
  }, [urls.join('|')]);

  const cardHeights = useMemo(
    () =>
      urls.map((uri) => {
        const natural = sizes[uri];
        return cardHeightForAspect(
          natural?.width ?? 4,
          natural?.height ?? 5,
          maxCardW,
          maxCardH,
        );
      }),
    [urls, sizes, maxCardW, maxCardH],
  );

  const snapInterval = maxCardW + GAP;

  if (urls.length === 0) return null;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
    setIndex(Math.max(0, Math.min(urls.length - 1, next)));
  };

  const openViewer = (i: number) => {
    setViewerIndex(i);
    setViewerOpen(true);
  };

  const countLabel = urls.length === 1 ? '1 image' : `${urls.length} images`;

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingHorizontal: SIDE_PAD,
        }}>
        <Text
          style={{
            fontFamily: Inter.semiBold,
            fontSize: 16,
            color: '#111827',
            letterSpacing: -0.4,
          }}>
          Campaign gallery
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 13,
            color: '#9CA3AF',
            letterSpacing: -0.2,
          }}>
          {countLabel}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PAD,
          gap: GAP,
          alignItems: 'center',
        }}>
        {urls.map((uri, i) => {
          const height =
            cardHeights[i] ?? Math.round(maxCardW / FALLBACK_ASPECT);
          return (
            <Pressable
              key={`${uri}-${i}`}
              accessibilityRole="imagebutton"
              accessibilityLabel={
                title
                  ? `${title}, image ${i + 1} of ${urls.length}. Opens full view.`
                  : `Image ${i + 1}. Opens full view.`
              }
              accessibilityHint="Opens the image in full screen"
              onPress={() => openViewer(i)}
              {...androidPressProps()}
              style={({ pressed }) => ({
                width: maxCardW,
                height,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#F3F4F6',
                opacity: pressed ? 0.92 : 1,
              })}>
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {urls.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingTop: 2,
          }}>
          {urls.map((_, i) => {
            const active = i === index;
            return (
              <View
                key={`dot-${i}`}
                style={{
                  width: active ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: active ? BRAND.primary : '#D1D5DB',
                }}
              />
            );
          })}
        </View>
      ) : null}

      <AnnouncementImageViewer
        visible={viewerOpen}
        urls={urls}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}
