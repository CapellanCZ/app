import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

export function AuthBackRow() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(drawer)/(tabs)');
    }
  }, [router]);

  return (
    <View className="px-4 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="flex-row items-center gap-2 rounded-3xl px-4 py-4"
        onPress={handleBack}>
        <Ionicons name="chevron-back" size={20} color="#181D27" />
        <Text className="text-sm font-semibold text-[#181D27]">Back</Text>
      </Pressable>
    </View>
  );
}
