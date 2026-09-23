import { View } from 'react-native';

import { SkeletonBone } from '@/components/ui/SkeletonBone';

/** Slot chip grid placeholder — mirrors BookingPeriodSection rows. */
function SlotRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBone key={i} width="100%" height={48} borderRadius={16} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

function PeriodSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <SkeletonBone width="28%" height={14} borderRadius={6} />
      <SlotRowSkeleton />
      <SlotRowSkeleton />
    </View>
  );
}

/** Time section skeleton while day slots load. */
export function BookingSlotsSkeleton() {
  return (
    <View style={{ gap: 18 }}>
      <PeriodSkeleton />
      <PeriodSkeleton />
    </View>
  );
}

/** Full booking screen skeleton (staff list still loading). */
export function BookingScreenSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 20, gap: 12, paddingTop: 14 }}>
      <View style={{ gap: 8, paddingBottom: 4 }}>
        <SkeletonBone width="58%" height={28} borderRadius={8} />
        <SkeletonBone width="78%" height={16} borderRadius={6} />
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E8E8E8',
          padding: 16,
          gap: 14,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonBone width={52} height={52} borderRadius={26} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone width="70%" height={16} borderRadius={6} />
            <SkeletonBone width="42%" height={12} borderRadius={6} />
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E8E8E8',
          padding: 16,
          gap: 14,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SkeletonBone width={34} height={34} borderRadius={10} />
          <SkeletonBone width="30%" height={16} borderRadius={6} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonBone key={i} width="100%" height={64} borderRadius={14} style={{ flex: 1 }} />
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E8E8E8',
          padding: 16,
          gap: 14,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SkeletonBone width={34} height={34} borderRadius={10} />
          <SkeletonBone width="24%" height={16} borderRadius={6} />
        </View>
        <BookingSlotsSkeleton />
      </View>
    </View>
  );
}
