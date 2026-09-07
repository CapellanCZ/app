import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconsaxArchiveIcon } from '@/components/icons/IconsaxArchiveIcon';
import { IconsaxHourglassIcon } from '@/components/icons/IconsaxHourglassIcon';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { BottomSheetModal, type BottomSheetModalHandle } from '@/components/ui/BottomSheetModal';
import { Inter } from '@/lib/typography/inter';

export type HomeMoreSheetProps = {
  visible: boolean;
  onClose: () => void;
  onMyQueue: () => void;
  onPastVisits: () => void;
};

/**
 * Home "More" sheet — content-sized bottom sheet with solid iOS dim (same as login).
 */
export function HomeMoreSheet({ visible, onClose, onMyQueue, onPastVisits }: HomeMoreSheetProps) {
  const sheetRef = useRef<BottomSheetModalHandle>(null);

  return (
    <BottomSheetModal
      ref={sheetRef}
      visible={visible}
      onClose={onClose}
      backgroundColor="#F9F9F9"
      bottomPadding={16}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Clinic tools and visit history</Text>
        </View>

        <View style={styles.rows}>
          <ProfileMenuRow
            icon={<IconsaxHourglassIcon size={24} color="#111111" />}
            label="My Queue"
            onPress={() => sheetRef.current?.dismiss(onMyQueue)}
          />
          <ProfileMenuRow
            icon={<IconsaxArchiveIcon size={24} color="#111111" />}
            label="Past Visits"
            onPress={() => sheetRef.current?.dismiss(onPastVisits)}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 4,
  },
  header: {
    gap: 6,
  },
  rows: {
    gap: 10,
  },
  title: {
    fontFamily: Inter.medium,
    fontSize: 22,
    color: '#222222',
    letterSpacing: -0.88,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Inter.regular,
    fontSize: 15,
    color: '#727272',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
});
