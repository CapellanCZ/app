import { Avatar, Button } from 'heroui-native';
import { YStack, XStack } from 'tamagui';
import { Text, View } from 'react-native';

import { TopNavigationBar } from '@/components/home/TopNavigationBar';

export default function Home() {
  return (
    <View className="flex-1">
      <TopNavigationBar userName="Nationalian" />


    </View>
  );
}
  