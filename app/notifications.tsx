import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import {
  Alert,
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  ScrollView,
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
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { IconsaxTickDoubleIcon } from '@/components/icons/IconsaxTickDoubleIcon';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import type { NotificationItem } from '@/lib/notifications/types';
import { ROUTES } from '@/lib/routes';
import { Inter } from '@/lib/typography/inter';

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

/**
 * Notifications — Figma node 2254:925.
 * Tab swipe matches School Doctors / Medical Records; rows stay mounted across filters.
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
  const archiveAll = useNotificationStore((s) => s.archiveAll);
  const markRead = useNotificationStore((s) => s.markRead);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [panelKey, setPanelKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [menuItem, setMenuItem] = useState<NotificationItem | null>(null);
  /** Bottom→top slide-left delays while clearing all. */
  const [clearExitDelays, setClearExitDelays] = useState<Record<string, number> | null>(null);
  const clearingRef = useRef(false);
  const directionRef = useRef<'forward' | 'back'>('forward');
  /** Stagger enter only on the first list paint this visit. */
  const allowEnterAnimRef = useRef(true);
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
      // Root NotificationSubscription already keeps data fresh — no focus refetch.
      // Mark all as read when leaving (back, swipe, navigate away).
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

  useEffect(() => {
    if (filtered.length > 0) {
      // After first non-empty paint, stop staggering remounts on filter changes.
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
        .activeOffsetX([-24, 24])
        .failOffsetY([-12, 12])
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

  const handleClearAll = useCallback(() => {
    if (!items.length || clearingRef.current) return;
    Alert.alert(
      'Clear all notifications?',
      'This removes every notification from your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            const list = readFilter === 'unread' ? items.filter((n) => !n.read) : items;
            if (!list.length) return;

            if (reduceMotion) {
              void archiveAll();
              return;
            }

            clearingRef.current = true;
            const staggerMs = 55;
            const exitMs = 260;
            const delays: Record<string, number> = {};
            // Bottom card first → top card last.
            list.forEach((item, index) => {
              const fromBottom = list.length - 1 - index;
              delays[item.id] = fromBottom * staggerMs;
            });
            setClearExitDelays(delays);

            const totalMs = (list.length - 1) * staggerMs + exitMs + 40;
            setTimeout(() => {
              void archiveAll();
              setClearExitDelays(null);
              clearingRef.current = false;
            }, totalMs);
          },
        },
      ],
    );
  }, [archiveAll, items, readFilter, reduceMotion]);

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
    ({ item, index }) => (
      <NotificationListRow
        item={item}
        enterIndex={allowEnterAnimRef.current ? index : undefined}
        animateOutDelay={clearExitDelays?.[item.id]}
        onExitComplete={clearExitDelays ? () => undefined : undefined}
        onArchive={archiveNotification}
        onMarkRead={markRead}
        onOpenMenu={openMenu}
      />
    ),
    [archiveNotification, clearExitDelays, markRead, openMenu],
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
      tintColor="#111111"
      colors={['#111111']}
      progressBackgroundColor="#FFFFFF"
    />
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F9F9F9',
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: Math.max(insets.bottom, 24),
      }}>
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
          marginBottom: 10,
        }}>
        <IconsaxArrowLeftIcon size={24} color="#6C6C6C" />
      </Pressable>

      <View style={{ gap: 16, marginBottom: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
          <Text
            style={{
              flex: 1,
              fontFamily: Inter.medium,
              fontSize: 28,
              letterSpacing: -2.24,
              lineHeight: 38,
              color: '#222222',
            }}>
            Notifications
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all notifications"
            accessibilityState={{ disabled: items.length === 0 || Boolean(clearExitDelays) }}
            disabled={items.length === 0 || Boolean(clearExitDelays)}
            hitSlop={12}
            onPress={handleClearAll}
            style={{
              padding: 4,
              opacity: items.length === 0 || clearExitDelays ? 0.35 : 1,
            }}>
            <IconsaxTickDoubleIcon size={26} color="#222222" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
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
                contentContainerStyle={{ gap: 20, paddingBottom: 8 }}
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
                }}
                style={{ flex: 1 }}
                refreshControl={refreshControl}>
                <View style={{ alignItems: 'center', gap: 12, maxWidth: 320 }}>
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
              </ScrollView>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                removeClippedSubviews
                contentContainerStyle={{ gap: 20, paddingBottom: 8 }}
                style={{ flex: 1 }}
                refreshControl={refreshControl}
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
