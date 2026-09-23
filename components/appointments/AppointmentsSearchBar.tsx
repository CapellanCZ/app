import { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';

import { IconsaxCloseCircleIcon } from '@/components/icons/IconsaxCloseCircleIcon';
import { IconsaxSearchIcon } from '@/components/icons/IconsaxSearchIcon';
import { Inter } from '@/lib/typography/inter';

/**
 * Appointments search — same white / #E8E8E8 language as cards,
 * focus blue shared with the privacy banner (#048AF3).
 */
const SEARCH = {
  bg: '#FFFFFF',
  border: '#E8E8E8',
  focus: '#048AF3',
  focusRing: 'rgba(4, 138, 243, 0.14)',
  placeholder: '#9E9E9E',
  text: '#222222',
  icon: '#6C6C6C',
  clear: '#A7A7A7',
} as const;

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function AppointmentsSearchBar({
  value,
  onChangeText,
  placeholder = 'Search by doctor or reason',
}: Props) {
  const inputRef = useRef<TextInputType>(null);
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const iconColor = focused ? SEARCH.focus : SEARCH.icon;

  return (
    <Pressable
      accessibilityRole="search"
      onPress={() => inputRef.current?.focus()}
      style={[styles.bar, focused ? styles.barFocused : null]}>
      <IconsaxSearchIcon size={20} color={iconColor} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SEARCH.placeholder}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="search"
        enablesReturnKeyAutomatically
        blurOnSubmit
        selectionColor={SEARCH.focus}
        accessibilityLabel="Search appointments"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        clearButtonMode="never"
      />
      {hasValue ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            inputRef.current?.focus();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={({ pressed }) => [styles.clearBtn, pressed && styles.clearPressed]}>
          <IconsaxCloseCircleIcon size={20} color={SEARCH.clear} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: SEARCH.bg,
    borderWidth: 1,
    borderColor: SEARCH.border,
  },
  barFocused: {
    borderColor: SEARCH.focus,
    ...Platform.select({
      ios: { boxShadow: `0 0 0 3px ${SEARCH.focusRing}` },
      default: {},
    }),
  },
  input: {
    flex: 1,
    fontFamily: Inter.regular,
    fontSize: 15,
    letterSpacing: -0.3,
    color: SEARCH.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    margin: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPressed: {
    opacity: 0.55,
  },
});
