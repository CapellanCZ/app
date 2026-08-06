import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
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
import { toTitleCase, type NotificationItem } from '@/lib/notifications/types';
import { Inter } from '@/lib/typography/inter';

const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;

export type NotificationListRowProps = {
  item: NotificationItem;
  onArchive: (id: string) => void;
  onMarkRead: (id: string) => void;
  /** List index for staggered enter (School Doctors / Medical Records pattern). */
  enterIndex?: number;
  /** When set, the card fades out after this delay (ms), then calls onArchive */
  animateOutDelay?: number;
};

/** Body: 14 / #3F3F3F; emphasize doctor name + “confirmed”. */
function NotificationBody({ text }: { text: string }) {
  const parts = text.split(/(Dr\.\s[\w .]+?(?=\s+was\b)|confirmed)/g);
  return (
    <Text
      style={{
        fontFamily: Inter.regular,
        fontSize: 14,
        letterSpacing: -0.56,
        color: '#3F3F3F',
        lineHeight: 21,
      }}>
      {parts.map((part, i) => {
        if (!part) return null;
        const emphasize = part === 'confirmed' || /^Dr\.\s/i.test(part);
        return (
          <Text
            key={`${i}-${part.slice(0, 16)}`}
            style={
              emphasize
                ? { fontFamily: Inter.medium, fontWeight: '500' }
                : undefined
            }>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

/**
 * Notification card — Figma 2254:1002 / 1020 / 1036 / 2260:1171.
 * Unread: white card. Read: transparent (no fill).
 */
export function NotificationListRow({
  item,
  onArchive,
  onMarkRead,
  enterIndex,
  animateOutDelay,
}: NotificationListRowProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const status = resolveNotificationStatus(item.notificationType, item.title);
  const tokens = NOTIFICATION_STATUS_STYLE[status];

  useEffect(() => {
    if (animateOutDelay === undefined) return;
    const duration = 220;
    opacity.value = withDelay(
      animateOutDelay,
      withTiming(0, { duration, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onArchive)(item.id);
      }),
    );
    translateY.value = withDelay(
      animateOutDelay,
      withTiming(-6, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [animateOutDelay, item.id, onArchive, opacity, translateY]);

  const archiveStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  const handlePress = () => {
    if (!item.read) onMarkRead(item.id);
    if (item.href) {
      try {
        router.push(item.href as never);
      } catch {
        // ignore invalid hrefs
      }
    }
  };

  return (
    <>
      <Animated.View style={archiveStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${toTitleCase(item.title)}. ${status}`}
          accessibilityState={{ selected: !item.read }}
          onPress={handlePress}
          onLongPress={() => setMenuVisible(true)}
          delayLongPress={350}
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
            exiting={reduceMotion ? undefined : fadeSlideUpExiting()}
            style={[
              {
                backgroundColor: item.read ? 'transparent' : '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 18,
                width: '100%',
              },
              pressStyle,
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              <NotificationTypeIcon variant={status} size={44} />

              <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 18,
                    width: '100%',
                  }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: Inter.medium,
                      fontSize: 16,
                      letterSpacing: -0.64,
                      color: '#000000',
                      lineHeight: 18,
                    }}>
                    {toTitleCase(item.title)}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 8,
                      marginLeft: 8,
                      flexShrink: 0,
                    }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: Inter.regular,
                        fontSize: 12,
                        letterSpacing: -0.48,
                        color: '#6C6C6C',
                        lineHeight: 18,
                        textAlign: 'right',
                      }}>
                      {item.timeLabel}
                    </Text>
                    {!item.read ? (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 9999,
                          backgroundColor: tokens.unreadDot,
                        }}
                      />
                    ) : null}
                  </View>
                </View>

                <NotificationBody text={item.body} />
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
          onPress={() => setMenuVisible(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 12,
              paddingBottom: 36,
              paddingHorizontal: 20,
            }}>
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E3E3E3',
                marginBottom: 20,
              }}
            />
            {!item.read ? (
              <Pressable
                onPress={() => {
                  setMenuVisible(false);
                  onMarkRead(item.id);
                }}
                style={{ paddingVertical: 14 }}>
                <Text style={{ fontFamily: Inter.medium, fontSize: 15, color: '#222222' }}>
                  Mark as read
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                setMenuVisible(false);
                onArchive(item.id);
              }}
              style={{ paddingVertical: 14 }}>
              <Text style={{ fontFamily: Inter.medium, fontSize: 15, color: '#EF4444' }}>
                Archive
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
