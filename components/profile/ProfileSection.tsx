import { Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';

type ProfileSectionProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * Section label + stacked rows — matches home section hierarchy.
 */
export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          letterSpacing: -0.64,
          lineHeight: 22,
          color: '#727272',
        }}>
        {title}
      </Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}
