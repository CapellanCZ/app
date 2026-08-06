import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native-gesture-handler';

import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { GreyAvatar } from '@/components/profile/GreyAvatar';
import { ROUTES } from '@/lib/routes';
import { Inter } from '@/lib/typography/inter';

type Props = {
  userName: string;
  avatarUrl?: string | null;
};

/**
 * Figma home header: avatar + "Welcome back," + name · notification pill.
 */
export function HomeWelcomeHeader({ userName, avatarUrl }: Props) {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push(ROUTES.profile)}
          style={{ flexShrink: 0 }}>
          <GreyAvatar size={48} name={userName} avatarUrl={avatarUrl} />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#727272',
              letterSpacing: -0.64,
              lineHeight: 20,
            }}>
            Welcome back,
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: Inter.medium,
              fontSize: 16,
              color: '#000000',
              letterSpacing: -1.28,
              lineHeight: 24,
            }}>
            {userName}
          </Text>
        </View>
      </View>

      <NotificationBellButton />
    </View>
  );
}
