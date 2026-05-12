import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { SCHEDULE_PARTNER } from '../../lib/health-service/bookingScheduleTheme';
import type { Staff } from '../../lib/health-service/types';

function roleKindLabel(role: Staff['role']): string {
  if (role === 'doctor') return 'Doctor';
  if (role === 'dentist') return 'General Dentist';
  return 'Nurse';
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s+/i, '').split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

export type ProviderCardProps = {
  staff: Staff;
  availableToday: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ProviderCard({ staff, onPress, style }: ProviderCardProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(staff.photoUrl) && !photoFailed;

  useEffect(() => {
    setPhotoFailed(false);
  }, [staff.id, staff.photoUrl]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${staff.name}, ${roleKindLabel(staff.role)}. Tap to book.`}
      onPress={onPress}
      style={[
        {
          width: '100%',
          aspectRatio: 1,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#D5D7DA',
          backgroundColor: '#E8EEF5',
        },
        style,
      ]}
      className="active:opacity-90">
      {showPhoto ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: staff.photoUrl! }}
          onError={() => setPhotoFailed(true)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '600', color: SCHEDULE_PARTNER.textMuted }}>
            {initials(staff.name)}
          </Text>
        </View>
      )}

      <View
        style={{
          position: 'absolute',
          left: 6,
          right: 6,
          bottom: 6,
          backgroundColor: '#FDFDFD',
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 8,
          paddingVertical: 6,
          gap: 10,
        }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: 14, fontWeight: '500', color: '#252B37', letterSpacing: -0.56 }}
            numberOfLines={1}>
            {staff.name}
          </Text>
          <Text
            style={{ fontSize: 12, fontWeight: '400', color: '#717680', letterSpacing: -0.48 }}
            numberOfLines={1}>
            {staff.specialtyLabel || roleKindLabel(staff.role)}
          </Text>
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: '#F5F5F5',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
          <Text style={{ fontSize: 14, color: '#252B37', fontWeight: '500', lineHeight: 18 }}>↗</Text>
        </View>
      </View>
    </Pressable>
  );
}
