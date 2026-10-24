import { memo, useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { NotificationTypeIcon } from '@/components/notifications/NotificationTypeIcon';
import { fadeSlideUpEntering, fadeSlideUpExiting } from '@/lib/animations/fadeSlideUp';
import {
  NOTIFICATION_STATUS_STYLE,
  resolveNotificationStatus,
} from '@/lib/notifications/resolveNotificationStatus';
import {
  DEFAULT_SOURCE_BY_CATEGORY,
  type NotificationItem,
} from '@/lib/notifications/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import { BRAND } from '@/lib/ui/theme';

const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;
const BODY_SPLIT = /(Dr\.\s[\w .]+?(?=\s+was\b)|confirmed)/g;
const CARD_BG = BRAND.softSurface;

export type NotificationListRowProps = {
  item: NotificationItem;
  onArchive: (id: string) => void;
  onMarkRead: (id: string) => void;
  onOpenMenu: (item: NotificationItem) => void;
  /** List index for staggered enter (first paint only). */
  enterIndex?: number;
  /**
   * When set, slide the card left after this delay (ms).
   * If `onExitComplete` is omitted, archives the item when the animation finishes.
   */
  animateOutDelay?: number;
  onExitComplete?: (id: string) => void;
};

/** Body: muted gray; emphasize doctor name + “confirmed”. */
function NotificationBody({ text }: { text: string }) {
  const parts = useMemo(() => text.split(BODY_SPLIT), [text]);

  return (
    <Text
      style={{
        fontFamily: Inter.regular,
        fontSize: 13,
        letterSpacing: -0.2,
        color: '#6B7280',
        lineHeight: 19,
      }}>
      {parts.map((part, i) => {
        if (!part) return null;
        const emphasize = part === 'confirmed' || /^Dr\.\s/i.test(part);
        return (
          <Text
            key={`${i}-${part.slice(0, 16)}`}
            style={emphasize ? { fontFamily: Inter.medium, color: '#4B5563' } : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

/**
 * Notification card — soft blue tint, unread dot beside title, source · time footer.
 */
export const NotificationListRow = memo(function NotificationListRow({
  item,
  onArchive,
  onMarkRead,
  onOpenMenu,
  enterIndex,
  animateOutDelay,
  onExitComplete,
}: NotificationListRowProps) {
  const { push } = useRouter();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const status = item.notificationType ?? resolveNotificationStatus(undefined, item.title);
  const tokens = NOTIFICATION_STATUS_STYLE[status];
  const title = item.title;
  const source = item.source ?? DEFAULT_SOURCE_BY_CATEGORY[item.category];

  useEffect(() => {
    if (animateOutDelay === undefined) return;
    const duration = reduceMotion ? 80 : 260;
    const finish = () => {
      if (onExitComplete) onExitComplete(item.id);
      else onArchive(item.id);
    };

    opacity.value = withDelay(
      animateOutDelay,
      withTiming(0, { duration, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
    translateX.value = withDelay(
      animateOutDelay,
      withTiming(-120, { duration, easing: Easing.in(Easing.cubic) }),
    );
  }, [
    animateOutDelay,
    item.id,
    onArchive,
    onExitComplete,
    opacity,
    reduceMotion,
    translateX,
  ]);

  const archiveStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  const handlePress = () => {
    if (!item.read) onMarkRead(item.id);
    if (item.href) {
      try {
        push(item.href as never);
      } catch {
        // ignore invalid hrefs
      }
    }
  };

  return (
    <Animated.View style={archiveStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${status}`}
        accessibilityState={{ selected: !item.read }}
        onPress={handlePress}
        onLongPress={() => onOpenMenu(item)}
        delayLongPress={350}
        {...androidPressProps({ hitSlop: 2 })}
        onPressIn={() => {
          if (reduceMotion) return;
          scale.value = withSpring(0.97, PRESS_SPRING);
          dim.value = withSpring(0.92, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
          dim.value = withSpring(1, PRESS_SPRING);
        }}>
        <Animated.View
          entering={
            enterIndex != null && !reduceMotion ? fadeSlideUpEntering(enterIndex) : undefined
          }
          exiting={reduceMotion ? undefined : fadeSlideUpExiting()}>
          <Animated.View
            style={[
              {
                backgroundColor: item.read ? '#F7F8FA' : CARD_BG,
                borderRadius: 16,
                borderCurve: 'continuous',
                paddingHorizontal: 14,
                paddingVertical: 14,
                width: '100%',
                borderWidth: 1,
                borderColor: item.read ? '#ECECEC' : BRAND.softBorder,
              },
              pressStyle,
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <NotificationTypeIcon variant={status} size={44} />

              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                  }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flexShrink: 1,
                      fontFamily: Inter.semiBold,
                      fontSize: 15,
                      letterSpacing: -0.4,
                      color: '#111827',
                      lineHeight: 20,
                    }}>
                    {title}
                  </Text>
                  {!item.read ? (
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 9999,
                        backgroundColor: tokens.unreadDot,
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                </View>

                <NotificationBody text={item.body} />

                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 12,
                    letterSpacing: -0.2,
                    color: '#9CA3AF',
                    lineHeight: 16,
                    marginTop: 2,
                  }}>
                  {source}  ·  {item.timeLabel}
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});
