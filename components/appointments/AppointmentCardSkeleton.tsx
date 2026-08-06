import { View } from 'react-native';

import { APPOINTMENT_CARD_COLORS } from '@/components/appointments/AppointmentCard';
import { SkeletonBone, SkeletonList } from '@/components/ui/SkeletonBone';

/** Mirrors AppointmentCard layout with a soft pulse shimmer. */
export function AppointmentCardSkeleton({ backgroundColor }: { backgroundColor: string }) {
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
        gap: 10,
      }}>
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.16)',
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <SkeletonBone width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone width="70%" height={14} borderRadius={6} />
              <SkeletonBone width="42%" height={12} borderRadius={6} />
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
          <SkeletonBone width={88} height={14} borderRadius={6} />
          <SkeletonBone width={108} height={14} borderRadius={6} />
        </View>
        <SkeletonBone width="46%" height={14} borderRadius={6} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function AppointmentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonList
      count={count}
      renderItem={(index) => (
        <AppointmentCardSkeleton
          backgroundColor={APPOINTMENT_CARD_COLORS[index % APPOINTMENT_CARD_COLORS.length]}
        />
      )}
    />
  );
}
