import { forwardRef, ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import {
  INPUT_BRAND,
  INPUT_ERROR,
  INPUT_PLACEHOLDER,
  INPUT_TEXT,
  inputFieldBase,
  inputFieldError,
  inputFieldFocused,
} from '@/lib/ui/inputFocus';
import { Inter } from '@/lib/typography/inter';

const LABEL = '#6C6C6C';
const MUTED = INPUT_PLACEHOLDER;

/**
 * Character set presets for the input:
 * - `text`       → any characters (default)
 * - `numeric`    → digits only `0-9`
 * - `alpha`      → letters only `a-zA-Z` (plus space)
 * - `alphanumeric` → letters + digits (plus space)
 * - `email`      → letters, digits, `@ . _ - +`
 */
export type AppInputType = 'text' | 'numeric' | 'alpha' | 'alphanumeric' | 'email';

const FILTERS: Record<AppInputType, RegExp | null> = {
  text: null,
  numeric: /[^0-9]/g,
  alpha: /[^a-zA-Z ]/g,
  alphanumeric: /[^a-zA-Z0-9 ]/g,
  email: /[^a-zA-Z0-9@._\-+]/g,
};

export type AppInputProps = Omit<TextInputProps, 'style'> & {
  /** Label shown above the field */
  label?: string;
  /** Helper/description text shown below the field */
  description?: string;
  /** Error message — overrides description and applies error styling */
  error?: string;
  /** Element rendered inside the field to the LEFT of the input (icon or element) */
  prefix?: ReactNode;
  /** Element rendered inside the field to the RIGHT of the input (icon or element) */
  suffix?: ReactNode;
  /** Show a thin vertical separator between prefix and input */
  prefixDivider?: boolean;
  /** Show a thin vertical separator between input and suffix */
  suffixDivider?: boolean;
  /** Disables interaction + greys out the field */
  disabled?: boolean;
  /** Restrict which characters can be typed. Default: `text` (no restriction) */
  inputType?: AppInputType;
  /** Custom regex of characters to DISALLOW (overrides `inputType`). Matched chars are stripped. */
  disallowPattern?: RegExp;
  /** Override container style (outer wrapper) */
  containerStyle?: ViewStyle;
  /** Override input row style */
  fieldStyle?: ViewStyle;
};

/**
 * Reusable text input — soft chip surface matching booking fields.
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    label,
    description,
    error,
    prefix,
    suffix,
    prefixDivider = false,
    suffixDivider = false,
    disabled = false,
    inputType = 'text',
    disallowPattern,
    containerStyle,
    fieldStyle,
    onFocus,
    onBlur,
    onChangeText,
    editable,
    placeholderTextColor,
    ...rest
  },
  ref,
) {
  const filter = disallowPattern ?? FILTERS[inputType];
  const handleChangeText = (v: string) => {
    const filtered = filter ? v.replace(filter, '') : v;
    onChangeText?.(filtered);
  };
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const isEditable = editable !== false && !disabled;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          focused && !hasError && styles.fieldFocused,
          hasError && styles.fieldError,
          disabled && styles.fieldDisabled,
          fieldStyle,
        ]}>
        {prefix ? (
          <>
            <View style={styles.slot}>{prefix}</View>
            {prefixDivider ? <View style={styles.divider} /> : null}
          </>
        ) : null}

        <TextInput
          ref={ref}
          {...rest}
          editable={isEditable}
          placeholderTextColor={placeholderTextColor ?? INPUT_PLACEHOLDER}
          selectionColor={INPUT_BRAND}
          style={styles.input}
          onChangeText={handleChangeText}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />

        {suffix ? (
          <>
            {suffixDivider ? <View style={styles.divider} /> : null}
            <View style={styles.slot}>{suffix}</View>
          </>
        ) : null}
      </View>

      {hasError ? (
        <Text style={styles.error}>{error}</Text>
      ) : description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
});

/** Convenience pressable slot for tap-targetable prefix/suffix icons */
export function AppInputSlotButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: Inter.medium,
    fontSize: 14,
    color: LABEL,
    letterSpacing: -0.28,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
    gap: 10,
    ...inputFieldBase,
  },
  fieldFocused: {
    ...inputFieldFocused,
  },
  fieldError: {
    ...inputFieldError,
  },
  fieldDisabled: {
    opacity: 0.65,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  input: {
    flex: 1,
    fontFamily: Inter.regular,
    fontSize: 16,
    lineHeight: 22,
    color: INPUT_TEXT,
    letterSpacing: -0.64,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  description: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: MUTED,
    letterSpacing: -0.28,
    lineHeight: 20,
  },
  error: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: INPUT_ERROR,
    letterSpacing: -0.28,
    lineHeight: 20,
  },
});
