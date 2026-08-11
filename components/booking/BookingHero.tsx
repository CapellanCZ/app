import { Image, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { Inter } from '@/lib/typography/inter';

/** Figma doctor portrait model (node 2235:1558) — full-body, not avatar crop. */
const doctorHeroModel = require('@/assets/images/booking/doctor-hero.png');
const campusCareHeart = require('@/assets/heart-grey.png');

type Props = {
  doctorName: string;
  specialty: string;
  onBack: () => void;
  /** Hides / fades the model (e.g. when the sheet is fully expanded). */
  modelStyle?: StyleProp<ViewStyle>;
};

/**
 * Booking hero — fills the clipped band above the sheet.
 * Asset is a waist-cropped portrait (hard bottom edge) — tuck that edge
 * under the sheet and fade into it so the cut doesn’t show.
 */
export function BookingHero({ doctorName, specialty, onBack, modelStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9', overflow: 'hidden' }}>
      {/*
        Wrap RN Image so resizeMode="contain" is reliable; animate opacity on the shell.
        Negative bottom tucks the asset’s hard waist crop under the sheet lip.
      */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: screenW * 0.02,
            width: screenW * 0.66,
            // bottom + height come from modelStyle (tucked under sheet)
          },
          modelStyle,
        ]}
        pointerEvents="none">
        <Image
          source={doctorHeroModel}
          accessibilityLabel="Doctor"
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>

      <CircleBackButton
        onPress={onBack}
        style={{
          marginTop: insets.top + 8,
          marginLeft: 25,
          zIndex: 2,
        }}
      />

      <View style={{ marginTop: 44, marginLeft: 25, maxWidth: '48%', gap: 10, zIndex: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Image
            source={campusCareHeart}
            accessibilityLabel="CampusCare"
            style={{ width: 22, height: 18, opacity: 0.45 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 20,
              color: '#B8B8B8',
              letterSpacing: -1.6,
            }}>
            CampusCare
          </Text>
        </View>

        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 24,
              color: '#222222',
              letterSpacing: -1.92,
              lineHeight: 30,
            }}
            numberOfLines={2}>
            {doctorName}
          </Text>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#727272',
              letterSpacing: -0.64,
              lineHeight: 20,
            }}
            numberOfLines={1}>
            {specialty}
          </Text>
        </View>
      </View>
    </View>
  );
}
