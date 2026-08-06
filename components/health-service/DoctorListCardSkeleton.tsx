import { View } from 'react-native';

import { SkeletonBone, SkeletonList } from '@/components/ui/SkeletonBone';

/** Mirrors DoctorListCard layout with a soft pulse shimmer. */
export function DoctorListCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        paddingTop: 18,
        paddingBottom: 12,
        paddingHorizontal: 16,
      }}>
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <SkeletonBone width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone width="72%" height={14} borderRadius={6} />
              <SkeletonBone width="44%" height={12} borderRadius={6} />
            </View>
          </View>
          <SkeletonBone width={42} height={42} borderRadius={999} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 }}>
          <SkeletonBone width={8} height={8} borderRadius={999} />
          <SkeletonBone width={88} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function DoctorListSkeleton({ count = 4 }: { count?: number }) {
  return <SkeletonList count={count} renderItem={() => <DoctorListCardSkeleton />} />;
}
