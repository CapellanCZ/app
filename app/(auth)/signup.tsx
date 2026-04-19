import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { AuthSuccessModal } from '@/components/auth/AuthSuccessModal';
import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { PLACEHOLDER_NU_EMAIL, PROGRAM_OPTIONS } from '@/components/auth/constants';
import { RegisterChrome } from '@/components/auth/RegisterChrome';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BottomSheet, Button, InputGroup } from 'heroui-native';

const NU_DOMAIN = '@students.nu-dasma.edu.ph';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [program, setProgram] = useState<(typeof PROGRAM_OPTIONS)[number] | ''>('');
  const [studentId, setStudentId] = useState('');
  const [programPickerOpen, setProgramPickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const clearError = (field: string) => setErrors((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });

  const selectProgram = useCallback((value: (typeof PROGRAM_OPTIONS)[number]) => {
    setProgram(value);
    setProgramPickerOpen(false);
  }, []);

  const handleSignUp = async () => {
    const newErrors: Record<string, string> = {};

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      newErrors.email = 'Please enter your NU email.';
    } else if (!trimmedEmail.endsWith(NU_DOMAIN)) {
      newErrors.email = 'Only @students.nu-dasma.edu.ph emails are allowed.';
    }
    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!program) newErrors.program = 'Please select your program.';
    if (!studentId.trim()) newErrors.studentId = 'Student ID is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (!isSupabaseConfigured || !supabase) {
      setErrors({ general: 'Supabase is not configured. Contact support.' });
      return;
    }

    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/login');

      const { error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            program,
            student_id: studentId.trim(),
          },
        },
      });

      if (authError) {
        setErrors({ general: authError.message });
      } else {
        setShowSuccess(true);
      }
    } catch (e: any) {
      const msg = e?.message?.toLowerCase?.() ?? '';
      if (msg.includes('network') || msg.includes('fetch')) {
        setErrors({ general: 'Network error — please check your internet connection and try again.' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <RegisterChrome
      title="Create your Account"
      subtitle="Sign up to enjoy the best student welfare experience exclusively on National University."
      footer={
        <>
          {errors.general ? (
            <View className="flex-row items-start gap-3 rounded-xl border border-[#FED7AA] bg-[#FFFBEB] px-3.5 py-3">
              <View className="mt-0.5">
                <Ionicons name="warning" size={20} color="#D97706" />
              </View>
              <Text className="flex-1 text-sm leading-5 text-[#92400E]">{errors.general}</Text>
            </View>
          ) : null}
          <Button
            variant="primary"
            className="h-12 w-full rounded-3xl border border-[#001229]/10 bg-[#2970FF]"
            isDisabled={loading}
            onPress={handleSignUp}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Button.Label className="font-semibold leading-5 text-white">Create my account</Button.Label>
            )}
          </Button>
          <AuthLegalFooter topSpacing={false} />
        </>
      }>
      <View className="gap-4">
        <AuthSegmentedNav active="signup" className="mt-0" />

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
              onChangeText={(v: string) => { setEmail(v); clearError('email'); }}
            />
            <InputGroup.Suffix isDecorative>
              <IconsaxEnvelopeIcon size={22} />
            </InputGroup.Suffix>
          </InputGroup>
          {errors.email ? (
            <Text className="mt-1 text-sm leading-5 text-red-500">{errors.email}</Text>
          ) : null}
        </View>

        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1 gap-1.5">
            <Text className="text-sm font-semibold leading-5 text-[#494A50]">First name</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                autoCorrect={false}
                placeholder="Juan"
                placeholderColorClassName="text-[#8F9098]"
                value={firstName}
                onChangeText={(v: string) => { setFirstName(v); clearError('firstName'); }}
              />
            </InputGroup>
            {errors.firstName ? (
              <Text className="mt-1 text-sm leading-5 text-red-500">{errors.firstName}</Text>
            ) : null}
          </View>
            <View className="min-w-0 flex-1 gap-1.5">
            <Text className="text-sm font-semibold leading-5 text-[#494A50]">Last name</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                autoCorrect={false}
                placeholder="Dela Cruz"
                placeholderColorClassName="text-[#8F9098]"
                value={lastName}
                onChangeText={(v: string) => { setLastName(v); clearError('lastName'); }}
              />
            </InputGroup>
            {errors.lastName ? (
              <Text className="mt-1 text-sm leading-5 text-red-500">{errors.lastName}</Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1 gap-1.5">
            <Text className="text-sm font-semibold leading-5 text-[#494A50]">Program</Text>
            <BottomSheet
              className="w-full"
              isOpen={programPickerOpen}
              onOpenChange={setProgramPickerOpen}>
              <BottomSheet.Trigger className="w-full" accessibilityLabel="Select program">
                <InputGroup>
                  <InputGroup.Input
                    variant="primary"
                    editable={false}
                    pointerEvents="none"
                    showSoftInputOnFocus={false}
                    placeholder="Select program"
                    placeholderColorClassName="text-[#8F9098]"
                    value={program}
                  />
                  <InputGroup.Suffix isDecorative>
                    <IconsaxArrowDownIcon size={18} color="#717680" />
                  </InputGroup.Suffix>
                </InputGroup>
              </BottomSheet.Trigger>
              <BottomSheet.Portal>
                <BottomSheet.Overlay isCloseOnPress />
                <BottomSheet.Content snapPoints={['60%', '85%']} index={0}>
                  {/* Drag handle */}
                  <View className="mb-4 items-center">
                    <View className="h-1 w-10 rounded-full bg-[#E5E7EB]" />
                  </View>

                  {/* Header */}
                  <View className="mb-4 px-1">
                    <BottomSheet.Title className="text-base font-semibold leading-6 text-[#181D27]">
                      Select Program
                    </BottomSheet.Title>
                    <Text className="mt-0.5 text-sm leading-5 text-[#717680]">
                      Choose the program you are currently enrolled in
                    </Text>
                  </View>

                  <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    {PROGRAM_OPTIONS.map((opt, index) => {
                      const isSelected = program === opt;
                      return (
                        <Pressable
                          key={opt}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                          className={`mx-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                            isSelected ? 'bg-[#EEF3FF]' : 'active:bg-[#F9FAFB]'
                          } ${index < PROGRAM_OPTIONS.length - 1 ? 'mb-1' : ''}`}
                          onPress={() => selectProgram(opt)}>
                          <View className="mr-3 flex-1">
                            <Text
                              className={`text-sm leading-5 ${
                                isSelected ? 'font-semibold text-[#2970FF]' : 'font-medium text-[#181D27]'
                              }`}>
                              {opt}
                            </Text>
                          </View>
                          <View
                            className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                              isSelected ? 'border-[#2970FF] bg-[#2970FF]' : 'border-[#D1D5DB]'
                            }`}>
                            {isSelected ? (
                              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                    <View className="h-4" />
                  </ScrollView>
                </BottomSheet.Content>
              </BottomSheet.Portal>
            </BottomSheet>
            {errors.program ? (
              <Text className="mt-1 text-sm leading-5 text-red-500">{errors.program}</Text>
            ) : null}
          </View>
          <View className="min-w-0 flex-1 gap-1.5">
            <Text className="text-sm font-semibold leading-5 text-[#494A50]">Student ID</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                autoCorrect={false}
                keyboardType="default"
                placeholder="e.g. 2024-12345"
                placeholderColorClassName="text-[#8F9098]"
                value={studentId}
                onChangeText={(v: string) => { setStudentId(v); clearError('studentId'); }}
              />
            </InputGroup>
            {errors.studentId ? (
              <Text className="mt-1 text-sm leading-5 text-red-500">{errors.studentId}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </RegisterChrome>

    <AuthSuccessModal
      visible={showSuccess}
      onClose={() => {
        setShowSuccess(false);
        router.replace('/login');
      }}
      icon="checkmark-circle"
      iconColor="#22C55E"
      iconBg="rgba(34,197,94,0.1)"
      title="Account Created!"
      message="Your CampusCare account has been created. Please check your NU email to verify your account, then sign in with a magic link."
      buttonLabel="Go to Login"
    />
    </>
  );
}
