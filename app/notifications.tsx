import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import {
  type ListRenderItem,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyStateNotifIllustration } from '@/components/notifications/EmptyStateNotifIllustration';
import { NotificationItemMenu } from '@/components/notifications/NotificationItemMenu';
import { NotificationListRow } from '@/components/notifications/NotificationListRow';
import { NotificationListSkeleton } from '@/components/notifications/NotificationListSkeleton';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  groupNotificationsBySection,
  type NotificationListSection,
} from '@/lib/notifications/groupNotifications';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import type { NotificationItem } from '@/lib/notifications/types';
import { ROUTES } from '@/lib/routes';
import { Inter } from '@/lib/typography/inter';
import { BRAND } from '@/lib/ui/theme';

type ReadFilter = 'all' | 'unread';

const FILTER_ORDER: ReadFilter[] = ['all', 'unread'];

const FILTER_TABS: { id: ReadFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

const TAB_SWIPE_DISTANCE = 56;
const TAB_SWIPE_VELOCITY = 650;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DRAG_SPRING = { damping: 26, stiffness: 200, mass: 0.85 } as const;

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<NotificationItem, NotificationListSection>,
);

/**
 * Notifications inbox — floating segment, date groups, soft tinted cards.
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useAuth();
  const items = useNotificationStore((s) => s.items);
  const hasLoaded = useNotificationStore((s) => s.hasLoaded);
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const archiveNotification = useNotificationStore((s) => s.archive);
  const markRead = useNotificationStore((s) => s.markRead);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [panelKey, setPanelKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [menuItem, setMenuItem] = useState<NotificationItem | null>(null);
  const directionRef = useRef<'forward' | 'back'>('forward');
  const allowEnterAnimRef = useRef(true);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const seenSeededRef = useRef(false);
  const [liveEnterIds, setLiveEnterIds] = useState<Set<string>>(() => new Set());
  const reduceMotion = useReducedMotion();

  const dragX = useSharedValue(0);
  const tabIndexSV = useSharedValue(0);
  const reduceMotionSV = useSharedValue(false);

  useEffect(() => {
    tabIndexSV.value = FILTER_ORDER.indexOf(readFilter);
  }, [readFilter, tabIndexSV]);

  useEffect(() => {
    reduceMotionSV.value = Boolean(reduceMotion);
  }, [reduceMotion, reduceMotionSV]);

  useEffect(() => {
    if (!session?.user?.id) {
      useNotificationStore.getState().loadMock();
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void markAllRead();
      };
    }, [markAllRead]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const userId = session?.user?.id;
      if (userId) {
        await fetchAll(userId, { silent: true });
      } else {
        useNotificationStore.getState().loadMock();
      }
      await markAllRead();
    } catch (e) {
      console.error('Notifications refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll, markAllRead, session?.user?.id]);

  const filtered = useMemo(() => {
    return readFilter === 'unread' ? items.filter((n) => !n.read) : items;
  }, [items, readFilter]);

  const sections = useMemo(() => groupNotificationsBySection(filtered), [filtered]);
  const hasUnread = useMemo(() => items.some((n) => !n.read), [items]);

  useEffect(() => {
    if (!hasLoaded) return;

    if (!seenSeededRef.current) {
      seenIdsRef.current = new Set(items.map((n) => n.id));
      seenSeededRef.current = true;
      return;
    }

    const incoming: string[] = [];
    for (const item of items) {
      if (!seenIdsRef.current.has(item.id)) {
        incoming.push(item.id);
        seenIdsRef.current.add(item.id);
      }
    }
    if (!incoming.length) return;

    setLiveEnterIds(new Set(incoming));
    const t = setTimeout(() => setLiveEnterIds(new Set()), 420);
    return () => clearTimeout(t);
  }, [hasLoaded, items]);

  useEffect(() => {
    if (filtered.length > 0) {
      const t = setTimeout(() => {
        allowEnterAnimRef.current = false;
      }, 400);
      return () => clearTimeout(t);
    }
  }, [filtered.length]);

  const goToFilter = useCallback((next: ReadFilter, direction: 'forward' | 'back') => {
    setReadFilter((prev) => {
      if (prev === next) return prev;
      directionRef.current = direction;
      setPanelKey((k) => k + 1);
      return next;
    });
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(FILTER_ORDER.length - 1, index));
      const next = FILTER_ORDER[clamped];
      const current = FILTER_ORDER.indexOf(readFilter);
      if (clamped === current) return;
      goToFilter(next, clamped > current ? 'forward' : 'back');
    },
    [goToFilter, readFilter],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-28, 28])
        .failOffsetY([-10, 10])
        .onUpdate((e) => {
          if (reduceMotionSV.value) return;
          dragX.value = e.translationX * 0.35;
        })
        .onEnd((e) => {
          const current = tabIndexSV.value;
          const shouldNext =
            e.translationX < -TAB_SWIPE_DISTANCE || e.velocityX < -TAB_SWIPE_VELOCITY;
          const shouldPrev =
            e.translationX > TAB_SWIPE_DISTANCE || e.velocityX > TAB_SWIPE_VELOCITY;

          if (shouldNext && current < FILTER_ORDER.length - 1) {
            runOnJS(goToIndex)(current + 1);
          } else if (shouldPrev && current > 0) {
            runOnJS(goToIndex)(current - 1);
          }
          dragX.value = withSpring(0, DRAG_SPRING);
        }),
    [dragX, goToIndex, reduceMotionSV, tabIndexSV],
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace(ROUTES.home);
    }
  }, [navigation, router]);

  const openMenu = useCallback((item: NotificationItem) => {
    setMenuItem(item);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuItem(null);
  }, []);

  const renderItem: ListRenderItem<NotificationItem> = useCallback(
    ({ item, index }) => {
      const enterIndex = allowEnterAnimRef.current
        ? index
        : liveEnterIds.has(item.id)
          ? 0
          : undefined;

      return (
        <NotificationListRow
          item={item}
          enterIndex={enterIndex}
          onArchive={archiveNotification}
          onMarkRead={markRead}
          onOpenMenu={openMenu}
        />
      );
    },
    [archiveNotification, liveEnterIds, markRead, openMenu],
  );

  const keyExtractor = useCallback((item: NotificationItem) => item.id, []);

  const isEmpty = filtered.length === 0;
  const showSkeleton = !refreshing && !hasLoaded && items.length === 0;

  const entering = reduceMotion
    ? FadeIn.duration(120)
    : directionRef.current === 'forward'
      ? FadeInRight.duration(180).easing(EASE_OUT)
      : FadeInLeft.duration(180).easing(EASE_OUT);

  const exiting = reduceMotion
    ? FadeOut.duration(120)
    : directionRef.current === 'forward'
      ? FadeOutLeft.duration(140).easing(EASE_OUT)
      : FadeOutRight.duration(140).easing(EASE_OUT);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={BRAND.primary}
      colors={[BRAND.primary]}
      progressBackgroundColor="#FFFFFF"
    />
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F8F9FB',
        paddingTop: insets.top + 8,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          marginBottom: 16,
        }}>
        <CircleBackButton onPress={handleBack} />
        <Text
          accessibilityRole="header"
          style={{
            flex: 1,
            fontFamily: Inter.medium,
            fontSize: 28,
            letterSpacing: -2.24,
            lineHeight: 34,
            color: '#222222',
          }}>
          Notifications
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          flexDirection: 'row',
          backgroundColor: '#EDEFF2',
          borderRadius: 999,
          padding: 4,
        }}>
        {FILTER_TABS.map((tab) => {
          const active = readFilter === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                const nextIndex = FILTER_ORDER.indexOf(tab.id);
                const current = FILTER_ORDER.indexOf(readFilter);
                if (nextIndex === current) return;
                goToFilter(tab.id, nextIndex > current ? 'forward' : 'back');
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: active ? '#FFFFFF' : 'transparent',
                ...(active
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 4,
                      elevation: 1,
                    }
                  : null),
              }}>
              <Text
                style={{
                  fontFamily: active ? Inter.semiBold : Inter.medium,
                  fontSize: 14,
                  letterSpacing: -0.2,
                  color: active ? '#111827' : '#9CA3AF',
                }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flex: 1, overflow: 'visible' }, dragStyle]}>
          <Animated.View
            key={panelKey}
            entering={entering}
            exiting={exiting}
            style={{ flex: 1 }}>
            {showSkeleton ? (
              <ScrollView
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical
                contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 8 }}
                style={{ flex: 1 }}
                refreshControl={refreshControl}>
                <NotificationListSkeleton count={4} />
              </ScrollView>
            ) : isEmpty ? (
              <ScrollView
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingBottom: 48,
                  paddingHorizontal: 32,
                }}
                style={{ flex: 1 }}
                refreshControl={refreshControl}>
                <View style={{ alignItems: 'center', gap: 12, maxWidth: 300 }}>
                  <EmptyStateNotifIllustration size={168} />
                  <Text
                    style={{
                      fontFamily: Inter.semiBold,
                      fontSize: 22,
                      letterSpacing: -0.8,
                      lineHeight: 28,
                      color: '#111827',
                      textAlign: 'center',
                    }}>
                    No Notification Yet
                  </Text>
                  <Text
                    style={{
                      fontFamily: Inter.regular,
                      fontSize: 15,
                      color: '#9CA3AF',
                      letterSpacing: -0.2,
                      lineHeight: 22,
                      textAlign: 'center',
                    }}>
                    You have no notifications right now.{'\n'}Come back later.
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <AnimatedSectionList
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                stickySectionHeadersEnabled={false}
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                itemLayoutAnimation={
                  reduceMotion ? undefined : LinearTransition.duration(220)
                }
                contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}
                style={{ flex: 1 }}
                refreshControl={refreshControl}
                renderSectionHeader={({ section }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: section.key === sections[0]?.key ? 0 : 10,
                      paddingBottom: 4,
                    }}>
                    <Text
                      style={{
                        fontFamily: Inter.semiBold,
                        fontSize: 16,
                        letterSpacing: -0.4,
                        color: '#111827',
                      }}>
                      {section.title}
                    </Text>
                    {section.key === 'today' && hasUnread ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Mark all as read"
                        hitSlop={8}
                        onPress={() => void markAllRead()}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                        <Text
                          style={{
                            fontFamily: Inter.medium,
                            fontSize: 13,
                            color: BRAND.primary,
                            letterSpacing: -0.2,
                          }}>
                          Mark all as read
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              />
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <NotificationItemMenu
        item={menuItem}
        onClose={closeMenu}
        onMarkRead={markRead}
        onArchive={archiveNotification}
      />
    </View>
  );
}
