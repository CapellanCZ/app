import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxArchiveIcon } from '@/components/icons/IconsaxArchiveIcon';
import { IconsaxHourglassIcon } from '@/components/icons/IconsaxHourglassIcon';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

export type HomeMoreSheetProps = {
  visible: boolean;
  onClose: () => void;
  onMyQueue: () => void;
  onPastVisits: () => void;
};

const SHEET_OFFSCREEN = 420;

/**
 * Home "More" sheet — Phase 2 quick links matching profile menu rows.
 */
export function HomeMoreSheet({ visible, onClose, onMyQueue, onPastVisits }: HomeMoreSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN);

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const animateOut = useCallback(
    (after?: () => void) => {
      sheetTranslateY.value = withTiming(
        SHEET_OFFSCREEN,
        { duration: 240, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          runOnJS(setMounted)(false);
          runOnJS(finishClose)();
          if (after) runOnJS(after)();
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

  const handleMyQueue = () => {
    animateOut(onMyQueue);
  };

  const handlePastVisits = () => {
    animateOut(onPastVisits);
  };

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => animateOut()}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={() => animateOut()}
          {...androidPressProps()}
          style={styles.backdrop}
        />

        <Animated.View
          style={[
            sheetStyle,
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}>
          <View style={styles.handle} />

          <View style={{ gap: 6 }}>
            <Text style={styles.title}>More</Text>
            <Text style={styles.subtitle}>Clinic tools and visit history</Text>
          </View>

          <View style={{ gap: 10 }}>
            <ProfileMenuRow
              icon={<IconsaxHourglassIcon size={24} color="#111111" />}
              label="My Queue"
              onPress={handleMyQueue}
            />
            <ProfileMenuRow
              icon={<IconsaxArchiveIcon size={24} color="#111111" />}
              label="Past Visits"
              onPress={handlePastVisits}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
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
  sheet: {
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
  title: {
    fontFamily: Inter.medium,
    fontSize: 22,
    color: '#222222',
    letterSpacing: -0.88,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Inter.regular,
    fontSize: 15,
    color: '#727272',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
});
