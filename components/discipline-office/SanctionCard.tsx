import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import { IconsaxDangerIcon } from '@/components/icons/IconsaxDangerIcon';
import { IconsaxImportCircleIcon } from '@/components/icons/IconsaxImportCircleIcon';
import { IconsaxMultiloadIcon } from '@/components/icons/IconsaxMultiloadIcon';

import { SanctionInReviewBadge } from './SanctionInReviewBadge';

const TEXT_TITLE = '#1F2024';
const TEXT_BODY = '#1F2024';
const TEXT_DESC = '#1F2024';
const TEXT_MUTED = '#717680';
/** Figma link / “Upload Proof” (text button, not filled). */
const LINK = '#004EEB';
const TRACK = '#E8E9F1';
const FILL = '#006FFD';
/** Subtle rule under progress / above footer */
const DIVIDER = 'rgba(212, 214, 221, 0.45)';

const BADGE_IN_PROGRESS_BG = '#D1E0FF';
const BADGE_IN_PROGRESS_TEXT = '#00359E';
const BADGE_PENDING_BG = '#FEF0C7';
const BADGE_PENDING_TEXT = '#DC6803';
/** Matches in-review badge accent — “proof submitted” check in footer */
const SUBMITTED_CHECK = '#079455';

export type SanctionProgress = {
  current: number;
  total: number;
  /** e.g. `"hours"` → label `8 / 24 hours` */
  unit: string;
};

export type SanctionStatus = 'in_progress' | 'pending' | 'in_review';

export type SanctionCardProps = {
  status: SanctionStatus;
  title: string;
  description: string;
  dueDateLabel: string;
  /** When set, shows the progress row + bar (Figma “Community Service” card). */
  progress?: SanctionProgress;
  /** When `status === 'in_review'`, typical review window (calendar days). */
  reviewDaysMin?: number;
  reviewDaysMax?: number;
  /** When `status === 'in_review'`, human-readable status (e.g. proof received, under review). */
  reviewStatusLabel?: string;
  defaultExpanded?: boolean;
  onUploadProof?: () => void;
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

function StatusBadge({ status }: { status: SanctionStatus }) {
  if (status === 'in_progress') {
    return (
      <View
        className="flex-row items-center gap-1.5 rounded-full px-2 py-1.5"
        style={{ backgroundColor: BADGE_IN_PROGRESS_BG }}>
        <View className="h-5 w-[18px] items-center justify-center">
          <IconsaxMultiloadIcon width={18} height={20} color={BADGE_IN_PROGRESS_TEXT} />
        </View>
        <Text
          className="text-xs font-semibold leading-5"
          style={{ color: BADGE_IN_PROGRESS_TEXT }}>
          In progress
        </Text>
      </View>
    );
  }
  if (status === 'in_review') {
    return <SanctionInReviewBadge />;
  }
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2 py-1.5"
      style={{ backgroundColor: BADGE_PENDING_BG }}>
      <IconsaxDangerIcon size={18} color={BADGE_PENDING_TEXT} />
      <Text className="text-xs font-semibold leading-5" style={{ color: BADGE_PENDING_TEXT }}>
        Pending
      </Text>
    </View>
  );
}

/**
 * Expandable sanction card (Figma node 703:33550 — My Sanctions list).
 */
