import type { TextStyle } from 'react-native';

import { Inter } from './inter';

/**
 * Shared Inter scale for health-service patient screens (settings, vitals, consultation summary).
 * Letter-spacing matches help-center, notification-settings, and PersonalInfoField.
 */
export const healthUiText = {
  pageTitle: {
    fontFamily: Inter.medium,
    fontSize: 30,
    color: '#222222',
    letterSpacing: -2.24,
    lineHeight: 38,
  },
  pageSubtitle: {
    fontFamily: Inter.regular,
    fontSize: 18,
    color: '#727272',
    letterSpacing: -0.64,
    lineHeight: 22,
  },
  modalTitle: {
    fontFamily: Inter.medium,
    fontSize: 28,
    color: '#222222',
    letterSpacing: -2.24,
    lineHeight: 36,
  },
  modalSubtitle: {
    fontFamily: Inter.regular,
    fontSize: 18,
    color: '#727272',
    letterSpacing: -0.64,
    lineHeight: 22,
  },
  sectionEyebrow: {
    fontFamily: Inter.medium,
    fontSize: 14,
    color: '#727272',
    letterSpacing: -0.15,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    fontFamily: Inter.regular,
    fontSize: 14,
    color: '#727272',
    letterSpacing: -0.15,
    lineHeight: 20,
  },
  fieldLabel: {
    fontFamily: Inter.medium,
    fontSize: 13,
    color: '#727272',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  fieldValue: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#222222',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  fieldValueMuted: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#9E9E9E',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  detailLabel: {
    fontFamily: Inter.regular,
    fontSize: 16,
    color: '#6C6C6C',
    letterSpacing: -1.12,
    lineHeight: 22,
  },
  detailValue: {
    fontFamily: Inter.regular,
    fontSize: 16,
    color: '#222222',
    letterSpacing: -1.12,
    lineHeight: 22,
  },
  cardTitle: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#222222',
    letterSpacing: -0.64,
    lineHeight: 22,
  },
  secondaryButton: {
    fontFamily: Inter.medium,
    fontSize: 17,
    color: '#222222',
    letterSpacing: -1.2,
    lineHeight: 18,
  },
  primaryButton: {
    fontFamily: Inter.medium,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight: 18,
  },
  link: {
    fontFamily: Inter.medium,
    fontSize: 15,
    color: '#2970FF',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  badge: {
    fontFamily: Inter.medium,
    fontSize: 13,
    color: '#4D7A9A',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
} as const satisfies Record<string, TextStyle>;
