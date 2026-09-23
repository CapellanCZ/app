import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { StethoscopeIcon } from '@/components/icons/StethoscopeIcon';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import type { StaffRole } from '@/lib/health-service/types';

const CHIP_BG = '#F9F9F9';
const SELECTED_BG = '#0F0E0E';

export type BookingProviderType = Extract<StaffRole, 'doctor' | 'dentist'>;

function ToothIcon({ size = 20, color = '#111111' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.75C9.2 2.75 7.35 4.55 6.85 7.15C6.55 8.7 6.35 10.05 5.55 11.35C4.55 13 4.35 14.55 4.85 16.1C5.45 17.95 6.85 19.05 8.25 18.55C9.05 18.25 9.55 17.55 10.05 16.55C10.45 15.75 10.85 15.05 12 15.05C13.15 15.05 13.55 15.75 13.95 16.55C14.45 17.55 14.95 18.25 15.75 18.55C17.15 19.05 18.55 17.95 19.15 16.1C19.65 14.55 19.45 13 18.45 11.35C17.65 10.05 17.45 8.7 17.15 7.15C16.65 4.55 14.8 2.75 12 2.75Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const OPTIONS: {
  id: BookingProviderType;
  label: string;
  Icon: (props: { size?: number; color?: string }) => ReactNode;
}[] = [
  { id: 'doctor', label: 'Physician', Icon: StethoscopeIcon },
  { id: 'dentist', label: 'Dentist', Icon: ToothIcon },
];

type Props = {
  value: BookingProviderType;
  onChange: (next: BookingProviderType) => void;
  /** Hide the field label when wrapped in a section card title. */
  hideLabel?: boolean;
};

/** Physician · Dentist row — matches consultation request field styling. */
export function BookingProviderTypeSelect({ value, onChange, hideLabel = false }: Props) {
  return (
    <View style={{ gap: hideLabel ? 0 : 8 }}>
      {hideLabel ? null : (
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 14,
            color: '#6C6C6C',
            letterSpacing: -0.28,
          }}>
          Provider type
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          const iconColor = selected ? '#FFFFFF' : '#111111';
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                if (!selected) onChange(opt.id);
              }}
              {...androidPressProps({ light: selected, hitSlop: 2 })}
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: selected ? SELECTED_BG : CHIP_BG,
                paddingVertical: 14,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                overflow: 'hidden',
              }}>
              <opt.Icon size={18} color={iconColor} />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: selected ? Inter.medium : Inter.regular,
                  fontSize: 16,
                  color: selected ? '#FFFFFF' : '#111111',
                  letterSpacing: -0.64,
                  textAlign: 'center',
                }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
