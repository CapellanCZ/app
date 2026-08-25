import { Platform, Text, TextInput } from 'react-native';

type TextDefaults = {
  includeFontPadding?: boolean;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
};

/**
 * Align Android text metrics with iOS:
 * - strip extra font padding (Android adds it by default → looks taller/looser)
 * - cap accessibility font scale so layouts don’t blow past the iOS look
 */
export function configureAndroidText() {
  if (Platform.OS !== 'android') return;

  const defaults: TextDefaults = {
    includeFontPadding: false,
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.15,
  };

  const TextText = Text as typeof Text & { defaultProps?: TextDefaults };
  const RNTextInput = TextInput as typeof TextInput & { defaultProps?: TextDefaults };

  RNText.defaultProps = {
    ...RNText.defaultProps,
    ...defaults,
  };

  RNTextInput.defaultProps = {
    ...RNTextInput.defaultProps,
    ...defaults,
  };
}
