import { Text, View } from 'react-native';

import { AppointmentImportantNoteIcon } from '@/components/booking/AppointmentImportantNoteIcon';
import { Inter } from '@/lib/typography/inter';

/**
 * Figma 2249:417 — light blue check-in tip on confirmed appointment screen.
 */
export function AppointmentImportantNote() {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(211, 233, 250, 0.35)',
      }}>
      <View style={{ width: 24, height: 24, flexShrink: 0, marginTop: 1 }}>
        <AppointmentImportantNoteIcon size={24} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 16,
            color: '#3F3F3F',
            letterSpacing: -1.12,
            lineHeight: 22,
          }}>
          Important Note
        </Text>
        <Text
          style={{
            fontFamily: Inter.regular,
            fontSize: 14,
            color: '#373636',
            letterSpacing: -0.48,
            lineHeight: 19,
          }}>
          Please arrive 15 minutes early for check-in. Don’t forget to bring your school ID.
        </Text>
      </View>
    </View>
  );
}
