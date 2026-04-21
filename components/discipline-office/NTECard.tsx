import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import { SCHEDULE_PARTNER } from '@/lib/health-service/bookingScheduleTheme';

const T = SCHEDULE_PARTNER;

export type NTEStatus = 'pending_response' | 'responded' | 'waived' | 'escalated';

export type NTECardProps = {
  id: string;
  caseType: string;
  description: string;
  issuedAtLabel: string;
  deadlineLabel?: string;
  status: NTEStatus;
  isOverdue?: boolean;
  onRespond?: () => void;
  /** `nested` — soft tile on tinted list panel. `default` — outlined card. */
  variant?: 'default' | 'nested';
};

function nteStatusLabel(status: NTEStatus): string {
  if (status === 'responded') return 'Responded';
  if (status === 'waived') return 'No Response (Waived)';
  if (status === 'escalated') return 'Escalated to Case';
  return 'Pending Response';
}

function nteStatusColor(status: NTEStatus, isOverdue?: boolean): string {
  if (status === 'responded') return '#027A48';
  if (status === 'waived') return '#B45309';
  if (status === 'escalated') return '#DC2626';
  if (isOverdue) return '#DC2626';
  return '#EAB308';
}

export function NTECard({
  id,
  caseType,
  description,
  issuedAtLabel,
  deadlineLabel,
  status,
  isOverdue,
  onRespond,
  variant = 'default',
}: NTECardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = nteStatusColor(status, isOverdue);
  const isPending = status === 'pending_response';

  return (
    <View
      style={{
        borderRadius: variant === 'nested' ? 12 : 16,
        borderWidth: variant === 'nested' ? 0 : 1,
        borderColor: T.cardBorder,
        backgroundColor: variant === 'nested' ? T.segmentTrackBg : T.surface,
        overflow: 'hidden',
      }}>
      {/* Header row */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 14,
          gap: 10,
        }}
        className="active:opacity-80">
        <View style={{ flex: 1, gap: 4 }}>
          {/* NTE label + reference */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: '#FEF3C7',
              }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E', letterSpacing: 0.3 }}>
                NTE
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '500', color: T.textMuted }}>
              {id}
            </Text>
          </View>

          {/* Case type */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: T.textPrimary,
              letterSpacing: -0.1,
            }}
            numberOfLines={expanded ? undefined : 1}>
            {caseType}
          </Text>

          {/* Status tag */}
          <View
            style={{
              marginTop: 2,
              alignSelf: 'flex-start',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: `${statusColor}15`,
            }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>
              {nteStatusLabel(status)}
            </Text>
          </View>
        </View>

        {/* Expand toggle */}
        <View style={{ marginTop: 2 }}>
          {expanded
            ? <IconsaxArrowUpIcon size={18} color={T.textMuted} />
            : <IconsaxArrowDownIcon size={18} color={T.textMuted} />}
        </View>
      </Pressable>

      {/* Expanded body */}
      {expanded && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 14,
            gap: 10,
            borderTopWidth: 1,
            borderTopColor: T.divider,
          }}>
          {/* Description */}
          <Text style={{ fontSize: 13, lineHeight: 20, color: T.textMuted, marginTop: 10 }}>
            {description}
          </Text>

          {/* Meta: issued + deadline */}
          <View
            style={{
              borderRadius: 10,
              backgroundColor: T.segmentTrackBg,
              paddingHorizontal: 12,
              paddingVertical: 10,
              gap: 6,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: T.textMuted, fontWeight: '500' }}>Issued</Text>
              <Text style={{ fontSize: 12, color: T.textPrimary, fontWeight: '600' }}>{issuedAtLabel}</Text>
            </View>
            {deadlineLabel && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: T.textMuted, fontWeight: '500' }}>Deadline</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isOverdue ? '#DC2626' : T.textPrimary,
                  }}>
                  {deadlineLabel}{isOverdue ? ' · Overdue' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* CTA — only for pending */}
          {isPending && onRespond && (
            <Pressable
              onPress={onRespond}
              style={{
                marginTop: 2,
                height: 44,
                borderRadius: 999,
                backgroundColor: T.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="active:opacity-80">
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                Submit Response
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
