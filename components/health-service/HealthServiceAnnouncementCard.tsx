import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AnnouncementCardSkeleton } from '@/components/health-service/AnnouncementCardSkeleton';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { formatDateLabel, limitSentences } from '@/lib/announcements/announcementsApi';
import type { Announcement } from '@/lib/announcements/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const AUTO_MS = 5500;
/** Figma image frame aspect (306×204). */
const IMAGE_ASPECT = 306 / 204;

/** Soft ambient shadow — Android elevation is too hard against #F9F9F9. */
const CARD_SOFT_SHADOW: ViewStyle =
  Platform.OS === 'android'
    ? {
        elevation: 0,
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      };

/** Fixed copy block so slides never resize with shorter/longer text. */
const DATE_LINE_HEIGHT = 16;
const TITLE_LINE_HEIGHT = 22;
const BODY_LINE_HEIGHT = 19;
const BODY_LINES = 3;
const BODY_BLOCK_HEIGHT = BODY_LINE_HEIGHT * BODY_LINES;
const FOOTER_HEIGHT = 20;

type SlideProps = {
  item: Announcement;
  width: number;
  index: number;
  total: number;
  onReadMore: (item: Announcement) => void;
};

/** Soft title case for ALL-CAPS admin titles → "World Hepatitis Day". */
function displayTitle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function AnnouncementSlide({ item, width, index, total, onReadMore }: SlideProps) {
  const dateLabel = formatDateLabel(item.publishedAt);
  const title = displayTitle(item.title);
  const previewBody = limitSentences(item.body ?? '');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. Read more`}
      accessibilityHint="Opens the full announcement"
      onPress={() => onReadMore(item)}
      {...androidPressProps({ hitSlop: 0 })}
      style={({ pressed }) => ({
        width,
        backgroundColor: '#FFFFFF',
        opacity: pressed ? 0.92 : 1,
      })}>
      {/* Hero — full poster visible (contain), Figma 2240:291 */}
      <View
        style={{
          marginHorizontal: 2,
          marginTop: 2,
          borderRadius: 16,
          overflow: 'hidden',
          aspectRatio: IMAGE_ASPECT,
          backgroundColor: '#FFFFFF',
        }}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            accessibilityLabel={title}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
            <Text style={{ fontFamily: Inter.regular, fontSize: 12, color: '#9CA3AF' }}>
              CampusCare
            </Text>
          </View>
        )}

        {/* Soft inset fade at bottom of image (Figma inset shadow) */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
          locations={[0.35, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 48,
          }}
        />
      </View>

      {/* Copy + footer — fixed heights so card size never jumps */}
      <View
        style={{
          padding: 20,
          gap: 10,
        }}>
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 12,
              color: '#848282',
              letterSpacing: -0.4,
              height: DATE_LINE_HEIGHT,
              lineHeight: DATE_LINE_HEIGHT,
            }}
            numberOfLines={1}>
            {dateLabel || ' '}
          </Text>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 18,
              color: '#212121',
              letterSpacing: -1.28,
              height: TITLE_LINE_HEIGHT,
              lineHeight: TITLE_LINE_HEIGHT,
            }}
            numberOfLines={1}>
            {title || ' '}
          </Text>
        </View>

        <View style={{ gap: 18 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 14,
              color: '#4A4A4A',
              letterSpacing: -0.48,
              height: BODY_BLOCK_HEIGHT,
              lineHeight: BODY_LINE_HEIGHT,
            }}
            numberOfLines={BODY_LINES}>
            {previewBody || ' '}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: FOOTER_HEIGHT,
            }}>
            {/* Visual affordance only — whole card opens the announcement */}
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 14,
                color: '#6BAED6',
                letterSpacing: -0.48,
              }}>
              Read More →
            </Text>

            <View
              pointerEvents="none"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: i === index ? '#0D0D0D' : '#D9D9D9',
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Home announcement carousel — Figma node 2240:286.
 * Shows skeleton while the shared store fetch is in flight (prefetch starts on Home).
 */
export function HealthServiceAnnouncementCard() {
  const { patient } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  const items = useAnnouncementStore((s) => s.items);
  const hasLoaded = useAnnouncementStore((s) => s.hasLoaded);
  const load = useAnnouncementStore((s) => s.load);

  // Kick off / continue fetch immediately on mount (overlaps with skeleton paint).
  useEffect(() => {
    void load({ patientType: patient?.patient_type });
  }, [load, patient?.patient_type]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
  }, [items]);

  useEffect(() => {
    if (width <= 0 || items.length <= 1) return;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % items.length;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [width, items.length]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const i = Math.min(
        items.length - 1,
        Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width)),
      );
      indexRef.current = i;
      setIndex(i);
    },
    [width, items.length],
  );

  const onReadMore = useCallback((item: Announcement) => {
    Alert.alert(displayTitle(item.title), item.body?.trim() || 'No additional details.', [
      { text: 'OK' },
    ]);
  }, []);

  if (!hasLoaded) {
    return <AnnouncementCardSkeleton />;
  }

  if (items.length === 0) {
    return (
      <View
        style={{
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          padding: 20,
          ...CARD_SOFT_SHADOW,
        }}>
        <Text style={{ fontFamily: Inter.regular, fontSize: 13, color: '#6C6C6C' }}>
          No announcements right now. Check back soon.
        </Text>
      </View>
    );
  }

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - width) > 1) setWidth(w);
      }}
      style={{
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        ...CARD_SOFT_SHADOW,
      }}>
      {/* Inner clip so soft shadow isn’t cut off by overflow:hidden */}
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        {width > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumScrollEnd}
            keyboardShouldPersistTaps="handled">
            {items.map((item) => (
              <AnnouncementSlide
                key={item.id}
                item={item}
                width={width}
                index={index}
                total={items.length}
                onReadMore={onReadMore}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
