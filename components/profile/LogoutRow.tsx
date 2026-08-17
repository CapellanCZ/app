import { Platform, Pressable, Text, View } from 'react-native';
import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { androidPressProps } from '@/lib/ui/androidPress';

type LogoutRowProps = {
  onPress: () => void;
};

/**
 * Centered logout row with red icon and text.
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
        minHeight: Platform.OS === 'android' ? 56 : undefined,
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        overflow: 'hidden',
        opacity: pressed ? 0.7 : 1,
      })}>
      <LogoutIcon size={24} color="#D92D20" />
      <Text style={{ fontSize: 16, fontWeight: '400', color: '#D92D20' }}>
        Logout
      </Text>
    </Pressable>
  );
}
