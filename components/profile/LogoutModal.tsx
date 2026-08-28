import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { AppButton } from '@/components/ui/AppButton';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

export type LogoutModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const SHEET_OFFSCREEN = 420;

/**
 * Logout confirmation — CampusCare bottom sheet (Inter, white card, safe-action first).
 */
export function LogoutModal({ visible, onConfirm, onCancel }: LogoutModalProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN);

  const finishClose = useCallback(
    (action: 'confirm' | 'cancel') => {
      if (action === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    },
    [onConfirm, onCancel],
  );

  const animateOut = useCallback(
    (action: 'confirm' | 'cancel') => {
      sheetTranslateY.value = withTiming(
        SHEET_OFFSCREEN,
        { duration: 240, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
            runOnJS(finishClose)(action);
          }
        },
      );
    },
    [sheetTranslateY, finishClose],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      sheetTranslateY.value = SHEET_OFFSCREEN;
      sheetTranslateY.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible, sheetTranslateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => animateOut('cancel')}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={() => animateOut('cancel')}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          }}
        />

        <Animated.View
          style={[
            {
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 12,
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
            sheetStyle,
          ]}>
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

          <View style={{ alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#D3E9FA',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <LogoutIcon size={26} color="#4D7A9A" />
            </View>

            <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: Inter.semiBold,
                  fontSize: 22,
                  color: '#222222',
                  letterSpacing: -0.88,
                  lineHeight: 28,
                  textAlign: 'center',
                }}>
                Log out?
              </Text>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 15,
                  color: 'rgba(114, 114, 114, 0.85)',
                  letterSpacing: -0.3,
                  lineHeight: 22,
                  textAlign: 'center',
                  maxWidth: 300,
                }}>
                You&apos;ll need to sign in again with a one-time password sent to your email.
              </Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <AppButton
              label="Stay signed in"
              variant="dark"
              onPress={() => animateOut('cancel')}
              accessibilityLabel="Stay signed in"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              onPress={() => animateOut('confirm')}
              {...androidPressProps({ hitSlop: 4 })}
              style={({ pressed }) => ({
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 48,
                backgroundColor: '#F9F9F9',
                opacity: pressed ? 0.88 : 1,
              })}>
              <Text
                style={{
                  fontFamily: Inter.medium,
                  fontSize: 16,
                  color: '#C93B2E',
                  letterSpacing: -0.32,
                  lineHeight: 22,
                }}>
                Log out
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
