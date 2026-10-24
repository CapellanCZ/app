import { View } from 'react-native';

import { SkeletonBone, SkeletonList } from '@/components/ui/SkeletonBone';

/** Mirrors NotificationListRow layout with a soft pulse shimmer. */
export function NotificationCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: '#EEF4FF',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
        width: '100%',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <SkeletonBone width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
          <SkeletonBone width="62%" height={14} borderRadius={6} />
          <SkeletonBone width="100%" height={12} borderRadius={6} />
          <SkeletonBone width="78%" height={12} borderRadius={6} />
          <SkeletonBone width="44%" height={10} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function NotificationListSkeleton({ count = 4 }: { count?: number }) {
  return <SkeletonList count={count} renderItem={() => <NotificationCardSkeleton />} />;
}
