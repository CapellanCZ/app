import { Pressable, Text, View } from 'react-native';

import { IconsaxCalendar2Icon } from '@/components/icons/IconsaxCalendar2Icon';
import { IconsaxMedalStarFilledIcon } from '@/components/icons/IconsaxMedalStarFilledIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import type { RequirementTrackItem } from '@/lib/scholarships/requirementTracking';

const TAB_DOT: Record<string, string> = {
  pending: '#F79009',
  submitted: '#2970FF',
  under_review: '#7A5AF8',
};

export type ScholarshipRequirementListCardProps = {
  item: RequirementTrackItem;
  onPress: () => void;
};

/** Grey list card — mirrors `AppointmentListCard` for requirements / applications. */
export function ScholarshipRequirementListCard({ item, onPress }: ScholarshipRequirementListCardProps) {
  const dotColor = TAB_DOT[item.tab] ?? '#2970FF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.statusLabel}`}
      onPress={onPress}
      style={{
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
      }}
      className="active:opacity-90">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1, minWidth: 0 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: '#EAF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <IconsaxMedalStarFilledIcon size={26} color="#5B8AF5" />
          </View>
          <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 20, fontWeight: '600', color: '#181D27', letterSpacing: -0.8 }}
              numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, color: '#717680' }} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#F5F5F5',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            marginLeft: 8,
          }}>
          <View style={{ width: 8, height: 4, borderRadius: 99, backgroundColor: dotColor }} />
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#252B37', letterSpacing: -0.24 }}>
            {item.statusLabel}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#E9EAEB',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <IconsaxCalendar2Icon size={20} color="#181D27" />
          <Text style={{ fontSize: 12, color: '#181D27' }} numberOfLines={1}>
            {item.dateLabel}
          </Text>
        </View>
        <View style={{ width: 1, height: 17, backgroundColor: '#C5C6CC', marginHorizontal: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <IconsaxClockIcon size={20} color="#252B37" />
          <Text style={{ fontSize: 12, color: '#252B37' }} numberOfLines={1}>
            {item.secondaryLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
