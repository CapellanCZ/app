import { StyleSheet, Image, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { GetStartedGlassButton } from '@/components/auth/GetStartedGlassButton';
import { Inter } from '@/lib/typography/inter';

const BG = '#F9F9F9';

export type GetStartedHeroProps = {
  onSignIn: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
};

export function GetStartedHero({ onSignIn, onTerms, onPrivacy }: GetStartedHeroProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  return (
    <View style={styles.root}>
      {/* Image area — sharp cut into the bottom panel */}
      <View style={styles.imageArea}>
        <Image
          source={require('../../assets/images/booking/doctor-hero.png')}
          style={{
            width: screenW * 0.9,
            height: '78%',
            position: 'absolute',
            bottom: 28,
            alignSelf: 'center',
            left: screenW * 0.06,
          }}
          resizeMode="contain"
        />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.safePanel}>
        {/* Soft top shadow (works on Android + iOS; elevation can't cast upward). */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.12)']}
          locations={[0, 0.55, 1]}
          style={styles.topShadow}
        />
        <View style={styles.panel}>
          <View style={styles.textBlock}>
            <Text style={styles.headline}>Shaping the Future of{'\n'}Health Care</Text>
            <Text style={styles.subtitle}>
              Book your appointments visits faster with the Health Service Office.
            </Text>
          </View>

          <View style={styles.btnStack}>
            <GetStartedGlassButton onPress={onSignIn} />
          </View>

          <Text style={styles.legal}>
            {'By proceeding, you agree to our '}
            <Text
              style={styles.legalLink}
              onPress={onTerms}
              suppressHighlighting={false}
              accessibilityRole="link"
              accessibilityLabel="Terms of Use">
              Terms of Use
            </Text>
            {' and acknowledge that you have read our '}
            <Text
              style={styles.legalLink}
              onPress={onPrivacy}
              suppressHighlighting={false}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy">
              Privacy Policy
            </Text>
          </Text>
        </View>
      </SafeAreaView>

      {/* Grey heart + CampusCare wordmark */}
      <View style={[styles.logoRow, { top: insets.top + 18 }]} pointerEvents="none">
        <Image
          source={require('../../assets/heart-grey.png')}
          style={styles.logoHeart}
          resizeMode="contain"
          accessibilityLabel="CampusCare"
        />
        <Text style={styles.logoText}>CampusCare</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  imageArea: {
    flex: 1,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  safePanel: {
    backgroundColor: '#F9F9F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    zIndex: 2,
    // Pull panel up so it covers the lower body a bit.
    marginTop: -48,
  },
  topShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -36,
    height: 36,
    zIndex: 3,
  },
  panel: {
    backgroundColor: '#F9F9F9',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 16,
  },
  textBlock: {
    gap: 10,
    alignItems: 'center',
  },
  headline: {
    // Weight lives in the font file — don't set fontWeight or iOS/Android may ignore Inter-Medium.
    fontFamily: Inter.medium,
    fontSize: 42,
    color: '#111111',
    letterSpacing: -3,
    textAlign: 'center',
    lineHeight: 46,
  },
  subtitle: {
    fontFamily: Inter.regular,
    fontSize: 17,
    color: '#727272',
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  btnStack: {
    marginTop: 4,
    gap: 12,
  },
  legal: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#A4A7AE',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  legalLink: {
    color: '#717680',
    textDecorationLine: 'underline',
  },
  logoRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  logoHeart: {
    width: 28,
    height: 24,
    opacity: 0.45,
  },
  logoText: {
    fontFamily: Inter.regular,
    fontSize: 20,
    color: '#B8B8B8',
    letterSpacing: -1.6,
  },
});
