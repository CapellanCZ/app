import { Text, View } from 'react-native';

import type { PrescriptionMedication } from '@/lib/consultation/types';
import { healthUiText } from '@/lib/typography/healthUiText';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

type ConsultationPrescriptionCardProps = {
  medications: PrescriptionMedication[];
};

const FIELD_BG = '#F5F5F5';
const EMPTY = '—';

function ReadOnlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
      <Text style={healthUiText.fieldLabel}>{label}</Text>
      <View
        style={{
          backgroundColor: FIELD_BG,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 10,
          minHeight: multiline ? 72 : 40,
          justifyContent: multiline ? 'flex-start' : 'center',
        }}>
        <Text
          selectable
          style={value === EMPTY ? healthUiText.fieldValueMuted : healthUiText.fieldValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MedicationCard({
  index,
  medication,
}: {
  index: number;
  medication: PrescriptionMedication;
}) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: '#FFFFFF',
        padding: 14,
        gap: 14,
      }}>
      <Text style={healthUiText.cardTitle}>Medication {index + 1}</Text>

      <ReadOnlyField label="Name" value={medication.name?.trim() || EMPTY} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ReadOnlyField label="Strength" value={medication.strength?.trim() || EMPTY} />
        <ReadOnlyField label="Quantity" value={medication.quantity?.trim() || EMPTY} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ReadOnlyField label="Frequency" value={medication.frequency?.trim() || EMPTY} />
        <ReadOnlyField label="Duration" value={medication.duration?.trim() || EMPTY} />
      </View>

      <ReadOnlyField
        label="Instructions"
        value={medication.instructions?.trim() || EMPTY}
        multiline
      />
    </View>
  );
}

/**
 * Read-only prescription summary for patients — mirrors the web prescription form layout.
 */
export function ConsultationPrescriptionCard({ medications }: ConsultationPrescriptionCardProps) {
  if (medications.length === 0) return null;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: '#FFFFFF',
        padding: 16,
        gap: 14,
      }}>
      <View style={{ gap: 6 }}>
        <Text accessibilityRole="header" style={healthUiText.sectionEyebrow}>
          Prescription
        </Text>
        <Text style={healthUiText.sectionDescription}>
          Medications prescribed during this consultation.
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: SCHEDULE_PARTNER.divider, width: '100%' }} />

      {medications.map((medication, index) => (
        <MedicationCard key={`med-${index}`} index={index} medication={medication} />
      ))}
    </View>
  );
}
