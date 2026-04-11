import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Tabs } from 'heroui-native';

import { DisciplineTabEmptyState } from '@/components/discipline/DisciplineTabEmptyState';
import { DisciplineCaseProgressCard, SanctionCard } from '@/components/discipline-office';
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
/** Set `false` when there are no sanctions — empty state shows instead. */
const MOCK_HAS_SANCTIONS = true;

const MOCK_SANCTIONS = [
  {
    id: 'cs-1',
    status: 'in_progress' as const,
    title: 'Community Service',
    description: 'Complete 24 hours of community service at the Court',
    dueDateLabel: 'Thu, Feb 19',
    progress: { current: 8, total: 24, unit: 'hours' },
  },
  {
    id: 'aiw-1',
    status: 'pending' as const,
    title: 'Academic Integrity Workshop',
    description:
      'Attend a mandatory 2-hour workshop on academic integrity and ethical conduct.',
    dueDateLabel: 'Fri, Feb 20',
  },
  {
    id: 'essay-1',
    status: 'in_review' as const,
    title: 'Reflective Essay',
    description:
      'Submit a 1,000-word reflection on academic honesty and lessons learned from the incident.',
    dueDateLabel: 'Mon, Mar 2',
  },
];

export default function DisciplineOfficeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(DISCIPLINE_TABS[0].value);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
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
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View className="gap-8 pb-10">
                  {MOCK_SANCTIONS.map((item) => (
                    <SanctionCard
                      key={item.id}
                      status={item.status}
                      title={item.title}
                      description={item.description}
                      dueDateLabel={item.dueDateLabel}
                      progress={item.progress}
                      onUploadProof={() =>
                        router.push({
                          pathname: '/discipline-office/upload-proof',
                          params: { sanctionId: item.id },
                        })
                      }
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <DisciplineTabEmptyState variant="sanctions" />
            )}
          </Tabs.Content>
        </UnderlineTabs>
      </View>
    </View>
  );
}
