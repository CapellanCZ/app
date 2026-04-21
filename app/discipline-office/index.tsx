import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'heroui-native';

import { useAuth } from '@/lib/auth/AuthProvider';
import {
  fetchCasesByStudent,
  fetchNTEsByStudent,
  fetchSanctionsByStudent,
  mapCaseToCardProps,
  mapNTEToCardProps,
  mapSanctionToCardProps,
} from '@/lib/discipline-office/disciplineApi';

import { DisciplineTabEmptyState } from '@/components/discipline-office/DisciplineTabEmptyState';
import {
  DisciplineCaseProgressCard,
  DisciplineOfficeNoticeCard,
  DisciplineOfficeScreenShell,
  NTECard,
  SanctionCard,
} from '@/components/discipline-office';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { HOME_SCROLL_PADDING_H } from '@/lib/ui/screenGradients';

const DISCIPLINE_TABS = [
  { value: 'my-case', label: 'My Case' },
  { value: 'my-sanctions', label: 'My Sanctions' },
  { value: 'notices', label: 'Notices' },
] as const;

const SECTION = 28;
const CTA_H = 52;

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
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(DISCIPLINE_TABS[0].value);
  const [isLoading, setIsLoading] = useState(true);

  const [cases, setCases] = useState<ReturnType<typeof mapCaseToCardProps>[]>([]);
  const [sanctions, setSanctions] = useState<ReturnType<typeof mapSanctionToCardProps>[]>([]);
  const [ntes, setNtes] = useState<ReturnType<typeof mapNTEToCardProps>[]>([]);

  const studentId = (session?.user?.user_metadata?.student_id as string | undefined) ?? '';

  useEffect(() => {
    if (!studentId) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      fetchCasesByStudent(studentId),
      fetchSanctionsByStudent(studentId),
      fetchNTEsByStudent(studentId),
    ]).then(([rawCases, rawSanctions, rawNTEs]) => {
      if (cancelled) return;
      setCases(rawCases.map(mapCaseToCardProps));
      setSanctions(rawSanctions.map(mapSanctionToCardProps));
      setNtes(rawNTEs.map(mapNTEToCardProps));
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [studentId]);

  const openCaseCount = cases.length;
  const sanctionCount = sanctions.length;
  const sanctionsNeedingAction = sanctions.filter((s) => s.status !== 'in_review').length;
  const pendingNTECount = ntes.filter((n) => n.status === 'pending_response').length;

  return (
    <DisciplineOfficeScreenShell>
      <ScreenNavbar title="Discipline Office" />

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

        {/* —— Pending NTE urgent banner —— */}
        {pendingNTECount > 0 && (
          <Pressable
            onPress={() => setActiveTab('notices')}
            style={{
              marginTop: SECTION,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#FCA5A5',
              backgroundColor: '#FEF2F2',
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
            className="active:opacity-80">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: '#FCA5A5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#DC2626' }}>!</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>
                {pendingNTECount} Notice{pendingNTECount > 1 ? 's' : ''} Require{pendingNTECount === 1 ? 's' : ''} Your Response
              </Text>
              <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 1 }}>
                Tap to view your NTE notices
              </Text>
            </View>
          </Pressable>
        )}

        {/* —— Records: tabs + lists in one card —— */}
        <View
          style={{
            marginTop: SECTION,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#FFFFFF',
            backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
            overflow: 'hidden',
            paddingHorizontal: 14,
            paddingTop: 12,
          }}>
          <UnderlineTabs tabs={[...DISCIPLINE_TABS]} value={activeTab} onValueChange={setActiveTab}>
            <Tabs.Content className="mt-5 w-full pb-4" value="my-case">
              {isLoading ? (
                <ActivityIndicator style={{ marginVertical: 24 }} />
              ) : cases.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {cases.map((item) => (
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
                      defaultExpanded={cases.length === 1}
                    />
                  ))}
                </View>
              ) : (
                <DisciplineTabEmptyState variant="case" />
              )}
            </Tabs.Content>
            <Tabs.Content className="mt-3 w-full pb-4" value="notices">
              {isLoading ? (
                <ActivityIndicator style={{ marginVertical: 24 }} />
              ) : ntes.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {ntes.map((item) => (
                    <NTECard
                      key={item.id}
                      variant="nested"
                      id={item.id}
                      caseType={item.caseType}
                      description={item.description}
                      issuedAtLabel={item.issuedAtLabel}
                      deadlineLabel={item.deadlineLabel}
                      status={item.status}
                      isOverdue={item.isOverdue}
                      onRespond={() =>
                        router.push({
                          pathname: '/discipline-office/nte-response',
                          params: {
                            nteId: item.id,
                            caseType: item.caseType,
                            issuedAtLabel: item.issuedAtLabel,
                            deadlineLabel: item.deadlineLabel,
                          },
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <DisciplineTabEmptyState variant="case" />
              )}
            </Tabs.Content>
            <Tabs.Content className="mt-3 w-full pb-0" value="my-sanctions">
              {isLoading ? (
                <ActivityIndicator style={{ marginVertical: 24 }} />
              ) : sanctions.length > 0 ? (
                <View style={{ gap: 12, paddingBottom: 18 }}>
                  {sanctions.map((item) => (
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
