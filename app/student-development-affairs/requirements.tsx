import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { IconsaxDocumentTextIcon } from '@/components/icons/IconsaxDocumentTextIcon';
import {
  ScholarshipRequirementListCard,
} from '@/components/student-development-affairs/ScholarshipRequirementListCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  REQUIREMENT_TABS,
  buildRequirementTrackItems,
  filterRequirementsByTab,
  type RequirementTab,
} from '@/lib/scholarships/requirementTracking';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';

function parseInitialTab(value: string | string[] | undefined): RequirementTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'submitted' || raw === 'under_review' || raw === 'pending') return raw;
  return 'pending';
}

export default function ScholarshipRequirementsScreen() {
  const insets = useSafeAreaInsets();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<RequirementTab>(() => parseInitialTab(tabParam));

  const {
    myEnrollment,
    myApplications,
    fetchMyEnrollment,
    fetchMyApplications,
    fetchApplicationById,
    subscribeToCompliance,
    subscribeToMyApplications,
  } = useScholarshipStore();

  useFocusEffect(
    useCallback(() => {
      void fetchMyEnrollment();
      void fetchMyApplications();
    }, [fetchMyApplications, fetchMyEnrollment]),
  );

  useEffect(() => {
    setActiveTab(parseInitialTab(tabParam));
  }, [tabParam]);

  useEffect(() => {
    if (!myEnrollment?.id) return;
    return subscribeToCompliance(myEnrollment.id);
  }, [myEnrollment?.id, subscribeToCompliance]);

  useEffect(() => {
    if (!session?.user?.id) return;
    return subscribeToMyApplications(session.user.id);
  }, [session?.user?.id, subscribeToMyApplications]);

  const allItems = useMemo(
    () => buildRequirementTrackItems(myEnrollment, myApplications),
    [myApplications, myEnrollment],
  );

  const filtered = useMemo(
    () => filterRequirementsByTab(allItems, activeTab),
    [activeTab, allItems],
  );

  const openItem = useCallback(
    async (item: (typeof allItems)[number]) => {
      if (item.kind === 'compliance') {
        router.push('/my-scholarship');
        return;
      }
      if (item.application) {
        await fetchApplicationById(item.application.id);
        router.push('/student-development-affairs/apply');
      }
    },
    [fetchApplicationById],
  );

  const emptyCopy = useMemo(() => {
    if (activeTab === 'pending') {
      return {
        title: 'No Pending Requirements',
        body: "You don't have any pending requirements or draft applications right now.",
      };
    }
    if (activeTab === 'submitted') {
      return {
        title: 'No Submitted Items',
        body: 'Submitted applications will appear here while waiting for review.',
      };
    }
    return {
      title: 'Nothing Under Review',
      body: 'Requirements and applications under staff review will show up here.',
    };
  }, [activeTab]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          gap: 24,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F0F0F0',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            className="active:opacity-70">
            <IconsaxArrowLeftIcon size={20} color="#181D27" />
          </Pressable>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '600', color: '#000000', letterSpacing: -0.48 }}>
              Requirements
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '300', color: '#535862', letterSpacing: -0.28 }}>
              Track pending, submitted, and under-review items
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F5F5F5',
              borderRadius: 100,
              padding: 4,
            }}>
            {REQUIREMENT_TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    height: 33,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#FFFFFF' : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: selected ? '500' : '400',
                      color: selected ? '#007AFF' : '#090909',
                      letterSpacing: -0.23,
                    }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 24 }}>
            {filtered.length === 0 ? (
              <View
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 28,
                  gap: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <IconsaxDocumentTextIcon size={48} color="#A4A7AE" />
                <View style={{ gap: 4, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#717680',
                      letterSpacing: -0.32,
                      textAlign: 'center',
                    }}>
                    {emptyCopy.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#A4A7AE',
                      letterSpacing: -0.24,
                      textAlign: 'center',
                    }}>
                    {emptyCopy.body}
                  </Text>
                </View>
              </View>
            ) : (
              filtered.map((item) => (
                <ScholarshipRequirementListCard
                  key={item.id}
                  item={item}
                  onPress={() => void openItem(item)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
