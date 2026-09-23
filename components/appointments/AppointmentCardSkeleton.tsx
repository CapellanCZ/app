import { View } from 'react-native';

import { SkeletonBone, SkeletonList } from '@/components/ui/SkeletonBone';

/** Mirrors white outlined AppointmentCard (Figma 4203:124). */
export function AppointmentCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        gap: 20,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonBone width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBone width="72%" height={14} borderRadius={6} />
          <SkeletonBone width="40%" height={12} borderRadius={6} />
        </View>
      </View>
      <SkeletonBone width="100%" height={1} borderRadius={1} />
      <View style={{ gap: 12, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <SkeletonBone width="30%" height={14} borderRadius={6} />
          <SkeletonBone width="40%" height={14} borderRadius={6} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <SkeletonBone width="28%" height={14} borderRadius={6} />
          <SkeletonBone width="36%" height={14} borderRadius={6} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <SkeletonBone width="32%" height={14} borderRadius={6} />
          <SkeletonBone width="44%" height={14} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function AppointmentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonList count={count} renderItem={() => <AppointmentCardSkeleton />} />
  );
}
