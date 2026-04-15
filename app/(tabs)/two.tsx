import { Text, View } from 'react-native';

import { TabScreenHeader } from '@/components/TabScreenHeader';

/**
 * Profile tab — custom top bar (Native Tabs live under a root `Stack` with no header; see `TabScreenHeader`).
 */
export default function ProfileTab() {
  return (
    <View className="flex-1 bg-white">
      <TabScreenHeader title="Profile" />
      <View className="flex-1 px-5 pt-4">
        <Text className="text-base leading-6 text-[#494A50]">
          Account details and preferences will appear here.
        </Text>
      </View>
    </View>
  );
}
