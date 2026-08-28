import { Text, View } from 'react-native';

import { IconsaxInfoCircleIcon } from '@/components/icons/IconsaxInfoCircleIcon';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

type Props = {
  message: string;
};

/** Soft info callout at the bottom of personal info. */
export function PersonalInfoNoteCard({ message }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: '#FFFFFF',
        padding: 16,
      }}>
      <View style={{ marginTop: 1 }}>
        <IconsaxInfoCircleIcon size={20} color="#6BAED6" />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: Inter.regular,
          fontSize: 14,
          lineHeight: 20,
          color: '#727272',
          letterSpacing: -0.15,
        }}>
        {message}
      </Text>
    </View>
  );
}
