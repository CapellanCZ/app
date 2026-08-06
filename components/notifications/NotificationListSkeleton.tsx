import { View } from 'react-native';

import { SkeletonBone, SkeletonList } from '@/components/ui/SkeletonBone';

/** Mirrors NotificationListRow layout with a soft pulse shimmer. */
export function NotificationCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 18,
        width: '100%',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <SkeletonBone width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SkeletonBone width="58%" height={14} borderRadius={6} />
            <SkeletonBone width={36} height={12} borderRadius={6} />
          </View>
          <SkeletonBone width="100%" height={12} borderRadius={6} />
          <SkeletonBone width="82%" height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function NotificationListSkeleton({ count = 4 }: { count?: number }) {
  return <SkeletonList count={count} renderItem={() => <NotificationCardSkeleton />} />;
}
