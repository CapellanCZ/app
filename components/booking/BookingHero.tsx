import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BookingChevronIcon } from '@/components/booking/BookingIcons';
import { Inter } from '@/lib/typography/inter';

/** Figma doctor portrait model (node 2235:1558) — full-body, not avatar crop. */
const doctorHeroModel = require('@/assets/images/booking/doctor-hero.png');

type Props = {
  doctorName: string;
  specialty: string;
  onBack: () => void;
};

function BrandHeart() {
  return (
    <Svg width={22} height={18} viewBox="0 0 40 33" fill="none" opacity={0.35}>
      <Path
        d="M33.7 6.3C37.2 9.8 37.2 15.4 33.7 18.9L23.7 28.9C21.7 30.9 18.4 30.9 16.4 28.9L7.5 19.9L21.1 6.3C24.6 2.8 30.2 2.8 33.7 6.3Z"
        fill="#5E5E5E"
      />
    </Svg>
  );
}

/**
 * Booking hero — same pattern as GetStartedHero:
 * flex image area fills space above the sheet; model sticks to the top-right.
 */
export function BookingHero({ doctorName, specialty, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9', overflow: 'hidden' }}>
      {/* Doctor model — pinned to top-right, fills the hero (get-started style) */}
      <Image
        source={doctorHeroModel}
        accessibilityLabel="Doctor"
        style={{
          position: 'absolute',
          top: insets.top * 0.2,
          right: -screenW * 0.06,
          width: screenW * 0.72,
          height: '108%',
        }}
        resizeMode="contain"
      />

      {/* Soft fade into the booking sheet */}
      <LinearGradient
        colors={[
          'rgba(249,249,249,0)',
          'rgba(249,249,249,0.35)',
          'rgba(249,249,249,0.85)',
          '#F9F9F9',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '28%',
        }}
        pointerEvents="none"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={{
          marginTop: insets.top + 8,
          marginLeft: 25,
          width: 42,
          height: 42,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
        <View style={{ transform: [{ scaleX: -1 }] }}>
          <BookingChevronIcon size={24} color="#6C6C6C" />
        </View>
      </Pressable>

      <View style={{ marginTop: 28, marginLeft: 25, maxWidth: '48%', gap: 12, zIndex: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <BrandHeart />
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 20,
              color: '#CFCFCF',
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
