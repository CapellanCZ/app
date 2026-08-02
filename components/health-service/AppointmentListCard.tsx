import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Appointment } from '../../lib/health-service/types';
import { IconsaxCalendar2Icon } from '../icons/IconsaxCalendar2Icon';
import { IconsaxClockIcon } from '../icons/IconsaxClockIcon';

const STATUS_DOT: Record<string, string> = {
  pending: '#F79009',
  confirmed: '#2970FF',
  completed: '#12B76A',
  cancelled: '#A4A7AE',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export type AppointmentListCardProps = {
  appointment: Appointment;
  staffName: string;
  staffPhoto?: string | null;
  staffRating?: number;
  staffSpecialty?: string;
  /** Override status badge text (e.g. "Visited" on Records). */
  statusLabelOverride?: string;
  onPress: () => void;
};

export function AppointmentListCard({
  appointment,
  staffName,
  staffPhoto,
  staffRating,
  staffSpecialty,
  statusLabelOverride,
  onPress,
}: AppointmentListCardProps) {
  const dotColor = STATUS_DOT[appointment.status] ?? '#2970FF';
  const statusLabel =
    statusLabelOverride ?? STATUS_LABEL[appointment.status] ?? appointment.status;
  const dateLabel = formatDateLabel(appointment.dateKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${staffName}, ${dateLabel}, ${appointment.startLabel}, ${statusLabel}. Open details.`}
      onPress={onPress}
      style={{
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
      }}>

      {/* ── Top row: avatar + info + status badge ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>

        {/* Left: avatar + name + specialty */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1, minWidth: 0 }}>
          {/* Circular avatar */}
          <View style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: '#D5D7DA',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {staffPhoto ? (
              <Image source={{ uri: staffPhoto }} style={{ width: 54, height: 54 }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 22, fontWeight: '600', color: '#FFFFFF' }}>
                {staffName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name + rating + specialty */}
          <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 20, fontWeight: '600', color: '#181D27', letterSpacing: -0.8 }}
              numberOfLines={1}>
              {staffName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              {staffRating !== undefined && (
                <>
                  <Ionicons name="star" size={12} color="#F79009" />
                  <Text style={{ fontSize: 12, color: '#181D27', marginLeft: 3 }}>
                    {staffRating.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#181D27', marginHorizontal: 5 }}>·</Text>
                </>
              )}
              {staffSpecialty ? (
                <Text style={{ fontSize: 12, color: '#181D27' }} numberOfLines={1}>
                  {staffSpecialty}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Status badge */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#F5F5F5',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          marginLeft: 8,
        }}>
          <View style={{ width: 8, height: 4, borderRadius: 99, backgroundColor: dotColor }} />
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#252B37', letterSpacing: -0.24 }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* ── Bottom info bar ── */}
      <View style={{
        backgroundColor: '#E9EAEB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <IconsaxCalendar2Icon size={20} color="#181D27" />
          <Text style={{ fontSize: 12, color: '#181D27' }} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>

        {/* Vertical divider */}
        <View style={{ width: 1, height: 17, backgroundColor: '#C5C6CC', marginHorizontal: 12 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <IconsaxClockIcon size={20} color="#252B37" />
          <Text style={{ fontSize: 12, color: '#252B37' }}>
            {appointment.startLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
