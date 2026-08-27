import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { androidPressProps } from '@/lib/ui/androidPress';
import { Inter } from '@/lib/typography/inter';

const BRAND = '#2970FF';
const BRAND_DARK = '#155EEF';
const BRAND_SOFT = '#F5F8FF';
const DISABLED = '#D5D7DA';
const BLACK = '#000000';

export type AppButtonVariant = 'primary' | 'secondary' | 'dark';

export type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const isDark = variant === 'dark';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      {...androidPressProps({
        light: isPrimary || isDark,
        hitSlop: 4,
      })}
      style={({ pressed }) => [
        styles.base,
        isDark ? styles.dark : isPrimary ? styles.primary : styles.secondary,
        isDisabled && isPrimary ? styles.primaryDisabled : null,
        isDisabled && isDark ? styles.darkDisabled : null,
        isDisabled && !isPrimary && !isDark ? styles.secondaryDisabled : null,
        pressed &&
          !isDisabled &&
          (isDark
            ? styles.darkPressed
            : isPrimary
              ? styles.primaryPressed
              : styles.secondaryPressed),
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            isDark || isPrimary ? styles.labelOnDark : styles.labelSecondary,
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    height: 48,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: BRAND,
    borderWidth: 1,
    borderColor: 'rgba(0,18,41,0.10)',
    overflow: 'hidden',
  },
  primaryPressed: {
    backgroundColor: '#1D65F5',
    opacity: Platform.OS === 'android' ? 0.92 : 1,
  },
  dark: {
    backgroundColor: BLACK,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#C8C8C8',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 14,
        }
      : { elevation: 0 }),
  },
  darkPressed: {
    backgroundColor: '#222222',
    opacity: Platform.OS === 'android' ? 0.92 : 1,
  },
  darkDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryDisabled: {
    backgroundColor: DISABLED,
    borderColor: DISABLED,
  },
  secondary: {
    backgroundColor: BRAND_SOFT,
    overflow: 'hidden',
  },
  secondaryPressed: {
    backgroundColor: '#EBF0FF',
    opacity: Platform.OS === 'android' ? 0.92 : 1,
  },
  secondaryDisabled: {
    backgroundColor: '#F0F0F0',
  },
  label: {
    fontFamily: Inter.medium,
    fontSize: 16,
    letterSpacing: -0.32,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  labelOnDark: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: BRAND_DARK,
  },
});
