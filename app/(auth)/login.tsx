import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthProvider';
import { sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp } from '@/lib/auth/authApi';
import { AuthChrome } from '@/components/auth/AuthChrome';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { NU_DOMAIN, PLACEHOLDER_NU_EMAIL, RESEND_COOLDOWN_SECONDS, PROGRAM_OPTIONS } from '@/lib/auth/constants';
import { IconsaxArrowLeftIcon } from '@/components/icons/IconsaxArrowLeftIcon';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { IconsaxStarFilledIcon } from '@/components/icons/IconsaxStarFilledIcon';
import { Button, InputGroup } from 'heroui-native';

type Step = 'email' | 'verify';

export default function Login() {
  const router = useRouter();
  const { session } = useAuth();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ tone: 'error' | 'warning'; message: string } | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-navigate to home when session is set (magic link or OTP)
  useEffect(() => {
    if (session) router.replace('/(tabs)');
  }, [session, router]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { if (cooldownRef.current) clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [cooldown]);

  // ─── Send OTP / magic link ───
  const handleSend = useCallback(async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) { setError({ tone: 'error', message: 'Please enter your NU email.' }); return; }
    if (!trimmed.endsWith(NU_DOMAIN)) { setError({ tone: 'error', message: 'Only @students.nu-dasma.edu.ph emails are allowed.' }); return; }

    setLoading(true);
    const result = await apiSendOtp(trimmed);
    setLoading(false);

    if (!result.ok) { setError({ tone: 'warning', message: result.message }); return; }
    setStep('verify');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }, [email]);

  // ─── Verify OTP code ───
  const handleVerify = useCallback(async (code: string) => {
    setVerifying(true);
    setOtpError(false);
    setError(null);

    const result = await apiVerifyOtp(email.trim().toLowerCase(), code);
    setVerifying(false);

    if (!result.ok) {
      setOtpError(true);
      setError({ tone: 'error', message: result.message });
    }
  }, [email]);

  // ─── Resend handler ───
  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setError(null);
    setOtpError(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    await apiSendOtp(email.trim().toLowerCase());
  }, [email, cooldown]);

  // ──────────────────────────────────────────
  // STEP 2: OTP Verification
  // ──────────────────────────────────────────
  if (step === 'verify') {
    return (
      <AuthChrome
        title="Verify your email"
        subtitle={`We sent a 6-digit code and magic link to ${email.trim().toLowerCase()}`}>
        <View className="mt-6 flex flex-col gap-5">
          {error ? <AuthErrorBanner message={error.message} tone={error.tone} /> : null}

          <View className="items-center">
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#535862', marginBottom: 14 }}>
              Enter verification code
            </Text>
            <OtpCodeInput onComplete={handleVerify} disabled={verifying} hasError={otpError} />
          </View>

          {verifying ? (
            <View className="items-center py-2">
              <ActivityIndicator color="#2970FF" size="small" />
              <Text style={{ fontSize: 13, color: '#535862', marginTop: 6 }}>Verifying...</Text>
            </View>
          ) : null}

          <View className="items-center pt-1">
            {cooldown > 0 ? (
              <Text style={{ fontSize: 13, color: '#8F9098' }}>Resend code in {cooldown}s</Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={8}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#2970FF' }}>Resend code</Text>
              </Pressable>
            )}
          </View>

          <View className="flex-row items-center gap-3 pt-1">
            <View className="h-px flex-1 bg-[#E8EEF4]" />
            <Text style={{ fontSize: 12, color: '#8F9098' }}>or check email for magic link</Text>
            <View className="h-px flex-1 bg-[#E8EEF4]" />
          </View>

          <Pressable
            onPress={() => { setStep('email'); setError(null); setOtpError(false); }}
            className="flex-row items-center justify-center gap-2 active:opacity-70"
            hitSlop={8}>
            <IconsaxArrowLeftIcon size={16} color="#535862" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#535862' }}>Use a different email</Text>
          </Pressable>
        </View>
      </AuthChrome>
    );
  }

  // ──────────────────────────────────────────
  // STEP 1: Email Entry
  // ──────────────────────────────────────────
  return (
    <AuthChrome
      title="Go ahead and setup your account"
      subtitle="Welcome back, Nationalian! Please sign in to manage your account.">
      <AuthSegmentedNav active="login" />

      <View className="mt-4 flex flex-col gap-6">
        {error ? <AuthErrorBanner message={error.message} tone={error.tone} /> : null}

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
              onChangeText={(v: string) => { setEmail(v); setError(null); }}
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
          onPress={handleSend}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Button.Label className="font-semibold text-white">Continue</Button.Label>
              <IconsaxStarFilledIcon size={20} color="#FFFFFF" />
            </>
          )}
        </Button>
      </View>
    </AuthChrome>
  );
}
