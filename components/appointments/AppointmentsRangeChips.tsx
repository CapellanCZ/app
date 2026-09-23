import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APPT_UI } from '@/components/appointments/appointmentsUiTokens';
import {
  RANGE_PRESETS,
  type AppointmentRangePreset,
} from '@/components/appointments/appointmentsFilterUtils';
import { Inter } from '@/lib/typography/inter';

type Props = {
  value: AppointmentRangePreset;
  onChange: (preset: AppointmentRangePreset) => void;
};

/** Soft range chips — charcoal selected (same language as underline tabs). */
export function AppointmentsRangeChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled">
      {RANGE_PRESETS.map((preset) => {
        const isActive = value === preset.id;
        return (
          <Pressable
            key={preset.id}
            onPress={() => onChange(preset.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipIdle]}>
            <Text
              style={[styles.chipLabel, isActive ? styles.chipLabelActive : styles.chipLabelIdle]}>
              {preset.label}
            </Text>
          </Pressable>
        );
      })}
      {value === 'custom' ? (
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={[styles.chipLabel, styles.chipLabelActive]}>Custom</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: APPT_UI.radiusPill,
  },
  chipIdle: {
    backgroundColor: APPT_UI.soft,
  },
  chipActive: {
    backgroundColor: APPT_UI.ink,
  },
  chipLabel: {
    fontFamily: Inter.medium,
    fontSize: 13,
    letterSpacing: -0.4,
  },
  chipLabelIdle: {
    color: APPT_UI.inkStrong,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
});
