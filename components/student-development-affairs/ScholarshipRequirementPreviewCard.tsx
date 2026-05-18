import { Pressable, Text, View } from 'react-native';

import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxMedalStarFilledIcon } from '@/components/icons/IconsaxMedalStarFilledIcon';
import { IconsaxTimerIcon } from '@/components/icons/IconsaxTimerIcon';
import type { RequirementTrackItem } from '@/lib/scholarships/requirementTracking';

const BRAND = '#2970FF';

export type ScholarshipRequirementPreviewCardProps = {
  item: RequirementTrackItem;
  onPress: () => void;
};

/** Clinic-style blue preview card for the next scholarship requirement / application. */
export function ScholarshipRequirementPreviewCard({
  item,
  onPress,
}: ScholarshipRequirementPreviewCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.statusLabel}`}
      onPress={onPress}
      style={{
        backgroundColor: BRAND,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 2,
      }}
      className="active:opacity-90">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 9999,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <IconsaxMedalStarFilledIcon size={28} color="#FDFDFD" />
          </View>
          <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#FDFDFD',
                letterSpacing: -0.8,
              }}
              numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '400', color: '#FDFDFD' }} numberOfLines={1}>
              {item.subtitle} • {item.statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <IconsaxCalendarIcon size={16} color="rgba(253,253,253,0.9)" />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#FDFDFD' }} numberOfLines={1}>
            {item.dateLabel}
          </Text>
        </View>
        <View
          style={{
            width: 1,
            height: 16,
            backgroundColor: 'rgba(255,255,255,0.4)',
            marginHorizontal: 12,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <IconsaxTimerIcon size={16} color="rgba(253,253,253,0.9)" />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#FDFDFD' }} numberOfLines={1}>
            {item.secondaryLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
