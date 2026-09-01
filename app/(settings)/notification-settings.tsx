import { useEffect } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonalInfoNoteCard } from '@/components/profile/PersonalInfoNoteCard';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { NotificationPreferenceKey } from '@/lib/notifications/notificationPreferenceKeys';
import { useNotificationPreferencesStore } from '@/lib/notifications/notificationPreferencesStore';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

type ToggleItem = {
  id: NotificationPreferenceKey;
  label: string;
  description: string;
};

const PUSH_TOGGLES: ToggleItem[] = [
  {
    id: 'appointments',
    label: 'Appointment Reminders',
    description: 'Upcoming visits, confirmations, and cancellations',
  },
  {
    id: 'announcements',
    label: 'Campus Announcements',
    description: 'Important school-wide updates and advisories',
  },
  {
    id: 'health',
    label: 'Health Alerts',
    description: 'Queue updates and clinic notices',
  },
];

function ToggleRow({
  item,
  value,
  disabled,
  onToggle,
  isLast,
}: {
  item: ToggleItem;
  value: boolean;
  disabled?: boolean;
  onToggle: (id: NotificationPreferenceKey, v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SCHEDULE_PARTNER.divider,
        opacity: disabled ? 0.6 : 1,
      }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 16,
            color: '#222222',
            letterSpacing: -0.64,
            lineHeight: 22,
          }}>
          {item.label}
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 14,
            color: '#727272',
            letterSpacing: -0.15,
            lineHeight: 20,
          }}>
          {item.description}
        </Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={(v) => onToggle(item.id, v)}
        trackColor={{ false: '#E3E3E3', true: '#6BAED6' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E3E3E3"
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const preferences = useNotificationPreferencesStore((s) => s.preferences);
  const hasLoaded = useNotificationPreferencesStore((s) => s.hasLoaded);
  const loading = useNotificationPreferencesStore((s) => s.loading);
  const savingKey = useNotificationPreferencesStore((s) => s.savingKey);
  const error = useNotificationPreferencesStore((s) => s.error);
  const fetchPreferences = useNotificationPreferencesStore((s) => s.fetch);
  const setPreference = useNotificationPreferencesStore((s) => s.setPreference);
  const fetchNotifications = useNotificationStore((s) => s.fetchAll);

  useEffect(() => {
    if (!userId) return;
    void fetchPreferences(userId);
  }, [userId, fetchPreferences]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleToggle = (id: NotificationPreferenceKey, value: boolean) => {
    if (!userId) return;
    void (async () => {
      await setPreference(userId, id, value);
      await fetchNotifications(userId, { silent: true });
    })();
  };

  const togglesDisabled = !userId || loading || !hasLoaded;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
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
              Notifications
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 18,
                color: '#727272',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              Choose what you want to be notified about
            </Text>
          </View>
        </View>

        <ProfileSection title="Push Notifications">
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}>
            {PUSH_TOGGLES.map((item, index) => (
              <ToggleRow
                key={item.id}
                item={item}
                value={preferences[item.id]}
                disabled={togglesDisabled || savingKey === item.id}
                onToggle={handleToggle}
                isLast={index === PUSH_TOGGLES.length - 1}
              />
            ))}
          </View>
        </ProfileSection>

        {error ? (
          <PersonalInfoNoteCard message={`Could not save your preferences: ${error}`} />
        ) : null}

        <PersonalInfoNoteCard message="You can also manage notification permissions in your device system settings." />
      </ScrollView>
    </View>
  );
}
