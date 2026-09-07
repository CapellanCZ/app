import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
  /** Max height as a fraction of the window (0–1). Default: 0.88 */
  maxHeightFraction?: number;
  /** Show the grabber handle. Default: true */
  showHandle?: boolean;
};

export type BottomSheetModalHandle = {
  /** Play the dismiss animation, then run optional callback (e.g. navigate). */
  dismiss: (afterClose?: () => void) => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
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
    maxHeightFraction = 0.88,
    showHandle = true,
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const closingRef = useRef(false);

  const sheetMaxHeight = SCREEN_HEIGHT * maxHeightFraction;
  const closedBottomPad = Math.max(insets.bottom, 12) + bottomPadding;

  const finishClose = useCallback(() => {
    closingRef.current = false;
    setMounted(false);
    onClose();
  }, [onClose]);

  const finishCloseSilent = useCallback(() => {
    closingRef.current = false;
    setMounted(false);
  }, []);

  const handleDismiss = useCallback(
    (afterClose?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      translateY.set(
        withTiming(SHEET_OFFSCREEN, { duration: CLOSE_MS, easing: IOS_DISMISS }, (finished) => {
          if (!finished) {
            closingRef.current = false;
            return;
          }
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
      // Always clear a stuck dismiss flag so a new open isn't ignored.
      closingRef.current = false;
      if (mounted) {
        // Remounted while already open (e.g. mid-dismiss cancelled) — slide back in.
        translateY.set(withTiming(0, { duration: OPEN_MS, easing: IOS_PRESENT }));
        return;
      }
      translateY.set(SHEET_OFFSCREEN);
      setMounted(true);
      return;
    }

    if (!mounted || closingRef.current) {
      if (!mounted) translateY.set(SHEET_OFFSCREEN);
      return;
    }

    // Parent flipped `visible` off — animate out without re-calling onClose.
    closingRef.current = true;
    translateY.set(
      withTiming(SHEET_OFFSCREEN, { duration: CLOSE_MS, easing: IOS_DISMISS }, (finished) => {
        if (!finished) {
          closingRef.current = false;
          return;
        }
        runOnJS(finishCloseSilent)();
      }),
    );
  }, [visible, mounted, translateY, finishCloseSilent]);

  const present = useCallback(() => {
    closingRef.current = false;
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
          style={[styles.sheet, { backgroundColor, maxHeight: sheetMaxHeight }, sheetStyle]}>
          {showHandle ? <View style={styles.handle} /> : null}
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
