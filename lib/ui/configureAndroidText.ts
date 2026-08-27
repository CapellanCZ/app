import { Platform, Text, TextInput } from 'react-native';

type HostWithDefaults = {
  defaultProps?: {
    includeFontPadding?: boolean;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
  };
};

/**
 * Align Android text metrics with iOS:
 * - strip extra font padding (Android adds it by default → looks taller/looser)
 * - cap accessibility font scale so layouts don’t blow past the iOS look
 *
 * Uses `any`-style host access — `Text.defaultProps` is unsupported in typings
 * and some RN/new-arch builds reject renamed host aliases.
 */
export function configureAndroidText() {
  if (Platform.OS !== 'android') return;

  const defaults = {
    includeFontPadding: false,
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.15,
  };

  try {
    const textHost = Text as unknown as HostWithDefaults;
    textHost.defaultProps = {
      ...(textHost.defaultProps ?? {}),
      ...defaults,
    };

    const inputHost = TextInput as unknown as HostWithDefaults;
    inputHost.defaultProps = {
      ...(inputHost.defaultProps ?? {}),
      ...defaults,
    };
  } catch (e) {
    // Non-fatal — app must still boot if the host rejects defaultProps.
    console.warn('[configureAndroidText] skipped:', e);
  }
}
