import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconsaxVerifyIcon } from '../icons/IconsaxVerifyIcon';
import { IconsaxProfileIcon } from '../icons/IconsaxProfileIcon';
import { IconsaxCalendarIcon } from '../icons/IconsaxCalendarIcon';
import { IconsaxClockIcon } from '../icons/IconsaxClockIcon';
import { IconsaxArrowRightIcon } from '../icons/IconsaxArrowRightIcon';

const BRAND = '#2970FF';
const GRAY_50 = '#FAFAFA';
const GRAY_100 = '#F5F5F5';
const GRAY_200 = '#E9EAEB';
const GRAY_500 = '#717680';
const GRAY_800 = '#252B37';
const GRAY_900 = '#181D27';

type Props = {
  visible: boolean;
  onClose: () => void;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  checkInCode: string;
};

const KNOB_SIZE = 48;
const TRACK_PADDING = 4;

function SlideToCancelButton({ onSlide, trackWidth }: { onSlide: () => void; trackWidth: number }) {
  const maxDrag = trackWidth - KNOB_SIZE - TRACK_PADDING * 2;
  const translateX = useSharedValue(0);
  const chevronOpacity = useSharedValue(1);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    chevronOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  useAnimatedReaction(
    () => translateX.value,
    (current) => {
      if (current === 0) {
        chevronOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          false
        );
      } else {
        chevronOpacity.value = withTiming(0.5, { duration: 200 });
      }
    }
  );

  const handleComplete = () => {
    setIsSliding(true);
    onSlide();
    setTimeout(() => {
      translateX.value = withTiming(0, { duration: 300 });
      setIsSliding(false);
    }, 400);
  };

  const panGesture = Gesture.Pan()
    .enabled(!isSliding)
    .onUpdate((e) => {
      translateX.value = Math.max(0, Math.min(e.translationX, maxDrag));
    })
    .onEnd(() => {
      if (translateX.value >= maxDrag * 0.7) {
        translateX.value = withSpring(maxDrag, { damping: 15, stiffness: 150 });
        runOnJS(handleComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, maxDrag * 0.3], [1, 0], Extrapolate.CLAMP),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    opacity: chevronOpacity.value * interpolate(translateX.value, [maxDrag * 0.5, maxDrag], [1, 0], Extrapolate.CLAMP),
  }));

  return (
    <View style={{
      height: 56,
      backgroundColor: GRAY_900,
      borderRadius: 28,
      overflow: 'hidden',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Label */}
      <Animated.View style={[
        {
          ...StyleSheet.absoluteFillObject,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: KNOB_SIZE + TRACK_PADDING + 16,
          paddingRight: 24,
        },
        labelStyle,
      ]}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF' }}>
          Slide to Cancel Appointment
        </Text>
        <Animated.Text style={[
          { fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
          chevronStyle,
        ]}>
          {`>>>`}
        </Animated.Text>
      </Animated.View>

      {/* Knob */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          {
            position: 'absolute',
            left: TRACK_PADDING,
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          },
          knobStyle,
        ]}>
          <IconsaxArrowRightIcon size={24} color={GRAY_900} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function AppointmentBookedModal({
  visible,
  onClose,
  doctorName,
  appointmentDate,
  appointmentTime,
  checkInCode,
}: Props) {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const trackWidth = screenWidth * 0.9 - 40;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}>
        <Pressable 
          style={{
            backgroundColor: '#FDFDFD',
            borderRadius: 32,
            width: '90%',
            maxWidth: 400,
            maxHeight: screenHeight * 0.85,
            marginHorizontal: 20,
          }}
          onPress={(e) => e.stopPropagation()}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 40,
              paddingBottom: 24,
              paddingHorizontal: 20,
            }}>
          {/* Success Icon + Title */}
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              backgroundColor: GRAY_100,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconsaxVerifyIcon size={50} color="#34D399" />
            </View>

            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '600',
                color: GRAY_800,
                letterSpacing: -0.5,
              }}>
                Appointment Booked
              </Text>
              <Text style={{
                fontSize: 14,
                color: GRAY_500,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                Your appointment has been confirmed.{'\n'}Details have been sent to your email.
              </Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={{
            marginTop: 24,
            backgroundColor: GRAY_50,
            borderRadius: 24,
            padding: 16,
          }}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 32,
              borderWidth: 1,
              borderColor: GRAY_200,
              padding: 20,
            }}>
              {/* Doctor */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 17 }}>
                <IconsaxProfileIcon size={28} color={GRAY_800} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: GRAY_500, letterSpacing: -0.28 }}>
                    Doctor
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: GRAY_900, marginTop: 2 }}>
                    {doctorName}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: GRAY_200, marginVertical: 16 }} />

              {/* Appointment Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 17 }}>
                <IconsaxCalendarIcon size={28} color={GRAY_800} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: GRAY_500, letterSpacing: -0.28 }}>
                    Appointment Date
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: GRAY_900, marginTop: 2 }}>
                    {appointmentDate}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: GRAY_200, marginVertical: 16 }} />

              {/* Appointment Time */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                <IconsaxClockIcon size={28} color={GRAY_800} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: GRAY_500, letterSpacing: -0.28 }}>
                    Appointment Time
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: GRAY_900, marginTop: 2 }}>
                    {appointmentTime}
                  </Text>
                  <Text style={{ fontSize: 12, color: GRAY_500, marginTop: 4 }}>
                    Please be 10 minutes early in your appointment
                  </Text>
                </View>
              </View>
            </View>

            {/* Barcode */}
            <View style={{
              marginTop: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}>
              <View style={{
                width: '100%',
                height: 100,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                {/* Barcode placeholder - simplified bars */}
                <View style={{ flexDirection: 'row', gap: 2, alignItems: 'flex-end' }}>
                  {[2, 1, 1, 2, 1, 2, 1, 1, 2, 3, 1, 2, 1, 2, 1, 1, 2, 1, 3, 1, 2, 1, 2, 1, 1, 2].map((h, i) => (
                    <View
                      key={i}
                      style={{
                        width: 3,
                        height: h * 20,
                        backgroundColor: '#000',
                      }}
                    />
                  ))}
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#000', textAlign: 'center' }}>
                {checkInCode}
              </Text>
            </View>
          </View>

          {/* Slide to Cancel Button */}
          <View style={{ marginTop: 24 }}>
            <GestureHandlerRootView>
              <SlideToCancelButton onSlide={onClose} trackWidth={trackWidth} />
            </GestureHandlerRootView>
          </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
