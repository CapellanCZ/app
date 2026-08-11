import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Inter } from '@/lib/typography/inter';

/** Figma Splashscreen 206:37 — heart + CampusCare wordmark. */
const HEART_WIDTH = 86;
const HEART_HEIGHT = 70;

type SplashBrandProps = {
  style?: StyleProp<ViewStyle>;
};

export function SplashBrand({ style }: SplashBrandProps) {
  return (
    <View
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
      <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Image
          source={require('../../assets/heart-blue.png')}
          style={{ width: HEART_WIDTH, height: HEART_HEIGHT }}
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
          }}>
          CampusCare
        </Text>
      </View>
    </View>
  );
}
