import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';

const ICON_BG = SCHEDULE_PARTNER.segmentTrackBg;
const ICON_COLOR = SCHEDULE_PARTNER.textPrimary;
const DIVIDER = SCHEDULE_PARTNER.divider;
const SURFACE = SCHEDULE_PARTNER.surface;

export type ProfileMenuRowProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  value?: string;
  isFirst?: boolean;
  isLast?: boolean;
  variant?: 'default' | 'danger';
};

/**
 * Reusable menu row component for profile screen.
 * Displays icon, label, optional value/chevron, with rounded corners on ends.
 */
export function ProfileMenuRow({
  icon,
  label,
  onPress,
  value,
  isFirst,
  isLast,
  variant = 'default',
}: ProfileMenuRowProps) {
  const isDanger = variant === 'danger';
  const isDisplay = !onPress;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: DIVIDER,
        backgroundColor: SURFACE,
        gap: 12,
        borderTopLeftRadius: isFirst ? 16 : 0,
        borderTopRightRadius: isFirst ? 16 : 0,
        borderBottomLeftRadius: isLast ? 16 : 0,
        borderBottomRightRadius: isLast ? 16 : 0,
      }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: isDanger ? 'rgba(239,68,68,0.1)' : ICON_BG,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          color: isDanger ? '#EF4444' : SCHEDULE_PARTNER.textPrimary,
        }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 14, color: SCHEDULE_PARTNER.textMuted }}>{value}</Text>
      ) : !isDisplay ? (
        <IconsaxArrowRightIcon size={18} color={isDanger ? '#EF4444' : SCHEDULE_PARTNER.textDisabled} />
      ) : null}
    </View>
  );

  if (isDisplay) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:opacity-60">
      {content}
    </Pressable>
  );
}
