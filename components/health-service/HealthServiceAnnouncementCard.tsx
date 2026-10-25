import { useCallback, useEffect } from 'react';
import {
  Image,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AnnouncementCardSkeleton } from '@/components/health-service/AnnouncementCardSkeleton';
import { useAuth } from '@/lib/auth/AuthProvider';
import { displayAnnouncementTitle } from '@/lib/announcements/announcementDisplay';
import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import { formatDateLabel, limitSentences } from '@/lib/announcements/announcementsApi';
import type { Announcement } from '@/lib/announcements/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { BRAND } from '@/lib/ui/theme';
import { ROUTES } from '@/lib/routes';

const THUMB_SIZE = 88;
const THUMB_RADIUS = 12;
const PREVIEW_SENTENCES = 2;

const CARD_SOFT_SHADOW: ViewStyle =
  Platform.OS === 'android'
    ? {
        elevation: 0,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      };

function audienceLabel(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  if (!t) return 'All';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

type RowProps = {
  item: Announcement;
  onPress: (item: Announcement) => void;
};

function AnnouncementListRow({ item, onPress }: RowProps) {
  const dateLabel = formatDateLabel(item.publishedAt);
  const title = displayAnnouncementTitle(item.title);
  const previewBody = limitSentences(item.body ?? '', PREVIEW_SENTENCES);
  const audience = audienceLabel(item.audience);
  const meta = [audience, dateLabel].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${meta}`}
      accessibilityHint="Opens the full announcement"
      onPress={() => onPress(item)}
      {...androidPressProps({ hitSlop: 0 })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ECECEC',
        padding: 12,
        opacity: pressed ? 0.92 : 1,
        ...CARD_SOFT_SHADOW,
      })}>
      <View
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_RADIUS,
          overflow: 'hidden',
          backgroundColor: BRAND.soft,
          flexShrink: 0,
        }}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel={title}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
              backgroundColor: BRAND.soft,
            }}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 11,
                color: BRAND.primary,
                textAlign: 'center',
              }}
              numberOfLines={2}>
              CampusCare
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 4, paddingTop: 2 }}>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#848282',
            letterSpacing: -0.2,
          }}
          numberOfLines={1}>
          {meta || ' '}
        </Text>
        <Text
          style={{
            fontFamily: Inter.semiBold,
            fontSize: 16,
            color: '#212121',
            letterSpacing: -0.6,
            lineHeight: 20,
          }}
          numberOfLines={2}>
          {title || 'Announcement'}
        </Text>
        {previewBody ? (
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 13,
              color: '#4A4A4A',
              letterSpacing: -0.2,
              lineHeight: 18,
            }}
            numberOfLines={2}>
            {previewBody}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Home announcements — poster thumbnail list (audience · date, title, preview).
 */
export function HealthServiceAnnouncementCard() {
  const { patient } = useAuth();
  const router = useRouter();

  const items = useAnnouncementStore((s) => s.items);
  const hasLoaded = useAnnouncementStore((s) => s.hasLoaded);
  const load = useAnnouncementStore((s) => s.load);

  useEffect(() => {
    void load({ patientType: patient?.patient_type });
  }, [load, patient?.patient_type]);

  const onOpen = useCallback(
    (item: Announcement) => {
      router.push(`${ROUTES.announcement}/${item.id}` as never);
    },
    [router],
  );

  if (!hasLoaded) {
    return <AnnouncementCardSkeleton />;
  }

  if (items.length === 0) {
    return (
      <View
        style={{
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#ECECEC',
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
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <AnnouncementListRow key={item.id} item={item} onPress={onOpen} />
      ))}
    </View>
  );
}
