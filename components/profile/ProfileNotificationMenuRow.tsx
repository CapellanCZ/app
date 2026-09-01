import { Pressable, Text, View } from 'react-native';

import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { IconsaxNotificationIcon } from '@/components/icons/IconsaxNotificationIcon';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const ICON_BG = '#EAF5FC';
const ICON_COLOR = '#6BAED6';
const BADGE_BG = '#EF4444';

type Props = {
  onPress: () => void;
};

/**
 * Profile Account row — notifications inbox with unread badge + soft icon badge.
 */
export function ProfileNotificationMenuRow({ onPress }: Props) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      {...androidPressProps({ hitSlop: 2 })}
      style={({ pressed }) => ({
        opacity: pressed ? 0.88 : 1,
        overflow: 'hidden',
        borderRadius: 16,
      })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: 72,
          gap: 14,
        }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: ICON_BG,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <IconsaxNotificationIcon size={22} color={ICON_COLOR} />
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: Inter.medium,
              fontSize: 16,
              letterSpacing: -0.64,
              lineHeight: 22,
              color: '#222222',
            }}>
            Notifications
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: Inter.regular,
              fontSize: 13,
              letterSpacing: -0.2,
              lineHeight: 18,
              color: '#727272',
            }}>
            {unreadCount > 0
              ? `${unreadCount} unread · appointments & campus updates`
              : 'Appointments, health alerts & campus updates'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {unreadCount > 0 ? (
            <View
              style={{
                minWidth: 22,
                height: 22,
                paddingHorizontal: 6,
                borderRadius: 999,
                backgroundColor: BADGE_BG,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: Inter.semiBold,
                  fontSize: 11,
                  lineHeight: 14,
                  color: '#FFFFFF',
                  letterSpacing: -0.2,
                }}>
                {badgeLabel}
              </Text>
            </View>
          ) : null}
          <IconsaxArrowRightIcon size={20} color="#A7A7A7" />
        </View>
      </View>
    </Pressable>
  );
}
