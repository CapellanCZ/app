import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AnnouncementDetailBody } from '@/components/announcements/AnnouncementDetailBody';
import { AnnouncementGalleryCarousel } from '@/components/announcements/AnnouncementGalleryCarousel';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { PlainLogoIcon } from '@/components/icons/PlainLogoIcon';
import { displayAnnouncementTitle } from '@/lib/announcements/announcementDisplay';
import type { Announcement } from '@/lib/announcements/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { BRAND } from '@/lib/ui/theme';
import { ROUTES } from '@/lib/routes';

type Props = {
  announcement: Announcement;
};

/**
 * Full announcement detail — matches CampusCare announcement design (multi-image gallery).
 */
export function AnnouncementDetailView({ announcement }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const title = displayAnnouncementTitle(announcement.title) || 'Announcement';
  const images = announcement.imageUrls?.length
    ? announcement.imageUrls
    : announcement.imageUrl
      ? [announcement.imageUrl]
      : [];

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.home);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Centered nav — back | Announcements | spacer */}
      <View
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: '#ECECEC',
          backgroundColor: '#FFFFFF',
        }}>
        <View
          style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            {...androidPressProps({ borderless: true, hitSlop: 8 })}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              zIndex: 2,
            })}>
            <IconsaxArrowLeftIcon color="#181D27" size={22} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: Inter.semiBold,
                fontSize: 17,
                color: '#181D27',
                letterSpacing: -0.3,
              }}>
              Announcements
            </Text>
          </View>
          {/* Balance the back button so the title stays visually centered */}
          <View style={{ width: 44, height: 44 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          gap: 20,
        }}>
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 26,
              lineHeight: 32,
              color: '#111827',
              letterSpacing: -0.8,
            }}>
            {title}
          </Text>

          {/* Publisher */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: BRAND.soft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <PlainLogoIcon width={26} height={20} color={BRAND.primary} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text
                style={{
                  fontFamily: Inter.semiBold,
                  fontSize: 14,
                  color: '#111827',
                  letterSpacing: -0.3,
                }}>
                NU Dasmariñas
              </Text>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 12,
                  color: '#9CA3AF',
                  letterSpacing: -0.15,
                }}>
                Health Services Office
              </Text>
            </View>
          </View>

          <AnnouncementDetailBody body={announcement.body} />
        </View>

        {images.length > 0 ? (
          <AnnouncementGalleryCarousel urls={images} title={title} />
        ) : null}
      </ScrollView>
    </View>
  );
}
