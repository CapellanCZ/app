import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet } from 'heroui-native';

import {
  ScholarshipAnnouncementBanner,
  ScholarshipCard,
  ScholarshipSearchBar,
} from '@/components/student-development-affairs';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';
import type { ScholarshipProgram } from '@/lib/scholarships/types';

/** Matches home (`app/(tabs)/index.tsx`) powder blue → white backdrop. */
const SCHOLARSHIP_BG_GRADIENT = ['#E8EFFF', '#F4F8FF', '#FFFFFF'] as const;

type SortKey = 'name_asc' | 'name_desc' | 'closes_asc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name_asc', label: 'Scholarship name (A–Z)' },
  { key: 'name_desc', label: 'Scholarship name (Z–A)' },
  { key: 'closes_asc', label: 'Closing date (soonest first)' },
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function formatCloseDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDiscountLabel(program: ScholarshipProgram): string {
  if (program.tuitionDiscountPercent === 100 && program.miscDiscountPercent === 100) {
    return 'Full Scholarship';
  }
  if (program.tuitionDiscountPercent === program.miscDiscountPercent) {
    return `${program.tuitionDiscountPercent}% Discount`;
  }
  return `${program.tuitionDiscountPercent}% Tuition`;
}

/** Search band + white sheet on the same gradient shell as the home tab. */
export default function StudentDevelopmentAffairsScreen() {
  const router = useRouter();
  const { programs, isLoadingPrograms, error, fetchPrograms } = useScholarshipStore();

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');
  const [academicYearFilter, setAcademicYearFilter] = useState<string | null>(null);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const academicYears = useMemo(
    () => [...new Set(programs.map((p) => p.academicYear))].sort((a, b) => b.localeCompare(a)),
    [programs],
  );

  const openBanner = useMemo(() => {
    const open = programs.find((p) => p.status === 'open');
    if (!open) return null;
    return `Scholarship applications for AY ${open.academicYear} ${open.term} are open until ${formatCloseDate(open.applicationCloseDate)}.`;
  }, [programs]);

  const displayed = useMemo(() => {
    let list = [...programs];
    const q = normalize(query);
    if (q.length > 0) {
      list = list.filter((p) => normalize(p.name).includes(q));
    }
    if (academicYearFilter != null) {
      list = list.filter((p) => p.academicYear === academicYearFilter);
    }
    return list.sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name);
      if (sortKey === 'name_desc') return b.name.localeCompare(a.name);
      return new Date(a.applicationCloseDate).getTime() - new Date(b.applicationCloseDate).getTime();
    });
  }, [query, sortKey, academicYearFilter, programs]);

  const selectSort = useCallback((key: SortKey) => {
    setSortKey(key);
    setSortSheetOpen(false);
  }, []);

  const selectYear = useCallback((value: string | null) => {
    setAcademicYearFilter(value);
    setSortSheetOpen(false);
  }, []);

  return (
    <LinearGradient
      colors={[...SCHOLARSHIP_BG_GRADIENT]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
      <ScreenNavbar
        title="Scholarship List"
        titleNumberOfLines={2}
        menuIconSize={32}
      />
      <View className="mt-2 min-h-0 flex-1 bg-transparent px-0">
        <View className="gap-3 px-4 pt-1">
          <ScholarshipSearchBar
            value={query}
            onChangeText={setQuery}
            onSortPress={() => setSortSheetOpen(true)}
          />
          {openBanner ? (
            <View className="mb-2">
              <ScholarshipAnnouncementBanner message={openBanner} />
            </View>
          ) : null}
        </View>
        <View className="min-h-0 flex-1 rounded-t-[30px] pb-12 pt-2">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="w-full gap-3 px-4 pb-4">
              {isLoadingPrograms ? (
                <View className="items-center justify-center py-16">
                  <ActivityIndicator size="large" color="#2970FF" />
                  <Text className="mt-3 text-sm leading-5 text-[#717680]">Loading scholarships…</Text>
                </View>
              ) : error ? (
                <View className="items-center justify-center py-10 px-4">
                  <Text className="text-center text-sm leading-5 text-[#D92D20]">{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={fetchPrograms}
                    className="mt-4 rounded-full bg-[#2970FF] px-5 py-2.5">
                    <Text className="text-sm font-semibold text-white">Try Again</Text>
                  </Pressable>
                </View>
              ) : displayed.length === 0 ? (
                <View className="items-center justify-center py-10 px-4">
                  <Text className="text-center text-sm leading-5 text-[#535862]">
                    {query.length > 0
                      ? 'No scholarships match that name. Try another search or change filters.'
                      : 'No scholarships are currently open.'}
                  </Text>
                </View>
              ) : (
                displayed.map((program) => (
                  <ScholarshipCard
                    key={program.id}
                    title={program.name}
                    categoryLabel={`AY ${program.academicYear} · ${program.term}`}
                    discountLabel={getDiscountLabel(program)}
                    scheduleLabel={`Closes ${formatCloseDate(program.applicationCloseDate)}`}
                    onApplyPress={() =>
                      router.push({
                        pathname: '/student-development-affairs/about-scholarship',
                        params: { id: program.id, title: program.name },
                      })
                    }
                  />
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      <View className="absolute h-0 w-0 overflow-hidden opacity-0" pointerEvents="none">
        <BottomSheet isOpen={sortSheetOpen} onOpenChange={setSortSheetOpen}>
          <BottomSheet.Portal>
            <BottomSheet.Overlay isCloseOnPress />
            <BottomSheet.Content snapPoints={['52%', '72%']} index={0}>
              <BottomSheet.Title className="mb-3 px-1 text-base font-semibold leading-6 text-[#181D27]">
                Sort & filter
              </BottomSheet.Title>
              <ScrollView
                className="max-h-[420px]"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#8F9098]">
                  Sort by
                </Text>
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    accessibilityRole="button"
                    className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                    onPress={() => selectSort(opt.key)}>
                    <Text
                      className={`text-sm leading-5 ${sortKey === opt.key ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
                {academicYears.length > 0 ? (
                  <>
                    <Text className="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-[#8F9098]">
                      Academic Year
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                      onPress={() => selectYear(null)}>
                      <Text
                        className={`text-sm leading-5 ${academicYearFilter === null ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                        All years
                      </Text>
                    </Pressable>
                    {academicYears.map((year) => (
                      <Pressable
                        key={year}
                        accessibilityRole="button"
                        className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                        onPress={() => selectYear(year)}>
                        <Text
                          className={`text-sm leading-5 ${academicYearFilter === year ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                          AY {year}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                ) : null}
              </ScrollView>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet>
      </View>
    </LinearGradient>
  );
}
