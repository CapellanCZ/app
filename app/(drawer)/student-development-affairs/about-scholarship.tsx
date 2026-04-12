import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'heroui-native';

import { ScreenNavbar } from '@/components/ScreenNavbar';
import { ScholarshipDetailHeroCard } from '@/components/student-development-affairs/ScholarshipDetailHeroCard';
import { ScholarshipDetailSegmentedTabs } from '@/components/student-development-affairs/ScholarshipDetailSegmentedTabs';
import type { ScholarshipDetailTab } from '@/components/student-development-affairs/ScholarshipDetailSegmentedTabs';
import { ScholarshipEligibilityChecklist } from '@/components/student-development-affairs/ScholarshipEligibilityChecklist';
import { ScholarshipFeeSummaryCard } from '@/components/student-development-affairs/ScholarshipFeeSummaryCard';
import { ScholarshipRequirementsList } from '@/components/student-development-affairs/ScholarshipRequirementsList';

const DEFAULT_SPONSOR = 'DOÑA MIGUELA M. JHOCSON';
const DEFAULT_ABOUT =
  'This scholarship may apply to a senior high student graduating with high honors. Limited number of scholars available.';

const REQUIREMENT_ITEMS = [
  'Certificate Award',
  'Original High School Report Card',
  'Certificate of Good Moral Character',
  'PSA Birth Certificate (photocopy)',
  '2x2 picture (2 copies)',
  'No grade lower than 90 (1st–4th grading)',
  'Pass NU Scholarship Exam',
] as const;

const ELIGIBILITY_ITEMS = [
  'Maintain CGWA of at least 3.0',
  'Keep grades not lower than 2.50',
  'No fail, repeat, or zero-credit subjects',
  'One-time grace period for grade issues',
  'Must be enrolled continuously',
  'Maintain good conduct record',
  'Cannot reclassify as Gold Scholar',
  'Stay within program curriculum flow',
  'No add/drop unless College initiated',
  'Maintain minimum load requirements',
] as const;

type DetailConfig = {
  title: string;
  sponsorLabel: string;
  aboutBody: string;
  tuitionPercent: string;
  miscPercent: string;
};

const MOCK_BY_ID: Record<string, DetailConfig> = {
  '1': {
    title: 'White Scholarship',
    sponsorLabel: DEFAULT_SPONSOR,
    aboutBody: DEFAULT_ABOUT,
    tuitionPercent: '50%',
    miscPercent: '50%',
  },
  '2': {
    title: 'Gold Scholarship',
    sponsorLabel: DEFAULT_SPONSOR,
    aboutBody: DEFAULT_ABOUT,
    tuitionPercent: '50%',
    miscPercent: '50%',
  },
  '3': {
    title: 'Gold Scholarship',
    sponsorLabel: DEFAULT_SPONSOR,
    aboutBody: DEFAULT_ABOUT,
    tuitionPercent: '50%',
    miscPercent: '50%',
  },
};

function resolveDetail(id: string | undefined, titleParam: string | undefined): DetailConfig {
  if (id && MOCK_BY_ID[id]) {
    return MOCK_BY_ID[id];
  }
  return {
    title: titleParam?.trim() || 'Scholarship',
    sponsorLabel: DEFAULT_SPONSOR,
    aboutBody: DEFAULT_ABOUT,
    tuitionPercent: '100%',
    miscPercent: '100%',
  };
}

export default function AboutScholarshipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, title: titleParam } = useLocalSearchParams<{ id?: string; title?: string }>();

  const detail = useMemo(() => resolveDetail(id, titleParam), [id, titleParam]);

  const [tab, setTab] = useState<ScholarshipDetailTab>('requirements');
  const [eligibilityChecked, setEligibilityChecked] = useState(() =>
    ELIGIBILITY_ITEMS.map(() => false),
  );

  const toggleEligibility = useCallback((index: number) => {
    setEligibilityChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const onWantToApply = useCallback(() => {
    Alert.alert('Apply', `Application flow for ${detail.title} is not wired yet.`);
  }, [detail.title]);

  return (
    <View className="flex-1 bg-white">
      <ScreenNavbar
        title="About Scholarship"
        menuIconSize={32}
        onBackPress={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <View className="gap-4">
          <ScholarshipDetailHeroCard
            sponsorLabel={detail.sponsorLabel}
            title={detail.title}
            aboutBody={detail.aboutBody}
          />
          <ScholarshipFeeSummaryCard
            tuitionPercent={detail.tuitionPercent}
            miscPercent={detail.miscPercent}
          />
          <View className="gap-4">
            <ScholarshipDetailSegmentedTabs active={tab} onChange={setTab} />
            {tab === 'requirements' ? (
              <ScholarshipRequirementsList items={[...REQUIREMENT_ITEMS]} />
            ) : (
              <ScholarshipEligibilityChecklist
                items={[...ELIGIBILITY_ITEMS]}
                checked={eligibilityChecked}
                onToggle={toggleEligibility}
              />
            )}
          </View>
        </View>
      </ScrollView>
      <View
        className="px-5 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <Button
          variant="primary"
          className="h-12 w-full rounded-full border border-[#001229]/10 bg-[#2970FF]"
          onPress={onWantToApply}>
          <Button.Label className="text-sm font-semibold text-white">I want to apply</Button.Label>
        </Button>
      </View>
    </View>
  );
}
