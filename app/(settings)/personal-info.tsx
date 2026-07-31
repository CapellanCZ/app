import { ScrollView, Text, View } from 'react-native';

import { ScreenNavbar } from '@/components/ScreenNavbar';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { useProfileStore } from '@/lib/profile/profileStore';

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SCHEDULE_PARTNER.divider,
        backgroundColor: SCHEDULE_PARTNER.surface,
        gap: 2,
      }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: SCHEDULE_PARTNER.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, color: SCHEDULE_PARTNER.textPrimary }}>{value}</Text>
    </View>
  );
}

export default function PersonalInfoScreen() {
  const { patient, session } = useAuth();
  const profile = useProfileStore((s) => s.profile);

  const fullName =
    patient?.full_name?.trim() ||
    profile?.full_name?.trim() ||
    (profile ? `${profile.first_name} ${profile.last_name}`.trim() : '') ||
    '—';
  const email = patient?.email ?? profile?.email ?? session?.user?.email ?? '—';
  const patientType = patient?.patient_type ?? profile?.patient_type;
  const idLabel = patientType === 'faculty' ? 'Employee ID' : 'Student ID';
  const idValue =
    (patientType === 'faculty'
      ? patient?.employee_id ?? profile?.employee_id
      : patient?.student_id ?? profile?.student_id) || '—';
  const affiliation = patient?.affiliation ?? profile?.program ?? '—';
  const typeLabel =
    patientType === 'faculty' ? 'Faculty' : patientType === 'student' ? 'Student' : '—';

  const fields = [
    { label: 'Full Name', value: fullName },
    { label: idLabel, value: idValue },
    { label: 'Email', value: email },
    { label: 'Type', value: typeLabel },
    { label: 'Affiliation', value: affiliation },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScreenNavbar title="Personal Information" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
        }}>
        <Text
          style={{
            marginBottom: 8,
            marginLeft: 2,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          Patient Details
        </Text>
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.cardBorder,
            overflow: 'hidden',
          }}>
          {fields.map((f, i) => (
            <InfoRow key={f.label} label={f.label} value={f.value} isLast={i === fields.length - 1} />
          ))}
        </View>

        <Text
          style={{
            marginTop: 16,
            marginLeft: 2,
            fontSize: 12,
            lineHeight: 18,
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          To update your personal information, please contact the campus clinic admin.
        </Text>
      </ScrollView>
    </View>
  );
}
