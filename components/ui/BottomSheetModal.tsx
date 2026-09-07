import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { androidPressProps } from '@/lib/ui/androidPress';

type Props = {
  visible: boolean;
  children: ReactNode;
  onClose: () => void;
  /** Extra bottom padding inside the sheet (on top of safe area). Default: 24 */
  bottomPadding?: number;
  /** Whether tapping outside dismisses the sheet. Default: true */
  dismissOnBackdropPress?: boolean;
  /** Sheet surface color. Default: `#FFFFFF` */
  backgroundColor?: string;
};

export type BottomSheetModalHandle = {
  /** Play the dismiss animation, then run optional callback (e.g. navigate). */
  dismiss: (afterClose?: () => void) => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.88;
const SHEET_OFFSCREEN = Math.min(SCREEN_HEIGHT * 0.55, 480);
const SCRIM = 'rgba(0, 0, 0, 0.55)';

const IOS_PRESENT = Easing.bezier(0.32, 0.72, 0, 1);
const IOS_DISMISS = Easing.bezier(0.4, 0, 0.68, 0.06);
const OPEN_MS = 280;
const CLOSE_MS = 220;

/**
 * Content-sized bottom sheet (no tall empty pageSheet card).
 * Solid scrim on the root (reliable on iOS) + sheet slides on a UI-thread timeline.
 */
export const BottomSheetModal = forwardRef<BottomSheetModalHandle, Props>(function BottomSheetModal(
  {
    visible,
    children,
    onClose,
    bottomPadding = 24,
    dismissOnBackdropPress = true,
    backgroundColor = '#FFFFFF',
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SHEET_OFFSCREEN);

  const closedBottomPad = Math.max(insets.bottom, 12) + bottomPadding;

  const finishClose = useCallback(() => {
    setMounted(false);
    onClose();
  }, [onClose]);

  const handleDismiss = useCallback(
    (afterClose?: () => void) => {
      translateY.set(
        withTiming(SHEET_OFFSCREEN, { duration: CLOSE_MS, easing: IOS_DISMISS }, (finished) => {
          if (!finished) return;
          runOnJS(finishClose)();
          if (afterClose) runOnJS(afterClose)();
        }),
      );
    },
    [translateY, finishClose],
  );

  useImperativeHandle(ref, () => ({ dismiss: handleDismiss }), [handleDismiss]);

  useEffect(() => {
    if (!visible) {
      setMounted(false);
      translateY.set(SHEET_OFFSCREEN);
      return;
    }

    translateY.set(SHEET_OFFSCREEN);
    setMounted(true);
  }, [visible, translateY]);

  const present = useCallback(() => {
    translateY.set(SHEET_OFFSCREEN);
    translateY.set(withTiming(0, { duration: OPEN_MS, easing: IOS_PRESENT }));
  }, [translateY]);

  const sheetStyle = useAnimatedStyle(() => {
    const kbLift = -keyboardHeight.get();
    const keyboardOpenBottomPad = Math.max(24, bottomPadding);
    return {
      paddingBottom: kbLift > 10 ? keyboardOpenBottomPad : closedBottomPad,
      transform: [{ translateY: translateY.get() - Math.max(0, kbLift) }],
    };
  });

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onShow={present}
      onRequestClose={() => handleDismiss()}>
      <View style={styles.root} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          disabled={!dismissOnBackdropPress}
          onPress={dismissOnBackdropPress ? () => handleDismiss() : undefined}
          {...androidPressProps({ borderless: true })}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[styles.sheet, { backgroundColor, maxHeight: SHEET_MAX_HEIGHT }, sheetStyle]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: SCRIM,
  },
  /** Hug children — never flex:1 (that created the empty white pageSheet). */
  sheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
});
