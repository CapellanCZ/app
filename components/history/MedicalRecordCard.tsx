import { Image, Pressable, Text, View } from 'react-native';

import {
  FigmaHistoryCalendarIcon,
  FigmaHistoryChevronIcon,
  FigmaHistoryReasonIcon,
} from '@/components/history/FigmaHistoryIcons';
import { Inter } from '@/lib/typography/inter';

/** Same pastel cycle as appointments / Figma medical records. */
export const MEDICAL_RECORD_CARD_COLORS = ['#D3E9FA', '#F4EDD6', '#F4E2FC'] as const;

type Props = {
  staffName: string;
  staffSpecialty?: string;
  staffPhoto?: string | null;
  /** e.g. "24 Feb, Thu" */
  dateLabel: string;
  /** Visit reason / condition label */
  reasonLabel: string;
  backgroundColor: string;
  onPress: () => void;
};

/**
 * Figma medical record card (node 2229:962): pastel surface, attended-by, chevron, date + reason.
 */
export function MedicalRecordCard({
  staffName,
  staffSpecialty = 'Physician',
  staffPhoto,
  dateLabel,
  reasonLabel,
  backgroundColor,
  onPress,
}: Props) {
  const initial = staffName.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Visit with ${staffName}, ${dateLabel}, ${reasonLabel}`}
      onPress={onPress}
      style={{
        backgroundColor,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 16,
        paddingTop: 18,
        paddingBottom: 12,
        paddingHorizontal: 16,
        width: '100%',
      }}
      className="active:opacity-90">
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.16)',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              {staffPhoto ? (
                <Image
                  source={{ uri: staffPhoto }}
                  style={{ width: 44, height: 44 }}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={{
                    fontFamily: Inter.medium,
                    fontSize: 20,
                    color: '#6B7280',
                  }}>
                  {initial}
                </Text>
              )}
            </View>

            <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 16,
                  color: '#3F3F3F',
                  letterSpacing: -1.12,
                  lineHeight: 18,
                }}>
                Attended by
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 18,
                  color: '#000000',
                  letterSpacing: -0.64,
                  lineHeight: 20,
                }}>
                {staffName}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 16,
                  color: '#3F3F3F',
                  letterSpacing: -1.12,
                  lineHeight: 18,
                }}>
                {staffSpecialty}
              </Text>
            </View>
          </View>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.51)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <FigmaHistoryChevronIcon size={24} color="#6C6C6C" />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24,
            paddingHorizontal: 10,
            minHeight: 28,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <FigmaHistoryCalendarIcon size={20} color="#3F3F3F" />
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 16,
                color: '#3F3F3F',
                letterSpacing: -1.12,
              }}>
              {dateLabel}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <FigmaHistoryReasonIcon size={20} color="#3F3F3F" />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Inter.regular,
                fontSize: 16,
                color: '#3F3F3F',
                letterSpacing: -1.12,
                flex: 1,
              }}>
              {reasonLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