export function SanctionCard({
  status,
  title,
  description,
  dueDateLabel,
  progress,
  reviewDaysMin,
  reviewDaysMax,
  reviewStatusLabel,
  defaultExpanded = true,
  onUploadProof,
}: SanctionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const pct = progress ? clampPercent(progress.current, progress.total) : 0;
  const progressLabel = progress
    ? `${progress.current} / ${progress.total} ${progress.unit}`
    : '';

  return (
    <View className="w-full gap-3">
      <View className="w-full flex-row items-center justify-between">
        <StatusBadge status={status} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse sanction' : 'Expand sanction'}
          hitSlop={8}
          onPress={() => setExpanded((e) => !e)}
          className="h-8 w-8 items-center justify-center">
          {expanded ? (
            <IconsaxArrowUpIcon size={20} color={TEXT_TITLE} />
          ) : (
            <IconsaxArrowDownIcon size={20} color={TEXT_TITLE} />
          )}
        </Pressable>
      </View>

      {expanded ? (
        <View className="w-full flex-col gap-3 rounded-xl bg-white px-4 py-5">
          <View className="flex-col gap-1.5">
            <Text
              className="text-[18px] font-bold leading-normal tracking-[0.09px]"
              style={{ color: TEXT_BODY }}>
              {title}
            </Text>
            <Text
              className="text-sm leading-4 tracking-[0.12px]"
              style={{ color: TEXT_DESC }}>
              {description}
            </Text>
          </View>

          {status === 'in_review' &&
          reviewDaysMin != null &&
          reviewDaysMax != null ? (
            <View
              className="w-full flex-col gap-2 rounded-lg p-3"
              style={{ backgroundColor: '#FAFAFA' }}>
              <View className="flex-row items-start gap-2">
                <View className="pt-0.5">
                  <IconsaxClockIcon size={18} color={TEXT_MUTED} />
                </View>
                <View className="min-w-0 flex-1 flex-col gap-1">
                  <Text
                    className="text-xs font-semibold leading-4 tracking-[0.12px]"
                    style={{ color: TEXT_BODY }}>
                    {formatDaysUntilReview(reviewDaysMin, reviewDaysMax)}
                  </Text>
                  {reviewStatusLabel ? (
                    <Text
                      className="text-xs leading-4 tracking-[0.12px]"
                      style={{ color: TEXT_MUTED }}>
                      {reviewStatusLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {progress ? (
            <View
              className="w-full flex-col gap-1 rounded-lg p-2"
              style={{ backgroundColor: '#FAFAFA' }}>
              <View className="w-full flex-row items-end justify-between gap-4">
                <Text
                  className="flex-1 text-[10px] leading-[14px] tracking-[0.15px]"
                  style={{ color: '#535862' }}>
                  Progress
                </Text>
                <Text
                  className="min-w-[72px] text-right text-[10px] font-semibold leading-none"
                  style={{ color: '#535862' }}>
                  {progressLabel}
                </Text>
              </View>
              <View className="h-2 w-full overflow-hidden rounded" style={{ backgroundColor: TRACK }}>
                <View
                  className="h-full rounded-[4px]"
                  style={{ width: `${pct}%`, backgroundColor: FILL }}
                />
              </View>
            </View>
          ) : null}

          <View className="h-px w-full" style={{ backgroundColor: DIVIDER }} />

          <View className="w-full flex-row items-center justify-between">
            {status === 'in_review' ? (
              <View className="min-w-0 flex-1 flex-row items-center gap-1.5 pr-2">
                <Ionicons name="checkmark-circle" size={20} color={SUBMITTED_CHECK} />
                <Text
                  className="min-w-0 flex-1 text-xs leading-4 tracking-[0.12px]"
                  style={{ color: TEXT_MUTED }}>
                  {dueDateLabel}
                </Text>
              </View>
            ) : (
              <View className="min-w-0 flex-1 flex-row items-center gap-1 pr-2">
                <IconsaxClockIcon size={20} color={TEXT_MUTED} />
                <Text
                  className="flex-1 text-xs leading-4 tracking-[0.12px]"
                  style={{ color: TEXT_MUTED }}>
                  {dueDateLabel}
                </Text>
              </View>
            )}
            {status !== 'in_review' && onUploadProof ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Upload proof"
                hitSlop={10}
                onPress={() => onUploadProof()}
                className="-mr-1 flex-row items-center gap-1 py-1 active:opacity-70">
                <IconsaxImportCircleIcon size={20} color={LINK} />
                <Text
                  className="text-xs font-normal leading-4 tracking-[0.12px]"
                  style={{ color: LINK }}>
                  Upload Proof
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
