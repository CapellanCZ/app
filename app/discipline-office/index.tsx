import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'heroui-native';

import { DisciplineTabEmptyState } from '@/components/discipline/DisciplineTabEmptyState';
import {
  DisciplineCaseProgressCard,
  DisciplineOfficeNoticeCard,
  DisciplineOfficeScreenShell,
  SanctionCard,
  type DisciplineCaseStep,
} from '@/components/discipline-office';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { HOME_SCROLL_PADDING_H } from '@/lib/ui/screenGradients';

const DISCIPLINE_TABS = [
  { value: 'my-case', label: 'My Case' },
  { value: 'my-sanctions', label: 'My Sanctions' },
] as const;

const SECTION = 28;
const CTA_H = 52;

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

function SnapshotStrip({
  openCases,
  sanctions,
  awaitingAction,
  embedded = false,
}: {
  openCases: number;
  sanctions: number;
  awaitingAction: number;
  embedded?: boolean;
}) {
  const cells = [
    { value: String(openCases), label: 'Open cases' },
    { value: String(sanctions), label: 'Sanctions' },
    { value: String(awaitingAction), label: 'Needs action' },
  ];

  return (
    <View
      style={
        embedded
          ? {
              flexDirection: 'row',
              borderTopWidth: 1,
              borderTopColor: SCHEDULE_PARTNER.divider,
              backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
              overflow: 'hidden',
            }
          : {
              flexDirection: 'row',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: SCHEDULE_PARTNER.surface,
              overflow: 'hidden',
            }
      }>
      {cells.map((cell, i) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 6,
            alignItems: 'center',
            justifyContent: 'center',
            borderLeftWidth: i > 0 ? 1 : 0,
            borderLeftColor: SCHEDULE_PARTNER.divider,
          }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.3,
              color: SCHEDULE_PARTNER.textPrimary,
            }}>
            {cell.value}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: '500',
              lineHeight: 14,
              textAlign: 'center',
              color: SCHEDULE_PARTNER.textMuted,
            }}
            numberOfLines={2}>
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ActionPill({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minHeight: CTA_H,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: SCHEDULE_PARTNER.surface,
      }}
      className="active:opacity-88">
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          color: SCHEDULE_PARTNER.textPrimary,
        }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={SCHEDULE_PARTNER.textMuted} />
    </Pressable>
  );
}

export default function DisciplineOfficeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>(DISCIPLINE_TABS[0].value);

  const openCaseCount = MOCK_CASES.length;
  const sanctionCount = MOCK_HAS_SANCTIONS ? MOCK_SANCTIONS.length : 0;
  const sanctionsNeedingAction = MOCK_HAS_SANCTIONS
    ? MOCK_SANCTIONS.filter((s) => s.status !== 'in_review').length
    : 0;

  return (
    <DisciplineOfficeScreenShell>
      <ScreenNavbar title="Discipline Office" onBackPress={() => router.replace('/(tabs)')} />

      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        }}>
        {/* —— Overview: conduct copy → file report → counters (one card) —— */}
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.cardBorder,
            backgroundColor: SCHEDULE_PARTNER.surface,
            overflow: 'hidden',
          }}>
          <DisciplineOfficeNoticeCard embedded />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: SCHEDULE_PARTNER.divider,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14,
            }}>
            <ActionPill
              label="File incident report"
              accessibilityLabel="Open incident report form"
              onPress={() => router.push('/discipline-office/incident-report')}
            />
          </View>
          <SnapshotStrip
            embedded
            openCases={openCaseCount}
            sanctions={sanctionCount}
            awaitingAction={sanctionsNeedingAction}
          />
        </View>

        {/* —— Records: tabs + lists in one card —— */}
        <View
          style={{
            marginTop: SECTION,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#FFFFFF',
            backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
            overflow: 'hidden',
            paddingHorizontal: 12,
          }}>
          <UnderlineTabs tabs={[...DISCIPLINE_TABS]} value={activeTab} onValueChange={setActiveTab}>
            <Tabs.Content className="mt-3 w-full pb-0" value="my-case">
              {MOCK_CASES.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {MOCK_CASES.map((item) => (
                    <DisciplineCaseProgressCard
                      key={item.id}
                      variant="nested"
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
              ) : (
                <DisciplineTabEmptyState variant="case" />
              )}
            </Tabs.Content>
            <Tabs.Content className="mt-3 w-full pb-0" value="my-sanctions">
              {MOCK_HAS_SANCTIONS ? (
                <View style={{ gap: 12 }}>
                  {MOCK_SANCTIONS.map((item) => (
                    <SanctionCard
                      key={item.id}
                      variant="nested"
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
              ) : (
                <DisciplineTabEmptyState variant="sanctions" />
              )}
            </Tabs.Content>
          </UnderlineTabs>
        </View>
      </ScrollView>
    </DisciplineOfficeScreenShell>
  );
}
