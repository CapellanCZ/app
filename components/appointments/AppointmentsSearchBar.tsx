import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInput as TextInputType,
} from 'react-native';

import {
  RANGE_PRESETS,
  type AppointmentRangePreset,
} from '@/components/appointments/appointmentsFilterUtils';
import { IconsaxCloseCircleIcon } from '@/components/icons/IconsaxCloseCircleIcon';
import { IconsaxSearchIcon } from '@/components/icons/IconsaxSearchIcon';
import { SettingIcon } from '@/components/icons/SettingIcon';
import {
  INPUT_BRAND,
  INPUT_PLACEHOLDER,
  INPUT_TEXT,
  inputFieldBase,
  inputFieldFocused,
} from '@/lib/ui/inputFocus';
import { Inter } from '@/lib/typography/inter';

/** Resting outline — same light gray as appointment cards. */
const OUTLINE = '#E8E8E8';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  range: AppointmentRangePreset;
  onRangeChange: (preset: AppointmentRangePreset) => void;
  placeholder?: string;
};

/**
 * Appointments search — login `AppInput` focus UX + always-visible soft outline.
 * Filter opens native Alert (All / Last 7 / Last 30).
 */
export function AppointmentsSearchBar({
  value,
  onChangeText,
  range,
  onRangeChange,
  placeholder = 'Search by name or condition...',
}: Props) {
  const inputRef = useRef<TextInputType>(null);
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const rangeActive = range !== 'all';
  const selectedLabel =
    RANGE_PRESETS.find((p) => p.id === range)?.label ?? RANGE_PRESETS[0].label;

  const openRangeFilter = () => {
    Alert.alert(
      'Date range',
      'Show appointments in this window',
      [
        ...RANGE_PRESETS.map((preset) => ({
          text: preset.id === range ? `✓ ${preset.label}` : preset.label,
          onPress: () => onRangeChange(preset.id),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  };

  return (
    <Pressable
      accessibilityRole="search"
      onPress={() => inputRef.current?.focus()}
      style={[styles.field, focused ? styles.fieldFocused : styles.fieldIdle]}>
      <IconsaxSearchIcon size={18} color="#6C6C6C" />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={INPUT_PLACEHOLDER}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="search"
        enablesReturnKeyAutomatically
        blurOnSubmit
        selectionColor={INPUT_BRAND}
        accessibilityLabel="Search appointments"
        clearButtonMode="never"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {hasValue ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            inputRef.current?.focus();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <IconsaxCloseCircleIcon size={18} color="#A7A7A7" />
        </Pressable>
      ) : null}
      <Pressable
        onPress={openRangeFilter}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Filter by date range, ${selectedLabel}`}
        accessibilityState={{ selected: rangeActive }}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
        <SettingIcon size={20} color={rangeActive || focused ? INPUT_BRAND : '#6C6C6C'} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
    gap: 10,
    ...inputFieldBase,
  },
  fieldIdle: {
    borderWidth: 1,
    borderColor: OUTLINE,
  },
  fieldFocused: {
    ...inputFieldFocused,
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
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
});
