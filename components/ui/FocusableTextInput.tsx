import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import {
  INPUT_BRAND,
  INPUT_PLACEHOLDER,
  INPUT_TEXT,
  inputFieldBase,
  inputFieldError,
  inputFieldFocused,
} from '@/lib/ui/inputFocus';
import { Inter } from '@/lib/typography/inter';

export type FocusableTextInputProps = TextInputProps & {
  /** When true, applies the error border/ring instead of brand focus. */
  hasError?: boolean;
  style?: StyleProp<TextStyle>;
};

/**
 * Soft chip TextInput with home-brand blue focus ring.
 * Use for any standalone field that isn’t `AppInput`.
 */
export const FocusableTextInput = forwardRef<TextInput, FocusableTextInputProps>(
  function FocusableTextInput(
    { hasError = false, style, onFocus, onBlur, placeholderTextColor, ...rest },
    ref,
  ) {
    const [focused, setFocused] = useState(false);

    return (
      <TextInput
        ref={ref}
        {...rest}
        placeholderTextColor={placeholderTextColor ?? INPUT_PLACEHOLDER}
        selectionColor={INPUT_BRAND}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.base,
          inputFieldBase,
          focused && !hasError ? inputFieldFocused : null,
          hasError ? inputFieldError : null,
          style,
        ]}
      />
    );
  },
);

const styles = StyleSheet.create({
  base: {
    fontFamily: Inter.regular,
    fontSize: 16,
    color: INPUT_TEXT,
    letterSpacing: -0.64,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
