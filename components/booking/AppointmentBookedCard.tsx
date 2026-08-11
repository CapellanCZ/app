import { Image, Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';

type Props = {
  doctorName: string;
  specialtyLabel: string;
  photoUrl?: string | null;
  dateLabel: string;
  timeLabel: string;
  /** Estimated finish — shown as EST on confirmed appointments only. */
  estDoneLabel?: string | null;
  /** Queue / patient number from `health_queue_tickets`, e.g. "2#". */
  queueNumberLabel?: string | null;
  /** When true, always show the Queue row (use placeholder if label is empty). */
  showQueueRow?: boolean;
  /** Reason from booking form (`appointments.reason`). */
  visitReason?: string | null;
};

/**
 * Figma 2248:175 — white detail card on booking success screen.
 */
export function AppointmentBookedCard({
  doctorName,
  specialtyLabel,
  photoUrl,
  dateLabel,
  timeLabel,
  estDoneLabel,
  queueNumberLabel,
  showQueueRow = false,
  visitReason,
}: Props) {
  const timeDisplay = estDoneLabel ? `${timeLabel} · EST ${estDoneLabel}` : timeLabel;
  const queueValue = queueNumberLabel?.trim() || 'Pending';
  const shouldShowQueue = showQueueRow || Boolean(queueNumberLabel?.trim());
  const reasonValue = visitReason?.trim() || null;
  return (
    <View
      style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 20,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#F2ECEC',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 18,
              color: '#000000',
              letterSpacing: -0.64,
            }}
            numberOfLines={1}>
            {doctorName}
          </Text>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 16,
              color: '#3F3F3F',
              letterSpacing: -1.12,
            }}
            numberOfLines={1}>
            {specialtyLabel}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: '#EFEFEF', width: '100%' }} />

      <View style={{ paddingHorizontal: 8, gap: 12 }}>
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Time" value={timeDisplay} />
        {reasonValue ? (
          <DetailRow label="Reason for visit" value={reasonValue} multiline />
        ) : null}
        {shouldShowQueue ? (
          <DetailRow label="Queue / Patient Number" value={queueValue} />
        ) : null}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: 16 }}>
      <Text
        style={{
          flex: 1,
          fontFamily: Inter.regular,
          fontSize: 16,
          color: '#6C6C6C',
          letterSpacing: -1.12,
        }}>
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          fontFamily: Inter.regular,
          fontSize: 16,
          color: '#000000',
          letterSpacing: -1.12,
          textAlign: 'left',
        }}
        numberOfLines={multiline ? 3 : 1}>
        {value}
      </Text>
    </View>
  );
}
