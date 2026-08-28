import { Pressable, Text, View } from 'react-native';

import { IconsaxCallFilledIcon } from '@/components/icons/IconsaxCallFilledIcon';
import { PersonalInfoField } from '@/components/profile/PersonalInfoField';
import type { EmergencyContact } from '@/lib/patients/emergencyContact';
import { openPhoneCall } from '@/lib/health-service/clinicContact';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';
import { androidPressProps } from '@/lib/ui/androidPress';

type Props = {
  contact: EmergencyContact;
};

const EMPTY = '—';

function displayValue(value: string): string {
  return value.trim() || EMPTY;
}

/** Read-only emergency contact — fetched from `patients` via Supabase. */
export function PersonalInfoEmergencyContactSection({ contact }: Props) {
  const phone = contact.phone.trim();
  const hasPhone = Boolean(phone);

  const fields = [
    { label: 'Full Name', value: displayValue(contact.name) },
    { label: 'Relationship', value: displayValue(contact.relationship) },
  ];

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}>
      {fields.map((field) => (
        <PersonalInfoField key={field.label} label={field.label} value={field.value} />
      ))}

      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 4,
        }}>
        <Text
          style={{
            fontFamily: Inter.medium,
            fontSize: 13,
            color: '#727272',
            letterSpacing: -0.2,
            lineHeight: 18,
          }}>
          Phone Number
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text
            selectable
            style={{
              flex: 1,
              fontFamily: Inter.medium,
              fontSize: 16,
              color: '#222222',
              letterSpacing: -0.4,
              lineHeight: 22,
            }}>
            {displayValue(contact.phone)}
          </Text>
          {hasPhone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call emergency contact"
              onPress={() => openPhoneCall(phone)}
              {...androidPressProps({ borderless: true, hitSlop: 8 })}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.51)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}>
              <IconsaxCallFilledIcon size={18} color="#6C6C6C" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
