import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CircularProgressRing } from '@/components/CircularProgressRing';

export type UploadedFileListRowProps = {
  fileName: string;
  dateLabel: string;
  timeLabel: string;
  sizeLabel: string;
  /** 0–100 upload progress */
  progress: number;
  onRemove?: () => void;
  className?: string;
};

/**
 * Single uploaded file row: PDF chip, meta, ring progress, remove (Figma 703:33599).
 */
export function UploadedFileListRow({
  fileName,
  dateLabel,
  timeLabel,
  sizeLabel,
  progress,
  onRemove,
  className,
}: UploadedFileListRowProps) {
  return (
    <View
      className={`w-full flex-row items-end rounded-xl bg-white p-3 ${className ?? ''}`}>
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-md bg-[#E53935]">
          <Text className="text-[7px] font-bold text-white">PDF</Text>
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-sm font-semibold text-[#1F2024]" numberOfLines={1}>
            {fileName}
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
            <Text
              className="text-[10px] leading-[14px] tracking-wide text-[#71727A]"
              numberOfLines={1}>
              {dateLabel}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text
                className="text-[10px] leading-[14px] tracking-wide text-[#71727A]"
                numberOfLines={1}>
                {timeLabel}
              </Text>
              <View className="h-1 w-1 rounded-full bg-[#71727A]" />
              <Text className="text-[10px] font-semibold text-[#71727A]" numberOfLines={1}>
                {sizeLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="ml-2 flex-row items-end gap-2">
        <CircularProgressRing percent={progress} size={40} strokeWidth={4} />
        {onRemove ? (
          <Pressable
            accessibilityLabel={`Remove ${fileName}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onRemove}
            className="h-7 w-7 items-center justify-center rounded-lg active:opacity-70">
            <Ionicons name="close" size={22} color="#71727A" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
