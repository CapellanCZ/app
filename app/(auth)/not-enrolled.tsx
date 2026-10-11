import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { signOutUser } from '@/lib/auth/signOut';
import { Inter } from '@/lib/typography/inter';

/**
 * Shown when auth succeeds but no `patients` row is linked to the user.
 */
export default function NotEnrolledScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost there</Text>
      <Text style={styles.body}>
        Your school email signed in, but it is not linked to a campus clinic record yet.
      </Text>
      <Text style={styles.body}>
        Please contact the Health Service Office so they can import or link your student or faculty
        profile. Once that is done, open the app again and sign in.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out and try another email"
        onPress={handleSignOut}
        style={styles.button}
        className="active:opacity-80">
        <Text style={styles.buttonText}>Use a different email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  title: {
    fontFamily: Inter.semiBold,
    fontSize: 28,
    color: '#181D27',
    letterSpacing: -0.56,
  },
  body: {
    fontFamily: Inter.regular,
    fontSize: 16,
    color: '#717680',
    lineHeight: 24,
    letterSpacing: -0.32,
  },
  button: {
    marginTop: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2970FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Inter.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
