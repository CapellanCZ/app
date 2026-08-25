import { memo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native-gesture-handler';

import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { ROUTES } from '@/lib/routes';
import { androidPressProps } from '@/lib/ui/androidPress';

type Props = {
  size?: number;
  iconColor?: string;
  backgroundColor?: string;
  className?: string;
};

/**
 * Isolated bell so unread badge updates don’t re-render the surrounding header.
 * Visual size matches iOS; Android uses hitSlop for a larger tap area.
 */
export const NotificationBellButton = memo(function NotificationBellButton({
  size = 48,
  iconColor = '#090808',
  backgroundColor = '#FFFFFF',
  className,
}: Props) {
  const { push } = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={() => push(ROUTES.notifications)}
      className={className}
      {...androidPressProps({ borderless: true, hitSlop: 8 })}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        opacity: pressed ? 0.75 : 1,
      })}>
      <IconsaxNotificationIcon size={24} color={iconColor} />
      {hasUnread ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: size * 0.25,
            right: size * 0.25,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#EF4444',
          }}
        />
      ) : null}
    </Pressable>
  );
});
