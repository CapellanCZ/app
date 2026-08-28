import { Pressable, Text } from 'react-native';

import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

type LogoutRowProps = {
  onPress: () => void;
};

/**
 * Centered logout row — same chip surface as other profile rows.
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
        overflow: 'hidden',
        opacity: pressed ? 0.88 : 1,
      })}>
      <LogoutIcon size={22} color="#C93B2E" />
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          letterSpacing: -0.64,
          lineHeight: 22,
          color: '#C93B2E',
        }}>
        Logout
      </Text>
    </Pressable>
  );
}
