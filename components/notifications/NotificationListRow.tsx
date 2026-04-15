import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Href, router } from 'expo-router';

import { IconsaxHierarchyIcon } from '@/components/icons/IconsaxHierarchyIcon';
import { IconsaxMedalIcon } from '@/components/icons/IconsaxMedalIcon';
import { IconsaxMegaphoneIcon } from '@/components/icons/IconsaxMegaphoneIcon';
import { IconsaxSearchFavoriteIcon } from '@/components/icons/IconsaxSearchFavoriteIcon';
import { IconsaxStickynoteIcon } from '@/components/icons/IconsaxStickynoteIcon';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import {
  NOTIFICATION_CATEGORY_LABEL,
  type NotificationItem,
  type WelfareNotificationCategory,
} from '@/lib/notifications/mockNotifications';

const BRAND = SCHEDULE_PARTNER.brand;
const ICON_WELL = '#EFF4FF';

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
  onMarkRead: (id: string) => void;
  /** Omit bottom divider (last row in a group / screen). */
  isLast: boolean;
};

/**
 * Inset list row (CampusCare mobile list pattern — grouped table, not floating cards).
 */
export function NotificationListRow({ item, onMarkRead, isLast }: NotificationListRowProps) {
  const Icon = CATEGORY_ICON[item.category];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${NOTIFICATION_CATEGORY_LABEL[item.category]}. ${item.title}. ${item.body}`}
      onPress={() => {
        if (!item.read) {
          onMarkRead(item.id);
        }
        router.push(item.href as Href);
      }}
      android_ripple={{ color: 'rgba(15, 23, 42, 0.06)' }}
      className="active:opacity-95">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: SCHEDULE_PARTNER.divider,
          backgroundColor: item.read ? 'transparent' : 'rgba(41, 112, 255, 0.04)',
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
    </Pressable>
  );
}
