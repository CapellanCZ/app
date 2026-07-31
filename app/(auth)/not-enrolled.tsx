import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';

/**
 * Shown when auth succeeds but no `patients` row is linked to the user.
 */
export default function NotEnrolledScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Not enrolled</Text>
      <Text style={styles.body}>
        Your account is not linked to the campus clinic yet. Contact the clinic admin to be
        enrolled.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={handleSignOut}
        style={styles.button}
        className="active:opacity-80">
        <Text style={styles.buttonText}>Sign out</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#181D27',
    letterSpacing: -0.56,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
