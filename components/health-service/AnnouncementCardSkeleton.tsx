import { View } from 'react-native';

import { SkeletonBone } from '@/components/ui/SkeletonBone';

/** Figma image frame aspect (306×204) — matches HealthServiceAnnouncementCard. */
const IMAGE_ASPECT = 306 / 204;

/**
 * Mirrors the home announcement carousel card with a soft pulse shimmer.
 */
export function AnnouncementCardSkeleton() {
  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}>
      <View
        style={{
          marginHorizontal: 2,
          marginTop: 2,
          borderRadius: 16,
          overflow: 'hidden',
          aspectRatio: IMAGE_ASPECT,
          backgroundColor: 'rgba(0,0,0,0.04)',
        }}>
        <SkeletonBone
          width="100%"
          height={204}
          borderRadius={16}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />
      </View>

      <View style={{ padding: 20, gap: 10 }}>
        <View style={{ gap: 8 }}>
          <SkeletonBone width="28%" height={12} borderRadius={6} />
          <SkeletonBone width="72%" height={18} borderRadius={6} />
        </View>

        <View style={{ gap: 8, marginTop: 8 }}>
          <SkeletonBone width="100%" height={12} borderRadius={6} />
          <SkeletonBone width="94%" height={12} borderRadius={6} />
          <SkeletonBone width="66%" height={12} borderRadius={6} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            minHeight: 20,
          }}>
          <SkeletonBone width={88} height={14} borderRadius={6} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SkeletonBone width={8} height={8} borderRadius={999} />
            <SkeletonBone width={8} height={8} borderRadius={999} />
            <SkeletonBone width={8} height={8} borderRadius={999} />
          </View>
        </View>
      </View>
    </View>
  );
}
