import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonalInfoEmergencyContactSection } from '@/components/profile/PersonalInfoEmergencyContactSection';
import { PersonalInfoField } from '@/components/profile/PersonalInfoField';
import { PersonalInfoNoteCard } from '@/components/profile/PersonalInfoNoteCard';
import { PersonalInfoPhotoSection } from '@/components/profile/PersonalInfoPhotoSection';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import { emergencyContactFromPatient } from '@/lib/patients/emergencyContact';
import { usePatientStore } from '@/lib/patients/patientStore';
import { displayNameWithoutMiddle } from '@/lib/profile/displayName';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useAvatarUpload } from '@/lib/profile/useAvatarUpload';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';
export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patient, session } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const setAvatarUrl = useProfileStore((s) => s.setAvatarUrl);
  const fetchPatient = usePatientStore((s) => s.fetchPatient);

  const avatarUrl = profile?.avatar_url ?? null;
  const avatarUrlRef = useRef(avatarUrl);
  avatarUrlRef.current = avatarUrl;

  const getCurrentAvatarUrl = useCallback(() => avatarUrlRef.current, []);

  const { uploadStatus, pickAndSave } = useAvatarUpload({
    userId: session?.user?.id,
    getCurrentAvatarUrl,
    onSuccess: setAvatarUrl,
    onSynced: session?.user?.id
      ? () => {
          void fetchPatient(session.user.id);
        }
      : undefined,
  });

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const cached = useProfileStore.getState().profile;
    if (cached?.id === userId && (cached.full_name || cached.first_name)) {
      return;
    }

    void fetchProfile(userId, {
      email: session.user.email ?? undefined,
      userMetadata: session.user.user_metadata,
    });
  }, [session?.user?.id, session?.user?.email, session?.user?.user_metadata, fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user?.id) return;
      void fetchPatient(session.user.id);
    }, [session?.user?.id, fetchPatient]),
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const rawName =
    patient?.full_name?.trim() ||
    profile?.full_name?.trim() ||
    (profile ? `${profile.first_name} ${profile.last_name}`.trim() : '') ||
    '—';
  const name = displayNameWithoutMiddle(rawName) || '—';
  const email = patient?.email ?? profile?.email ?? session?.user?.email ?? '—';

  const patientType = patient?.patient_type ?? profile?.patient_type;
  const normalizedType =
    patientType === 'faculty' || patientType === 'student' ? patientType : undefined;
  const idLabel = normalizedType === 'faculty' ? 'Employee ID' : 'Student ID';
  const idValue =
    (normalizedType === 'faculty'
      ? patient?.employee_id ?? profile?.employee_id
      : patient?.student_id ?? profile?.student_id) || '—';

  const emergencyContact = useMemo(
    () => emergencyContactFromPatient(patient ?? {}),
    [patient],
  );

  const accountFields = [
    { label: 'Full Name', value: rawName !== '—' ? rawName : name },
    { label: idLabel, value: idValue },
    { label: 'Email', value: email },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
          gap: 20,
        }}>
        <View style={{ gap: 16 }}>
          <CircleBackButton onPress={handleBack} />
          <View style={{ gap: 6 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: Inter.medium,
                fontSize: 30,
                color: '#222222',
                letterSpacing: -2.24,
                lineHeight: 38,
              }}>
              Personal Information
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 18,
                color: '#727272',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              Manage your photo and account details
            </Text>
          </View>
        </View>

        <PersonalInfoPhotoSection
          name={name}
          avatarUrl={avatarUrl}
          uploadStatus={uploadStatus}
          onPress={pickAndSave}
        />

        <ProfileSection title="Account Details">
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}>
            {accountFields.map((field, index) => (
              <PersonalInfoField
                key={field.label}
                label={field.label}
                value={field.value}
                isLast={index === accountFields.length - 1}
              />
            ))}
          </View>
        </ProfileSection>

        <ProfileSection title="Emergency Contact">
          <PersonalInfoEmergencyContactSection contact={emergencyContact} />
        </ProfileSection>

        <PersonalInfoNoteCard message="To update your personal information, please contact the campus clinic admin." />
      </ScrollView>
    </View>
  );
}
