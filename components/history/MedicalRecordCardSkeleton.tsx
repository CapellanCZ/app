import { View } from 'react-native';

import { MEDICAL_RECORD_CARD_COLORS } from '@/components/history/MedicalRecordCard';
import { SkeletonBone, SkeletonList } from '@/components/ui/SkeletonBone';

/** Mirrors MedicalRecordCard layout with a soft pulse shimmer. */
export function MedicalRecordCardSkeleton({ backgroundColor }: { backgroundColor: string }) {
  return (
    <View
      style={{
        backgroundColor,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        borderRadius: 16,
        paddingTop: 18,
        paddingBottom: 12,
        paddingHorizontal: 16,
        width: '100%',
      }}>
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.10)',
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <SkeletonBone width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone width="68%" height={14} borderRadius={6} />
              <SkeletonBone width="40%" height={12} borderRadius={6} />
            </View>
          </View>
          <SkeletonBone width={42} height={42} borderRadius={999} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24,
            paddingHorizontal: 10,
            minHeight: 28,
          }}>
          <SkeletonBone width={96} height={14} borderRadius={6} />
          <SkeletonBone width={120} height={14} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function MedicalRecordListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonList
      count={count}
      renderItem={(index) => (
        <MedicalRecordCardSkeleton
          backgroundColor={MEDICAL_RECORD_CARD_COLORS[index % MEDICAL_RECORD_CARD_COLORS.length]}
        />
      )}
    />
  );
}
