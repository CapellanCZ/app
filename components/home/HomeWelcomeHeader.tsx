import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { GreyAvatar } from '@/components/profile/GreyAvatar';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { Inter } from '@/lib/typography/inter';

type Props = {
  userName: string;
  avatarUrl?: string | null;
};

/**
 * Figma home header: avatar + "Welcome back," + name · notification pill.
 */
export function HomeWelcomeHeader({ userName, avatarUrl }: Props) {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.items.filter((n) => !n.read).length);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push('/(tabs)/profiles')}
          style={{ flexShrink: 0 }}>
          <GreyAvatar size={48} name={userName} avatarUrl={avatarUrl} />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#727272',
              letterSpacing: -0.64,
              lineHeight: 20,
            }}>
            Welcome back,
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: Inter.medium,
              fontSize: 16,
              color: '#000000',
              letterSpacing: -1.28,
              lineHeight: 24,
            }}>
            {userName}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={() => router.push('/(tabs)/notification')}
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
        <IconsaxNotificationIcon size={24} color="#090808" />
        {unreadCount > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#EF4444',
            }}
          />
        ) : null}
      </Pressable>
    </View>
  );
}
