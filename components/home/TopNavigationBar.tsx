import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Text, XStack, YStack } from 'tamagui';

import { IconsaxMenuIcon } from '@/components/icons/IconsaxMenuIcon';

const AVATAR_BG = '#EAF2FF';
const AVATAR_ICON = '#B4DBFF';
const SUBTITLE_COLOR = '#414651';
const TITLE_COLOR = '#1F2024';

export type TopNavigationBarProps = {
  welcomeLabel?: string;
  userName?: string;
  avatarUrl?: string | null;
  showMenuButton?: boolean;
};

export function TopNavigationBar({
  welcomeLabel = 'Welcome back,',
  userName = 'Nationalian',
  avatarUrl,
  showMenuButton = true,
}: TopNavigationBarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <XStack
      gap={12}
      px={18}
      pt={Math.max(insets.top, 12)}
      style={{ alignItems: 'center' }}>
      <Avatar circular size={48} backgroundColor={AVATAR_BG}>
        {avatarUrl ? <Avatar.Image src={avatarUrl} /> : null}
        <Avatar.Fallback
          alignItems="center"
          backgroundColor={AVATAR_BG}
          justifyContent="center">
          <Ionicons name="person" size={22} color={AVATAR_ICON} />
        </Avatar.Fallback>
      </Avatar>

      <YStack flex={1} gap={2} justifyContent="center" minWidth={0}>
        <Text
          color={SUBTITLE_COLOR}
          fontSize={14}
          fontWeight="400"
          letterSpacing={0.12}
          lineHeight={16}>
          {welcomeLabel}
        </Text>
        <Text color={TITLE_COLOR} fontSize={16} fontWeight="600" numberOfLines={1}>
          {userName}
        </Text>
      </YStack>

      {showMenuButton ? (
        <Pressable
          accessibilityLabel="Open menu"
          hitSlop={12}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <IconsaxMenuIcon color={TITLE_COLOR} size={36} />
        </Pressable>
      ) : (
        <YStack height={32} width={32} />
      )}
    </XStack>
  );
}
