import { useState, type ComponentType } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxCloseCircleIcon } from '@/components/icons/IconsaxCloseCircleIcon';
import { IconsaxDangerIcon } from '@/components/icons/IconsaxDangerIcon';
import { UserEditIcon } from '@/components/icons/UserEditIcon';
import { ShieldSecurityIcon } from '@/components/icons/ShieldSecurityIcon';
import { PersonalInfoNoteCard } from '@/components/profile/PersonalInfoNoteCard';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { Inter } from '@/lib/typography/inter';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';

type IconProps = { size?: number; color?: string };

type FAQItem = {
  q: string;
  a: string;
  Icon: ComponentType<IconProps>;
};

const FAQS: FAQItem[] = [
  {
    q: 'How do I book an appointment?',
    a: 'Go to the Health Service tab, choose a provider, select a date and time slot, then confirm your booking. You will receive a notification once confirmed.',
    Icon: IconsaxCalendarIcon,
  },
  {
    q: 'Can I cancel a booked appointment?',
    a: 'Yes. Open the appointment from the Health Service screen and tap "Cancel Appointment." Cancellations must be made at least 2 hours before the scheduled time.',
    Icon: IconsaxCloseCircleIcon,
  },
  {
    q: 'Why is my account not loading data?',
    a: 'Ensure you have a stable internet connection. If the issue persists, try signing out and signing back in with your One-Time Password. Contact IT Support if the problem continues.',
    Icon: IconsaxDangerIcon,
  },
  {
    q: 'How do I update my personal information?',
    a: "Your academic information is managed by the Registrar's Office. For corrections, visit the Registrar with a valid ID and supporting documents.",
    Icon: UserEditIcon,
  },
  {
    q: 'Is my health data kept private?',
    a: 'Yes. Health-related information is strictly confidential and only accessible to authorized Health Service Office personnel. See our Privacy Policy for full details.',
    Icon: ShieldSecurityIcon,
  },
];

function FAQRow({ item, isLast }: { item: FAQItem; isLast?: boolean }) {
  const [open, setOpen] = useState(false);
  const { Icon } = item;

  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SCHEDULE_PARTNER.divider,
      }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.88 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
          gap: 12,
        })}>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} color="#111111" />
        </View>
        <Text
          style={{
            flex: 1,
            fontFamily: Inter.medium,
            fontSize: 16,
            color: '#222222',
            letterSpacing: -0.64,
            lineHeight: 22,
          }}>
          {item.q}
        </Text>
        {open ? (
          <IconsaxArrowUpIcon size={18} color="#A7A7A7" />
        ) : (
          <IconsaxArrowDownIcon size={18} color="#A7A7A7" />
        )}
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingLeft: 52 }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 14,
              lineHeight: 20,
              color: '#727272',
              letterSpacing: -0.15,
            }}>
            {item.a}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
          gap: 20,
        }}>
        <View style={{ gap: 16 }}>
          <CircleBackButton onPress={handleBack} />
          <View style={{ gap: 6 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: Inter.medium,
                fontSize: 30,
                color: '#222222',
                letterSpacing: -2.24,
                lineHeight: 38,
              }}>
              Help Center
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 18,
                color: '#727272',
                letterSpacing: -0.64,
                lineHeight: 22,
              }}>
              Answers to common questions about CampusCare
            </Text>
          </View>
        </View>

        <ProfileSection title="Frequently Asked Questions">
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}>
            {FAQS.map((item, index) => (
              <FAQRow key={item.q} item={item} isLast={index === FAQS.length - 1} />
            ))}
          </View>
        </ProfileSection>

        <PersonalInfoNoteCard message="Still need help? Email us at support@campuscare.edu.ph and we'll get back to you as soon as possible." />
      </ScrollView>
    </View>
  );
}
