import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { AuthSegmentedNav } from '@/components/auth/AuthSegmentedNav';
import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxEnvelopeIcon } from '@/components/icons/IconsaxEnvelopeIcon';
import { PLACEHOLDER_NU_EMAIL, PROGRAM_OPTIONS } from '@/components/auth/constants';
import { RegisterChrome } from '@/components/auth/RegisterChrome';
import { BottomSheet, Button, InputGroup } from 'heroui-native';

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
        <>
          <Button
            variant="primary"
            className="h-12 w-full rounded-3xl border border-[#001229]/10 bg-[#2970FF]">
            <Button.Label className="font-semibold leading-5 text-white">Create my account</Button.Label>
          </Button>
          <AuthLegalFooter topSpacing={false} />
        </>
      }>
      <View className="gap-4">
        <AuthSegmentedNav active="signup" className="mt-0" />

        <View className="gap-2">
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
              <IconsaxEnvelopeIcon size={22} />
            </InputGroup.Suffix>
          </InputGroup>
        </View>

        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">First name</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                autoCorrect={false}
                placeholder="Juan"
                placeholderColorClassName="text-[#8F9098]"
                value={firstName}
                onChangeText={setFirstName}
              />
            </InputGroup>
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">Last name</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                autoCorrect={false}
                placeholder="Dela Cruz"
                placeholderColorClassName="text-[#8F9098]"
                value={lastName}
                onChangeText={setLastName}
              />
            </InputGroup>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">Program</Text>
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
                <BottomSheet.Content snapPoints={['55%', '85%']} index={0}>
                  <BottomSheet.Title className="mb-2 px-1 text-base font-semibold leading-6 text-[#181D27]">
                    Program
                  </BottomSheet.Title>
                  <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    {PROGRAM_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt}
                        accessibilityRole="button"
                        className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                        onPress={() => selectProgram(opt)}>
                        <Text
                          className={`text-sm leading-5 ${program === opt ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                          {opt}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </BottomSheet.Content>
              </BottomSheet.Portal>
            </BottomSheet>
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">Student ID</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                autoCorrect={false}
                keyboardType="default"
                placeholder="e.g. 2024-12345"
                placeholderColorClassName="text-[#8F9098]"
                value={studentId}
                onChangeText={setStudentId}
              />
            </InputGroup>
          </View>
        </View>
      </View>
    </RegisterChrome>
    </>
  );
}
