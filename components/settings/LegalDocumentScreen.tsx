import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';
import { Inter } from '@/lib/typography/inter';

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocumentScreenProps = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  /** Optional contact / help line under the document. */
  footerNote?: string;
  footerEmail?: string;
};

/**
 * Privacy / Terms layout — same chrome as Appointments & booking
 * (`CircleBackButton` + large Inter title on #F9F9F9).
 */
export function LegalDocumentScreen({
  title,
  lastUpdated,
  intro,
  sections,
  footerNote,
  footerEmail,
}: LegalDocumentScreenProps) {
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
              style={{
                fontFamily: Inter.medium,
                fontSize: 30,
                color: '#222222',
                letterSpacing: -2.24,
                lineHeight: 36,
              }}>
              {title}
            </Text>
            <Text
              style={{
                fontFamily: Inter.regular,
                fontSize: 16,
                color: '#727272',
                letterSpacing: -0.4,
                lineHeight: 22,
              }}>
              Last updated · {lastUpdated}
            </Text>
          </View>
        </View>

        {/* Intro */}
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.cardBorder,
            backgroundColor: '#FFFFFF',
            padding: 16,
          }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 15,
              lineHeight: 22,
              color: '#727272',
              letterSpacing: -0.2,
            }}>
            {intro}
          </Text>
        </View>

        {/* Sections */}
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.cardBorder,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}>
          {sections.map((section, index) => {
            const isLast = index === sections.length - 1;
            const number = String(index + 1).padStart(2, '0');
            return (
              <View
                key={section.heading}
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: SCHEDULE_PARTNER.divider,
                  gap: 8,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Text
                    style={{
                      fontFamily: Inter.medium,
                      fontSize: 13,
                      color: '#A4A7AE',
                      letterSpacing: -0.2,
                      marginTop: 1,
                    }}>
                    {number}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: Inter.semiBold,
                      fontSize: 16,
                      color: '#222222',
                      letterSpacing: -0.4,
                      lineHeight: 22,
                    }}>
                    {section.heading.replace(/^\d+\.\s*/, '')}
                  </Text>
                </View>
                <Text
                  style={{
                    marginLeft: 30,
                    fontFamily: Inter.regular,
                    fontSize: 14,
                    lineHeight: 22,
                    color: '#727272',
                    letterSpacing: -0.15,
                  }}>
                  {section.body}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        {(footerNote || footerEmail) ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: '#FFFFFF',
              padding: 16,
              gap: 6,
            }}>
            {footerNote ? (
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 13,
                  lineHeight: 19,
                  color: '#727272',
                  letterSpacing: -0.15,
                }}>
                {footerNote}
              </Text>
            ) : null}
            {footerEmail ? (
              <Text
                style={{
                  fontFamily: Inter.medium,
                  fontSize: 14,
                  color: '#111111',
                  letterSpacing: -0.2,
                  textDecorationLine: 'underline',
                }}>
                {footerEmail}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
