import { Ionicons } from '@expo/vector-icons';
import { Accordion } from 'heroui-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';

const BRAND = SCHEDULE_PARTNER.brand;
const BRAND_SOFT = 'rgba(41, 112, 255, 0.12)';
const TRACK = SCHEDULE_PARTNER.segmentTrackBg;
const FILL = BRAND;
const DOT_PENDING = SCHEDULE_PARTNER.textDisabled;
const ROW_H = 68;
const DOT = 22;
const CURRENT_RING_OPACITY_MIN = 0.45;
const CURRENT_RING_PULSE_MS = 1300;
const GUTTER_W = 22;
const LINE_LEFT = (GUTTER_W - 2) / 2;
const TAG_MINOR_BG = '#ECFDF3';
const TAG_MINOR_TEXT = '#027A48';
const TAG_MAJOR_BG = '#FEF3F2';
const TAG_MAJOR_TEXT = '#B42318';

function HairlineRule() {
  return <View style={{ height: 1, width: '100%', backgroundColor: SCHEDULE_PARTNER.divider }} />;
}

export type DisciplineCaseStep = {
  label: string;
  date?: string;
  note?: string;
};

export type CaseSeverity = 'minor' | 'major';

export type DisciplineCaseProgressCardProps = {
  title: string;
  description: string;
  severity?: CaseSeverity;
  progressPercent: number;
  completedSummary: string;
  percentLabel: string;
  currentStepIndex: number;
  steps: DisciplineCaseStep[];
  defaultExpanded?: boolean;
  accordionControlled?: boolean;
  accordionValue?: string | undefined;
  onAccordionValueChange?: (value: string | undefined) => void;
  /** `nested` — soft tile on a tinted list panel. `default` — outlined card. */
  variant?: 'default' | 'nested';
};

function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

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
      <View className="rounded-full" style={{ width: 9, height: 9, backgroundColor: BRAND }} />
    </View>
  );
}

function StepDot({ state }: { state: 'completed' | 'current' | 'pending' }) {
  if (state === 'completed') {
    return (
      <View
        className="items-center justify-center rounded-full"
        style={{ width: DOT, height: DOT, backgroundColor: BRAND }}>
        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
      </View>
    );
  }
  if (state === 'current') {
    return <CurrentStepDot />;
  }
  return (
    <View className="items-center justify-center" style={{ width: DOT, height: DOT }}>
      <View className="rounded-full" style={{ width: 8, height: 8, backgroundColor: DOT_PENDING }} />
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
        const titleColor = state === 'pending' ? SCHEDULE_PARTNER.textMuted : SCHEDULE_PARTNER.textPrimary;
        const segmentColor = i < currentStepIndex ? BRAND : SCHEDULE_PARTNER.borderCell;

        return (
          <View key={`${step.label}-${i}`} className="min-h-[68px] flex-row gap-4">
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
                    borderRadius: 1,
                  }}
                />
              )}
              <View className="flex-1 justify-center">
                <StepDot state={state} />
              </View>
            </View>
            <View className="min-w-0 flex-1 justify-center py-3 pr-0">
              <Text style={{ fontSize: 14, fontWeight: '600', lineHeight: 20, color: titleColor }}>{step.label}</Text>
              {state === 'current' && step.note ? (
                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    lineHeight: 17,
                    color: SCHEDULE_PARTNER.textMuted,
                    fontStyle: 'italic',
                  }}>
                  {step.note}
                </Text>
              ) : step.date && step.date !== 'Pending' ? (
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    lineHeight: 17,
                    color: SCHEDULE_PARTNER.textMuted,
                  }}>
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

function SeverityTag({ severity }: { severity: CaseSeverity }) {
  const isMinor = severity === 'minor';
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: isMinor ? TAG_MINOR_BG : TAG_MAJOR_BG }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: isMinor ? TAG_MINOR_TEXT : TAG_MAJOR_TEXT }}>
        {isMinor ? 'Minor' : 'Major'}
      </Text>
    </View>
  );
}

export function DisciplineCaseProgressCard({
  title,
  description,
  severity,
  progressPercent,
  completedSummary,
  percentLabel,
  currentStepIndex,
  steps,
  defaultExpanded = true,
  accordionControlled = false,
  accordionValue,
  onAccordionValueChange,
  variant = 'default',
}: DisciplineCaseProgressCardProps) {
  const p = clampPercent(progressPercent);
  const nested = variant === 'nested';

  return (
    <Accordion
      hideSeparator
      variant="surface"
      className={`overflow-hidden rounded-2xl bg-transparent px-0 py-0 ${nested ? 'border-0 shadow-none' : 'border shadow-none'}`}
      style={
        nested
          ? {
              backgroundColor: SCHEDULE_PARTNER.surface,
              borderRadius: 14,
              borderWidth: 0,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }
          : {
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: SCHEDULE_PARTNER.surface,
              borderWidth: 1,
            }
      }
      {...(accordionControlled
        ? { value: accordionValue, onValueChange: onAccordionValueChange }
        : { defaultValue: defaultExpanded ? 'case' : undefined, onValueChange: onAccordionValueChange })}
      isCollapsible>
      <Accordion.Item value="case">
        {({ isExpanded }) => (
          <>
            <Accordion.Trigger
              className={`items-start bg-transparent px-4 pt-4 ${isExpanded ? 'pb-0' : 'pb-4'}`}>
              <View className="w-full flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1 flex-col gap-2">
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      letterSpacing: -0.2,
                      color: SCHEDULE_PARTNER.textPrimary,
                      lineHeight: 22,
                    }}>
                    {title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      lineHeight: 20,
                      color: SCHEDULE_PARTNER.textMuted,
                    }}>
                    {description}
                  </Text>
                  {severity ? <SeverityTag severity={severity} /> : null}
                </View>
                <View className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F8FAFC]">
                  <Accordion.Indicator isAnimatedStyleActive={false}>
                    {isExpanded ? (
                      <IconsaxArrowUpIcon size={20} color={SCHEDULE_PARTNER.textMuted} />
                    ) : (
                      <IconsaxArrowDownIcon size={20} color={SCHEDULE_PARTNER.textMuted} />
                    )}
                  </Accordion.Indicator>
                </View>
              </View>
            </Accordion.Trigger>
            <Accordion.Content className="bg-transparent px-4 pb-4 pt-4">
              <HairlineRule />
              <View style={{ marginTop: 16, marginBottom: 16, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: SCHEDULE_PARTNER.textPrimary }}>
                    Progress
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: SCHEDULE_PARTNER.textMuted }}>{completedSummary}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: SCHEDULE_PARTNER.textPrimary }}>
                      {percentLabel}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    height: 6,
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: 999,
                    backgroundColor: TRACK,
                  }}>
                  <View style={{ height: '100%', width: `${p}%`, borderRadius: 999, backgroundColor: FILL }} />
                </View>
              </View>
              <View style={{ paddingLeft: 4 }}>
                <CaseTimeline steps={steps} currentStepIndex={currentStepIndex} />
              </View>
            </Accordion.Content>
          </>
        )}
      </Accordion.Item>
    </Accordion>
  );
}
