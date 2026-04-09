import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { PLACEHOLDER_NU_EMAIL, PROGRAM_OPTIONS } from '@/components/auth/constants';
import { RegisterChrome } from '@/components/auth/RegisterChrome';
import { Button, InputGroup } from 'heroui-native';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [program, setProgram] = useState<(typeof PROGRAM_OPTIONS)[number] | ''>('');
  const [studentId, setStudentId] = useState('');
  const [programPickerOpen, setProgramPickerOpen] = useState(false);

  const selectProgram = useCallback((value: (typeof PROGRAM_OPTIONS)[number]) => {
    setProgram(value);
    setProgramPickerOpen(false);
  }, []);

  return (
    <>
    <RegisterChrome
      title="Create your Account"
      subtitle="Set up your National University account to access student welfare and support with CampusCare."
      footer={
        <View className="gap-4 bg-white px-5 pt-4">
          <Button
            variant="primary"
            className="h-12 w-full rounded-3xl border border-[#001229]/10 bg-[#2970FF]">
            <Button.Label className="text-md font-semibold text-white">Create my account</Button.Label>
          </Button>
          <AuthLegalFooter topSpacing={false} />
        </View>
      }>
      <View className="gap-4">
        <AuthSegmentedNav active="signup" className="mt-0" />

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
              className="h-12 w-full rounded-xl border border-[#C5C6CC] bg-white px-4 text-md text-[#181D27]"
            />
            <InputGroup.Suffix isDecorative>
              <IconsaxEnvelopeIcon size={18} />
            </InputGroup.Suffix>
          </InputGroup>
        </View>

        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold text-[#494A50]">First name</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="secondary"
                autoCorrect={false}
                placeholder="Juan"
                placeholderColorClassName="text-[#8F9098]"
                value={firstName}
                onChangeText={setFirstName}
                className="h-12 w-full rounded-xl border border-[#C5C6CC] bg-white px-4 text-md text-[#181D27]"
              />
            </InputGroup>
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold text-[#494A50]">Last name</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="secondary"
                autoCorrect={false}
                placeholder="Dela Cruz"
                placeholderColorClassName="text-[#8F9098]"
                value={lastName}
                onChangeText={setLastName}
                className="h-12 w-full rounded-xl border border-[#C5C6CC] bg-white px-4 text-md text-[#181D27]"
              />
            </InputGroup>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold text-[#494A50]">Program</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select program"
              onPress={() => setProgramPickerOpen(true)}
              className="h-12 w-full flex-row items-center rounded-xl border border-[#C5C6CC] bg-white px-4">
              <Text
                className={`flex-1 text-md ${program ? 'text-[#181D27]' : 'text-[#8F9098]'}`}
                numberOfLines={1}>
                {program || 'Select program'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#717680" />
            </Pressable>
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold text-[#494A50]">Student ID</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="secondary"
                autoCorrect={false}
                keyboardType="default"
                placeholder="e.g. 2024-12345"
                placeholderColorClassName="text-[#8F9098]"
                value={studentId}
                onChangeText={setStudentId}
                className="h-12 w-full rounded-xl border border-[#C5C6CC] bg-white px-4 text-md text-[#181D27]"
              />
            </InputGroup>
          </View>
        </View>
      </View>
    </RegisterChrome>

    <Modal
      visible={programPickerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setProgramPickerOpen(false)}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss program picker"
          className="absolute inset-0"
          onPress={() => setProgramPickerOpen(false)}
        />
        <View className="max-h-[70%] rounded-t-3xl bg-white px-2 pb-8 pt-4">
          <Text className="mb-3 px-3 text-base font-semibold text-[#181D27]">Program</Text>
          {PROGRAM_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              accessibilityRole="button"
              className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
              onPress={() => selectProgram(opt)}>
              <Text
                className={`text-sm ${program === opt ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
    </>
  );
}
