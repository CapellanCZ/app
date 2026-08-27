import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconsaxArrowRightIcon } from '@/components/icons/IconsaxArrowRightIcon';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

export type ProfileMenuRowProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'danger';
};

/**
 * Profile menu row — white chip + Inter body, same as home quick-action tiles.
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
        opacity: pressed ? 0.88 : 1,
        overflow: 'hidden',
        borderRadius: 16,
      })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 16,
          minHeight: 56,
          gap: 12,
        }}>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <Text
          style={{
            flex: 1,
            fontFamily: Inter.medium,
            fontSize: 16,
            letterSpacing: -0.64,
            lineHeight: 22,
            color: isDanger ? '#D92D20' : '#222222',
          }}>
          {label}
        </Text>
        <IconsaxArrowRightIcon size={20} color={isDanger ? '#D92D20' : '#A7A7A7'} />
      </View>
    </Pressable>
  );
}
