import { Ionicons } from '@expo/vector-icons';
import { Accordion } from 'heroui-native';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';

const BRAND = '#2970FF';
const BRAND_SOFT = 'rgba(41, 112, 255, 0.1)';
const TRACK = '#E8E9F1';
const FILL = '#006FFD';
const DOT_PENDING = '#ABB7C2';
const TEXT_TITLE = '#1F2024';
const TEXT_PRIMARY = '#181D27';
const TEXT_MUTED = '#717680';
const ROW_H = 72;
const DOT = 24;
/** Outer ring pulse: min opacity & half-cycle length (reverse mirrors for one full breath). */
const CURRENT_RING_OPACITY_MIN = 0.42;
const CURRENT_RING_PULSE_MS = 1300;
const GUTTER_W = 24;
const LINE_LEFT = (GUTTER_W - 2) / 2;
const ICON_COLOR = '#1F2024';
const SEPARATOR_STROKE = '#D4D6DD';

/** Dashed rule with long gaps and shorter dashes (fewer segments than CSS `border-dashed`). */
function WideGapDashedSeparator({ className }: { className?: string }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(Math.round(w));
  };
  return (
    <View className={className} style={{ height: 2 }} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={2}>
          <Line
            x1={0}
            y1={1}
            x2={width}
            y2={1}
            stroke={SEPARATOR_STROKE}
            strokeWidth={1}
            strokeDasharray="18 16 "
          />
        </Svg>
      ) : null}
    </View>
  );
}

export type DisciplineCaseStep = {
  label: string;
  /** Omit for steps like “Case Closed” with no scheduled date */
  date?: string;
};

export type DisciplineCaseProgressCardProps = {
  title: string;
  description: string;
  /** 0–100; drives the blue fill width */
  progressPercent: number;
  /** e.g. “2 of 5 Completed” */
  completedSummary: string;
  /** Large percent label next to summary, e.g. “25%” */
  percentLabel: string;
  /**
   * Index of the in-progress step (0-based).
   * Steps with a lower index are completed; higher indices are pending.
   */
  currentStepIndex: number;
  steps: DisciplineCaseStep[];
  /** Uncontrolled default; ignored when `accordionControlled` is true */
  defaultExpanded?: boolean;
  /** When true, use `accordionValue` / `onAccordionValueChange` (closed = `undefined`, open = `'case'`) */
  accordionControlled?: boolean;
  accordionValue?: string | undefined;
  onAccordionValueChange?: (value: string | undefined) => void;
};

function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** Blink on the in-progress step’s outer soft ring only; inner blue core stays solid. */
function CurrentStepDot() {
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withTiming(CURRENT_RING_OPACITY_MIN, {
        duration: CURRENT_RING_PULSE_MS,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [blink]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: blink.value,
  }));

  return (
    <View className="items-center justify-center" style={{ width: DOT, height: DOT }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            backgroundColor: BRAND_SOFT,
          },
          ringStyle,
        ]}
      />
      <View className="rounded-[5px]" style={{ width: 10, height: 10, backgroundColor: BRAND }} />
    </View>
  );
}

function StepDot({
  state,
}: {
  state: 'completed' | 'current' | 'pending';
}) {
  if (state === 'completed') {
    return (
      <View
        className="items-center justify-center rounded-full"
        style={{ width: DOT, height: DOT, backgroundColor: BRAND }}>
        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
      </View>
    );
  }
  if (state === 'current') {
    return <CurrentStepDot />;
  }
  return (
    <View className="items-center justify-center" style={{ width: DOT, height: DOT }}>
      <View className="rounded-full" style={{ width: 10, height: 10, backgroundColor: DOT_PENDING }} />
    </View>
  );
}

