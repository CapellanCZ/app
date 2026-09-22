import { useCallback } from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { hideSplashScreenOnce } from '@/lib/bootstrap/splashScreen';
import { Inter } from '@/lib/typography/inter';

/** Branded splash — app icon + CampusCare wordmark. */
const ICON_SIZE = 120;

type SplashBrandProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Branded splash. Hides the native splash only after this view has laid out
 * so the mark is never missing during the handoff.
 */
export function SplashBrand({ style }: SplashBrandProps) {
  const onReady = useCallback(() => {
    void hideSplashScreenOnce();
  }, []);

  return (
    <View
      onLayout={onReady}
      style={[
        {
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
        },
        style,
      ]}>
      <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
          resizeMode="contain"
          accessibilityLabel="CampusCare"
        />
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 32,
            color: '#021032',
            letterSpacing: -2.56,
            lineHeight: 38,
            // Keep wordmark readable even if a custom face fails to bind.
            includeFontPadding: false,
          }}>
          CampusCare
        </Text>
      </View>
    </View>
  );
}
