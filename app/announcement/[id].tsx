import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnnouncementDetailView } from '@/components/announcements/AnnouncementDetailView';
import { useAuth } from '@/lib/auth/AuthProvider';
import { fetchAnnouncementById } from '@/lib/announcements/announcementsApi';
import { useAnnouncementStore } from '@/lib/announcements/announcementStore';
import type { Announcement } from '@/lib/announcements/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { BRAND } from '@/lib/ui/theme';
import { ROUTES } from '@/lib/routes';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const announcementId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const { patient } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const cached = useAnnouncementStore((s) =>
    s.items.find((item) => item.id === announcementId),
  );
  const [announcement, setAnnouncement] = useState<Announcement | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (cached) {
      setAnnouncement(cached);
      setLoading(false);
      setMissing(false);
      return;
    }
    if (!announcementId) {
      setMissing(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchAnnouncementById(announcementId, patient?.patient_type).then((row) => {
      if (cancelled) return;
      if (!row) {
        setMissing(true);
        setAnnouncement(null);
      } else {
        setAnnouncement(row);
        setMissing(false);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [announcementId, cached, patient?.patient_type]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
        }}>
        <ActivityIndicator color={BRAND.primary} size="large" />
      </View>
    );
  }

  if (missing || !announcement) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          gap: 12,
        }}>
        <Text style={{ fontFamily: Inter.semiBold, fontSize: 20, color: '#111827' }}>
          Announcement unavailable
        </Text>
        <Text style={{ fontFamily: Inter.regular, fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
          This post may have been removed or is not available for your account.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(ROUTES.home)}
          {...androidPressProps()}
          style={({ pressed }) => ({
            marginTop: 8,
            alignSelf: 'flex-start',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: BRAND.primary,
            opacity: pressed ? 0.88 : 1,
          })}>
          <Text style={{ fontFamily: Inter.semiBold, fontSize: 14, color: '#FFFFFF' }}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    );
  }

  return <AnnouncementDetailView announcement={announcement} />;
}
