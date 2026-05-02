import { Text, View } from 'react-native';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';

type ProfileSectionProps = {
  title?: string;
  children: React.ReactNode;
};

/**
 * Section wrapper with label and card styling.
 * Groups related menu items or content with a consistent label above.
 * Title is optional - when omitted, only shows card without label.
 */
export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View>
      {title && (
        <Text
          style={{
            marginTop: 24,
            marginBottom: 8,
            marginLeft: 4,
            fontSize: 15,
            fontWeight: '500',
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          {title}
        </Text>
      )}
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: SCHEDULE_PARTNER.cardBorder,
          overflow: 'hidden',
          backgroundColor: SCHEDULE_PARTNER.surface,
          marginTop: !title ? 24 : 0,
        }}>
        {children}
      </View>
    </View>
  );
}