function CaseTimeline({
  steps,
  currentStepIndex,
}: {
  steps: DisciplineCaseStep[];
  currentStepIndex: number;
}) {
  return (
    <View className="w-full">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const state: 'completed' | 'current' | 'pending' =
          i < currentStepIndex ? 'completed' : i === currentStepIndex ? 'current' : 'pending';
        const titleColor = state === 'pending' ? TEXT_MUTED : TEXT_PRIMARY;
        const segmentColor = i < currentStepIndex ? BRAND : '#CFD6DC';

        return (
          <View key={`${step.label}-${i}`} className="min-h-[72px] flex-row gap-6">
            <View className="relative items-center" style={{ width: GUTTER_W }}>
              {!isLast && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: LINE_LEFT,
                    top: ROW_H / 2 + DOT / 2,
                    width: 2,
                    height: ROW_H - DOT,
                    backgroundColor: segmentColor,
                  }}
                />
              )}
              <View className="flex-1 justify-center">
                <StepDot state={state} />
              </View>
            </View>
            <View className="min-w-0 flex-1 justify-center py-4 pr-0">
              <Text
                className="text-[14px] font-medium leading-5"
                style={{ color: titleColor }}>
                {step.label}
              </Text>
              {step.date ? (
                <Text className="mt-0.5 text-[12px] leading-5" style={{ color: TEXT_MUTED }}>
                  {step.date}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Expandable case card: summary, overall progress, and vertical status timeline (Figma node 736:3318).
 */
export function DisciplineCaseProgressCard({
  title,
  description,
  progressPercent,
  completedSummary,
  percentLabel,
  currentStepIndex,
  steps,
  defaultExpanded = true,
  accordionControlled = false,
  accordionValue,
  onAccordionValueChange,
}: DisciplineCaseProgressCardProps) {
  const p = clampPercent(progressPercent);

  return (
    <Accordion
      hideSeparator
      variant="surface"
      className="overflow-hidden rounded-[12px] border border-[#EEF0F6] bg-[#F8F9FE] px-4 py-5 shadow-none"
      {...(accordionControlled
        ? { value: accordionValue, onValueChange: onAccordionValueChange }
        : { defaultValue: defaultExpanded ? 'case' : undefined, onValueChange: onAccordionValueChange })}
      isCollapsible>
      <Accordion.Item value="case">
        {({ isExpanded }) => (
          <>
            <Accordion.Trigger className="items-start bg-transparent px-0 py-0">
              <View className="w-full flex-row items-start justify-between">
                <View className="min-w-0 flex-1 flex-col gap-2 pr-3">
                  <Text
                    className="text-[20px] font-bold leading-[22px] tracking-[0.09px]"
                    style={{ color: TEXT_TITLE }}>
                    {title}
                  </Text>
                  <Text
                    className="text-sm leading-5"
                    style={{ color: TEXT_PRIMARY }}>
                    {description}
                  </Text>
                </View>
                <View className="h-7 w-7 shrink-0 items-center justify-center self-start pt-0.5">
                  <Accordion.Indicator isAnimatedStyleActive={false}>
                    {isExpanded ? (
                      <IconsaxArrowUpIcon size={24} color={ICON_COLOR} />
                    ) : (
                      <IconsaxArrowDownIcon size={24} color={ICON_COLOR} />
                    )}
                  </Accordion.Indicator>
                </View>
              </View>
            </Accordion.Trigger>
            <Accordion.Content className="bg-transparent px-0 pb-0 pt-5">
              <WideGapDashedSeparator className="mb-4 w-full" />
              <View className="mb-5 w-full flex-col gap-1.5">
                <View className="flex-row items-baseline justify-between gap-2">
                  <Text
                    className="text-[12px] leading-4 tracking-[0.12px]"
                    style={{ color: TEXT_PRIMARY }}>
                    Overall Progress
                  </Text>
                  <View className="max-w-[58%] flex-row flex-wrap items-baseline justify-end gap-1.5">
                    <Text
                      className="text-right text-[12px] leading-4 tracking-[0.12px]"
                      style={{ color: TEXT_MUTED }}>
                      {completedSummary}
                    </Text>
                    <Text
                      className="text-[14px] font-medium leading-5 font-semibold"
                      style={{ color: TEXT_PRIMARY }}>
                      {percentLabel}
                    </Text>
                  </View>
                </View>
                <View
                  className="h-3 w-full overflow-hidden rounded-[4px]"
                  style={{ backgroundColor: TRACK }}>
                  <View
                    className="h-full rounded-[4px]"
                    style={{ width: `${p}%`, backgroundColor: FILL }}
                  />
                </View>
              </View>
              <View className="pl-2">
                <CaseTimeline steps={steps} currentStepIndex={currentStepIndex} />
              </View>
            </Accordion.Content>
          </>
        )}
      </Accordion.Item>
    </Accordion>
  );
}
