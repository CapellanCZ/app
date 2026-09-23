import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { Inter } from '@/lib/typography/inter';
import { ROUTES } from '@/lib/routes';

type AuthLegalFooterProps = {
  onTerms?: () => void;
  onPrivacy?: () => void;
};

function legalMetrics(screenW: number) {
  const raw = Math.round(screenW * (13 / 390));
  const fontSize = Math.min(14, Math.max(12, raw));
  const lineHeight = Math.round(fontSize * (17 / 13));
  const letterSpacing = fontSize * (-0.2 / 13);
  return { fontSize, lineHeight, letterSpacing };
}

/** Shared “By proceeding…” Terms / Privacy line for auth surfaces. */
export function AuthLegalFooter({ onTerms, onPrivacy }: AuthLegalFooterProps) {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const metrics = legalMetrics(screenW);

  const openTerms = () => {
    if (onTerms) {
      onTerms();
      return;
    }
    router.push(ROUTES.terms as never);
  };

  const openPrivacy = () => {
    if (onPrivacy) {
      onPrivacy();
      return;
    }
    router.push(ROUTES.privacy as never);
  };

  return (
    <Text
      style={[
        styles.legal,
        {
          fontSize: metrics.fontSize,
          lineHeight: metrics.lineHeight,
          letterSpacing: metrics.letterSpacing,
        },
      ]}
      allowFontScaling={false}>
      {'By proceeding, you agree to our '}
      <Text
        style={styles.link}
        onPress={openTerms}
        suppressHighlighting={false}
        accessibilityRole="link"
        accessibilityLabel="Terms of Use">
        Terms of Use
      </Text>
      {' and acknowledge that you have read our '}
      <Text
        style={styles.link}
        onPress={openPrivacy}
        suppressHighlighting={false}
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy">
        Privacy Policy
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  legal: {
    fontFamily: Inter.regular,
    color: '#A4A7AE',
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 0,
  },
  link: {
    color: '#717680',
    textDecorationLine: 'underline',
  },
});
