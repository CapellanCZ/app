import type { ReactNode } from 'react';
import { Switch, Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

const BRAND = '#6BAED6';

export type NotificationPreference = {
  id: string;
  label: string;
  description: string;
  icon?: ReactNode;
};

type Props = {
  item: NotificationPreference;
  value: boolean;
  onToggle: (id: string, value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
};

/** Toggle row inside a grouped settings card — matches personal-info field rhythm. */
export function NotificationPreferenceRow({ item, value, onToggle, isLast, disabled }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SCHEDULE_PARTNER.divider,
        opacity: disabled ? 0.45 : 1,
      }}>
      {item.icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#D3E9FA',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
          {item.icon}
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 16,
            letterSpacing: -0.4,
            lineHeight: 22,
            color: '#222222',
          }}>
          {item.label}
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 13,
            letterSpacing: -0.2,
            lineHeight: 18,
            color: '#727272',
          }}>
          {item.description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={(next) => onToggle(item.id, next)}
        disabled={disabled}
        trackColor={{ false: '#E3E3E3', true: BRAND }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E3E3E3"
      />
    </View>
  );
}
