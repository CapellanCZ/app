import { Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { healthUiText } from '@/lib/typography/healthUiText';

type Props = {
  /** Formatted follow-up day label, e.g. "15 Sep, Monday". */
  dateLabel: string;
};

/**
 * Patient-facing follow-up callout on Consultation Summary.
 */
export function ConsultationFollowUpNote({ dateLabel }: Props) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Follow-up scheduled for ${dateLabel}`}
      style={{
        width: '100%',
        gap: 4,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(211, 233, 250, 0.35)',
      }}>
      <Text
        style={{
          fontFamily: Inter.medium,
          fontSize: 16,
          color: '#3F3F3F',
          letterSpacing: -1.12,
          lineHeight: 22,
        }}>
        Follow-up
      </Text>
      <Text style={healthUiText.sectionDescription}>
        Your provider scheduled a follow-up for{' '}
        <Text style={{ fontFamily: Inter.medium, color: '#222222' }}>{dateLabel}</Text>.
      </Text>
    </View>
  );
}
