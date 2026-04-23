import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  onClose: () => void;
  /** Extra bottom padding inside the sheet (on top of safe area). Default: 24 */
  bottomPadding?: number;
  /** Whether tapping outside dismisses the sheet. Default: true */
  dismissOnBackdropPress?: boolean;
};

/**
 * Custom bottom sheet modal.
 * - Dark backdrop fades in (tap to dismiss)
 * - Sheet slides up from bottom with spring easing
 * - Rounded top corners (32px)
 * - Drag handle indicator
 * - Safe area + keyboard aware
 */
export function BottomSheetModal({
  children,
  onClose,
  bottomPadding = 24,
  dismissOnBackdropPress = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(600)).current;

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 600,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <View style={styles.root}>
      {/* Backdrop — animated fade */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdropPress ? handleDismiss : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
      </Animated.View>

      {/* Sheet — slides up */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
        style={styles.keyboardWrap}>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12) + bottomPadding,
              transform: [{ translateY }],
            },
          ]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    paddingHorizontal: 20,
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
