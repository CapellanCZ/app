import { useCallback } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

type AuthLegalFooterProps = {
  /** Extra margin above legal copy (default: stacked below form). */
  topSpacing?: boolean;
};

export function AuthLegalFooter({ topSpacing = true }: AuthLegalFooterProps) {
  const openTerms = useCallback(() => {
    void Linking.openURL('https://example.com/terms');
  }, []);

  const openPrivacy = useCallback(() => {
    void Linking.openURL('https://example.com/privacy');
  }, []);

  return (
    <>
      <View className={`${topSpacing ? 'mt-6' : 'mt-0'} items-center gap-0.5 px-1`}>
        <Text className="text-center text-xs text-[#71727A]">
          <Text>By continuing, you accept our </Text>
          <Text className="font-medium underline" onPress={openTerms}>
            Terms & Condition
          </Text>
          <Text> and </Text>
        </Text>
        <Pressable onPress={openPrivacy}>
          <Text className="text-xs font-medium text-[#71727A] underline">Privacy Policy</Text>
        </Pressable>
      </View>
    </>
  );
}
