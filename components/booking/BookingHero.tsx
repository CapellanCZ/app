import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookingSectionCard } from '@/components/booking/BookingSectionCard';
import { CircleBackButton } from '@/components/ui/CircleBackButton';
import { Inter } from '@/lib/typography/inter';

const AVATAR = 52;

type HeroProps = {
  onBack: () => void;
};

/**
 * Sticky booking chrome — back + title only (provider card scrolls with content).
 */
export function BookingHero({ onBack }: HeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <CircleBackButton onPress={onBack} />

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.headline}>
          Book appointment
        </Text>
        <Text style={styles.subhead}>
          Pick a date and time that works for your visit
        </Text>
      </View>
    </View>
  );
}

type ProviderCardProps = {
  doctorName: string;
  specialty: string;
  photoUrl?: string | null;
};

/** Provider identity card — lives in the scroll stack with other sections. */
export function BookingProviderCard({ doctorName, specialty, photoUrl }: ProviderCardProps) {
  const initial = doctorName.trim().charAt(0).toUpperCase() || '?';

  return (
    <BookingSectionCard>
      <View style={styles.providerRow}>
        <View style={styles.avatar}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              accessibilityLabel={doctorName}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>

        <View style={styles.textCol}>
          <Text style={styles.name} numberOfLines={2}>
            {doctorName}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialty}
          </Text>
        </View>
      </View>
    </BookingSectionCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 14,
  },
  copy: {
    gap: 4,
  },
  headline: {
    fontFamily: Inter.medium,
    fontSize: 28,
    color: '#222222',
    letterSpacing: -2.24,
    lineHeight: 34,
  },
  subhead: {
    fontFamily: Inter.regular,
    fontSize: 16,
    color: '#727272',
    letterSpacing: -0.64,
    lineHeight: 20,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    backgroundColor: '#D3E9FA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(4, 138, 243, 0.22)',
  },
  avatarImage: {
    width: AVATAR,
    height: AVATAR,
  },
  avatarInitial: {
    fontFamily: Inter.medium,
    fontSize: 20,
    color: '#048AF3',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: Inter.medium,
    fontSize: 20,
    color: '#222222',
    letterSpacing: -1.6,
    lineHeight: 26,
  },
  specialty: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#727272',
    letterSpacing: -0.56,
    lineHeight: 18,
  },
});
