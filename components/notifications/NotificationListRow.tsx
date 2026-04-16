import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { IconsaxHierarchyIcon } from '@/components/icons/IconsaxHierarchyIcon';
import { IconsaxMedalIcon } from '@/components/icons/IconsaxMedalIcon';
import { IconsaxMegaphoneIcon } from '@/components/icons/IconsaxMegaphoneIcon';
import { IconsaxSearchFavoriteIcon } from '@/components/icons/IconsaxSearchFavoriteIcon';
import { IconsaxStickynoteIcon } from '@/components/icons/IconsaxStickynoteIcon';
import { IconsaxArchiveIcon } from '@/components/icons/IconsaxArchiveIcon';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import {
  NOTIFICATION_CATEGORY_LABEL,
  type NotificationItem,
  type WelfareNotificationCategory,
} from '@/lib/notifications/mockNotifications';

const BRAND = SCHEDULE_PARTNER.brand;
const ICON_WELL = '#EFF4FF';
const SWIPE_THRESHOLD = -80;

type IconComp = ComponentType<{ size?: number; color?: string }>;

const CATEGORY_ICON: Record<WelfareNotificationCategory, IconComp> = {
  health: IconsaxSearchFavoriteIcon,
  discipline: IconsaxStickynoteIcon,
  scholarships: IconsaxMedalIcon,
  referrals: IconsaxHierarchyIcon,
  campus: IconsaxMegaphoneIcon,
};

export type NotificationListRowProps = {
  item: NotificationItem;
  onArchive: (id: string) => void;
  /** Omit bottom divider (last row in a group / screen). */
  isLast: boolean;
};

/**
 * Swipeable notification row with archive action.
 * Swipe left to reveal archive, or swipe far to auto-archive.
 */
export function NotificationListRow({ item, onArchive, isLast }: NotificationListRowProps) {
  const Icon = CATEGORY_ICON[item.category];
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const animatedArchiveStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / 60),
  }));

  const handleArchive = () => {
    opacity.value = withSpring(0, { stiffness: 300, damping: 20 }, () => {
      runOnJS(onArchive)(item.id);
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping left (negative values)
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD || event.velocityX < -500) {
        // Swiped far enough or fast enough - archive
        translateX.value = withSpring(-200, { stiffness: 300, damping: 20 }, () => {
          runOnJS(handleArchive)();
        });
      } else if (event.translationX < -60) {
        // Swiped partially - snap to reveal archive button
        translateX.value = withSpring(-80, { stiffness: 200, damping: 25 });
      } else {
        // Snap back
        translateX.value = withSpring(0, { stiffness: 200, damping: 25 });
      }
    });

  const handlePressArchive = () => {
    translateX.value = withSpring(-200, { stiffness: 300, damping: 20 }, () => {
      runOnJS(handleArchive)();
    });
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Background Archive Layer */}
      <Animated.View
        style={[
          animatedArchiveStyle,
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: isLast ? 0 : 1,
            width: 100,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#EF4444',
            borderTopRightRadius: isLast ? 12 : 0,
            borderBottomRightRadius: 12,
          },
        ]}>
        <Pressable
          onPress={handlePressArchive}
          accessibilityRole="button"
          accessibilityLabel="Archive notification"
          style={{ alignItems: 'center', gap: 4 }}>
          <IconsaxArchiveIcon size={24} color="#FFFFFF" />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            Archive
          </Text>
        </Pressable>
      </Animated.View>

      {/* Foreground Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            animatedRowStyle,
            {
              marginBottom: isLast ? 0 : 8,
              borderRadius: 12,
              overflow: 'hidden',
            },
          ]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              backgroundColor: item.read ? SCHEDULE_PARTNER.surface : 'rgba(41, 112, 255, 0.04)',
            }}>
              <View
                className="mt-0.5 shrink-0 items-center justify-center rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: ICON_WELL,
                }}>
                <Icon size={24} color={BRAND} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="mb-1 flex-row items-center justify-between gap-2">
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: '700',
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: SCHEDULE_PARTNER.textDisabled,
                    }}
                    numberOfLines={1}>
                    {NOTIFICATION_CATEGORY_LABEL[item.category]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: SCHEDULE_PARTNER.textMuted,
                    }}
                    numberOfLines={1}>
                    {item.timeLabel}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 16,
                    fontWeight: item.read ? '500' : '700',
                    letterSpacing: -0.2,
                    color: SCHEDULE_PARTNER.textPrimary,
                    lineHeight: 21,
                  }}>
                  {item.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    lineHeight: 19,
                    color: SCHEDULE_PARTNER.textMuted,
                  }}>
                  {item.body}
                </Text>
              </View>
            </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
