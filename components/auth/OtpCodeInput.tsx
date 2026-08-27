import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { Inter } from '@/lib/typography/inter';
import {
  INPUT_BRAND,
  INPUT_BRAND_RING,
  INPUT_ERROR,
  INPUT_ERROR_RING,
  INPUT_FIELD_BG,
  INPUT_TEXT,
} from '@/lib/ui/inputFocus';

const DIGIT_COUNT = 6;
const FIELD_BG = INPUT_FIELD_BG;
const TEXT = INPUT_TEXT;
const ERROR = INPUT_ERROR;
const BRAND = INPUT_BRAND;
const BRAND_RING = INPUT_BRAND_RING;
const ERROR_RING = INPUT_ERROR_RING;

type OtpCodeInputProps = {
  /** Called with the full code string once all digits are entered. */
  onComplete?: (code: string) => void;
  /** Called on every change with the partial code string. */
  onChange?: (code: string) => void;
  /** Disable input while verifying. */
  disabled?: boolean;
  /** If true, shake + clear (set externally after a bad code). */
  hasError?: boolean;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function OtpCodeInput({
  onComplete,
  onChange,
  disabled = false,
  hasError = false,
}: OtpCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(DIGIT_COUNT).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef<(TextInput | null)[]>(Array(DIGIT_COUNT).fill(null));
  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  onChangeRef.current = onChange;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasError) return;
    completedRef.current = false;
    setDigits(Array(DIGIT_COUNT).fill(''));
    setFocusedIndex(0);
    const t = setTimeout(() => refs.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, [hasError]);

  // Notify parent after commit — never call parent setState inside setDigits updaters.
  useEffect(() => {
    const code = digits.join('');
    onChangeRef.current?.(code);
    if (code.length === DIGIT_COUNT && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.(code);
    }
    if (code.length < DIGIT_COUNT) {
      completedRef.current = false;
    }
  }, [digits]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      if (disabled) return;

      const cleaned = onlyDigits(text);

      // Full code pasted / autofilled into one box
      if (cleaned.length >= DIGIT_COUNT) {
        const pasted = cleaned.slice(0, DIGIT_COUNT).split('');
        setDigits(pasted);
        refs.current[DIGIT_COUNT - 1]?.focus();
        setFocusedIndex(DIGIT_COUNT - 1);
        return;
      }

      // SMS autofill sometimes delivers 2+ chars mid-entry
      if (cleaned.length > 1) {
        setDigits((prev) => {
          const next = [...prev];
          const chars = cleaned.split('');
          for (let i = 0; i < chars.length && index + i < DIGIT_COUNT; i++) {
            next[index + i] = chars[i]!;
          }
          const focusAt = Math.min(index + chars.length, DIGIT_COUNT - 1);
          queueMicrotask(() => {
            refs.current[focusAt]?.focus();
            setFocusedIndex(focusAt);
          });
          return next;
        });
        return;
      }

      const char = cleaned.slice(-1);
      setDigits((prev) => {
        const next = prev.map((d, i) => (i === index ? char : d));
        if (char && index < DIGIT_COUNT - 1) {
          queueMicrotask(() => {
            refs.current[index + 1]?.focus();
            setFocusedIndex(index + 1);
          });
        }
        return next;
      });
    },
    [disabled],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key !== 'Backspace') return;

      setDigits((prev) => {
        if (prev[index]) {
          return prev.map((d, i) => (i === index ? '' : d));
        }
        if (index > 0) {
          queueMicrotask(() => {
            refs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
          });
          return prev.map((d, i) => (i === index - 1 ? '' : d));
        }
        return prev;
      });
    },
    [],
  );

  const renderBox = (i: number) => {
    const isFocused = focusedIndex === i;
    return (
      <Pressable
        key={i}
        onPress={() => {
          refs.current[i]?.focus();
          setFocusedIndex(i);
        }}
        style={{
          flex: 1,
          height: 52,
          borderRadius: 16,
          borderWidth: isFocused || hasError ? 1.5 : 0,
          borderColor: hasError ? ERROR : isFocused ? BRAND : 'transparent',
          backgroundColor: FIELD_BG,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'ios' && (hasError || isFocused)
            ? {
                boxShadow: hasError
                  ? `0 0 0 3px ${ERROR_RING}`
                  : `0 0 0 3px ${BRAND_RING}`,
              }
            : null),
        }}>
        <TextInput
          ref={(r) => {
            refs.current[i] = r;
          }}
          value={digits[i]}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          maxLength={i === 0 ? DIGIT_COUNT : 1}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          editable={!disabled}
          selectTextOnFocus
          selectionColor={BRAND}
          style={{
            fontFamily: Inter.semiBold,
            fontSize: 20,
            letterSpacing: -0.8,
            color: TEXT,
            textAlign: 'center',
            width: '100%',
            height: '100%',
            padding: 0,
          }}
        />
      </Pressable>
    );
  };

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' }}>
      {renderBox(0)}
      {renderBox(1)}
      {renderBox(2)}
      <View style={{ width: 12, height: 1.5, backgroundColor: '#D5D7DA', borderRadius: 1 }} />
      {renderBox(3)}
      {renderBox(4)}
      {renderBox(5)}
    </View>
  );
}
