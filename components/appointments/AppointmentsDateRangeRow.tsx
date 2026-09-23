import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { APPT_UI } from '@/components/appointments/appointmentsUiTokens';
import {
  formatDisplayDate,
  parseDateKey,
  toDateKey,
} from '@/components/appointments/appointmentsFilterUtils';
import { IconsaxCalendar2Icon } from '@/components/icons/IconsaxCalendar2Icon';
import { Inter } from '@/lib/typography/inter';

type Props = {
  fromKey: string;
  toKey: string;
  onChangeFrom: (key: string) => void;
  onChangeTo: (key: string) => void;
};

type ActiveField = 'from' | 'to' | null;

function DateCard({
  label,
  valueKey,
  onPress,
}: {
  label: string;
  valueKey: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${formatDisplayDate(valueKey)}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.iconWell}>
        <IconsaxCalendar2Icon size={18} color={APPT_UI.brand} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue} numberOfLines={1}>
          {formatDisplayDate(valueKey)}
        </Text>
      </View>
    </Pressable>
  );
}

/** Soft From / To date chips — QuickAction-style wells on page background. */
export function AppointmentsDateRangeRow({
  fromKey,
  toKey,
  onChangeFrom,
  onChangeTo,
}: Props) {
  const [active, setActive] = useState<ActiveField>(null);

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setActive(null);
    if (event.type === 'dismissed' || !date) {
      if (Platform.OS === 'ios' && event.type === 'dismissed') setActive(null);
      return;
    }
    const key = toDateKey(date);
    if (active === 'from') {
      onChangeFrom(key);
      if (key > toKey) onChangeTo(key);
    } else if (active === 'to') {
      onChangeTo(key);
      if (key < fromKey) onChangeFrom(key);
    }
    if (Platform.OS === 'android') setActive(null);
  };

  const pickerValue =
    active === 'from'
      ? parseDateKey(fromKey)
      : active === 'to'
        ? parseDateKey(toKey)
        : new Date();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <DateCard label="From Date" valueKey={fromKey} onPress={() => setActive('from')} />
        <DateCard label="To Date" valueKey={toKey} onPress={() => setActive('to')} />
      </View>

      {active ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          maximumDate={active === 'from' ? parseDateKey(toKey) : undefined}
          minimumDate={active === 'to' ? parseDateKey(fromKey) : undefined}
        />
      ) : null}

      {Platform.OS === 'ios' && active ? (
        <Pressable
          onPress={() => setActive(null)}
          style={styles.doneBtn}
          accessibilityRole="button"
          accessibilityLabel="Done choosing date">
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: APPT_UI.soft,
    borderRadius: APPT_UI.radiusCard,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: APPT_UI.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardLabel: {
    fontFamily: Inter.regular,
    fontSize: 12,
    lineHeight: 16,
    color: APPT_UI.inkMuted,
    letterSpacing: -0.24,
  },
  cardValue: {
    fontFamily: Inter.medium,
    fontSize: 15,
    lineHeight: 20,
    color: APPT_UI.ink,
    letterSpacing: -0.6,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  doneLabel: {
    fontFamily: Inter.medium,
    fontSize: 15,
    letterSpacing: -0.3,
    color: APPT_UI.inkStrong,
  },
});
