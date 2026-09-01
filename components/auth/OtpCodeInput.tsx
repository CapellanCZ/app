import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  OTP_DIGIT_COUNT,
  normalizeOtpCode,
  otpAutofillInputProps,
  otpDigitsFromCode,
} from '@/lib/auth/otpAutofill';
import { Inter } from '@/lib/typography/inter';
import {
  INPUT_BRAND,
  INPUT_BRAND_RING,
  INPUT_ERROR,
  INPUT_ERROR_RING,
  INPUT_FIELD_BG,
  INPUT_TEXT,
} from '@/lib/ui/inputFocus';

const FIELD_BG = INPUT_FIELD_BG;
const TEXT = INPUT_TEXT;
const ERROR = INPUT_ERROR;
const BRAND = INPUT_BRAND;
const BRAND_RING = INPUT_BRAND_RING;
const ERROR_RING = INPUT_ERROR_RING;

const digitTextStyle = {
  fontFamily: Inter.semiBold,
  fontSize: 20,
  letterSpacing: -0.8,
  color: TEXT,
  textAlign: 'center' as const,
};

type OtpCodeInputProps = {
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
};

export function OtpCodeInput({
  onComplete,
  onChange,
  disabled = false,
  hasError = false,
}: OtpCodeInputProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  onChangeRef.current = onChange;
  onCompleteRef.current = onComplete;

  const digits = otpDigitsFromCode(code);
  const activeIndex = Math.min(code.length, OTP_DIGIT_COUNT - 1);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasError) return;
    completedRef.current = false;
    setCode('');
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [hasError]);

  useEffect(() => {
    onChangeRef.current?.(code);
    if (code.length === OTP_DIGIT_COUNT && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.(code);
    }
    if (code.length < OTP_DIGIT_COUNT) {
      completedRef.current = false;
    }
  }, [code]);

  const handleCodeChange = useCallback(
    (raw: string) => {
      if (disabled) return;
      setCode(normalizeOtpCode(raw));
    },
    [disabled],
  );

  const renderBox = (index: number) => {
    const isActive = activeIndex === index && !disabled;
    const showFocus = isActive && !hasError;

    return (
      <View
        key={index}
        style={{
          flex: 1,
          height: 52,
          borderRadius: 16,
          borderWidth: showFocus || hasError ? 1.5 : 0,
          borderColor: hasError ? ERROR : showFocus ? BRAND : 'transparent',
          backgroundColor: FIELD_BG,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'ios' && (hasError || showFocus)
            ? {
                boxShadow: hasError
                  ? `0 0 0 3px ${ERROR_RING}`
                  : `0 0 0 3px ${BRAND_RING}`,
              }
            : null),
        }}>
        <Text style={digitTextStyle}>{digits[index]}</Text>
      </View>
    );
  };

  return (
    <Pressable
      accessibilityRole="none"
      disabled={disabled}
      onPress={() => inputRef.current?.focus()}
      style={{ width: '100%' }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' }}>
        {renderBox(0)}
        {renderBox(1)}
        {renderBox(2)}
        <View style={{ width: 12, height: 1.5, backgroundColor: '#D5D7DA', borderRadius: 1 }} />
        {renderBox(3)}
        {renderBox(4)}
        {renderBox(5)}
      </View>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleCodeChange}
        editable={!disabled}
        maxLength={OTP_DIGIT_COUNT}
        caretHidden
        selectionColor={BRAND}
        style={styles.autofillInput}
        {...otpAutofillInputProps()}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  autofillInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
  },
});
