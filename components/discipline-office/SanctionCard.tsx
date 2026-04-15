import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from 'heroui-native';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';

import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';

const BRAND = SCHEDULE_PARTNER.brand;
const TRACK = SCHEDULE_PARTNER.segmentTrackBg;
const FILL = BRAND;
const SUBMITTED_CHECK = '#079455';

export type SanctionProgress = {
  current: number;
  total: number;
  unit: string;
};

export type SanctionStatus = 'in_progress' | 'pending' | 'in_review';

export type SanctionCardProps = {
  status: SanctionStatus;
  title: string;
  description: string;
  caseTypeLabel?: string;
  dueDateLabel: string;
  progress?: SanctionProgress;
  reviewDaysMin?: number;
  reviewDaysMax?: number;
  reviewStatusLabel?: string;
  defaultExpanded?: boolean;
  onUploadProof?: () => void;
  /** `nested` — soft tile on a tinted list panel. `default` — outlined card. */
  variant?: 'default' | 'nested';
};

function clampPercent(current: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
}

function formatDaysUntilReview(minDays: number, maxDays: number): string {
  const lo = Math.min(minDays, maxDays);
  const hi = Math.max(minDays, maxDays);
  if (lo === hi) {
    if (lo <= 0) return 'Review expected today';
    if (lo === 1) return 'About 1 day until review';
    return `About ${lo} days until review`;
  }
  return `About ${lo}–${hi} days until review`;
}

function statusAsLabel(status: SanctionStatus): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'in_review') return 'In review';
  return 'Pending';
}

/** Text-only status line — distinct hue per state (no pill). */
function statusLabelColor(status: SanctionStatus): string {
  if (status === 'in_progress') return BRAND;
  if (status === 'in_review') return '#027A48';
  return '#B45309';
}

function MetaPanel({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
      {children}
    </View>
  );
}

/**
 * Sanction item: title-led layout; status is plain text (no top pills).
 */
export function SanctionCard({
  status,
  title,
  description,
  caseTypeLabel,
  dueDateLabel,
  progress,
  reviewDaysMin,
  reviewDaysMax,
  reviewStatusLabel,
  defaultExpanded = false,
  onUploadProof,
  variant = 'default',
}: SanctionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const pct = progress ? clampPercent(progress.current, progress.total) : 0;
  const progressLabel = progress ? `${progress.current} / ${progress.total} ${progress.unit}` : '';
  const nested = variant === 'nested';

  return (
    <View
      style={
        nested
          ? {
              width: '100%',
              borderRadius: 14,
              borderWidth: 0,
              backgroundColor: SCHEDULE_PARTNER.surface,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 16,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }
          : {
              width: '100%',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: SCHEDULE_PARTNER.cardBorder,
              backgroundColor: SCHEDULE_PARTNER.surface,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 16,
            }
      }>
      <View className="w-full flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
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
              marginTop: 4,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.2,
              color: statusLabelColor(status),
            }}>
            {statusAsLabel(status)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          hitSlop={8}
          onPress={() => setExpanded((e) => !e)}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            backgroundColor: SCHEDULE_PARTNER.segmentTrackBg,
          }}
          className="active:opacity-75">
          {expanded ? (
            <IconsaxArrowUpIcon size={18} color={SCHEDULE_PARTNER.textMuted} />
          ) : (
            <IconsaxArrowDownIcon size={18} color={SCHEDULE_PARTNER.textMuted} />
          )}
        </Pressable>
      </View>

      <Text
        numberOfLines={expanded ? undefined : 2}
        style={{
          marginTop: 10,
          fontSize: 14,
          lineHeight: 20,
          color: SCHEDULE_PARTNER.textMuted,
        }}>
        {description}
      </Text>

      <View className="mt-3 flex-row items-center gap-1.5">
        {status === 'in_review' ? (
          <Ionicons name="checkmark-circle" size={18} color={SUBMITTED_CHECK} />
        ) : (
          <IconsaxClockIcon size={18} color={SCHEDULE_PARTNER.textMuted} />
        )}
        <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: SCHEDULE_PARTNER.textMuted }}>{dueDateLabel}</Text>
      </View>

      {expanded ? (
        <View style={{ marginTop: 14, gap: 12 }}>
          {caseTypeLabel ? (
            <Text style={{ fontSize: 12, lineHeight: 17, color: SCHEDULE_PARTNER.textDisabled }}>
              Case type · {caseTypeLabel}
            </Text>
          ) : null}

          {status === 'in_review' && reviewDaysMin != null && reviewDaysMax != null ? (
            <MetaPanel>
              <View className="flex-row items-start gap-2">
                <View className="pt-0.5">
                  <IconsaxClockIcon size={18} color={SCHEDULE_PARTNER.textMuted} />
                </View>
                <View className="min-w-0 flex-1" style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: SCHEDULE_PARTNER.textPrimary }}>
                    {formatDaysUntilReview(reviewDaysMin, reviewDaysMax)}
                  </Text>
                  {reviewStatusLabel ? (
                    <Text style={{ fontSize: 12, lineHeight: 17, color: SCHEDULE_PARTNER.textMuted }}>
                      {reviewStatusLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            </MetaPanel>
          ) : null}

          {progress ? (
            <MetaPanel>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: SCHEDULE_PARTNER.textMuted }}>Progress</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: SCHEDULE_PARTNER.textPrimary }}>{progressLabel}</Text>
              </View>
              <View style={{ marginTop: 8, height: 6, borderRadius: 999, overflow: 'hidden', backgroundColor: TRACK }}>
                <View style={{ height: '100%', width: `${pct}%`, borderRadius: 999, backgroundColor: FILL }} />
              </View>
            </MetaPanel>
          ) : null}

          {status !== 'in_review' && onUploadProof ? (
            <Button
              variant="primary"
              size="md"
              className="mt-3 h-11 w-full flex-row items-center justify-center gap-2 rounded-full border border-[#001229]/10 bg-[#2970FF]"
              onPress={() => onUploadProof()}
              accessibilityLabel="Upload proof of compliance">
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Button.Label className="text-sm font-semibold text-white">Upload proof</Button.Label>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
