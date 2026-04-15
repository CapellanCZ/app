import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationListRow } from '@/components/notifications/NotificationListRow';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { MOCK_NOTIFICATIONS, type NotificationItem } from '@/lib/notifications/mockNotifications';
import {
  HOME_BG_GRADIENT_COLORS,
  HOME_BG_GRADIENT_LOCATIONS,
  HOME_SCROLL_PADDING_H,
} from '@/lib/ui/screenGradients';

const BRAND = SCHEDULE_PARTNER.brand;

type ReadFilter = 'all' | 'unread';

type ListBlock = { kind: 'section'; title: string } | { kind: 'item'; item: NotificationItem };

function buildGroupedList(today: NotificationItem[], earlier: NotificationItem[]): ListBlock[] {
  const out: ListBlock[] = [];
  if (today.length > 0) {
    out.push({ kind: 'section', title: 'Today' });
    today.forEach((item) => out.push({ kind: 'item', item }));
  }
  if (earlier.length > 0) {
    out.push({ kind: 'section', title: 'Earlier' });
    earlier.forEach((item) => out.push({ kind: 'item', item }));
  }
  return out;
}

function isLastNotificationRow(blocks: ListBlock[], index: number): boolean {
  for (let j = index + 1; j < blocks.length; j++) {
    if (blocks[j].kind === 'item') return false;
  }
  return true;
}

/** Section stripe inside grouped list (Figma-style inset table). */
function NotificationSectionStripe({ title }: { title: string }) {
  return (
    <View
      style={{
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
        borderBottomWidth: 1,
        borderBottomColor: SCHEDULE_PARTNER.divider,
      }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: SCHEDULE_PARTNER.textMuted,
        }}>
        {title}
      </Text>
    </View>
  );
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationItem[]>(() => [...MOCK_NOTIFICATIONS]);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const filtered = useMemo(() => {
    if (readFilter === 'unread') return items.filter((n) => !n.read);
    return items;
  }, [items, readFilter]);

  const { today, earlier } = useMemo(() => {
    const t: NotificationItem[] = [];
    const e: NotificationItem[] = [];
    for (const n of filtered) {
      if (n.section === 'today') t.push(n);
      else e.push(n);
    }
    return { today: t, earlier: e };
  }, [filtered]);

  const listBlocks = useMemo(() => buildGroupedList(today, earlier), [today, earlier]);

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const segmentBtn = (selected: boolean) => ({
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: selected ? BRAND : 'transparent',
  });

  return (
    <LinearGradient
      colors={[...HOME_BG_GRADIENT_COLORS]}
      locations={[...HOME_BG_GRADIENT_LOCATIONS]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-transparent"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: -0.35,
            color: SCHEDULE_PARTNER.textPrimary,
          }}>
          Notifications
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontSize: 14,
            lineHeight: 20,
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          {unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? 'update' : 'updates'} across campus services.`
            : "You're all caught up."}
        </Text>
        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            onPress={markAllRead}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            className="mt-2 self-start active:opacity-75">
            <Text style={{ fontSize: 14, fontWeight: '600', color: BRAND }}>Mark all as read</Text>
          </Pressable>
        ) : null}

        <Text
          style={{
            marginTop: 22,
            marginBottom: 8,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          Show
        </Text>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.segmentTrackBorder,
            backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
            padding: 4,
            gap: 4,
          }}>
          {(['all', 'unread'] as const).map((id) => {
            const selected = readFilter === id;
            const label = id === 'all' ? 'All' : 'Unread';
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                onPress={() => setReadFilter(id)}
                style={segmentBtn(selected)}
                className="active:opacity-90">
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: selected ? '600' : '500',
                    color: selected ? '#FFFFFF' : SCHEDULE_PARTNER.textMuted,
                  }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {listBlocks.length === 0 ? (
          <View className="mt-8 items-center rounded-2xl border border-[#E8EEF4] bg-white px-5 py-10">
            <Text style={{ textAlign: 'center', fontSize: 15, lineHeight: 22, color: SCHEDULE_PARTNER.textMuted }}>
              {readFilter === 'unread'
                ? 'No unread notifications. Switch to All to see earlier updates.'
                : 'No notifications yet.'}
            </Text>
          </View>
        ) : (
          <View
            className="mt-5 overflow-hidden rounded-3xl border"
            style={{
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: SCHEDULE_PARTNER.surface,
            }}>
            {listBlocks.map((block, index) => {
              if (block.kind === 'section') {
                return <NotificationSectionStripe key={`h-${block.title}-${index}`} title={block.title} />;
              }
              return (
                <NotificationListRow
                  key={block.item.id}
                  item={block.item}
                  onMarkRead={markRead}
                  isLast={isLastNotificationRow(listBlocks, index)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
