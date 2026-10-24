import { Pressable, Text } from 'react-native';

import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { CARD_ELEVATION } from '@/lib/ui/theme';

const LOGOUT_RED = '#E53935';

type LogoutRowProps = {
  onPress: () => void;
};

/**
 * Centered logout row — destructive red ink on elevated white card.
 */
export function LogoutRow({ onPress }: LogoutRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Log out"
      {...androidPressProps({ hitSlop: 2 })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        minHeight: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ECECEC',
        overflow: 'hidden',
        opacity: pressed ? 0.88 : 1,
        ...CARD_ELEVATION,
      })}>
      <LogoutIcon size={22} color={LOGOUT_RED} />
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          letterSpacing: -0.64,
          lineHeight: 22,
          color: LOGOUT_RED,
        }}>
        Logout
      </Text>
    </Pressable>
  );
}
