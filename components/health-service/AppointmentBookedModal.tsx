import { Modal, Pressable, Text, View, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export function AppointmentBookedModal({
  visible,
  onClose,
  doctorName,
  appointmentDate,
  appointmentTime,
  checkInCode,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');
  
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

          {/* Cancel Button */}
          <View style={{ marginTop: 24 }}>
            <Pressable
              onPress={onClose}
              style={{
                backgroundColor: GRAY_900,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: GRAY_200,
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 6,
                paddingRight: 20,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <IconsaxArrowRightIcon size={24} color={GRAY_900} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FDFDFD' }}>
                  Close
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: 'rgba(253,253,253,0.5)', letterSpacing: 2 }}>
                {`>>>`}
              </Text>
            </Pressable>
          </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
