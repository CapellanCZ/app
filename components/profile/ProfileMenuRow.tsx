import { ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { androidPressProps } from '@/lib/ui/androidPress';

export type ProfileMenuRowProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'danger';
};

/**
 * Reusable menu row component for profile screen.
 * Individual rounded card with icon, label, and chevron.
 */
export function ProfileMenuRow({
  icon,
  label,
  onPress,
  variant = 'default',
}: ProfileMenuRowProps) {
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...androidPressProps({ hitSlop: 2 })}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        overflow: 'hidden',
        borderRadius: 16,
      })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
          borderRadius: 16,
          padding: 16,
          minHeight: Platform.OS === 'android' ? 56 : undefined,
          gap: 12,
        }}>
        <View style={{ width: 24, height: 24 }}>{icon}</View>
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '400',
            color: isDanger ? '#D92D20' : '#000',
          }}>
          {label}
        </Text>
        <IconsaxArrowRightIcon size={20} color={isDanger ? '#D92D20' : '#A4A7AE'} />
      </View>
    </Pressable>
  );
}
