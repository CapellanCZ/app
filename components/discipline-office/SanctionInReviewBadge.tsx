import { Text, View } from 'react-native';

import { IconsaxHourglassIcon } from '@/components/icons/IconsaxHourglassIcon';

const BG = '#DCFAE6';
const FG = '#079455';

export type SanctionInReviewBadgeProps = {
  /** Override label if needed */
  label?: string;
};

/**
 * “In review” status pill (Figma node 462:2932) — success tint + hourglass icon.
 */
export function SanctionInReviewBadge({ label = 'In review' }: SanctionInReviewBadgeProps) {
  return (
    <View
      className="flex-row items-center gap-2 rounded-full px-2 py-1.5"
      style={{ backgroundColor: BG }}>
      <IconsaxHourglassIcon size={20} color={FG} />
      <Text className="text-[13px] font-semibold leading-5" style={{ color: FG }}>
        {label}
      </Text>
    </View>
  );
}
