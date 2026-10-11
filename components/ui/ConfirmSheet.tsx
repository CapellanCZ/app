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

import { IconsaxDangerIcon } from '@/components/icons/IconsaxDangerIcon';
import { AppButton } from '@/components/ui/AppButton';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';
import type { ConfirmSheetIcon } from '@/lib/ui/confirmSheetStore';

const SHEET_OFFSCREEN = 480;

export type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  icon?: ConfirmSheetIcon;
  /** When omitted, only the confirm button is shown (info dialog). */
  cancelLabel?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function SheetIcon({ icon }: { icon: ConfirmSheetIcon }) {
  if (icon === 'none') return null;

  const isDanger = icon === 'danger';
  return (
    <View
      style={[
        styles.iconWell,
        { backgroundColor: isDanger ? '#FEE4E2' : '#D3E9FA' },
      ]}>
      <IconsaxDangerIcon size={26} color={isDanger ? '#D92D20' : '#4D7A9A'} />
    </View>
  );
}

/**
 * CampusCare confirm / info bottom sheet — Inter, white card, safe-action first.
 * Use instead of React Native `Alert.alert` on Android/iOS.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  icon = 'info',
  cancelLabel,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN);

  const finishClose = useCallback(
    (action: 'confirm' | 'cancel') => {
      if (action === 'confirm') onConfirm();
      else onCancel();
    },
    [onConfirm, onCancel],
  );

  const animateOut = useCallback(
    (action: 'confirm' | 'cancel') => {
      sheetTranslateY.set(
        withTiming(SHEET_OFFSCREEN, { duration: 240, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
            runOnJS(finishClose)(action);
          }
        }),
      );
    },
    [sheetTranslateY, finishClose],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      sheetTranslateY.set(SHEET_OFFSCREEN);
      sheetTranslateY.set(
        withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [visible, sheetTranslateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.get() }],
  }));

  if (!mounted) return null;

  const hasCancel = Boolean(cancelLabel);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => animateOut('cancel')}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={() => animateOut('cancel')}
          style={styles.backdrop}
        />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
            sheetStyle,
          ]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <SheetIcon icon={icon} />
            <View style={styles.textBlock}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.message}>{message}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {hasCancel ? (
              destructive ? (
                <>
                  {/* Safe action first for destructive confirms (matches LogoutModal). */}
                  <AppButton
                    label={cancelLabel!}
                    variant="dark"
                    onPress={() => animateOut('cancel')}
                    accessibilityLabel={cancelLabel}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={confirmLabel}
                    onPress={() => animateOut('confirm')}
                    {...androidPressProps({ hitSlop: 4 })}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && { opacity: 0.88 },
                    ]}>
                    <Text style={[styles.secondaryLabel, styles.destructiveLabel]}>
                      {confirmLabel}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <AppButton
                    label={confirmLabel}
                    variant="dark"
                    onPress={() => animateOut('confirm')}
                    accessibilityLabel={confirmLabel}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={cancelLabel}
                    onPress={() => animateOut('cancel')}
                    {...androidPressProps({ hitSlop: 4 })}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && { opacity: 0.88 },
                    ]}>
                    <Text style={[styles.secondaryLabel, styles.neutralLabel]}>
                      {cancelLabel}
                    </Text>
                  </Pressable>
                </>
              )
            ) : (
              <AppButton
                label={confirmLabel}
                variant="dark"
                onPress={() => animateOut('confirm')}
                accessibilityLabel={confirmLabel}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export type OptionSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  options: { id: string; label: string; selected?: boolean }[];
  onSelect: (id: string) => void;
  onCancel: () => void;
};

/**
 * Option picker bottom sheet — same visual language as ConfirmSheet.
 */
export function OptionSheet({
  visible,
  title,
  message,
  options,
  onSelect,
  onCancel,
}: OptionSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN);

  const finishClose = useCallback(
    (selectedId: string | null) => {
      if (selectedId != null) onSelect(selectedId);
      else onCancel();
    },
    [onSelect, onCancel],
  );

  const animateOut = useCallback(
    (selectedId: string | null) => {
      sheetTranslateY.set(
        withTiming(SHEET_OFFSCREEN, { duration: 240, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
            runOnJS(finishClose)(selectedId);
          }
        }),
      );
    },
    [sheetTranslateY, finishClose],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      sheetTranslateY.set(SHEET_OFFSCREEN);
      sheetTranslateY.set(
        withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [visible, sheetTranslateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.get() }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => animateOut(null)}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={() => animateOut(null)}
          style={styles.backdrop}
        />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
            sheetStyle,
          ]}>
          <View style={styles.handle} />

          <View style={[styles.textBlock, { marginBottom: 16 }]}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.optionList}>
            {options.map((opt) => (
              <Pressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(opt.selected) }}
                accessibilityLabel={opt.label}
                onPress={() => animateOut(opt.id)}
                {...androidPressProps({ hitSlop: 2 })}
                style={({ pressed }) => [
                  styles.optionRow,
                  opt.selected && styles.optionRowSelected,
                  pressed && { opacity: 0.88 },
                ]}>
                <Text
                  style={[
                    styles.optionLabel,
                    opt.selected && styles.optionLabelSelected,
                  ]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
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
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3E3E3',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: Inter.semiBold,
    fontSize: 22,
    color: '#222222',
    letterSpacing: -0.88,
    lineHeight: 28,
    textAlign: 'center',
  },
  message: {
    fontFamily: Inter.regular,
    fontSize: 15,
    color: 'rgba(114, 114, 114, 0.85)',
    letterSpacing: -0.3,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    gap: 12,
  },
  secondaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    borderCurve: 'continuous',
    backgroundColor: '#F9F9F9',
  },
  secondaryLabel: {
    fontFamily: Inter.medium,
    fontSize: 16,
    letterSpacing: -0.32,
    lineHeight: 22,
  },
  destructiveLabel: {
    color: '#C93B2E',
  },
  neutralLabel: {
    color: '#222222',
  },
  optionList: {
    gap: 8,
  },
  optionRow: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  optionRowSelected: {
    backgroundColor: '#F5F8FF',
    borderWidth: 1,
    borderColor: '#2970FF',
  },
  optionLabel: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#222222',
    letterSpacing: -0.32,
  },
  optionLabelSelected: {
    color: '#155EEF',
    fontFamily: Inter.semiBold,
  },
});
