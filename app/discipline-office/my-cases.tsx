import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DisciplineCaseProgressCard,
  DisciplineOfficeScreenShell,
  type DisciplineCaseStep,
} from '@/components/discipline-office';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';

const HOME_TABS_ROUTE = '/(tabs)';

const NTE_STEPS: DisciplineCaseStep[] = [
  { label: 'NTE Issued', date: 'Nov 12' },
  { label: 'Awaiting Student Response' },
  { label: 'Decision: Accepted / Declined' },
  { label: 'Case Closed' },
];

const MOCK_CASES = [
  {
    id: '1',
    description:
      'The student submitted an assignment containing copied content from an online source without proper citation, resulting in a plagiarism violation.',
    tags: ['Minor Offense', 'Plagiarism'],
    progressPercent: 50,
    currentStepIndex: 1,
    steps: NTE_STEPS,
    defaultExpanded: true,
  },
  {
    id: '2',
    description:
      "Student was reported for repeatedly disrupting an ongoing class session and disregarding the instructor's verbal warnings.",
    tags: ['Minor Offense', 'Disruptive Conduct'],
    progressPercent: 25,
    currentStepIndex: 0,
    steps: NTE_STEPS,
    defaultExpanded: false,
  },
];

export default function MyCasesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(HOME_TABS_ROUTE);
    }
  };

  return (
    <DisciplineOfficeScreenShell>
      <View style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 16 },
          ]}>
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
            <Text style={styles.headerTitle}>Your Cases</Text>
            <Text style={styles.headerSubtitle}>
              View reports filed for your disciplinary concerns and track their status.
            </Text>
          </View>
        </View>

        {/* ── Cases list ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}>
          {MOCK_CASES.map((c) => (
            <DisciplineCaseProgressCard
              key={c.id}
              description={c.description}
              tags={c.tags}
              progressPercent={c.progressPercent}
              currentStepIndex={c.currentStepIndex}
              steps={c.steps}
              defaultExpanded={c.defaultExpanded}
            />
          ))}
        </ScrollView>
      </View>
    </DisciplineOfficeScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
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
  listContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
});
