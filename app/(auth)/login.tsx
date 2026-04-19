import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthChrome } from '@/components/auth/AuthChrome';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { AuthSuccessModal } from '@/components/auth/AuthSuccessModal';
import { PLACEHOLDER_NU_EMAIL } from '@/components/auth/constants';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { IconsaxStarFilledIcon } from '@/components/icons/IconsaxStarFilledIcon';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button, InputGroup } from 'heroui-native';

const NU_DOMAIN = '@students.nu-dasma.edu.ph';

export default function Login() {
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [showLinkSent, setShowLinkSent] = useState(false);

  const clearFieldError = () => setFieldError(null);

  // Auto-navigate to home when session is set (e.g., after magic link callback)
  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session, router]);

  const handleSendMagicLink = async () => {
    setFieldError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFieldError({ field: 'email', message: 'Please enter your NU email.' });
      return;
    }
    if (!trimmedEmail.endsWith(NU_DOMAIN)) {
      setFieldError({ field: 'email', message: 'Only @students.nu-dasma.edu.ph emails are allowed.' });
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setFieldError({ field: 'general', message: 'Supabase is not configured. Contact support.' });
      return;
    }

    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/(tabs)');

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectTo,
        },
      });

      if (otpError) {
        setFieldError({ field: 'general', message: otpError.message });
      } else {
        setShowLinkSent(true);
      }
    } catch (e: any) {
      const msg = e?.message?.toLowerCase?.() ?? '';
      if (msg.includes('network') || msg.includes('fetch')) {
        setFieldError({ field: 'general', message: 'Network error — please check your internet connection and try again.' });
      } else {
        setFieldError({ field: 'general', message: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <AuthChrome
      title="Go ahead and setup your account"
      subtitle="Welcome back, Nationalian! Please sign in to manage your account.">
      <AuthSegmentedNav active="login" />

      <View className="mt-4 flex flex-col gap-6">
        {fieldError ? (
          <View
            className={`flex-row items-start gap-3 rounded-xl border px-3.5 py-3 ${
              fieldError.field === 'email'
                ? 'border-[#FECACA] bg-[#FFF1F0]'
                : 'border-[#FED7AA] bg-[#FFFBEB]'
            }`}>
            <View className="mt-0.5">
              <Ionicons
                name={fieldError.field === 'email' ? 'alert-circle' : 'warning'}
                size={20}
                color={fieldError.field === 'email' ? '#DC2626' : '#D97706'}
              />
            </View>
            <Text
              className={`flex-1 text-sm leading-5 ${
                fieldError.field === 'email' ? 'text-[#991B1B]' : 'text-[#92400E]'
              }`}>
              {fieldError.message}
            </Text>
          </View>
        ) : null}

        <View className="gap-1.5">
          <Text className="text-sm font-semibold leading-5 text-[#494A50]">NU Email</Text>
          <InputGroup className="relative w-full">
            <InputGroup.Input
              variant="primary"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={PLACEHOLDER_NU_EMAIL}
              placeholderColorClassName="text-[#8F9098]"
              value={email}
              onChangeText={(v: string) => { setEmail(v); clearFieldError(); }}
            />
            <InputGroup.Suffix isDecorative>
              <IconsaxEnvelopeIcon size={22} color="#717680" />
            </InputGroup.Suffix>
          </InputGroup>
        </View>

        <Button
          variant="primary"
          className="bg-[#2970FF]"
          isDisabled={loading}
          onPress={handleSendMagicLink}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Button.Label className="font-semibold text-white">Send magic link</Button.Label>
              <IconsaxStarFilledIcon size={20} color="#FFFFFF" />
            </>
          )}
        </Button>
      </View>
    </AuthChrome>

    <AuthSuccessModal
      visible={showLinkSent}
      onClose={() => setShowLinkSent(false)}
      icon="mail-outline"
      iconColor="#2970FF"
      iconBg="rgba(41,112,255,0.08)"
      title="Magic Link Sent!"
      message="We've sent a magic link to your NU email. Open the link in your email to sign in — it expires in 10 minutes."
      buttonLabel="Got it"
    />
    </>
  );
}
