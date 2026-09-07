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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

/**
 * Bottom sheet with a reliable dim scrim.
 * Uses RN Modal + overFullScreen + static rgba backdrop (animated opacity on Android
 * often stays at 0 when the Modal mounts after the timing starts).
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

  const translateY = useSharedValue(SCREEN_HEIGHT);

  const closedBottomPad = Math.max(insets.bottom, 12) + bottomPadding;

  const finishClose = useCallback(() => {
    setMounted(false);
    onClose();
  }, [onClose]);

  const handleDismiss = useCallback(
    (afterClose?: () => void) => {
      translateY.set(
        withTiming(SCREEN_HEIGHT, { duration: 280, easing: Easing.in(Easing.cubic) }, (finished) => {
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
    if (visible) {
      setMounted(true);
      translateY.set(SCREEN_HEIGHT);
      // Defer spring until after Modal is in the tree so layout exists.
      requestAnimationFrame(() => {
        translateY.set(
          withSpring(0, {
            damping: 26,
            stiffness: 180,
            mass: 1,
            overshootClamping: true,
          }),
        );
      });
      return;
    }

    setMounted(false);
    translateY.set(SCREEN_HEIGHT);
  }, [visible, translateY]);

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
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => handleDismiss()}>
      <View style={styles.root} collapsable={false}>
        {/* Static rgba — never animate opacity of the scrim (breaks on Android Modal). */}
        <View style={styles.backdrop} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            disabled={!dismissOnBackdropPress}
            onPress={dismissOnBackdropPress ? () => handleDismiss() : undefined}
            style={StyleSheet.absoluteFill}
          />
        </View>

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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
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
