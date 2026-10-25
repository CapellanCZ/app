import { Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenNavbar } from '@/components/ScreenNavbar';
import { useAuth } from '@/lib/auth/AuthProvider';
import { signOutUser } from '@/lib/auth/signOut';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';
import { showAppToast } from '@/lib/ui/toastBridge';
import { showConfirmSheet } from '@/lib/ui/confirmSheetStore';
import { useRouter } from 'expo-router';

/**
 * CampusCare signs in with email OTP — there is no local password to change.
 * This screen explains that and offers session sign-out (device-local).
 */
export default function SecurityScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const email = session?.user?.email ?? null;

  const handleSignOutEverywhere = () => {
    showConfirmSheet({
      title: 'Sign out on this device?',
      message:
        'You will need a new email code to sign in again. This clears your session on this device only.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => {
        void (async () => {
          try {
            await signOutUser();
            router.replace('/(auth)');
          } catch {
            showAppToast({
              variant: 'accent',
              placement: 'top',
              label: 'Sign out failed',
              description: 'Please try again.',
            });
          }
        })();
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScreenNavbar title="Security" />
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
          gap: 16,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          Sign-in method
        </Text>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 16,
            borderWidth: 1,
            borderColor: '#EEF0F4',
            gap: 8,
          }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: SCHEDULE_PARTNER.text }}>
            Email one-time code
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: SCHEDULE_PARTNER.textMuted }}>
            CampusCare does not use a password. Each sign-in sends a one-time code to your campus
            email
            {email ? ` (${email})` : ''}. Never share that code with anyone.
          </Text>
        </View>

        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: SCHEDULE_PARTNER.textMuted,
          }}>
          Session
        </Text>
        <Pressable
          onPress={handleSignOutEverywhere}
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            borderCurve: 'continuous',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: '#F0D0D0',
          }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#B42318' }}>
            Sign out on this device
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
