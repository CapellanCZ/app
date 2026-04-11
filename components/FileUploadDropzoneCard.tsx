import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { OrDividerLabel } from '@/components/OrDividerLabel';

const BRAND = '#2970FF';
const MUTED = '#98A2B3';
const SUBTEXT = '#475367';

export type FileUploadDropzoneCardProps = {
  onPickFiles: () => void;
  hintText?: string;
  className?: string;
};

/**
 * Dashed upload area + OR divider + Browse Files (Figma 703:33599). Mobile: tap opens picker.
 */
export function FileUploadDropzoneCard({
  onPickFiles,
  hintText = 'SVG, PNG, JPG or GIF (max. 800×400px)',
  className,
}: FileUploadDropzoneCardProps) {
  return (
    <View
      className={`w-full overflow-hidden rounded-2xl border-[1.5px] border-dashed border-[#C5C6CC] bg-white px-6 py-7 ${className ?? ''}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose file to upload"
        onPress={onPickFiles}
        className="w-full items-center gap-4 active:opacity-90">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-[#F0F2F5]">
          <Ionicons name="cloud-upload-outline" size={28} color="#98A2B3" />
        </View>
        <View className="w-full items-center gap-0.5">
          <View className="flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-sm font-semibold" style={{ color: BRAND }}>
              Tap to upload
            </Text>
            <Text className="text-sm leading-5" style={{ color: SUBTEXT }}>
              or use below
            </Text>
          </View>
          <Text
            className="mt-1 px-2 text-center text-xs leading-4 tracking-wide"
            style={{ color: MUTED }}>
            {hintText}
          </Text>
        </View>
      </Pressable>

      <View className="mt-4 w-full">
        <OrDividerLabel />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Browse files"
        onPress={onPickFiles}
        className="mt-4 h-10 w-full items-center justify-center rounded-full active:opacity-90"
        style={{
          backgroundColor: BRAND,
          borderWidth: 1,
          borderColor: 'rgba(0, 18, 41, 0.1)',
        }}>
        <Text className="text-sm font-semibold text-white">Browse Files</Text>
      </Pressable>
    </View>
  );
}
