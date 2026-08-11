import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { Inter } from '@/lib/typography/inter';

const CHIP_BG = '#F9F9F9';
const SELECTED_BG = '#0F0E0E';
const SHEET_OFFSCREEN = 480;

/** Clinic consultation request options for the booking sheet. */
export const CONSULTATION_REQUEST_OPTIONS = [
  'General checkup',
  'Follow-up visit',
  'Illness / symptoms',
  'Medical certificate',
  'Dental consultation',
  'Lab / test review',
  'Other',
] as const;

export type ConsultationRequestOption = (typeof CONSULTATION_REQUEST_OPTIONS)[number];

export function buildBookingReason(
  request: ConsultationRequestOption | null,
  comments: string,
): string {
  const lines = [
    request ? `Consultation request: ${request}` : null,
    comments.trim() ? `Comments: ${comments.trim()}` : null,
  ].filter(Boolean);
  return lines.join('\n') || 'Clinic consultation';
}

type SelectProps = {
  value: ConsultationRequestOption | null;
  onChange: (value: ConsultationRequestOption) => void;
  error?: boolean;
};

/** Booking-styled consultation request dropdown (bottom sheet). */
export function BookingConsultationSelect({ value, onChange, error }: SelectProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN);

  const openSheet = useCallback(() => {
    setVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    sheetTranslateY.value = withTiming(
      SHEET_OFFSCREEN,
      { duration: 260, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setVisible)(false);
      },
    );
  }, [sheetTranslateY]);

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.value = SHEET_OFFSCREEN;
      return;
    }
    sheetTranslateY.value = SHEET_OFFSCREEN;
    sheetTranslateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, sheetTranslateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <>
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 14,
            color: '#6C6C6C',
            letterSpacing: -0.28,
          }}>
          Consultation request
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select consultation request"
          accessibilityState={{ expanded: visible }}
          onPress={openSheet}
          style={{
            backgroundColor: CHIP_BG,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderWidth: error ? 1 : 0,
            borderColor: error ? '#EF4444' : 'transparent',
          }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: Inter.regular,
              fontSize: 16,
              color: value ? '#111111' : '#A7A7A7',
              letterSpacing: -0.64,
            }}>
            {value ?? 'Select reason for visit'}
          </Text>
          <IconsaxArrowDownIcon size={16} color="#6C6C6C" />
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Dim stays fixed — does not slide with the sheet. */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <Animated.View
            style={[
              {
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 12,
                paddingHorizontal: 20,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                maxHeight: '70%',
              },
              sheetStyle,
            ]}>
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E3E3E3',
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 18,
                color: '#111111',
                letterSpacing: -0.72,
                marginBottom: 4,
              }}>
              Consultation request
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 14,
                color: '#6C6C6C',
                letterSpacing: -0.28,
                marginBottom: 12,
              }}>
              Why are you visiting the Health Service Office?
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {CONSULTATION_REQUEST_OPTIONS.map((opt) => {
                const selected = value === opt;
                return (
                  <Pressable
                    key={opt}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      onChange(opt);
                      closeSheet();
                    }}
                    style={{
                      backgroundColor: selected ? SELECTED_BG : CHIP_BG,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: Inter.regular,
                        fontSize: 16,
                        color: selected ? '#FFFFFF' : '#111111',
                        letterSpacing: -0.64,
                      }}>
                      {opt}
                    </Text>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: selected ? '#FFFFFF' : '#D1D5DB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? '#FFFFFF' : 'transparent',
                      }}>
                      {selected ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: SELECTED_BG,
                          }}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

type CommentsProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

/** Booking-styled multiline comments field. */
export function BookingCommentsField({ value, onChange, onFocus, onBlur }: CommentsProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 14,
          color: '#6C6C6C',
          letterSpacing: -0.28,
        }}>
        Additional comments
        <Text style={{ fontFamily: Inter.regular, color: '#A7A7A7' }}> (optional)</Text>
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Share symptoms, concerns, or notes for the clinic…"
        placeholderTextColor="#A7A7A7"
        multiline
        textAlignVertical="top"
        style={{
          minHeight: 96,
          backgroundColor: CHIP_BG,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 14,
          fontFamily: Inter.regular,
          fontSize: 16,
          color: '#111111',
          letterSpacing: -0.64,
          lineHeight: 22,
        }}
      />
    </View>
  );
}
