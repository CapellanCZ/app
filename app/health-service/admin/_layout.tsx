import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthProvider';

const STAFF_ROLES = new Set([
  'staff',
  'admin',
  'physician',
  'doctor',
  'nurse',
  'dentist',
  'clinic_staff',
]);

function isStaffSession(session: ReturnType<typeof useAuth>['session']): boolean {
  const meta = session?.user?.app_metadata ?? {};
  const roleRaw = meta.role ?? meta.primary_role ?? meta.user_role;
  const role = typeof roleRaw === 'string' ? roleRaw.toLowerCase().trim() : '';
  return Boolean(role && STAFF_ROLES.has(role));
}

/**
 * Clinic admin tools are not part of the patient experience.
 * Fail closed without staff app_metadata (RLS must still enforce writes).
 */
export default function HealthServiceAdminLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session || !isStaffSession(session)) {
    return <Redirect href="/health-service" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
