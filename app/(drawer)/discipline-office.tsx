import { useState } from 'react';
import { Text, View } from 'react-native';
import { Tabs } from 'heroui-native';

import { DisciplineTabEmptyState } from '@/components/discipline/DisciplineTabEmptyState';
import { DisciplineCaseProgressCard } from '@/components/discipline-office';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UnderlineTabs } from '@/components/UnderlineTabs';

const DISCIPLINE_TABS = [
  { value: 'my-case', label: 'My Case' },
  { value: 'my-sanctions', label: 'My Sanctions' },
] as const;

/** Swap to `false` when there is no active case — empty UI shows when `false`. */
const MOCK_HAS_ACTIVE_CASE = true;

const MOCK_CASE_STEPS = [
  { label: 'Reported', date: 'Jan. 15, 2026' },
  { label: 'Under Investigation', date: 'Jan. 18, 2026' },
  { label: 'Case Conference', date: 'Feb. 3, 2026' },
  { label: 'Decision', date: 'Jan. 15, 2026' },
  { label: 'Case Closed' },
] as const;
const MOCK_HAS_SANCTIONS = false;

export default function DisciplineOfficeScreen() {
  const [activeTab, setActiveTab] = useState<string>(DISCIPLINE_TABS[0].value);

  return (
    <View className="flex-1 bg-white">
      <ScreenNavbar title="Discipline Office" menuIconSize={32} />
      <View className="mt-2 flex-1 px-5">
        <UnderlineTabs
          className="flex-1"
          tabs={[...DISCIPLINE_TABS]}
          value={activeTab}
          onValueChange={setActiveTab}>
          <Tabs.Content className="mt-4 flex-1" value="my-case">
            {MOCK_HAS_ACTIVE_CASE ? (
              <DisciplineCaseProgressCard
                title="Academic Dishonesty"
                description="Unauthorized collaboration on individual assignment."
                progressPercent={25}
                completedSummary="2 of 5 Completed"
                percentLabel="25%"
                currentStepIndex={1}
                steps={[...MOCK_CASE_STEPS]}
              />
            ) : (
              <DisciplineTabEmptyState variant="case" />
            )}
          </Tabs.Content>
          <Tabs.Content className="mt-4 flex-1" value="my-sanctions">
            {MOCK_HAS_SANCTIONS ? (
              <View className="flex-1 rounded-2xl border border-dashed border-[#C5C6CC] p-6">
                <Text className="text-center text-sm text-[#71727A]">
                  Sanctions list will show here when connected to your backend.
                </Text>
              </View>
            ) : (
              <DisciplineTabEmptyState variant="sanctions" />
            )}
          </Tabs.Content>
        </UnderlineTabs>
      </View>
    </View>
  );
}
