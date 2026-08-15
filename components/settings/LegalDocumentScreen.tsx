import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenNavbar } from '@/components/layout/ScreenNavbar';
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
 * Shared Privacy / Terms layout — matches settings screens
 * (ScreenNavbar, surface cards, muted section labels, Inter type).
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

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <ScreenNavbar title={title} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
          gap: 16,
        }}>
        {/* Meta */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
          <View
            style={{
              backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              borderRadius: 99,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}>
            <Text
              style={{
                fontFamily: Inter.medium,
                fontSize: 12,
                color: SCHEDULE_PARTNER.textMuted,
                letterSpacing: -0.2,
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
            backgroundColor: SCHEDULE_PARTNER.surface,
            padding: 16,
          }}>
          <Text
            style={{
              fontFamily: Inter.regular,
              fontSize: 15,
              lineHeight: 22,
              color: SCHEDULE_PARTNER.textMuted,
              letterSpacing: -0.2,
            }}>
            {intro}
          </Text>
        </View>

        {/* Sections */}
        <Text
          style={{
            marginLeft: 4,
            marginBottom: -4,
            fontFamily: Inter.medium,
            fontSize: 15,
            color: SCHEDULE_PARTNER.textMuted,
            letterSpacing: -0.3,
          }}>
          Document
        </Text>
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: SCHEDULE_PARTNER.cardBorder,
            backgroundColor: SCHEDULE_PARTNER.surface,
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
                      color: SCHEDULE_PARTNER.brand,
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
                      color: SCHEDULE_PARTNER.textPrimary,
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
                    color: SCHEDULE_PARTNER.textMuted,
                    letterSpacing: -0.15,
                  }}>
                  {section.body}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        {(footerNote || footerEmail) && (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: SCHEDULE_PARTNER.surface,
              padding: 16,
              gap: 6,
            }}>
            {footerNote ? (
              <Text
                style={{
                  fontFamily: Inter.regular,
                  fontSize: 13,
                  lineHeight: 19,
                  color: SCHEDULE_PARTNER.textMuted,
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
                  color: SCHEDULE_PARTNER.brand,
                  letterSpacing: -0.2,
                }}>
                {footerEmail}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
