import { View } from 'react-native';

import { AnnouncementCardSkeleton } from '@/components/health-service/AnnouncementCardSkeleton';
import { SkeletonBone } from '@/components/ui/SkeletonBone';

const TILE_HEIGHT = 88;
const QUICK_ACTION_GAP = 10;

function SectionTitleSkeleton() {
  return <SkeletonBone width="52%" height={22} borderRadius={8} />;
}

function WelcomeHeaderSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <SkeletonBone width={48} height={48} borderRadius={24} />
        <View style={{ gap: 8, flex: 1 }}>
          <SkeletonBone width="42%" height={14} borderRadius={6} />
          <SkeletonBone width="58%" height={16} borderRadius={6} />
        </View>
      </View>
      <SkeletonBone width={40} height={40} borderRadius={20} />
    </View>
  );
}

function UpcomingCardSkeleton() {
  return (
    <View style={{ width: '100%', paddingTop: 7 }}>
      <SkeletonBone
        width="46%"
        height={22}
        borderRadius={19}
        style={{ position: 'absolute', top: 0, left: '4%', zIndex: 1 }}
      />
      <View
        style={{
          marginTop: 14,
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: 16,
          padding: 16,
          gap: 16,
          minHeight: 148,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonBone width={56} height={56} borderRadius={28} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBone width="64%" height={16} borderRadius={6} />
            <SkeletonBone width="40%" height={14} borderRadius={6} />
          </View>
          <SkeletonBone width={40} height={40} borderRadius={20} />
        </View>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <SkeletonBone width="38%" height={14} borderRadius={6} />
          <SkeletonBone width="44%" height={14} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

function QuickActionsSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: QUICK_ACTION_GAP, width: '100%' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={`qa-${i}`}
          style={{
            flex: 1,
            height: TILE_HEIGHT,
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
          <SkeletonBone width={24} height={24} borderRadius={8} />
          <SkeletonBone width="56%" height={12} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

function VitalsRowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <View
          key={`vital-${i}`}
          style={{
            flex: 1,
            minHeight: 120,
            borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.04)',
            paddingHorizontal: 16,
            paddingVertical: 18,
            gap: 24,
          }}>
          <SkeletonBone width="70%" height={12} borderRadius={6} />
          <SkeletonBone width="50%" height={22} borderRadius={6} />
          <SkeletonBone width="40%" height={12} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

/** Full home dashboard placeholder — all sections appear together after load. */
export function HomeScreenSkeleton() {
  return (
    <>
      <View style={{ gap: 10 }}>
        <View style={{ paddingVertical: 10 }}>
          <WelcomeHeaderSkeleton />
        </View>
        <View style={{ paddingHorizontal: 4 }}>
          <SkeletonBone width="88%" height={32} borderRadius={10} />
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <UpcomingCardSkeleton />
        <QuickActionsSkeleton />
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitleSkeleton />
        <VitalsRowSkeleton />
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitleSkeleton />
        <AnnouncementCardSkeleton />
      </View>
    </>
  );
}
