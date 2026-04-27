import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'heroui-native';

import { sanctionsProgressStore } from '@/features/discipline/sanctionsProgressStore';

import {
  DisciplineOfficeScreenShell,
  SanctionCard,
  type SanctionCardProps,
  type SanctionStatus,
  type SanctionType,
} from '@/components/discipline-office';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';

const HOME_TABS_ROUTE = '/(tabs)';

type MockSanction = Omit<SanctionCardProps, 'onUploadProof' | 'sanctionType'> & {
  id: string;
  sanctionType?: SanctionType;
};

const MOCK_SANCTIONS: MockSanction[] = [
  {
    id: '1',
    status: 'in_progress',
    title: 'Community Service',
    description:
      'Complete 20 hours of community service at the campus grounds as assigned by the Discipline Office.',
    sanctionType: 'community_service',
    dueDateLabel: 'Due May 15',
    progress: { current: 10, total: 24, unit: 'hours' },
    timeAgoLabel: '1 min ago',
  },
  {
    id: '2',
    status: 'pending',
    title: 'Written Apology Letter',
    description:
      'Submit a formal written apology letter addressed to the affected faculty member and the Discipline Office.',
    sanctionType: 'disciplinary_warning',
    dueDateLabel: 'Due May 15',
    timeAgoLabel: '1 hour ago',
  },
  {
    id: '3',
    status: 'in_review',
    title: 'Written Apology Letter',
    description:
      'Submit a formal written apology letter addressed to the affected faculty member and the Discipline Office.',
    sanctionType: 'probation',
    dueDateLabel: 'Due May 15',
    timeAgoLabel: '1 hour ago',
    submittedAtLabel: 'Apr 20, 2026',
  },
  {
    id: '4',
    status: 'case_closed',
    title: 'Written Apology Letter',
    description:
      'Submit a formal written apology letter addressed to the affected faculty member and the Discipline Office.',
    sanctionType: 'suspension',
    dueDateLabel: 'Due May 15',
    timeAgoLabel: '1 hour ago',
    completedAtLabel: 'Apr 20, 2026',
  },
];

type FilterKey = SanctionStatus | 'all';

type FilterDef = {
  key: FilterKey;
  label: string;
  dotColor: string;
  activeColor: string;
};

const FILTERS: FilterDef[] = [
  { key: 'all',         label: 'All',         dotColor: '#181D27', activeColor: '#181D27' },
  { key: 'in_progress', label: 'In Progress', dotColor: '#2970FF', activeColor: '#2970FF' },
  { key: 'pending',     label: 'Pending',     dotColor: '#F79009', activeColor: '#F79009' },
  { key: 'in_review',   label: 'In Review',   dotColor: '#17B26A', activeColor: '#17B26A' },
  { key: 'case_closed', label: 'Case Closed', dotColor: '#A4A7AE', activeColor: '#717680' },
];

export default function MySanctionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sanctions, setSanctions] = useState<MockSanction[]>(MOCK_SANCTIONS);

  useFocusEffect(
    useCallback(() => {
      const updates = sanctionsProgressStore.drain();
      if (updates.length === 0) return;
      setSanctions((prev) =>
        prev.map((s) => {
          const upd = updates.find((u) => u.sanctionId === s.id);
          if (!upd || !s.progress) return s;
          const newCurrent = Math.min(
            s.progress.total,
            s.progress.current + upd.additionalHours,
          );
          return { ...s, progress: { ...s.progress, current: newCurrent } };
        }),
      );
      const totalAdded = updates.reduce((sum, u) => sum + u.additionalHours, 0);
      toast.show({
        variant: 'success',
        placement: 'top',
        duration: 4200,
        label: 'Admin approved!',
        description: `${totalAdded.toFixed(2)} hrs added to your community service progress.`,
        icon: (
          <View style={{ paddingTop: 2 }}>
            <Ionicons name="checkmark-circle" size={26} color="#079455" />
          </View>
        ),
      });
    }, [toast]),
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(HOME_TABS_ROUTE);
    }
  };

  const handleUploadProof = (sanction: MockSanction) => {
    router.push({
      pathname: '/discipline-office/upload-proof',
      params: {
        sanctionId: sanction.id,
        sanctionTitle: sanction.title,
        sanctionDescription: sanction.description,
        sanctionType: sanction.sanctionType ?? '',
        dueDateLabel: sanction.dueDateLabel,
        totalHours: sanction.progress?.total.toString() ?? '0',
        currentHours: sanction.progress?.current.toString() ?? '0',
      },
    });
  };

  const filtered =
    activeFilter === 'all'
      ? sanctions
      : sanctions.filter((s) => s.status === activeFilter);

  return (
    <DisciplineOfficeScreenShell>
      <View style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={handleBack}
            className="active:opacity-70"
            style={styles.backBtn}>
            <IconsaxArrowLeftIcon size={20} color="#181D27" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Your Sanctions</Text>
            <Text style={styles.headerSubtitle}>
              Track your assigned sanctions and upload proof of compliance for review.
            </Text>
          </View>
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
          bounces={false}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count =
              f.key === 'all'
                ? MOCK_SANCTIONS.length
                : MOCK_SANCTIONS.filter((s) => s.status === f.key).length;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="active:opacity-80"
                style={[
                  styles.filterChip,
                  isActive
                    ? { backgroundColor: f.activeColor, borderColor: f.activeColor }
                    : styles.filterChipInactive,
                ]}>
                {!isActive && (
                  <View style={[styles.filterDot, { backgroundColor: f.dotColor }]} />
                )}
                <Text
                  style={[
                    styles.filterLabel,
                    isActive ? styles.filterLabelActive : styles.filterLabelInactive,
                  ]}>
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    isActive ? styles.filterBadgeActive : styles.filterBadgeInactive,
                  ]}>
                  <Text
                    style={[
                      styles.filterBadgeText,
                      isActive ? styles.filterBadgeTextActive : styles.filterBadgeTextInactive,
                    ]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Sanctions list ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.listScroll}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          ]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No sanctions found</Text>
              <Text style={styles.emptySubtitle}>
                There are no sanctions matching this filter.
              </Text>
            </View>
          ) : (
            filtered.map((sanction) => (
              <SanctionCard
                key={sanction.id}
                status={sanction.status}
                title={sanction.title}
                description={sanction.description}
                sanctionType={sanction.sanctionType}
                dueDateLabel={sanction.dueDateLabel}
                progress={sanction.progress}
                timeAgoLabel={sanction.timeAgoLabel}
                submittedAtLabel={sanction.submittedAtLabel}
                completedAtLabel={sanction.completedAtLabel}
                onUploadProof={
                  sanction.status === 'in_progress' || sanction.status === 'pending'
                    ? () => handleUploadProof(sanction)
                    : undefined
                }
              />
            ))
          )}
        </ScrollView>
      </View>
    </DisciplineOfficeScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.48,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#535862',
    letterSpacing: -0.28,
    lineHeight: 20,
  },
  // Filter row
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E9EAEB',
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.26,
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  filterLabelInactive: {
    color: '#414651',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeInactive: {
    backgroundColor: '#E9EAEB',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.22,
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  filterBadgeTextInactive: {
    color: '#535862',
  },
  // List
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  // Empty state
  emptyState: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#181D27',
    letterSpacing: -0.32,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#717680',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
