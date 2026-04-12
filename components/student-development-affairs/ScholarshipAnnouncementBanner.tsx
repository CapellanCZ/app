import { Text, View } from 'react-native';

import { IconsaxMegaphoneIcon } from '@/components/icons/IconsaxMegaphoneIcon';

const VARIANT_STYLES = {
  /** Figma 1265:4436 — warning surface + amber accent. */
  warning: {
    background: '#FFFCF5',
    border: '#FDB022',
    icon: '#FDB022',
  },
  /** Same layout; primary blue accent + cool tint. */
  info: {
    background: '#F0F7FF',
    border: '#2970FF',
    icon: '#2970FF',
  },
} as const;

export type ScholarshipAnnouncementBannerVariant = keyof typeof VARIANT_STYLES;

export type ScholarshipAnnouncementBannerProps = {
  variant?: ScholarshipAnnouncementBannerVariant;
  title?: string;
  message: string;
  className?: string;
};

/**
 * Announcement callout under the scholarships search (Figma node 1265:4436).
 */
export function ScholarshipAnnouncementBanner({
  variant = 'warning',
  title = 'Announcement',
  message,
  className,
}: ScholarshipAnnouncementBannerProps) {
  const t = VARIANT_STYLES[variant];

  return (
    <View
      className={`overflow-hidden rounded-xl pl-[13px] pr-4 py-4 ${className ?? ''}`}
      style={{
        backgroundColor: t.background,
        borderLeftWidth: 3,
        borderLeftColor: t.border,
      }}>
      <View className="flex-row gap-4">
        <View className="pt-1 ml-1">
          <IconsaxMegaphoneIcon size={24} color={t.icon} />
        </View>
        <View className="min-w-0 flex-1 gap-2">
          <Text className="text-lg font-semibold leading-6 text-[#1F2024]">{title}</Text>
          <Text className="text-sm leading-6 text-[#535862]">{message}</Text>
        </View>
      </View>
    </View>
  );
}
