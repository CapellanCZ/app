import { Platform, View, type ViewStyle } from 'react-native';

import { SkeletonBone } from '@/components/ui/SkeletonBone';

const THUMB_SIZE = 88;

const CARD_SOFT_SHADOW: ViewStyle =
  Platform.OS === 'android'
    ? {
        elevation: 0,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      };

function RowSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ECECEC',
        padding: 12,
        ...CARD_SOFT_SHADOW,
      }}>
      <SkeletonBone width={THUMB_SIZE} height={THUMB_SIZE} borderRadius={12} />
      <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
        <SkeletonBone width="42%" height={12} borderRadius={6} />
        <SkeletonBone width="88%" height={16} borderRadius={6} />
        <SkeletonBone width="100%" height={12} borderRadius={6} />
        <SkeletonBone width="72%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

/** Mirrors the home announcement poster-list rows with a soft pulse shimmer. */
export function AnnouncementCardSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <RowSkeleton />
      <RowSkeleton />
    </View>
  );
}
