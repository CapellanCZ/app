import { Text, View } from 'react-native';

import { IconsaxInfoCircleIcon } from '@/components/icons/IconsaxInfoCircleIcon';
import { Inter } from '@/lib/typography/inter';
import { BRAND, CARD_ELEVATION } from '@/lib/ui/theme';

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
        borderColor: '#ECECEC',
        backgroundColor: '#FFFFFF',
        padding: 16,
        ...CARD_ELEVATION,
      }}>
      <View style={{ marginTop: 1 }}>
        <IconsaxInfoCircleIcon size={20} color={BRAND.primary} />
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
