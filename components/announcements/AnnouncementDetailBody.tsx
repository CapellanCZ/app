import { Text } from 'react-native';

import { splitAnnouncementBody } from '@/lib/announcements/announcementDisplay';
import { Inter } from '@/lib/typography/inter';
import { BRAND } from '@/lib/ui/theme';

type Props = {
  body: string;
};

/**
 * Announcement body with brand-blue hashtag spans.
 */
export function AnnouncementDetailBody({ body }: Props) {
  const parts = splitAnnouncementBody(body);
  if (parts.length === 0) return null;

  return (
    <Text
      style={{
        fontFamily: Inter.regular,
        fontSize: 15,
        lineHeight: 24,
        color: '#4B5563',
        letterSpacing: -0.2,
      }}>
      {parts.map((part, i) =>
        part.kind === 'hashtag' ? (
          <Text
            key={`h-${i}`}
            style={{
              fontFamily: Inter.medium,
              color: BRAND.primary,
            }}>
            {part.value}
          </Text>
        ) : (
          <Text key={`t-${i}`}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}
