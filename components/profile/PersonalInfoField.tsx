import { Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

type Props = {
  label: string;
  value: string;
  isLast?: boolean;
};

/** Label + value row inside a personal-info card. */
export function PersonalInfoField({ label, value, isLast }: Props) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SCHEDULE_PARTNER.divider,
        gap: 4,
      }}>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 13,
          color: '#727272',
          letterSpacing: -0.2,
          lineHeight: 18,
        }}>
        {label}
      </Text>
      <Text
        selectable
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          color: '#222222',
          letterSpacing: -0.4,
          lineHeight: 22,
        }}>
        {value}
      </Text>
    </View>
  );
}
