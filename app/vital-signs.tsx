import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonalInfoNoteCard } from '@/components/profile/PersonalInfoNoteCard';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { VitalsSignsGrid } from '@/components/vitals/VitalsSignsGrid';
import { useAuth } from '@/lib/auth/AuthProvider';
import { healthUiText } from '@/lib/typography/healthUiText';
import { formatVitalsUpdatedAt, hasVitalsReadings } from '@/lib/vitals/vitalsDisplay';
import { useVitalsStore } from '@/lib/vitals/vitalsStore';

export default function VitalSignsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patient } = useAuth();
  const vitals = useVitalsStore((s) => s.vitals);
  const loadVitals = useVitalsStore((s) => s.load);
  const [refreshing, setRefreshing] = useState(false);

  const studentId = patient?.student_id ?? null;
  const employeeId = patient?.employee_id ?? null;

  useFocusEffect(
    useCallback(() => {
      void loadVitals({ studentId, employeeId, force: true });
    }, [studentId, employeeId, loadVitals]),
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadVitals({ studentId, employeeId, force: true });
    } finally {
      setRefreshing(false);
    }
  }, [studentId, employeeId, loadVitals]);

  const hasReadings = hasVitalsReadings(vitals);
  const updatedLabel = formatVitalsUpdatedAt(vitals.updatedAt);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#111111"
            colors={['#111111']}
            progressBackgroundColor="#FFFFFF"
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
          gap: 20,
        }}>
        <View style={{ gap: 16 }}>
          <CircleBackButton onPress={handleBack} />
          <View style={{ gap: 6 }}>
            <Text accessibilityRole="header" style={healthUiText.pageTitle}>
              Vital Signs
            </Text>
            <Text style={healthUiText.pageSubtitle}>Your latest clinic health readings</Text>
          </View>
        </View>

        {hasReadings && updatedLabel ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: '#D3E9FA',
            }}>
            <Text style={healthUiText.badge}>Last updated · {updatedLabel}</Text>
          </View>
        ) : null}

        <VitalsSignsGrid
          vitals={vitals}
          subtitle="Recorded by campus clinic staff during your visit."
        />

        <PersonalInfoNoteCard message="Vitals are recorded by campus clinic staff during your visit. These readings are for information only and are not a medical diagnosis." />
      </ScrollView>
    </View>
  );
}
