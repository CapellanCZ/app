import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HomeScreenHeader } from '@/components/home/HomeScreenHeader';
import {
  ScholarshipCard,
  ScholarshipDetailModal,
  ScholarshipFilterChips,
  ScholarshipPendingRequirementsEmpty,
  ScholarshipRequirementPreviewCard,
} from '@/components/student-development-affairs';
import { IconsaxSearchIcon } from '@/components/icons/IconsaxSearchIcon';
import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchStudentProfile } from '@/lib/profile/profileApi';
import {
  getScholarshipCardStatus,
  programMatchesChipFilter,
  type ScholarshipListFilter,
} from '@/lib/scholarships/programUtils';
import {
  buildRequirementTrackItems,
  countPendingRequirements,
  getHighlightedRequirement,
} from '@/lib/scholarships/requirementTracking';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';
import type { ScholarshipProgram } from '@/lib/scholarships/types';

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function formatCloseDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `Closes ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

/** Figma 1685:3783 — Scholarships hub with grey hero, filters, and program list. */
export default function StudentDevelopmentAffairsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const {
    programs,
    myEnrollment,
    myApplications,
    isLoadingPrograms,
    error,
    fetchPrograms,
    fetchMyEnrollment,
    fetchMyApplications,
    fetchApplicationById,
    subscribeToPrograms,
    subscribeToCompliance,
    subscribeToMyApplications,
  } = useScholarshipStore();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ScholarshipProgram | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [listFilter, setListFilter] = useState<ScholarshipListFilter>('high_demand');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (programs.length === 0 && !isLoadingPrograms) {
      void fetchPrograms();
    }
    void fetchMyEnrollment();
    void fetchMyApplications();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchStudentProfile(session.user.id).then((p) => {
      if (p?.avatar_url) setAvatarUrl(p.avatar_url);
    });
  }, [session?.user?.id]);

  useEffect(() => {
    const unsubscribePrograms = subscribeToPrograms();
    return unsubscribePrograms;
  }, [subscribeToPrograms]);

  useEffect(() => {
    if (!myEnrollment?.id) return;
    return subscribeToCompliance(myEnrollment.id);
  }, [myEnrollment?.id, subscribeToCompliance]);

  useEffect(() => {
    if (!session?.user?.id) return;
    return subscribeToMyApplications(session.user.id);
  }, [session?.user?.id, subscribeToMyApplications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPrograms(), fetchMyEnrollment(), fetchMyApplications()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMyApplications, fetchMyEnrollment, fetchPrograms]);

  const requirementItems = useMemo(
    () => buildRequirementTrackItems(myEnrollment, myApplications),
    [myApplications, myEnrollment],
  );

  const pendingRequirementsCount = useMemo(
    () => countPendingRequirements(requirementItems),
    [requirementItems],
  );

  const highlightedRequirement = useMemo(
    () => getHighlightedRequirement(requirementItems),
    [requirementItems],
  );

  const openHighlightedRequirement = useCallback(async () => {
    if (!highlightedRequirement) return;
    if (highlightedRequirement.kind === 'compliance') {
      router.push('/my-scholarship');
      return;
    }
    if (highlightedRequirement.application) {
      await fetchApplicationById(highlightedRequirement.application.id);
      router.push('/student-development-affairs/apply');
    }
  }, [fetchApplicationById, highlightedRequirement]);

  const displayed = useMemo(() => {
    let list =
      listFilter === 'all'
        ? [...programs]
        : programs.filter((p) => programMatchesChipFilter(p, listFilter));
    const q = normalize(query);
    if (q.length > 0) {
      list = list.filter((p) => normalize(p.name).includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [listFilter, programs, query]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 8,
        }}>
        <View style={{ padding: 8 }}>
          <View
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 32,
              paddingTop: insets.top,
              paddingBottom: 20,
              paddingHorizontal: 14,
              gap: 24,
            }}>
            <HomeScreenHeader title="Scholarships" avatarUrl={avatarUrl} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 9999,
                height: 45,
                paddingHorizontal: 16,
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
                elevation: 2,
              }}>
              <IconsaxSearchIcon size={16} color="#71717A" />
              <TextInput
                accessibilityLabel="Search scholarships"
                placeholder="Find scholarship here..."
                placeholderTextColor="#71717A"
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, fontSize: 16, fontWeight: '300', color: '#000', padding: 0 }}
              />
            </View>

            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 20, fontWeight: '500', color: '#000000' }}>
                    Pending Requirements
                  </Text>
                  {pendingRequirementsCount > 0 ? (
                    <View
                      style={{
                        minWidth: 16,
                        height: 16,
                        borderRadius: 999,
                        backgroundColor: '#F64235',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '400',
                          color: '#FFF',
                          textAlign: 'center',
                          lineHeight: 12,
                        }}>
                        {pendingRequirementsCount > 9 ? '9+' : pendingRequirementsCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="See all requirements"
                  onPress={() => router.push('/student-development-affairs/requirements')}
                  hitSlop={10}
                  className="active:opacity-70">
                  <Text style={{ fontSize: 14, fontWeight: '400', color: '#717680' }}>See All</Text>
                </Pressable>
              </View>

              {highlightedRequirement ? (
                <ScholarshipRequirementPreviewCard
                  item={highlightedRequirement}
                  onPress={() => void openHighlightedRequirement()}
                />
              ) : (
                <ScholarshipPendingRequirementsEmpty />
              )}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12, gap: 20 }}>
          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: '#000000' }}>
                List of Scholarships
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all scholarships"
                onPress={() =>
                  router.push({
                    pathname: '/student-development-affairs/scholarships',
                    params: {
                      ...(listFilter !== 'all' ? { filter: listFilter } : {}),
                      ...(query.trim() ? { q: query.trim() } : {}),
                    },
                  })
                }
                hitSlop={10}
                className="active:opacity-70">
                <Text style={{ fontSize: 14, fontWeight: '400', color: '#717680' }}>See All</Text>
              </Pressable>
            </View>
            <ScholarshipFilterChips
              activeFilter={listFilter}
              onFilterChange={setListFilter}
            />
          </View>

          {isLoadingPrograms && programs.length === 0 ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="large" color="#2970FF" />
              <Text className="mt-3 text-sm leading-5 text-[#717680]">Loading scholarships…</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center px-4 py-10">
              <Text className="text-center text-sm leading-5 text-[#D92D20]">{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void fetchPrograms()}
                className="mt-4 rounded-full bg-[#2970FF] px-5 py-2.5 active:opacity-80">
                <Text className="text-sm font-semibold text-white">Try Again</Text>
              </Pressable>
            </View>
          ) : displayed.length === 0 ? (
            <View className="items-center justify-center px-4 py-10">
              <Text className="text-center text-sm leading-5 text-[#535862]">
                {query.length > 0
                  ? 'No scholarships match your search. Try another keyword or filter.'
                  : 'No scholarships match this filter.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {displayed.map((program, index) => (
                <Animated.View
                  key={program.id}
                  entering={FadeInDown.delay(index * 55)
                    .duration(320)
                    .springify()
                    .damping(18)}>
                  <ScholarshipCard
                    title={program.name}
                    academicYear={program.academicYear || '2024-2025'}
                    term={program.term || '1st Term'}
                    slotsLeft={program.totalSlots - program.filledSlots}
                    tuitionPercent={program.tuitionDiscountPercent}
                    miscPercent={program.miscDiscountPercent}
                    minGpa={program.minGpa}
                    closeDate={formatCloseDate(program.applicationCloseDate)}
                    applicationCount={program.filledSlots}
                    status={getScholarshipCardStatus(program)}
                    onPress={() => {
                      setSelectedProgram(program);
                      setModalOpen(true);
                    }}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ScholarshipDetailModal
        program={selectedProgram}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </View>
  );
}
