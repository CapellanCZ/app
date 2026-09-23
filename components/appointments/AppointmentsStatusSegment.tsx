import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APPT_UI } from '@/components/appointments/appointmentsUiTokens';
import { Inter } from '@/lib/typography/inter';

/** Figma 4203:143 — Upcoming / Completed only. */
const SEGMENTS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
] as const;

export type AppointmentsTabId = (typeof SEGMENTS)[number]['id'];

type Props = {
  value: AppointmentsTabId;
  onChange: (next: AppointmentsTabId) => void;
};

/**
 * Full-width underline tabs — Upcoming / Completed (Figma 4203:143).
 */
export function AppointmentsStatusSegment({ value, onChange }: Props) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {SEGMENTS.map((seg) => {
        const selected = value === seg.id;
        return (
          <Pressable
            key={seg.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(seg.id)}
            style={[
              styles.segment,
              {
                borderBottomWidth: selected ? 1.5 : 1,
                borderBottomColor: selected ? APPT_UI.tabActive : APPT_UI.tabIdle,
              },
            ]}>
            <Text
              style={[
                styles.label,
                {
                  fontFamily: selected ? Inter.semiBold : Inter.regular,
                  color: selected ? APPT_UI.inkStrong : APPT_UI.inkFaint,
                },
              ]}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
    letterSpacing: -1.2,
    textAlign: 'center',
  },
});
