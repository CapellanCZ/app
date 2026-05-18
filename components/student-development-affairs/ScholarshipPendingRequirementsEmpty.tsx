import { Text, View } from 'react-native';

import { IconsaxDocumentTextIcon } from '@/components/icons/IconsaxDocumentTextIcon';

/** Figma 1685:3806 — pending requirements empty state inside the grey hero card. */
export function ScholarshipPendingRequirementsEmpty() {
  return (
    <View
      style={{
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 154,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
      }}>
      <IconsaxDocumentTextIcon size={48} color="#A4A7AE" />
      <View style={{ gap: 4, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: '#717680',
            letterSpacing: -0.32,
            textAlign: 'center',
          }}>
          No Requirements to Submit
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: '#A4A7AE',
            letterSpacing: -0.24,
            textAlign: 'center',
          }}>
          Click See All to see Pending, Submitted, and Under Review
        </Text>
      </View>
    </View>
  );
}
