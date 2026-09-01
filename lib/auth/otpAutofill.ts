import { Platform, type TextInputProps } from 'react-native';

export const OTP_DIGIT_COUNT = 6;

/** Domain hint for Supabase email templates — helps iOS Mail / keyboard suggestions. */
export const OTP_EMAIL_DOMAIN_HINT = 'campuscare.app';

/** Strip non-digits and cap length (paste, SMS, or Mail autofill). */
export function normalizeOtpCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT);
}

/** Split a normalized code into fixed-length digit cells for display. */
export function otpDigitsFromCode(code: string): string[] {
  const normalized = normalizeOtpCode(code);
  return Array.from({ length: OTP_DIGIT_COUNT }, (_, i) => normalized[i] ?? '');
}

/**
 * TextInput props that enable OTP suggestions above the keyboard.
 * iOS: QuickType from SMS / Mail · Android: Autofill / SMS Retriever
 */
export function otpAutofillInputProps(): Pick<
  TextInputProps,
  'textContentType' | 'autoComplete' | 'keyboardType' | 'importantForAutofill'
> {
  return Platform.select({
    ios: {
      textContentType: 'oneTimeCode',
      autoComplete: 'one-time-code',
      keyboardType: 'number-pad',
      importantForAutofill: 'yes',
    },
    android: {
      autoComplete: 'sms-otp',
      keyboardType: 'number-pad',
      importantForAutofill: 'yes',
    },
    default: {
      autoComplete: 'one-time-code',
      keyboardType: 'number-pad',
      importantForAutofill: 'yes',
    },
  })!;
}

/** Plain-text line to paste into the Supabase OTP email template. */
export function otpEmailAutofillLine(tokenPlaceholder = '{{ .Token }}'): string {
  return `@${OTP_EMAIL_DOMAIN_HINT} #${tokenPlaceholder}`;
}
