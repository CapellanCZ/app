import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyStateNotifIllustration } from '@/components/notifications/EmptyStateNotifIllustration';
import { NotificationListRow } from '@/components/notifications/NotificationListRow';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import { ROUTES } from '@/lib/routes';
import { Inter } from '@/lib/typography/inter';

type ReadFilter = 'all' | 'unread';

const FILTER_TABS: { id: ReadFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

/**
 * Notifications — Figma node 2254:925.
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useAuth();
  const items = useNotificationStore((s) => s.items);
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const archiveNotification = useNotificationStore((s) => s.archive);
  const markRead = useNotificationStore((s) => s.markRead);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      useNotificationStore.getState().loadMock();
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      const userId = session?.user?.id;
      if (userId) {
        fetchAll(userId).catch(() => undefined);
      }
    }, [session?.user?.id, fetchAll]),
  );

  const filtered = useMemo(() => {
    const list = readFilter === 'unread' ? items.filter((n) => !n.read) : items;
    return list;
  }, [items, readFilter]);

  const handleBack = useCallback(() => {
    markAllRead();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace(ROUTES.home);
    }
  }, [markAllRead, navigation, router]);

  const isEmpty = filtered.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 24),
          gap: 10,
        }}>
        {/* Back — 2254:926 */}
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleBack}
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <IconsaxArrowLeftIcon size={24} color="#6C6C6C" />
        </Pressable>

        {/* Title + tabs + list — 2254:929 */}
        <View style={{ gap: 20, flex: isEmpty ? 1 : undefined }}>
          <View style={{ gap: 16 }}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 28,
                letterSpacing: -2.24,
                lineHeight: 38,
                color: '#222222',
              }}>
              Notifications
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              {FILTER_TABS.map((tab) => {
                const active = readFilter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => setReadFilter(tab.id)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: active ? 1.5 : 1,
                      borderBottomColor: active ? '#323232' : '#E3E3E3',
                    }}>
                    <Text
                      style={{
                        fontFamily: active ? Inter.semiBold : Inter.regular,
                        fontSize: 15,
                        letterSpacing: -1.2,
                        color: active ? '#3C3A3A' : '#9E9E9E',
                        textAlign: 'center',
                      }}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {isEmpty ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 360,
              }}>
              <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
                <EmptyStateNotifIllustration size={186} />
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 28,
                    letterSpacing: -2.24,
                    lineHeight: 38,
                    color: '#222222',
                    textAlign: 'center',
                  }}>
                  No notification yet
                </Text>
                <Text
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 16,
                    letterSpacing: -0.64,
                    lineHeight: 20,
                    color: '#727272',
                    textAlign: 'center',
                  }}>
                  You’ll see notifications here when they{'\n'}are available
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ gap: 20, width: '100%' }}>
              {filtered.map((item) => (
                <NotificationListRow
                  key={item.id}
                  item={item}
                  onArchive={archiveNotification}
                  onMarkRead={markRead}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
