import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Tabs } from 'heroui-native';

import { DisciplineTabEmptyState } from '@/components/discipline/DisciplineTabEmptyState';
import {
  DisciplineCaseProgressCard,
  SanctionCard,
  type DisciplineCaseStep,
} from '@/components/discipline-office';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UnderlineTabs } from '@/components/UnderlineTabs';

const DISCIPLINE_TABS = [
  { value: 'my-case', label: 'My Case' },
  { value: 'my-sanctions', label: 'My Sanctions' },
] as const;

const MOCK_CASE_STEPS_PRIMARY = [
  { label: 'Reported', date: 'Jan. 15, 2026' },
  { label: 'Under Investigation', date: 'Jan. 18, 2026' },
  { label: 'Case Conference', date: 'Feb. 3, 2026' },
  { label: 'Decision', date: 'Jan. 15, 2026' },
  { label: 'Case Closed' },
] as const;

const MOCK_CASE_STEPS_SECONDARY = [
  { label: 'Reported', date: 'Dec. 2, 2025' },
  { label: 'Under Investigation', date: 'Dec. 5, 2025' },
  { label: 'Case Conference', date: 'Dec. 12, 2025' },
  { label: 'Decision' },
  { label: 'Case Closed' },
] as const;

/** Empty array shows the case empty state. */
const MOCK_CASES = [
  {
    id: 'case-1',
    title: 'Academic Dishonesty',
    description: 'Unauthorized collaboration on individual assignment.',
    severity: 'minor' as const,
    progressPercent: 25,
    completedSummary: '2 of 5 Completed',
    percentLabel: '25%',
    currentStepIndex: 1,
    steps: [...MOCK_CASE_STEPS_PRIMARY] as DisciplineCaseStep[],
  },
  {
    id: 'case-2',
    title: 'Campus Conduct',
    description: 'Noise complaint and repeated dorm policy violations.',
    severity: 'major' as const,
    progressPercent: 80,
    completedSummary: '4 of 5 Completed',
    percentLabel: '80%',
    currentStepIndex: 3,
    steps: [...MOCK_CASE_STEPS_SECONDARY] as DisciplineCaseStep[],
  },
];
/** Set `false` when there are no sanctions — empty state shows instead. */
const MOCK_HAS_SANCTIONS = true;

const MOCK_SANCTIONS = [
  {
    id: 'cs-1',
    status: 'in_progress' as const,
    title: 'Community Service',
    description: 'Complete 24 hours of community service at the Court',
    caseTypeLabel: 'Campus conduct',
    dueDateLabel: 'Thu, Feb 19',
    progress: { current: 8, total: 24, unit: 'hours' },
  },
  {
    id: 'aiw-1',
    status: 'pending' as const,
    title: 'Academic Integrity Workshop',
    description:
      'Attend a mandatory 2-hour workshop on academic integrity and ethical conduct.',
    caseTypeLabel: 'Academic dishonesty',
    dueDateLabel: 'Fri, Feb 20',
  },
  {
    id: 'essay-1',
    status: 'in_review' as const,
    title: 'Reflective Essay',
    description:
      'Submit a 1,000-word reflection on academic honesty and lessons learned from the incident.',
    caseTypeLabel: 'Academic dishonesty',
    dueDateLabel: 'Proof submitted Mar 2, 2026',
    reviewDaysMin: 1,
    reviewDaysMax: 3,
    reviewStatusLabel:
      'Proof received — your file is with the discipline office for review. You will be notified when a decision is posted.',
  },
];

export default function DisciplineOfficeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(DISCIPLINE_TABS[0].value);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar
        title="Discipline Office"
        menuIconSize={32}
        onBackPress={() => router.replace('/(drawer)/(tabs)')}
      />
      <View className="mt-2 flex-1 px-4">
        <UnderlineTabs
          className="flex-1"
          tabs={[...DISCIPLINE_TABS]}
          value={activeTab}
          onValueChange={setActiveTab}>
          <Tabs.Content className="mt-4 flex-1" value="my-case">
            {MOCK_CASES.length > 0 ? (
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View className="gap-4 pb-10">
                  {MOCK_CASES.map((item) => (
                    <DisciplineCaseProgressCard
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      severity={item.severity}
                      progressPercent={item.progressPercent}
                      completedSummary={item.completedSummary}
                      percentLabel={item.percentLabel}
                      currentStepIndex={item.currentStepIndex}
                      steps={item.steps}
                      defaultExpanded={MOCK_CASES.length === 1}
                    />
                  ))}
                </View>
              </ScrollView>
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
                      caseTypeLabel={item.caseTypeLabel}
                      dueDateLabel={item.dueDateLabel}
                      progress={item.progress}
                      reviewDaysMin={item.reviewDaysMin}
                      reviewDaysMax={item.reviewDaysMax}
                      reviewStatusLabel={item.reviewStatusLabel}
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
