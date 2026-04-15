import { View } from 'react-native';
import { Button } from 'heroui-native';

import { ScholarshipCardHeader } from './ScholarshipCardHeader';
import { ScholarshipInfoTagRow } from './ScholarshipInfoTagRow';

export type ScholarshipCardProps = {
  title: string;
  categoryLabel: string;
  discountLabel: string;
  scheduleLabel: string;
  onApplyPress?: () => void;
};

/** Full-width card; primary CTA matches `h-12` / `rounded-full` used on incident report & auth. */
export function ScholarshipCard({
  title,
  categoryLabel,
  discountLabel,
  scheduleLabel,
  onApplyPress,
}: ScholarshipCardProps) {
  return (
    <View className="w-full rounded-2xl border-2 border-white bg-[#F5F8FF] px-4 py-4">
      <View className="gap-3">
        <View>
          <ScholarshipCardHeader title={title} categoryLabel={categoryLabel} />
          <ScholarshipInfoTagRow discountLabel={discountLabel} scheduleLabel={scheduleLabel} />
        </View>
        <Button
          variant="primary"
          className="h-12 w-full rounded-full border border-[#001229]/10 bg-[#2970FF]"
          onPress={() => onApplyPress?.()}>
          <Button.Label className="text-sm font-semibold text-white">Apply Now</Button.Label>
        </Button>
      </View>
    </View>
  );
}
