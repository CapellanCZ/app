import { forwardRef, useCallback, useState } from 'react';
import { Pressable, View, type TextInput, type TextInputProps } from 'react-native';

import { IconsaxCloseCircleIcon } from '@/components/icons/IconsaxCloseCircleIcon';
import { IconsaxSearchIcon } from '@/components/icons/IconsaxSearchIcon';
import { InputGroup, Label, TextField } from 'heroui-native';

/** CampusCare Figma Search Bar (node 703:33216): flat pill, #F8F9FE, 24px radius, Body M placeholder. */
const INPUT_CLASS =
  'min-h-[52px] rounded-[24px] border-0 border-transparent bg-[#F8F9FE] py-3 text-md font-normal leading-5 text-[#181D27] shadow-none ios:shadow-none android:shadow-none focus:border-transparent';

export type SearchBarProps = Omit<TextInputProps, 'value' | 'defaultValue' | 'onChangeText'> & {
  /** Optional label above the field; omit for Figma-style bar only. */
  label?: string;
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  /** HeroUI placeholder tone (e.g. `text-[#8F9098]`). */
  placeholderColorClassName?: string;
  /** Outer wrapper (`TextField` when `label` is set, else `View`). */
  className?: string;
  /** `InputGroup` classes (default: full width + clip to pill). */
  inputGroupClassName?: string;
};

/**
 * Search field using HeroUI Native `InputGroup` (and optional `TextField` + `Label`).
 * Clear control shows only when the field is focused and has non-whitespace text.
 */
export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
  {
    label,
    value: valueProp,
    defaultValue = '',
    onChangeText,
    placeholder = 'Search',
    placeholderColorClassName = 'text-[#8F9098]',
    className,
    inputGroupClassName,
    onFocus,
    onBlur,
    editable = true,
    ...inputProps
  },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : internal;

  const commit = useCallback(
    (text: string) => {
      if (!controlled) {
        setInternal(text);
      }
      onChangeText?.(text);
    },
    [controlled, onChangeText],
  );

  const [focused, setFocused] = useState(false);
  const showClear = focused && value.trim().length > 0 && editable !== false;

  const iconColor = '#787777';

  const group = (
    <InputGroup
      className={inputGroupClassName ?? 'relative w-full overflow-hidden rounded-[24px]'}>
      <InputGroup.Prefix isDecorative className="justify-center pl-4 pr-4">
        <IconsaxSearchIcon size={20} color={iconColor} />
      </InputGroup.Prefix>
      <InputGroup.Input
        ref={ref}
        variant="primary"
        className={INPUT_CLASS}
        editable={editable}
        placeholder={placeholder}
        placeholderColorClassName={placeholderColorClassName}
        value={value}
        onChangeText={commit}
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {showClear ? (
        <InputGroup.Suffix className="justify-center pl-2 pr-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={10}
            onPress={() => commit('')}>
            <IconsaxCloseCircleIcon size={20} color={iconColor} />
          </Pressable>
        </InputGroup.Suffix>
      ) : null}
    </InputGroup>
  );

  if (label != null && label !== '') {
    return (
      <TextField className={className}>
        <Label>{label}</Label>
        {group}
      </TextField>
    );
  }

  return <View className={className}>{group}</View>;
});
