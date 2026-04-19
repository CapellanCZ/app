import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationListRow } from '@/components/notifications/NotificationListRow';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { useNotificationStore } from '@/lib/notifications/notificationStore';
import {
  HOME_BG_GRADIENT_COLORS,
  HOME_BG_GRADIENT_LOCATIONS,
  HOME_SCROLL_PADDING_H,
} from '@/lib/ui/screenGradients';

const BRAND = SCHEDULE_PARTNER.brand;

type ReadFilter = 'all' | 'unread';

type NotificationSection = 'today' | 'yesterday' | 'earlier';

interface SectionHeaderProps {
  title: string;
  unreadCount: number;
  onMarkAllRead: () => void;
}

function SectionHeader({ title, unreadCount, onMarkAllRead }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 8,
      }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: SCHEDULE_PARTNER.textMuted,
        }}>
        {title}
      </Text>
      {unreadCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mark all ${title.toLowerCase()} notifications as read`}
          onPress={onMarkAllRead}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          className="active:opacity-75">
          <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND }}>Mark all as read</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const items = useNotificationStore((s) => s.items);
  const markAllReadInSection = useNotificationStore((s) => s.markAllReadInSection);
  const archiveNotification = useNotificationStore((s) => s.archive);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const filtered = useMemo(() => {
    if (readFilter === 'unread') return items.filter((n) => !n.read);
    return items;
  }, [items, readFilter]);

  // Group notifications by section
  const { today, yesterday, earlier } = useMemo(() => {
    const t = filtered.filter((n) => n.section === 'today');
    const y = filtered.filter((n) => n.section === 'yesterday');
    const e = filtered.filter((n) => n.section === 'earlier');
    return { today: t, yesterday: y, earlier: e };
  }, [filtered]);

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
          paddingTop: 12,
          paddingHorizontal: HOME_SCROLL_PADDING_H,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            letterSpacing: -0.35,
            color: SCHEDULE_PARTNER.textPrimary,
          }}>
          Notifications
        </Text>

        <View
          style={{
            marginTop: 24,
            flexDirection: 'row',
            borderRadius: 28,
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

        {filtered.length === 0 ? (
          <View className="mt-8 items-center rounded-2xl border border-[#E8EEF4] bg-white px-5 py-10">
            <Text style={{ textAlign: 'center', fontSize: 15, lineHeight: 22, color: SCHEDULE_PARTNER.textMuted }}>
              {readFilter === 'unread'
                ? 'No unread notifications. Switch to All to see earlier updates.'
                : 'No notifications yet.'}
            </Text>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <SectionHeader
                  title="Today"
                  unreadCount={today.filter((n) => !n.read).length}
                  onMarkAllRead={() => markAllReadInSection('today')}
                />
                <View>
                  {today.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={archiveNotification}
                      isLast={index === today.length - 1}
                    />
                  ))}
                </View>
              </>
            )}

            {yesterday.length > 0 && (
              <>
                <SectionHeader
                  title="Yesterday"
                  unreadCount={yesterday.filter((n) => !n.read).length}
                  onMarkAllRead={() => markAllReadInSection('yesterday')}
                />
                <View>
                  {yesterday.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={archiveNotification}
                      isLast={index === yesterday.length - 1}
                    />
                  ))}
                </View>
              </>
            )}

            {earlier.length > 0 && (
              <>
                <SectionHeader
                  title="Earlier"
                  unreadCount={earlier.filter((n) => !n.read).length}
                  onMarkAllRead={() => markAllReadInSection('earlier')}
                />
                <View>
                  {earlier.map((item, index) => (
                    <NotificationListRow
                      key={item.id}
                      item={item}
                      onArchive={archiveNotification}
                      isLast={index === earlier.length - 1}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
