import { useState } from 'react';
import { Text, View } from 'react-native';
import { Tabs } from 'heroui-native';

import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UnderlineTabs } from '@/components/UnderlineTabs';

const DISCIPLINE_TABS = [
  { value: 'my-case', label: 'My Case' },
  { value: 'my-sanctions', label: 'My Sanctions' },
] as const;

export default function DisciplineOfficeScreen() {
  const [activeTab, setActiveTab] = useState<string>(DISCIPLINE_TABS[0].value);

  return (
    <View className="flex-1 bg-white">
      <ScreenNavbar title="Discipline Office" menuIconSize={32} />
      <View className="mt-4 flex-1 px-5">
        <UnderlineTabs
          className="flex-1"
          tabs={[...DISCIPLINE_TABS]}
          value={activeTab}
          onValueChange={setActiveTab}>
          <Tabs.Content className="mt-4 flex-1" value="my-case">
            <Text className="text-sm text-[#71727A]">My Case</Text>
          </Tabs.Content>
          <Tabs.Content className="mt-4 flex-1" value="my-sanctions">
            <Text className="text-sm text-[#71727A]">My Sanctions</Text>
          </Tabs.Content>
        </UnderlineTabs>
      </View>
    </View>
  );
}
