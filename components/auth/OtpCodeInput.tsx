import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
 
const DIGIT_COUNT = 6;
const BRAND = '#2970FF';
const BORDER_DEFAULT = '#D5D7DA';
const BORDER_FOCUS = BRAND;
const BORDER_FILLED = '#181D27';
const BG_DEFAULT = '#FFFFFF';
const BG_FOCUS = '#F5F8FF';
 
type OtpCodeInputProps = {
  /** Called with the full code string once all digits are entered. */
  onComplete: (code: string) => void;
  /** Disable input while verifying. */
  disabled?: boolean;
  /** If true, shake + clear (set externally after a bad code). */
  hasError?: boolean;
};
 
export function OtpCodeInput({ onComplete, disabled = false, hasError = false }: OtpCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef<(TextInput | null)[]>(Array(DIGIT_COUNT).fill(null));
 
  // Auto-focus first input on mount
  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 350);
    return () => clearTimeout(t);
  }, []);
 
  // Clear on error
  useEffect(() => {
    if (hasError) {
      setDigits(Array(DIGIT_COUNT).fill(''));
      setFocusedIndex(0);
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  }, [hasError]);
 
  const handleChange = useCallback(
    (text: string, index: number) => {
      if (disabled) return;
 
      // Handle paste of full code
      const cleaned = text.replace(/\D/g, '');
      if (cleaned.length === DIGIT_COUNT) {
        const pasted = cleaned.split('');
        setDigits(pasted);
        refs.current[DIGIT_COUNT - 1]?.focus();
        setFocusedIndex(DIGIT_COUNT - 1);
        onComplete(cleaned);
        return;
      }
 
      // Single digit input
      const char = cleaned.slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = char;
        return next;
      });
 
      if (char && index < DIGIT_COUNT - 1) {
        refs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
 
      // Check if all filled after this input
      if (char && index === DIGIT_COUNT - 1) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = char;
          const code = next.join('');
          if (code.length === DIGIT_COUNT) {
            onComplete(code);
          }
          return next;
        });
      }
    },
    [disabled, onComplete],
  );
 
  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
        refs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    },
    [digits],
  );
 
  return (
    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: DIGIT_COUNT }).map((_, i) => {
        const isFocused = focusedIndex === i;
        const isFilled = !!digits[i];
 
        return (
          <Pressable
            key={i}
            onPress={() => {
              refs.current[i]?.focus();
              setFocusedIndex(i);
            }}
            style={{
              width: 48,
              height: 56,
              borderRadius: 14,
              borderWidth: isFocused ? 2 : 1.5,
              borderColor: hasError
                ? '#EF4444'
                : isFocused
                  ? BORDER_FOCUS
                  : isFilled
                    ? BORDER_FILLED
                    : BORDER_DEFAULT,
              backgroundColor: isFocused ? BG_FOCUS : BG_DEFAULT,
              alignItems: 'center',
              justifyContent: 'center',
              ...Platform.select({
                ios: {
                  shadowColor: isFocused ? BRAND : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                },
                android: { elevation: isFocused ? 2 : 0 },
              }),
            }}>
            <TextInput
              ref={(r) => { refs.current[i] = r; }}
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
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#181D27',
                textAlign: 'center',
                width: '100%',
                height: '100%',
                padding: 0,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}