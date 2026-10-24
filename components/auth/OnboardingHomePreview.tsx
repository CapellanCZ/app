import { ScrollView, Text, View } from 'react-native';

import { PhoneMockFrame } from '@/components/auth/PhoneMockFrame';
import {
  FigmaBookingsIcon,
  FigmaDropletIcon,
  FigmaHeartRateIcon,
  FigmaVitalsIcon,
} from '@/components/home/FigmaHomeIcons';
import { IconsaxCallFilledIcon } from '@/components/icons/IconsaxCallFilledIcon';
import { IconsaxHourglassIcon } from '@/components/icons/IconsaxHourglassIcon';
import { Inter } from '@/lib/typography/inter';
import { BRAND } from '@/lib/ui/theme';

/** Mock patient + appointment used only for onboarding art. */
const MOCK = {
  firstName: 'Glenn A.',
  doctorName: 'Dannah Feigh Tapaganao',
  specialty: 'Physician',
  dateLabel: '24 Oct, Sat',
  timeLabel: '4:20 PM',
  estLabel: '4:50 PM',
  bp: '140/60',
  hr: '222 bpm',
};

type Props = {
  width: number;
  height: number;
};

/**
 * Live HD home dashboard preview inside a phone frame (onboarding slide 2).
 */
export function OnboardingHomePreview({ width, height }: Props) {
  const pad = Math.max(10, Math.round(width * 0.045));
  const scale = width / 320;
  const s = (n: number) => Math.max(1, Math.round(n * scale));

  return (
    <PhoneMockFrame width={width} height={height}>
      <ScrollView
        pointerEvents="none"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{
          paddingTop: Math.round(width * 0.1),
          paddingHorizontal: pad,
          paddingBottom: 40,
          gap: s(10),
        }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: s(32),
              height: s(32),
              borderRadius: 999,
              backgroundColor: '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: Inter.semiBold, fontSize: s(13), color: '#6B7280' }}>
              G
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Inter.regular, fontSize: s(11), color: '#9CA3AF' }}>
              Welcome back,
            </Text>
            <Text style={{ fontFamily: Inter.semiBold, fontSize: s(14), color: '#111827' }}>
              {MOCK.firstName}
            </Text>
          </View>
          <View
            style={{
              width: s(28),
              height: s(28),
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>

        <Text
          style={{
            fontFamily: Inter.semiBold,
            fontSize: s(18),
            color: '#111827',
            letterSpacing: -0.6,
            marginTop: 2,
          }}>
          How are you feeling today?
        </Text>

        {/* Upcoming card */}
        <View style={{ paddingTop: 6 }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 10,
              zIndex: 2,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: s(8),
                color: '#666',
                textTransform: 'uppercase',
              }}>
              Upcoming Appointments
            </Text>
          </View>
          <View
            style={{
              backgroundColor: BRAND.primaryCard,
              borderRadius: 14,
              padding: 12,
              gap: 10,
              borderWidth: 1,
              borderColor: BRAND.primaryCardDeep,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: '#FFF', fontFamily: Inter.semiBold, fontSize: s(14) }}>
                  D
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Inter.semiBold,
                    fontSize: s(12),
                    color: '#FFFFFF',
                  }}>
                  {MOCK.doctorName}
                </Text>
                <Text
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: s(10),
                    color: 'rgba(255,255,255,0.85)',
                  }}>
                  {MOCK.specialty}
                </Text>
              </View>
              <View
                style={{
                  width: s(28),
                  height: s(28),
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <IconsaxCallFilledIcon size={s(12)} color={BRAND.primary} />
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Inter.medium, fontSize: s(10), color: '#FFF' }}>
                {MOCK.dateLabel}
              </Text>
              <Text style={{ fontFamily: Inter.medium, fontSize: s(10), color: '#FFF' }}>
                {MOCK.timeLabel} · EST {MOCK.estLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            {
              label: 'My Appointments',
              icon: <FigmaBookingsIcon size={s(16)} color={BRAND.primary} />,
            },
            {
              label: 'Vital Signs',
              icon: <FigmaVitalsIcon size={s(16)} color={BRAND.primary} />,
            },
            {
              label: 'My Queue',
              icon: <IconsaxHourglassIcon size={s(16)} color={BRAND.primary} />,
            },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#ECECEC',
                paddingVertical: 10,
                alignItems: 'center',
                gap: 4,
              }}>
              {item.icon}
              <Text
                style={{
                  fontFamily: Inter.medium,
                  fontSize: s(8),
                  color: '#374151',
                  textAlign: 'center',
                }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={{ fontFamily: Inter.semiBold, fontSize: s(13), color: '#111827' }}>
          Your Recent Vitals
        </Text>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: BRAND.soft,
              borderRadius: 12,
              padding: 10,
              gap: 4,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Inter.regular, fontSize: s(9), color: '#6B7280' }}>
                Blood Pressure
              </Text>
              <FigmaDropletIcon size={s(14)} color={BRAND.primary} />
            </View>
            <Text style={{ fontFamily: Inter.semiBold, fontSize: s(16), color: '#111827' }}>
              {MOCK.bp}
            </Text>
            <Text style={{ fontFamily: Inter.medium, fontSize: s(9), color: '#E53935' }}>High</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: BRAND.softSurface,
              borderRadius: 12,
              padding: 10,
              gap: 4,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Inter.regular, fontSize: s(9), color: '#6B7280' }}>
                Avg. Heart Rate
              </Text>
              <FigmaHeartRateIcon size={s(14)} color={BRAND.primary} />
            </View>
            <Text style={{ fontFamily: Inter.semiBold, fontSize: s(16), color: '#111827' }}>
              {MOCK.hr}
            </Text>
            <Text style={{ fontFamily: Inter.medium, fontSize: s(9), color: '#E53935' }}>High</Text>
          </View>
        </View>

        <Text style={{ fontFamily: Inter.semiBold, fontSize: s(13), color: '#111827' }}>
          Announcement
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#ECECEC',
            padding: 8,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: s(44),
              height: s(44),
              borderRadius: 8,
              backgroundColor: '#E5E7EB',
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: Inter.regular, fontSize: s(9), color: '#9CA3AF' }}>
              Oct 21, 2026
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: Inter.semiBold, fontSize: s(11), color: '#111827' }}>
              Test Announcement
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: Inter.regular, fontSize: s(9), color: '#6B7280' }}>
              Campus clinic evaluation notice
            </Text>
          </View>
        </View>
      </ScrollView>
    </PhoneMockFrame>
  );
}
