import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import profileCirclePlaceholder from '@/assets/profile-circle.png';

const ICON_MUTED = '#1F2024';

export type HomeScreenHeaderProps = {
  /** Large title (reference UI uses a single word like “Lessons”). */
  title?: string;
};

/**
 * Home top bar: bold title + notification + profile (reference lesson-app hero layout).
 */
export function HomeScreenHeader({ title = 'Home' }: HomeScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="w-full flex-row items-center justify-between pb-2 pl-2"
      style={{ paddingTop: Math.max(insets.top, 8) }}>
      <Text className="text-[32px] font-bold leading-9 text-[#1F2024]">{title}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          hitSlop={10}
          className="size-11 items-center justify-center rounded-full bg-white border border-black/5"
          onPress={() => router.push('/(tabs)/notification')}>
          <Ionicons name="notifications-outline" size={22} color={ICON_MUTED} />
        </Pressable>
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.push('/(tabs)/two')}
          className="size-11 overflow-hidden rounded-full border border-black/5 bg-white">
          <Image
            source={profileCirclePlaceholder}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </Pressable>
      </View>
    </View>
  );
}
