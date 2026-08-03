import { Image, Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';

type Props = {
  doctorName: string;
  specialtyLabel: string;
  photoUrl?: string | null;
  dateLabel: string;
  timeLabel: string;
  /** Estimated finish — shown as EST on confirmed appointments only. */
  estDoneLabel?: string | null;
};

/**
 * Figma 2248:175 — white detail card on booking success screen.
 */
export function AppointmentBookedCard({
  doctorName,
  specialtyLabel,
  photoUrl,
  dateLabel,
  timeLabel,
  estDoneLabel,
}: Props) {
  const timeDisplay = estDoneLabel ? `${timeLabel} · EST ${estDoneLabel}` : timeLabel;
  return (
    <View
      style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 20,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#F2ECEC',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 18,
              color: '#000000',
              letterSpacing: -0.64,
            }}
            numberOfLines={1}>
            {doctorName}
          </Text>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#3F3F3F',
              letterSpacing: -1.12,
            }}
            numberOfLines={1}>
            {specialtyLabel}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: '#EFEFEF', width: '100%' }} />

      <View style={{ paddingHorizontal: 8, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text
            style={{
              flex: 1,
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#6C6C6C',
              letterSpacing: -1.12,
            }}>
            Date
          </Text>
          <Text
            style={{
              flex: 1,
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#000000',
              letterSpacing: -1.12,
              textAlign: 'left',
            }}
            numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text
            style={{
              flex: 1,
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#6C6C6C',
              letterSpacing: -1.12,
            }}>
            Time
          </Text>
          <Text
            style={{
              flex: 1,
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#000000',
              letterSpacing: -1.12,
            }}
            numberOfLines={1}>
            {timeDisplay}
          </Text>
        </View>
      </View>
    </View>
  );
}
