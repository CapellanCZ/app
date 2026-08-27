import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  FigmaBookingsIcon,
  FigmaMoreIcon,
  FigmaVitalsIcon,
} from '@/components/home/FigmaHomeIcons';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const TILE_HEIGHT = 88;
const ICON_SIZE = 24;
/** Reserved for up to 2 lines so single- and two-line labels share the same footprint. */
const LABEL_SLOT_HEIGHT = 28;
const ICON_LABEL_GAP = 8;
const ROW_GAP = 10;

type Action = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

type Props = {
  onBookings: () => void;
  onVitals: () => void;
  onMore: () => void;
};

/**
 * Figma quick-action tile (2220:144): equal size, icon + gap + label slot.
 */
function ActionTile({ label, icon, onPress }: Omit<Action, 'key'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label.replace(/\n/g, ' ')}
      onPress={onPress}
      {...androidPressProps({ hitSlop: 4 })}
      style={({ pressed }) => ({
        flex: 1,
        flexBasis: 0,
        minHeight: TILE_HEIGHT,
        height: TILE_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: ICON_LABEL_GAP,
        overflow: 'hidden',
        opacity: pressed ? 0.88 : 1,
      })}>
      <View
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View
        style={{
          height: LABEL_SLOT_HEIGHT,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: Inter.regular,
            fontSize: 12,
            color: '#111111',
            letterSpacing: -0.48,
            textAlign: 'center',
            lineHeight: 14,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Quick-action row: My Appointments · Vital Signs · More
 */
export function HomeQuickActions({ onBookings, onVitals, onMore }: Props) {
  const actions: Action[] = [
    {
      key: 'bookings',
      label: 'My\nAppointments',
      icon: <FigmaBookingsIcon size={ICON_SIZE} color="#323232" />,
      onPress: onBookings,
    },
    {
      key: 'vitals',
      label: 'Vital\nSigns',
      icon: <FigmaVitalsIcon size={ICON_SIZE} color="#323232" />,
      onPress: onVitals,
    },
    {
      key: 'more',
      label: 'More',
      icon: <FigmaMoreIcon size={ICON_SIZE} color="#323232" />,
      onPress: onMore,
    },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: ROW_GAP,
        width: '100%',
      }}>
      {actions.map((a) => (
        <ActionTile key={a.key} label={a.label} icon={a.icon} onPress={a.onPress} />
      ))}
    </View>
  );
}
