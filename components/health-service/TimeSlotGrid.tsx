import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { SCHEDULE_PARTNER } from '../../lib/health-service/bookingScheduleTheme';
import type { SlotPeriod } from '../../lib/health-service/types';

const BRAND = SCHEDULE_PARTNER.brand;
const TEXT_PRIMARY = SCHEDULE_PARTNER.textPrimary;
const TEXT_MUTED = '#535862';
const BORDER_SUBTLE = SCHEDULE_PARTNER.borderCell;

const PERIOD_TABS: { id: SlotPeriod; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

export type TimeSlotGridProps = {
  period: SlotPeriod;
  onPeriodChange: (next: SlotPeriod) => void;
  labelsByPeriod: Record<SlotPeriod, string[]>;
  selectedLabel: string | null;
  onSelect: (label: string) => void;
  /** Shown for the active period when that period has no slot labels */
  emptyMessage?: string;
  /** When true, no outer card — sits under date strip inside a shared schedule shell. */
  embedded?: boolean;
};

function SlotGrid({
  labels,
  selectedLabel,
  onSelect,
}: {
  labels: string[];
  selectedLabel: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {labels.map((label) => {
        const selected = selectedLabel === label;
        const isDisabledSlot = false;
        return (
          <View key={label} style={{ width: '23%', minWidth: 72, flexGrow: 1, maxWidth: '25%' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Book time ${label}`}
              accessibilityState={{ selected }}
              onPress={() => !isDisabledSlot && onSelect(label)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                paddingVertical: 12,
                paddingHorizontal: 4,
                borderWidth: 1,
                borderColor: selected ? BRAND : '#E9EAEB',
                backgroundColor: selected ? BRAND : '#FFFFFF',
              }}
              className="active:opacity-80">
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: selected ? '#FFFFFF' : TEXT_MUTED,
                }}>
                {label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function TimeSlotGrid({
  period,
  onPeriodChange,
  labelsByPeriod,
  selectedLabel,
  onSelect,
  emptyMessage,
  embedded = false,
}: TimeSlotGridProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [pagerWidth, setPagerWidth] = useState(0);
  const periodIndex = PERIOD_TABS.findIndex((t) => t.id === period);
  const safeIndex = periodIndex >= 0 ? periodIndex : 0;

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      if (pagerWidth <= 0) return;
      const x = Math.max(0, Math.min(index, PERIOD_TABS.length - 1)) * pagerWidth;
      scrollRef.current?.scrollTo({ x, animated });
    },
    [pagerWidth],
  );

  useEffect(() => {
    scrollToIndex(safeIndex, false);
  }, [safeIndex, pagerWidth, scrollToIndex]);

  const onPagerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== pagerWidth) setPagerWidth(w);
  }, [pagerWidth]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pagerWidth <= 0) return;
      const idx = Math.round(e.nativeEvent.contentOffset.x / pagerWidth);
      const clamped = Math.max(0, Math.min(idx, PERIOD_TABS.length - 1));
      const next = PERIOD_TABS[clamped]?.id;
      if (next && next !== period) onPeriodChange(next);
    },
    [pagerWidth, period, onPeriodChange],
  );

  const titleStyle = {
    fontSize: 18,
    fontWeight: '700' as const,
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  };

  const inner = (
    <>
      {/* Period segment tabs */}
      <View
        style={{
          flexDirection: 'row',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: '#E9EAEB',
          backgroundColor: '#F5F5F5',
          padding: 3,
          gap: 0,
        }}>
        {PERIOD_TABS.map((t) => {
          const selected = period === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t.label} time slots`}
              onPress={() => {
                const idx = PERIOD_TABS.findIndex((p) => p.id === t.id);
                scrollToIndex(idx, false);
                if (t.id !== period) onPeriodChange(t.id);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 999,
                paddingVertical: 10,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? '#FFFFFF' : 'transparent',
                shadowColor: selected ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: selected ? 0.06 : 0,
                shadowRadius: 2,
                elevation: selected ? 1 : 0,
              }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  fontWeight: selected ? '600' : '400',
                  color: selected ? BRAND : TEXT_MUTED,
                }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Slot grid */}
      <View style={{ marginTop: 12 }} onLayout={onPagerLayout}>
        {pagerWidth > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}>
            {PERIOD_TABS.map((t) => {
              const pageLabels = labelsByPeriod[t.id] ?? [];
              return (
                <View key={t.id} style={{ width: pagerWidth }}>
                  {pageLabels.length === 0 && emptyMessage ? (
                    <Text
                      style={{ color: '#8F9098', textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                      {emptyMessage}
                    </Text>
                  ) : (
                    <SlotGrid labels={pageLabels} selectedLabel={selectedLabel} onSelect={onSelect} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={{ minHeight: 1 }} />
        )}
      </View>
    </>
  );

  if (embedded) {
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 0 }}>
        {inner}
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: SCHEDULE_PARTNER.radius,
        backgroundColor: SCHEDULE_PARTNER.surface,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        overflow: 'hidden',
      }}>
      {inner}
    </View>
  );
}
