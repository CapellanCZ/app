import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PhoneMockFrame } from '@/components/auth/PhoneMockFrame';
import { IconsaxTimerIcon } from '@/components/icons/IconsaxTimerIcon';
import { Inter } from '@/lib/typography/inter';
import { BRAND, CARD_ELEVATION } from '@/lib/ui/theme';

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

/** Oct 2026 calendar cells — Monday-first, 24th selected (matches design). */
const OCT_2026_CELLS: (number | null)[] = [
  null,
  null,
  null,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  null,
];

const MOCK = {
  monthLabel: 'Oct 2026',
  selectedLabel: 'Saturday, Oct 24, 2026',
  selectedDay: 24,
  doctorName: 'Dr. Dannah Feigh Tapaganao, MD',
  role: 'School Physician',
};

type Props = {
  width: number;
  height: number;
};

/**
 * Live HD book-appointment preview inside a phone frame (onboarding slide 3).
 */
export function OnboardingBookPreview({ width, height }: Props) {
  const pad = Math.max(10, Math.round(width * 0.042));
  const scale = width / 320;
  const daySize = Math.max(22, Math.round(28 * scale));

  return (
    <PhoneMockFrame width={width} height={height}>
      <ScrollView
        pointerEvents="none"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{
          paddingTop: Math.round(width * 0.1),
          paddingHorizontal: pad,
          paddingBottom: 48,
          gap: 10 * scale,
        }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Ionicons name="chevron-back" size={18 * scale} color="#111827" />
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 16 * scale,
              color: '#111827',
              letterSpacing: -0.4,
            }}>
            Book appointment
          </Text>
        </View>

        {/* Month calendar */}
        <View
          style={{
            backgroundColor: '#F7F7F8',
            borderRadius: 16,
            paddingHorizontal: 10 * scale,
            paddingTop: 12 * scale,
            paddingBottom: 8 * scale,
            gap: 8 * scale,
            borderWidth: 1,
            borderColor: '#ECECEC',
            ...CARD_ELEVATION,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontFamily: Inter.semiBold,
                fontSize: 14 * scale,
                color: '#111111',
                letterSpacing: -0.4,
              }}>
              {MOCK.monthLabel}
            </Text>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <Text style={{ fontSize: 16 * scale, color: '#6C6C6C' }}>{'‹'}</Text>
              <Text style={{ fontSize: 16 * scale, color: '#6C6C6C' }}>{'›'}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((label) => (
              <View key={label} style={{ flex: 1, alignItems: 'center', paddingBottom: 4 }}>
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 9 * scale,
                    color: '#9CA3AF',
                    letterSpacing: 0.3,
                  }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 2 }}>
            {Array.from({ length: OCT_2026_CELLS.length / 7 }, (_, row) => (
              <View key={`row-${row}`} style={{ flexDirection: 'row' }}>
                {OCT_2026_CELLS.slice(row * 7, row * 7 + 7).map((day, col) => {
                  if (day == null) {
                    return <View key={`e-${row}-${col}`} style={{ flex: 1, height: daySize }} />;
                  }
                  const selected = day === MOCK.selectedDay;
                  const muted = day < 24;
                  return (
                    <View
                      key={`d-${day}`}
                      style={{
                        flex: 1,
                        height: daySize,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <View
                        style={{
                          width: daySize - 2,
                          height: daySize - 2,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? BRAND.primaryCard : 'transparent',
                        }}>
                        <Text
                          style={{
                            fontFamily: selected ? Inter.semiBold : Inter.medium,
                            fontSize: 11 * scale,
                            color: selected ? '#FFFFFF' : muted ? '#C4C4C8' : '#222222',
                          }}>
                          {day}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Selected date banner */}
        <View
          style={{
            backgroundColor: BRAND.primaryCard,
            borderRadius: 14,
            paddingHorizontal: 12 * scale,
            paddingVertical: 12 * scale,
            gap: 4,
            borderWidth: 1,
            borderColor: BRAND.primaryCardDeep,
          }}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 8 * scale,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}>
            Your selected appointment date
          </Text>
          <Text
            style={{
              fontFamily: Inter.semiBold,
              fontSize: 14 * scale,
              color: '#FFFFFF',
              letterSpacing: -0.5,
            }}>
            {MOCK.selectedLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <IconsaxTimerIcon size={11 * scale} color="rgba(255,255,255,0.9)" />
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 9 * scale,
                color: 'rgba(255,255,255,0.9)',
                flex: 1,
              }}>
              Pick a time below that works for your visit
            </Text>
          </View>
        </View>

        {/* Provider card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#ECECEC',
            padding: 10 * scale,
            ...CARD_ELEVATION,
          }}>
          <View
            style={{
              width: 40 * scale,
              height: 40 * scale,
              borderRadius: 999,
              backgroundColor: BRAND.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: Inter.semiBold,
                fontSize: 14 * scale,
                color: BRAND.primary,
              }}>
              D
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: Inter.semiBold,
                fontSize: 12 * scale,
                color: '#111827',
                letterSpacing: -0.3,
              }}>
              {MOCK.doctorName}
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 10 * scale,
                color: '#6B7280',
              }}>
              {MOCK.role}
            </Text>
          </View>
        </View>
      </ScrollView>
    </PhoneMockFrame>
  );
}
