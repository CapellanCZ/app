import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/layout/BottomTabBar';
import { EmptyStateNotifIllustration } from '@/components/notifications/EmptyStateNotifIllustration';
import { NotificationListRow } from '@/components/notifications/NotificationListRow';
import { Ionicons } from '@expo/vector-icons';
import { SettingIcon } from '@/components/icons/SettingIcon';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import type { NotificationItem } from '@/lib/notifications/types';

const BRAND = '#2970FF';

type ReadFilter = 'all' | 'unread';

type NotificationSection = 'today' | 'yesterday' | 'last7' | 'last30';

interface SectionHeaderProps {
  title: string;
  onMarkAllRead: () => void;
}

function SectionHeader({ title, onMarkAllRead }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 12,
      }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          textTransform: 'uppercase',
          color: '#717680',
        }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mark all ${title.toLowerCase()} notifications as read`}
        onPress={onMarkAllRead}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        className="active:opacity-75"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="checkmark-done" size={17} color={BRAND} />
        <Text style={{ fontSize: 14, fontWeight: '500', color: BRAND }}>Mark all as read</Text>
      </Pressable>
    </View>
  );
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useAuth();
  const items = useNotificationStore((s) => s.items);
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const archiveNotification = useNotificationStore((s) => s.archive);
  const markRead = useNotificationStore((s) => s.markRead);
  const [readFilter] = useState<ReadFilter>('all');
  const [archivingIds, setArchivingIds] = useState<Map<string, number>>(new Map());
  const archivingIdsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Load mock data if not authenticated
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
    }, [session?.user?.id, fetchAll])
  );

  const filtered = useMemo(() => {
    if (readFilter === 'unread') return items.filter((n) => !n.read);
    return items;
  }, [items, readFilter]);

  // Derive section from timeLabel for mock data without section field
  const deriveSection = (n: NotificationItem): NotificationSection => {
    if (n.section) return n.section;
    const tl = n.timeLabel.toLowerCase();
    if (tl.includes('h ago') || tl === 'just now') return 'today';
    if (tl === 'yesterday') return 'yesterday';
    if (tl.match(/\d+ days? ago/)) {
      const days = parseInt(tl.match(/\d+/)?.[0] ?? '0');
      if (days <= 6) return 'last7';
    }
    return 'last30';
  };

  // Group notifications by section
  const { today, yesterday, last7, last30 } = useMemo(() => {
    const t = filtered.filter((n) => deriveSection(n) === 'today');
    const y = filtered.filter((n) => deriveSection(n) === 'yesterday');
    const l7 = filtered.filter((n) => deriveSection(n) === 'last7');
    const l30 = filtered.filter((n) => deriveSection(n) === 'last30');
    return { today: t, yesterday: y, last7: l7, last30: l30 };
  }, [filtered]);

  const newCount = useMemo(
    () => filtered.filter((n) => !n.read).length,
    [filtered],
  );

  const triggerMarkAllArchive = useCallback((sectionItems: NotificationItem[]) => {
    const newMap = new Map(archivingIdsRef.current);
    sectionItems.forEach((item, index) => {
      newMap.set(item.id, index * 80);
    });
    archivingIdsRef.current = newMap;
    setArchivingIds(new Map(newMap));
  }, []);

  const handleArchive = useCallback(
    (id: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const nextMap = new Map(archivingIdsRef.current);
      nextMap.delete(id);
      archivingIdsRef.current = nextMap;
      setArchivingIds(new Map(nextMap));
      archiveNotification(id);
    },
    [archiveNotification]
  );

  const handleBack = useCallback(() => {
    markAllRead();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/health-service');
    }
  }, [markAllRead, navigation, router]);

  const isEmpty = filtered.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: isEmpty ? 1 : undefined,
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 8,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 16,
          }}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={handleBack}
            className="active:opacity-70"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#F5F5F5',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <IconsaxArrowLeftIcon size={20} color="#181D27" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                letterSpacing: -0.64,
                color: '#000',
              }}>
              Notifications
            </Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: '#717680', letterSpacing: -0.25 }}>
              You have{' '}
              <Text style={{ fontWeight: '700', color: '#2970FF' }}>{newCount} new</Text>{' '}
              notifications
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter notifications"
            hitSlop={10}
            className="active:opacity-60"
            style={{ marginTop: 4 }}
            onPress={() => console.log('[Notification] Filter pressed')}>
            <SettingIcon size={24} color="#1F2024" />
          </Pressable>
        </View>

        {isEmpty ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
            }}>
            <EmptyStateNotifIllustration size={160} />
            <Text
              style={{
                marginTop: 24,
                fontSize: 24,
                fontWeight: '600',
                color: '#181D27',
                letterSpacing: -0.48,
                textAlign: 'center',
              }}>
              No Notification Yet
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: '400',
                color: '#717680',
                letterSpacing: -0.28,
                lineHeight: 20,
                textAlign: 'center',
              }}>
              You have no notifications right now.{'\n'}Come back later
            </Text>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <SectionHeader title="Today" onMarkAllRead={() => triggerMarkAllArchive(today)} />
                <View>
                  {today.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={handleArchive}
                      onMarkRead={markRead}
                      isLast={index === today.length - 1}
                      animateOutDelay={archivingIds.get(item.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {yesterday.length > 0 && (
              <>
                <SectionHeader
                  title="Yesterday"
                  onMarkAllRead={() => triggerMarkAllArchive(yesterday)}
                />
                <View>
                  {yesterday.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={handleArchive}
                      onMarkRead={markRead}
                      isLast={index === yesterday.length - 1}
                      animateOutDelay={archivingIds.get(item.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {last7.length > 0 && (
              <>
                <SectionHeader
                  title="Last 7 Days"
                  onMarkAllRead={() => triggerMarkAllArchive(last7)}
                />
                <View>
                  {last7.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={handleArchive}
                      onMarkRead={markRead}
                      isLast={index === last7.length - 1}
                      animateOutDelay={archivingIds.get(item.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {last30.length > 0 && (
              <>
                <SectionHeader
                  title="Last 30 Days"
                  onMarkAllRead={() => triggerMarkAllArchive(last30)}
                />
                <View>
                  {last30.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={handleArchive}
                      onMarkRead={markRead}
                      isLast={index === last30.length - 1}
                      animateOutDelay={archivingIds.get(item.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
