import { Platform, type ViewStyle } from 'react-native';

/**
 * Global shared design tokens used across features.
 * Promotes consistency and prevents cross-feature import leaks.
 *
 * Primary brand: NU Dasmariñas–aligned CampusCare blue `#004EEB`.
 */
export const BRAND = {
  /** Primary application blue — CTAs, tabs, accents */
  primary: '#004EEB',
  /**
   * Large solid card fills (e.g. Upcoming Appointment).
   * Same hue as primary, slightly lighter so big fields are easier on the eyes.
   */
  primaryCard: '#2B6AEF',
  /** Deeper edge / border for primaryCard surfaces */
  primaryCardDeep: '#1A55D9',
  /** Slightly deeper stop for gradients */
  primaryDeep: '#0039C7',
  /** Soft fill behind selected chips / icon wells */
  soft: '#E8F0FF',
  /** Soft border for brand-tinted surfaces */
  softBorder: '#C5D7FF',
  /** Light supporting surface (cards, docks) */
  softSurface: '#EEF4FF',
  /** Translucent tint for slots / highlights */
  tint: 'rgba(0, 78, 235, 0.08)',
  /** Focus ring / ripple-friendly wash */
  ring: 'rgba(0, 78, 235, 0.18)',
} as const;

/** Soft card elevation — matches home announcement / quick-action cards. */
export const CARD_ELEVATION: ViewStyle =
  Platform.OS === 'android'
    ? {
        elevation: 0,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      };

export const SCHEDULE_PARTNER = {
  radius: 20,
  cardBorder: 'rgba(15, 23, 42, 0.08)',
  surface: '#FFFFFF',
  divider: '#EEF2F6',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',
  borderCell: '#E8EEF4',
  /** Neutral track for week arrows / period tabs — no blue outline */
  segmentTrackBg: '#F8FAFC',
  segmentTrackBorder: '#E8EEF4',
  brand: BRAND.primary,
  slotTint: BRAND.tint,
} as const;
