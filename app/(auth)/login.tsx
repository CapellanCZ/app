import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthChrome } from '@/components/auth/AuthChrome';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { PLACEHOLDER_NU_EMAIL } from '@/components/auth/constants';
import { Button, InputGroup } from 'heroui-native';

export default function Login() {
  const [email, setEmail] = useState('');

  return (
    <AuthChrome
      title="Go ahead and setup your account"
      subtitle="Welcome back, Nationalian! Please sign in to manage your account.">
      <AuthSegmentedNav active="login" />

      <View className="mt-4 flex flex-col gap-4">
        <View className="gap-2">
          <Text className="text-xs font-semibold text-[#494A50]">NU Email</Text>
          <InputGroup className="relative w-full">
            <InputGroup.Input
              variant="secondary"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={PLACEHOLDER_NU_EMAIL}
              placeholderColorClassName="text-[#8F9098]"
              value={email}
              onChangeText={setEmail}
              className="h-12 w-full rounded-xl border border-[#C5C6CC] bg-white px-4 text-sm text-[#181D27]"
            />
            <InputGroup.Suffix isDecorative>
              <Ionicons name="mail-outline" size={18} color="#717680" />
            </InputGroup.Suffix>
          </InputGroup>
        </View>

        <Button
          variant="primary"
          className="bg-[#2970FF]">
          <Button.Label className="font-semibold text-white">Send magic link</Button.Label>
          <FontAwesome5 name="magic" size={14} color="#FFFFFF" />
        </Button>
      </View>
    </AuthChrome>
  );
}
