import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { IconsaxSearchIcon } from '@/components/icons/IconsaxSearchIcon';
import {
  ScholarshipCard,
  ScholarshipDetailModal,
  ScholarshipFilterChips,
} from '@/components/student-development-affairs';
import {
  getScholarshipCardStatus,
  programMatchesChipFilter,
  type ScholarshipChipFilter,
  type ScholarshipListFilter,
} from '@/lib/scholarships/programUtils';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';
import type { ScholarshipProgram } from '@/lib/scholarships/types';

const BRAND = '#2970FF';

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function formatCloseDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `Closes ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function parseListFilter(value: string | string[] | undefined): ScholarshipListFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'high_demand' || raw === 'limited_slots' || raw === 'closing_soon') return raw;
  return 'all';
}

/** See-all scholarships — mirrors `health-service/doctors.tsx` layout. */
export default function AllScholarshipsScreen() {
  const insets = useSafeAreaInsets();
  const { filter: filterParam, q: qParam } = useLocalSearchParams<{
    filter?: string;
    q?: string;
  }>();

  const { programs, isLoadingPrograms, error, fetchPrograms } = useScholarshipStore();

  const [search, setSearch] = useState(() => {
    const raw = Array.isArray(qParam) ? qParam[0] : qParam;
    return raw ?? '';
  });
  const [listFilter, setListFilter] = useState<ScholarshipListFilter>(() =>
    parseListFilter(filterParam),
  );
  const [selectedProgram, setSelectedProgram] = useState<ScholarshipProgram | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (programs.length === 0 && !isLoadingPrograms) {
        void fetchPrograms();
      }
    }, [fetchPrograms, isLoadingPrograms, programs.length]),
  );

  const handleChipPress = useCallback((filter: ScholarshipChipFilter) => {
    setListFilter((prev) => (prev === filter ? 'all' : filter));
  }, []);

  const filtered = useMemo(() => {
    let list =
      listFilter === 'all'
        ? [...programs]
        : programs.filter((p) => programMatchesChipFilter(p, listFilter));
    const q = normalize(search);
    if (q.length > 0) {
      list = list.filter((p) => normalize(p.name).includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [listFilter, programs, search]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: '#F5F5F5',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            className="active:opacity-70">
            <IconsaxArrowLeftIcon size={20} color="#252B37" />
          </Pressable>

          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#000000',
                letterSpacing: -0.48,
              }}>
              List of Scholarships
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: '#535862',
                letterSpacing: -0.28,
              }}>
              Browse scholarships and apply for the one that fits you
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 45,
              backgroundColor: '#FFFFFF',
              borderRadius: 9999,
              paddingHorizontal: 16,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 3,
            }}>
            <IconsaxSearchIcon size={16} color="#717680" />
            <TextInput
              accessibilityLabel="Search scholarships"
              value={search}
              onChangeText={setSearch}
              placeholder="Find scholarship here..."
              placeholderTextColor="#71717A"
              returnKeyType="search"
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '300',
                color: '#252B37',
                padding: 0,
              }}
            />
          </View>

          <View style={{ gap: 20 }}>
            <ScholarshipFilterChips activeFilter={listFilter} onFilterChange={handleChipPress} />

            {isLoadingPrograms && programs.length === 0 ? (
              <View className="items-center justify-center py-16">
                <ActivityIndicator size="large" color={BRAND} />
                <Text className="mt-3 text-sm leading-5 text-[#717680]">Loading scholarships…</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center py-10">
                <Text className="text-center text-sm leading-5 text-[#D92D20]">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void fetchPrograms()}
                  className="mt-4 rounded-full bg-[#2970FF] px-5 py-2.5 active:opacity-80">
                  <Text className="text-sm font-semibold text-white">Try Again</Text>
                </Pressable>
              </View>
            ) : filtered.length === 0 ? (
              <Text
                style={{
                  width: '100%',
                  paddingVertical: 32,
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9095A1',
                }}>
                {search.length > 0
                  ? 'No scholarships match your search.'
                  : 'No scholarships match this filter.'}
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {filtered.map((program) => (
                  <ScholarshipCard
                    key={program.id}
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
                ))}
              </View>
            )}
          </View>
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
