import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeVitalsRow } from '@/components/home/HomeVitalsRow';
import { PersonalInfoField } from '@/components/profile/PersonalInfoField';
import { PersonalInfoNoteCard } from '@/components/profile/PersonalInfoNoteCard';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { VitalsEmptyState } from '@/components/vitals/VitalsEmptyState';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';
import {
  buildSecondaryMeasurements,
  formatVitalsUpdatedAt,
  hasVitalsReadings,
} from '@/lib/vitals/vitalsDisplay';
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
  const secondaryMeasurements = buildSecondaryMeasurements(vitals);

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
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: Inter.medium,
                fontSize: 30,
                color: '#222222',
                letterSpacing: -2.24,
                lineHeight: 38,
              }}>
              Vital Signs
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 18,
                color: '#727272',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              Your latest clinic health readings
            </Text>
          </View>
        </View>

        {hasReadings ? (
          <>
            {updatedLabel ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: '#D3E9FA',
                }}>
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 13,
                    color: '#4D7A9A',
                    letterSpacing: -0.2,
                    lineHeight: 18,
                  }}>
                  Last updated · {updatedLabel}
                </Text>
              </View>
            ) : null}

            <ProfileSection title="Primary vitals">
              <HomeVitalsRow
                variant="detail"
                bloodPressure={vitals.bloodPressure}
                heartRate={vitals.heartRate}
              />
            </ProfileSection>

            {secondaryMeasurements.length > 0 ? (
              <ProfileSection title="Other measurements">
                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: SCHEDULE_PARTNER.cardBorder,
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}>
                  {secondaryMeasurements.map((row, index) => (
                    <PersonalInfoField
                      key={row.label}
                      label={row.label}
                      value={row.value}
                      isLast={index === secondaryMeasurements.length - 1}
                    />
                  ))}
                </View>
              </ProfileSection>
            ) : null}
          </>
        ) : (
          <VitalsEmptyState />
        )}

        <PersonalInfoNoteCard message="Vitals are recorded by campus clinic staff during your visit. These readings are for information only and are not a medical diagnosis." />
      </ScrollView>
    </View>
  );
}
