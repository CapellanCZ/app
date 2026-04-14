import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BottomSheet } from 'heroui-native';

import {
  ScholarshipAnnouncementBanner,
  ScholarshipCard,
  ScholarshipSearchBar,
} from '@/components/student-development-affairs';
import { ScreenNavbar } from '@/components/ScreenNavbar';

const SCHOLARSHIP_ANNOUNCEMENT_COPY =
  'Scholarship application for AY 2025 - 2026 3rd Term is only open from January 22, 2026 until March 14, 2026.';

const MOCK_SCHOLARSHIPS = [
  {
    id: '1',
    title: 'White Scholarship',
    categoryLabel: 'Academic Excellence',
    discountLabel: '50% Discount',
    scheduleLabel: 'every start of academic year',
  },
  {
    id: '2',
    title: 'Gold Scholarship',
    categoryLabel: 'Academic Excellence',
    discountLabel: '50% Discount',
    scheduleLabel: 'every start of academic year',
  },
  {
    id: '3',
    title: 'Student Leadership Award',
    categoryLabel: 'Leadership & Service',
    discountLabel: 'Partial grant',
    scheduleLabel: 'annual renewal',
  },
] as const;

type Scholarship = (typeof MOCK_SCHOLARSHIPS)[number];

type SortKey = 'name_asc' | 'name_desc' | 'category_asc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name_asc', label: 'Scholarship name (A–Z)' },
  { key: 'name_desc', label: 'Scholarship name (Z–A)' },
  { key: 'category_asc', label: 'Category (A–Z)' },
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/** Figma 1263:2934 — #FAFAFA chrome, search band, white sheet 30 top radius. */
export default function StudentDevelopmentAffairsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(MOCK_SCHOLARSHIPS.map((s) => s.categoryLabel))].sort((a, b) => a.localeCompare(b)),
    [],
  );

  const displayed = useMemo(() => {
    let list: Scholarship[] = [...MOCK_SCHOLARSHIPS];
    const q = normalize(query);
    if (q.length > 0) {
      list = list.filter((s) => normalize(s.title).includes(q));
    }
    if (categoryFilter != null) {
      list = list.filter((s) => s.categoryLabel === categoryFilter);
    }
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'name_asc') return a.title.localeCompare(b.title);
      if (sortKey === 'name_desc') return b.title.localeCompare(a.title);
      const c = a.categoryLabel.localeCompare(b.categoryLabel);
      return c !== 0 ? c : a.title.localeCompare(b.title);
    });
    return sorted;
  }, [query, sortKey, categoryFilter]);

  const selectSort = useCallback((key: SortKey) => {
    setSortKey(key);
    setSortSheetOpen(false);
  }, []);

  const selectCategory = useCallback((value: string | null) => {
    setCategoryFilter(value);
    setSortSheetOpen(false);
  }, []);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar
        title="Student Development & Activities"
        titleNumberOfLines={2}
        menuIconSize={32}
        onBackPress={() => router.replace('/(tabs)')}
      />
      <View className="mt-2 min-h-0 flex-1 px-0">
        <View className="gap-3 px-4 pb-5 pt-1">
          <ScholarshipSearchBar
            value={query}
            onChangeText={setQuery}
            onSortPress={() => setSortSheetOpen(true)}
          />
          <View className="mt-2">
            <ScholarshipAnnouncementBanner variant="warning" message={SCHOLARSHIP_ANNOUNCEMENT_COPY} />
          </View>
        </View>
        <View className="min-h-0 flex-1 rounded-t-[30px] bg-white pb-8 pt-6">
          <View className="mb-4 px-6">
            <Text className="text-lg font-semibold leading-6 tracking-[0.08px] text-[#1F2024]">
              Academic Scholarships
            </Text>
          </View>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="w-full gap-3 px-4 pb-4">
              {displayed.length === 0 ? (
                <View className="items-center justify-center py-10 px-4">
                  <Text className="text-center text-sm leading-5 text-[#535862]">
                    No scholarships match that name. Try another search or change sort and filters.
                  </Text>
                </View>
              ) : (
                displayed.map((item) => (
                  <ScholarshipCard
                    key={item.id}
                    title={item.title}
                    categoryLabel={item.categoryLabel}
                    discountLabel={item.discountLabel}
                    scheduleLabel={item.scheduleLabel}
                    onApplyPress={() =>
                      router.push({
                        pathname: '/student-development-affairs/about-scholarship',
                        params: { id: item.id, title: item.title },
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
                <Text className="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-[#8F9098]">
                  Category
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                  onPress={() => selectCategory(null)}>
                  <Text
                    className={`text-sm leading-5 ${categoryFilter === null ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                    All categories
                  </Text>
                </Pressable>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    accessibilityRole="button"
                    className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                    onPress={() => selectCategory(cat)}>
                    <Text
                      className={`text-sm leading-5 ${categoryFilter === cat ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet>
      </View>
    </View>
  );
}
