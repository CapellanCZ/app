import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthSuccessModal } from '@/components/auth/AuthSuccessModal';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { InlineSelect } from '@/components/ui/InlineSelect';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { DEPARTMENT_OPTIONS, NU_DOMAIN, PROGRAM_OPTIONS } from '@/lib/auth/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type Step = 'email' | 'info' | 'program';

const STEP_PROGRESS: Record<Step, number> = {
  email: 0 / 3,
  info: 1 / 3,
  program: 2 / 3,
};

export default function SignUp() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState<(typeof DEPARTMENT_OPTIONS)[number] | ''>('');
  const [program, setProgram] = useState<(typeof PROGRAM_OPTIONS)[number] | ''>('');

  const [openPicker, setOpenPicker] = useState<'none' | 'department' | 'program'>('none');

  const formatStudentId = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };
  const STUDENT_ID_RE = /^\d{4}-\d{6}$/;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ tone: 'error' | 'warning'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleNextFromEmail = useCallback(() => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return setFieldErrors({ email: 'Please enter your NU email.' });
    if (!trimmed.endsWith(NU_DOMAIN))
      return setFieldErrors({ email: 'Only @students.nu-dasma.edu.ph emails are allowed.' });
    setFieldErrors({});
    setStep('info');
  }, [email]);

  const handleNextFromInfo = useCallback(() => {
    setError(null);
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    if (!studentId.trim()) errs.studentId = 'Student ID is required.';
    else if (!STUDENT_ID_RE.test(studentId.trim()))
      errs.studentId = 'Format must be YYYY-NNNNNN (e.g. 2023-172077).';
    if (Object.keys(errs).length) return setFieldErrors(errs);
    setFieldErrors({});
    setStep('program');
  }, [firstName, lastName, studentId]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const errs: Record<string, string> = {};
    if (!department) errs.department = 'Please select your department.';
    if (!program) errs.program = 'Please select your program.';
    if (Object.keys(errs).length) return setFieldErrors(errs);
    setFieldErrors({});

    if (!isSupabaseConfigured || !supabase) {
      setError({ tone: 'error', message: 'Supabase is not configured. Contact support.' });
      return;
    }

    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/login');
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            program,
            department,
            student_id: studentId.trim(),
          },
        },
      });
      if (authError) setError({ tone: 'warning', message: authError.message });
      else setShowSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.toLowerCase() : '';
      setError({
        tone: 'warning',
        message:
          msg.includes('network') || msg.includes('fetch')
            ? 'Network error — please check your internet and try again.'
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [department, email, firstName, lastName, program, studentId]);

  const handleBack = useCallback(() => {
    setError(null);
    setFieldErrors({});
    if (step === 'info') setStep('email');
    else if (step === 'program') setStep('info');
  }, [step]);

  return (
    <>
      <BottomSheetModal
        onClose={() => router.back()}
        dismissOnBackdropPress={step === 'email'}>
        <View style={styles.content}>
          {/* Progress bar */}
          <ProgressBar value={STEP_PROGRESS[step]} />

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <>
              <View style={styles.textBlock}>
                <Text style={styles.title}>Let&apos;s get started with your school email</Text>
                <Text style={styles.subtitle}>
                  Use your email to save your progress and enjoy smooth experience.
                </Text>
              </View>

              {error ? <AuthErrorBanner message={error.message} tone={error.tone} /> : null}

              <AppInput
                error={fieldErrors.email}
                inputType="email"
                placeholder="johndoe@students.nu-dasma.edu.ph"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                keyboardType="email-address"
                value={email}
                onChangeText={(v) => { setEmail(v); clearFieldError('email'); setError(null); }}
                prefix={<IconsaxEnvelopeIcon size={20} color="#717680" />}
                prefixDivider
                fieldStyle={{ paddingRight: 8 }}
              />

              <AppButton
                label="Continue"
                onPress={handleNextFromEmail}
                variant="primary"
                disabled={!email.trim()}
              />

              <Text style={styles.footerText}>
                {'Already have an account? '}
                <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
                  Sign in
                </Text>
              </Text>
            </>
          )}

          {/* ── STEP 2: Basic info ── */}
          {step === 'info' && (
            <>
              <View style={styles.textBlock}>
                <Text style={styles.title}>Tell us something about you</Text>
                <Text style={styles.subtitle}>
                  Use your email to save your progress and enjoy smooth experience.
                </Text>
              </View>

              {error ? <AuthErrorBanner message={error.message} tone={error.tone} /> : null}

              <View style={styles.row}>
                <View style={styles.rowCell}>
                  <AppInput
                    placeholder="First Name"
                    error={fieldErrors.firstName}
                    autoCorrect={false}
                    autoCapitalize="words"
                    value={firstName}
                    onChangeText={(v) => { setFirstName(v); clearFieldError('firstName'); }}
                  />
                </View>
                <View style={styles.rowCell}>
                  <AppInput
                    placeholder="Last Name"
                    error={fieldErrors.lastName}
                    autoCorrect={false}
                    autoCapitalize="words"
                    value={lastName}
                    onChangeText={(v) => { setLastName(v); clearFieldError('lastName'); }}
                  />
                </View>
              </View>

              <AppInput
                placeholder="Student ID (e.g. 2023-172077)"
                error={fieldErrors.studentId}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="number-pad"
                maxLength={11}
                value={studentId}
                onChangeText={(v) => { setStudentId(formatStudentId(v)); clearFieldError('studentId'); }}
              />

              <View style={{ gap: 4 }}>
                <AppButton
                  label="Next"
                  onPress={handleNextFromInfo}
                  variant="primary"
                  disabled={!firstName.trim() || !lastName.trim() || !studentId.trim()}
                />
                <Pressable onPress={handleBack} style={styles.goBackBtn} hitSlop={8}>
                  <Text style={styles.goBackLabel}>Go back</Text>
                </Pressable>
              </View>

              <Text style={styles.footerText}>
                {'Already have an account? '}
                <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
                  Sign in
                </Text>
              </Text>
            </>
          )}

          {/* ── STEP 3: Program & department ── */}
          {step === 'program' && (
            <>
              <View style={styles.textBlock}>
                <Text style={styles.title}>What&apos;s your program and department</Text>
                <Text style={styles.subtitle}>
                  Use your email to save your progress and enjoy smooth experience.
                </Text>
              </View>

              {error ? <AuthErrorBanner message={error.message} tone={error.tone} /> : null}

              <InlineSelect
                placeholder="School Department"
                options={DEPARTMENT_OPTIONS}
                value={department}
                error={fieldErrors.department}
                open={openPicker === 'department'}
                onOpenChange={(o) => setOpenPicker(o ? 'department' : 'none')}
                onChange={(v) => {
                  setDepartment(v);
                  clearFieldError('department');
                  setProgram('');
                }}
              />

              <InlineSelect
                placeholder={department ? 'Program / Course' : 'Select a department first'}
                options={PROGRAM_OPTIONS}
                value={program}
                error={fieldErrors.program}
                disabled={!department}
                open={openPicker === 'program'}
                onOpenChange={(o) => setOpenPicker(o ? 'program' : 'none')}
                onChange={(v) => { setProgram(v); clearFieldError('program'); }}
              />

              <View style={{ gap: 4 }}>
                <AppButton
                  label="Create my account"
                  onPress={handleSubmit}
                  loading={loading}
                  variant="primary"
                  disabled={!department || !program}
                />
                <Pressable onPress={handleBack} style={styles.goBackBtn} hitSlop={8}>
                  <Text style={styles.goBackLabel}>Go back</Text>
                </Pressable>
              </View>

              <Text style={styles.footerText}>
                {'Already have an account? '}
                <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
                  Sign in
                </Text>
              </Text>
            </>
          )}

        </View>
      </BottomSheetModal>

      <AuthSuccessModal
        visible={showSuccess}
        onClose={() => { setShowSuccess(false); router.replace('/login'); }}
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

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  textBlock: {
    gap: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.56,
    color: '#181D27',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.32,
    color: '#717680',
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowCell: {
    flex: 1,
    minWidth: 0,
  },
  footerText: {
    fontSize: 14,
    color: '#A4A7AE',
    textAlign: 'center',
    letterSpacing: -0.24,
    lineHeight: 14,
    marginTop: 4,
  },
  footerLink: {
    fontWeight: '500',
    color: '#717680',
  },
  goBackBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#528BFF',
    letterSpacing: -0.32,
  },
});
