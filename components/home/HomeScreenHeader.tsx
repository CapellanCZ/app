import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { GreyAvatar } from '@/components/profile/GreyAvatar';
import { useNotificationStore } from '@/lib/notifications/notificationStore';

const ICON_MUTED = '#1F2024';
const ROW_HEIGHT = 52;
const NOTIFICATION_SIZE = 48;
const AVATAR_SIZE = 52;

export type HomeScreenHeaderProps = {
  /** Large title (Figma: 32px semibold). */
  title?: string;
  avatarUrl?: string | null;
  userName?: string;
};

/**
 * Top bar: bold title + notification + profile (Figma CampusCare mobile pattern).
 * Fixed row height so badge / title length does not shift layout between screens.
 */
export function HomeScreenHeader({
  title = 'Home',
  avatarUrl,
  userName = '',
}: HomeScreenHeaderProps) {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.items.filter((n) => !n.read).length);

  return (
    <View
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
        style={{ flexShrink: 0 }}
        className="active:opacity-80">
        <GreyAvatar size={AVATAR_SIZE} name={userName} avatarUrl={avatarUrl} />
      </Pressable>
    </View>
  );
}
