import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabScreenHeaderProps = {
  title: string;
};

/**
 * In-tab title bar for screens under Expo Router native tabs: the root `Stack` uses `headerShown: false`
 * for the `(tabs)` shell, so per-tab `Stack.Screen` headers do not appear; this fills the iOS nav bar slot.
 */
export function TabScreenHeader({ title }: TabScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="none"
      className="border-b border-[#C6C6C8] bg-white"
      style={{ paddingTop: insets.top }}>
      <View className="h-11 items-center justify-center px-4">
        <Text
          accessibilityRole="header"
          className="text-center text-[17px] font-semibold text-[#000000]"
          numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}
