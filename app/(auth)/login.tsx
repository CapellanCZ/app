import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthChrome } from '@/components/auth/AuthChrome';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { PLACEHOLDER_NU_EMAIL } from '@/components/auth/constants';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { IconsaxStarFilledIcon } from '@/components/icons/IconsaxStarFilledIcon';
import { Button, InputGroup } from 'heroui-native';

export default function Login() {
  const [email, setEmail] = useState('');

  return (
    <AuthChrome
      title="Go ahead and setup your account"
      subtitle="Welcome back, Nationalian! Please sign in to manage your account.">
      <AuthSegmentedNav active="login" />

      <View className="mt-4 flex flex-col gap-6">
        <View className="gap-1.5">
          <Text className="text-xs font-semibold leading-4 text-[#494A50]">NU Email</Text>
          <InputGroup className="relative w-full">
            <InputGroup.Input
              variant="primary"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={PLACEHOLDER_NU_EMAIL}
              placeholderColorClassName="text-[#8F9098]"
              value={email}
              onChangeText={setEmail}
            />
            <InputGroup.Suffix isDecorative>
              <IconsaxEnvelopeIcon size={22} color="#717680" />
            </InputGroup.Suffix>
          </InputGroup>
        </View>

        <Button
          variant="primary"
          className="bg-[#2970FF]">
          <Button.Label className="font-semibold text-white">Send magic link</Button.Label>
          <IconsaxStarFilledIcon size={20} color="#FFFFFF" />
        </Button>
      </View>
    </AuthChrome>
  );
}
