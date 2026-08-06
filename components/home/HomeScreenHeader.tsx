import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { GreyAvatar } from '@/components/profile/GreyAvatar';
import { ROUTES } from '@/lib/routes';

const ICON_MUTED = '#1F2024';
const ROW_HEIGHT = 52;
const AVATAR_SIZE = 52;

export type HomeScreenHeaderProps = {
  /** Large title (Figma: 32px semibold). */
  title?: string;
  avatarUrl?: string | null;
  userName?: string;
};

/**
 * Top bar: bold title + notification + profile (Figma CampusCare mobile pattern).
 * Fixed row height so badge / title length does not shift layout between screens.
 */
export function HomeScreenHeader({
  title = 'Home',
  avatarUrl,
  userName = '',
}: HomeScreenHeaderProps) {
  const router = useRouter();

  return (
    <View
      style={{
        height: ROW_HEIGHT,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 32,
          fontWeight: '600',
          color: '#000000',
          letterSpacing: -1.28,
          lineHeight: 38,
          includeFontPadding: false,
        }}>
        {title}
      </Text>

      <NotificationBellButton
        iconColor={ICON_MUTED}
        backgroundColor="#FDFDFD"
        className="active:opacity-70"
      />

      <Pressable
        accessibilityLabel="Profile"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.push(ROUTES.profile)}
        style={{ flexShrink: 0 }}
        className="active:opacity-80">
        <GreyAvatar size={AVATAR_SIZE} name={userName} avatarUrl={avatarUrl} />
      </Pressable>
    </View>
  );
}
