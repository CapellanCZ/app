import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxHourglassIcon } from '@/components/icons/IconsaxHourglassIcon';
import { PersonalInfoNoteCard } from '@/components/profile/PersonalInfoNoteCard';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  fetchPatientActiveQueue,
  formatStationLabel,
  queueStatusLabel,
} from '@/lib/queue/patientQueueApi';
import type { PatientQueueView } from '@/lib/queue/types';
import { ROUTES } from '@/lib/routes';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

function statusBadgeColors(status: PatientQueueView['ticket']['status']) {
  if (status === 'called') {
    return { bg: '#D1FAE5', text: '#065F46' };
  }
  if (status === 'waiting') {
    return { bg: '#FEF3C7', text: '#92400E' };
  }
  return { bg: '#D3E9FA', text: '#1E4A63' };
}

function QueueEmptyState() {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        paddingHorizontal: 24,
        paddingVertical: 32,
        alignItems: 'center',
        gap: 12,
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#D3E9FA',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <IconsaxHourglassIcon size={26} color="#4D7A9A" />
      </View>
      <Text
        style={{
          fontFamily: Inter.semiBold,
          fontSize: 18,
          color: '#222222',
          letterSpacing: -0.72,
          lineHeight: 24,
          textAlign: 'center',
        }}>
        You are not in queue today
      </Text>
      <Text
        style={{
          fontFamily: Inter.regular,
          fontSize: 14,
          color: 'rgba(114, 114, 114, 0.85)',
          letterSpacing: -0.28,
          lineHeight: 20,
          textAlign: 'center',
          maxWidth: 280,
        }}>
        When you check in for a confirmed visit, your queue number and station will appear here.
      </Text>
    </View>
  );
}

function QueueStatusCard({ queue }: { queue: PatientQueueView }) {
  const badge = statusBadgeColors(queue.ticket.status);
  const statusLabel = queueStatusLabel(queue.ticket.status);
  const stationLabel = formatStationLabel(queue.station);

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: '#FFFFFF',
        padding: 16,
        gap: 16,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 14,
            color: '#727272',
            letterSpacing: -0.15,
            textTransform: 'uppercase',
          }}>
          Today's ticket
        </Text>
        <View
          style={{
            backgroundColor: badge.bg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 12,
              color: badge.text,
              letterSpacing: -0.2,
            }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Text
          accessibilityLabel={`Queue ticket ${queue.ticket.code}`}
          style={{
            fontFamily: Inter.semiBold,
            fontSize: 40,
            color: '#222222',
            letterSpacing: -1.6,
            lineHeight: 44,
          }}>
          {queue.ticket.code}
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 15,
            color: '#727272',
            letterSpacing: -0.2,
            lineHeight: 20,
          }}>
          Position #{queue.ticket.position}
          {queue.ticket.estimatedMinutes > 0
            ? ` · Est. wait ${queue.ticket.estimatedMinutes} min`
            : null}
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: SCHEDULE_PARTNER.divider,
          paddingTop: 14,
          gap: 10,
        }}>
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 13,
              color: '#727272',
              letterSpacing: -0.15,
            }}>
            Station
          </Text>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 16,
              color: '#222222',
              letterSpacing: -0.64,
              lineHeight: 22,
            }}>
            {stationLabel}
          </Text>
        </View>

        {queue.staffName ? (
          <View style={{ gap: 2 }}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 13,
                color: '#727272',
                letterSpacing: -0.15,
              }}>
              Provider
            </Text>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 16,
                color: '#222222',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              {queue.staffName}
              {queue.staffSpecialty ? ` · ${queue.staffSpecialty}` : null}
            </Text>
          </View>
        ) : null}

        {queue.appointmentTimeLabel ? (
          <View style={{ gap: 2 }}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 13,
                color: '#727272',
                letterSpacing: -0.15,
              }}>
              Appointment time
            </Text>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 16,
                color: '#222222',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              {queue.appointmentTimeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function MyQueueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patient } = useAuth();
  const [queue, setQueue] = useState<PatientQueueView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = useCallback(async () => {
    if (!patient?.id) {
      setQueue(null);
      return;
    }
    const next = await fetchPatientActiveQueue(patient.id);
    setQueue(next);
  }, [patient?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void loadQueue().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [loadQueue]),
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.home);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadQueue();
    } finally {
      setRefreshing(false);
    }
  }, [loadQueue]);

  const handleViewAppointment = () => {
    if (!queue?.appointmentId) return;
    router.push({
      pathname: '/health-service/appointment/[id]',
      params: { id: queue.appointmentId },
    });
  };

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
              My Queue
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 18,
                color: '#727272',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              Your clinic queue status for today
            </Text>
          </View>
        </View>

        <ProfileSection title="Queue status">
          {!loading && !queue ? <QueueEmptyState /> : null}
          {queue ? <QueueStatusCard queue={queue} /> : null}
          {loading && !queue ? (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: SCHEDULE_PARTNER.cardBorder,
                backgroundColor: '#FFFFFF',
                padding: 24,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 14,
                  color: '#727272',
                }}>
                Loading queue…
              </Text>
            </View>
          ) : null}
        </ProfileSection>

        {queue?.appointmentId ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleViewAppointment}
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
              alignSelf: 'flex-start',
              paddingVertical: 4,
            })}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 15,
                color: '#2970FF',
                letterSpacing: -0.2,
              }}>
              View appointment details
            </Text>
          </Pressable>
        ) : null}

        <PersonalInfoNoteCard message="Stay nearby the clinic. You will get a notification when it is your turn to proceed to the station." />
      </ScrollView>
    </View>
  );
}
