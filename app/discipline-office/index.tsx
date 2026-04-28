import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth/AuthProvider';
import {
  fetchCasesByStudent,
  fetchNTEsByStudent,
  fetchSanctionsByStudent,
  mapNTEToCardProps,
} from '@/lib/discipline-office/disciplineApi';

import {
  DisciplineOfficeScreenShell,
  ScreenHeader,
  NTECard,
} from '@/components/discipline-office';
import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import { IconsaxBriefcaseIcon } from '@/components/icons/IconsaxBriefcaseIcon';
import { IconsaxPaperIcon } from '@/components/icons/IconsaxPaperIcon';
import { IconsaxCloseCircleIcon } from '@/components/icons/IconsaxCloseCircleIcon';
import { IconsaxEditIcon } from '@/components/icons/IconsaxEditIcon';
import { IconsaxLikeIcon } from '@/components/icons/IconsaxLikeIcon';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { HOME_SCROLL_PADDING_H } from '@/lib/ui/screenGradients';

const T = SCHEDULE_PARTNER;

// ── Stats Strip ───────────────────────────────────────────────────────────────

function StatsStrip({
  noticeCount,
  openCases,
  sanctions,
}: {
  noticeCount: number;
  openCases: number;
  sanctions: number;
}) {
  const cells = [
    { value: String(noticeCount), label: 'Notice' },
    { value: String(openCases), label: 'Open Cases' },
    { value: String(sanctions), label: 'Sanctions' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 94,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E9EAEB',
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
      }}>
      {cells.map((cell, i) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderLeftWidth: i > 0 ? 1 : 0,
            borderLeftColor: '#DCDDDE',
          }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: '600',
              letterSpacing: -0.64,
              color: '#000000',
            }}>
            {cell.value}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '400',
              color: '#717680',
              letterSpacing: -0.32,
              textAlign: 'center',
            }}>
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Clean Record Banner ───────────────────────────────────────────────────────

function CleanRecordBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#2970FF',
        borderRadius: 9999,
        paddingLeft: 24,
        paddingRight: 20,
        paddingVertical: 12,
      }}>
      <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
        <IconsaxLikeIcon size={32} color="#FFFFFF" />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '400',
          color: '#FFFFFF',
          lineHeight: 20,
        }}>
        You're disciplinary records are clean. Keep up the good work!
      </Text>
      <Pressable
        onPress={onDismiss}
        accessibilityLabel="Dismiss clean record banner"
        hitSlop={8}
        className="active:opacity-70">
        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
          <IconsaxCloseCircleIcon size={28} color="#FFFFFF" />
        </View>
      </Pressable>
    </View>
  );
}

// ── Pending NTE Urgent Banner ─────────────────────────────────────────────────

function PendingNTEBanner({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
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
          {count} Notice{count > 1 ? 's' : ''} Require{count === 1 ? 's' : ''} Your Response
        </Text>
        <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 1 }}>
          See the Notice to Explain section below
        </Text>
      </View>
    </Pressable>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────

function QuickActionCard({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: ReactNode;
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
        width: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 2,
        gap: 12,
      }}
      className="active:opacity-75">
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          backgroundColor: '#F5F5F5',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: '#000000',
          letterSpacing: -0.28,
          lineHeight: 20,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
}: {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={{ gap: 16 }}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
        }}
        className="active:opacity-70">
        <Text
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: '500',
            color: '#000000',
          }}>
          {title}
        </Text>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          {expanded
            ? <IconsaxArrowUpIcon size={20} color={T.textMuted} />
            : <IconsaxArrowDownIcon size={20} color={T.textMuted} />}
        </View>
      </Pressable>
      {expanded && <View>{children}</View>}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DisciplineOfficeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const casesSectionY = useRef<number>(0);

  const [ntes, setNtes] = useState<ReturnType<typeof mapNTEToCardProps>[]>([]);
  const [openCasesCount, setOpenCasesCount] = useState(0);
  const [sanctionsCount, setSanctionsCount] = useState(0);

  const studentId = (session?.user?.user_metadata?.student_id as string | undefined) ?? '';

  useEffect(() => {
    if (!studentId) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      fetchNTEsByStudent(studentId),
      fetchCasesByStudent(studentId),
      fetchSanctionsByStudent(studentId),
    ]).then(([rawNTEs, rawCases, rawSanctions]) => {
      if (cancelled) return;
      setNtes(rawNTEs.map(mapNTEToCardProps));
      setOpenCasesCount(rawCases.length);
      setSanctionsCount(rawSanctions.length);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [studentId]);

  const nteCount = ntes.length;
  const pendingNTECount = ntes.filter((n) => n.status === 'pending_response').length;
  const isClean = !isLoading && nteCount === 0 && openCasesCount === 0 && sanctionsCount === 0;

  return (
    <DisciplineOfficeScreenShell>
      <ScreenHeader
        title="Discipline Office"
        subtitle="Reports are reviewed fairly. You can track your case and sanctions here."
        paddingBottom={12}
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          gap: 28,
        }}>

        {/* ── Stats Strip ── */}
        {isLoading ? (
          <ActivityIndicator style={{ marginVertical: 24 }} />
        ) : (
          <StatsStrip
            noticeCount={nteCount}
            openCases={openCasesCount}
            sanctions={sanctionsCount}
          />
        )}

        {/* ── Clean Record Banner ── */}
        {isClean && !bannerDismissed && (
          <CleanRecordBanner onDismiss={() => setBannerDismissed(true)} />
        )}

        {/* ── Pending NTE Urgent Banner ── */}
        {!isLoading && pendingNTECount > 0 && (
          <PendingNTEBanner
            count={pendingNTECount}
            onPress={() =>
              scrollRef.current?.scrollTo({ y: casesSectionY.current, animated: true })
            }
          />
        )}

        {/* ── Quick Actions ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 12,
            paddingRight: HOME_SCROLL_PADDING_H,
          }}>
          <QuickActionCard
            icon={<IconsaxEditIcon size={20} color="#0A0D12" />}
            label="Report an Incident"
            accessibilityLabel="Open incident report form"
            onPress={() => router.push('/discipline-office/incident-report')}
          />
          <QuickActionCard
            icon={<IconsaxBriefcaseIcon size={20} color="#0A0D12" />}
            label="View my Cases"
            accessibilityLabel="View my cases"
            onPress={() => router.push('/discipline-office/my-cases')}
          />
          <QuickActionCard
            icon={<IconsaxPaperIcon size={20} color="#0A0D12" />}
            label="View my Sanctions"
            accessibilityLabel="View my sanctions"
            onPress={() => router.push('/discipline-office/my-sanctions')}
          />
        </ScrollView>

        {/* ── Notice to Explain ── */}
        <CollapsibleSection title="Notice to Explain" defaultExpanded>
          {isLoading ? (
            <ActivityIndicator style={{ marginVertical: 16 }} />
          ) : ntes.length > 0 ? (
            <View style={{ gap: 12 }}>
              {ntes.map((item) => (
                <NTECard
                  key={item.id}
                  variant="default"
                  id={item.id}
                  caseType={item.caseType}
                  description={item.description}
                  issuedAtLabel={item.issuedAtLabel}
                  deadlineLabel={item.deadlineLabel}
                  status={item.status}
                  isOverdue={item.isOverdue}
                  onRespond={() =>
                    router.push({
                      pathname: '/discipline-office/statement-of-explanation',
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
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                color: '#535862',
                textAlign: 'center',
                paddingVertical: 32,
              }}>
              Nothing to see here...
            </Text>
          )}
        </CollapsibleSection>

      </ScrollView>
    </DisciplineOfficeScreenShell>
  );
}
