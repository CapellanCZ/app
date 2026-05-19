import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { useNotificationStore } from '@/lib/notifications/notificationStore';

import profileCirclePlaceholder from '@/assets/profile-circle.png';

const ICON_MUTED = '#1F2024';
const ROW_HEIGHT = 52;
const NOTIFICATION_SIZE = 48;
const AVATAR_SIZE = 52;

export type HomeScreenHeaderProps = {
  /** Large title (Figma: 32px semibold). */
  title?: string;
  avatarUrl?: string | null;
};

/**
 * Top bar: bold title + notification + profile (Figma CampusCare mobile pattern).
 * Fixed row height so badge / title length does not shift layout between screens.
 */
export function HomeScreenHeader({ title = 'Home', avatarUrl }: HomeScreenHeaderProps) {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.items.filter((n) => !n.read).length);

  return (
    <View
<<<<<<< HEAD
      style={{
        height: ROW_HEIGHT,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 32,
          fontWeight: '600',
          color: '#000000',
          letterSpacing: -1.28,
          lineHeight: 38,
          includeFontPadding: false,
        }}>
        {title}
      </Text>

      <Pressable
        accessibilityLabel="Notifications"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.push('/(tabs)/notification')}
        style={{
          width: NOTIFICATION_SIZE,
          height: NOTIFICATION_SIZE,
          borderRadius: NOTIFICATION_SIZE / 2,
          backgroundColor: '#FDFDFD',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        className="active:opacity-70">
        <IconsaxNotificationIcon size={24} color={ICON_MUTED} />
        {unreadCount > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 11,
              right: 11,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#EF4444',
            }}
          />
        ) : null}
      </Pressable>

      <Pressable
        accessibilityLabel="Profile"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.push('/(tabs)/profiles')}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          overflow: 'hidden',
          flexShrink: 0,
        }}
        className="active:opacity-80">
        <Image
          source={avatarUrl ? { uri: avatarUrl } : profileCirclePlaceholder}
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Pressable>
=======
      className="w-full flex-row items-center justify-between pb-2 pl-1"
      style={{ paddingTop: Math.max(8) }}>
      <Text className="text-[32px] font-bold leading-9 text-[#1F2024]">{title}</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          hitSlop={10}
          className="size-11 items-center justify-center rounded-full bg-white border border-black/5"
          onPress={() => router.push('/(tabs)/notification')}>
          <IconsaxNotificationIcon size={22} color={ICON_MUTED} />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 10 ,
                right: 12,
                minWidth: 8,
                height: 8,
                borderRadius: 8,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}>
            </View>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.push('/(tabs)/profiles')}
          style={{ width: 44, height: 44, borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF' }}>
          <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : profileCirclePlaceholder}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </View>
        </Pressable>
      </View>
>>>>>>> 26a0c50e4d510725d1d3fffd83ea8ce0bbb9abf7
    </View>
  );
}
