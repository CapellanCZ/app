import type { ImageSourcePropType } from 'react-native';

export type GetStartedSlideLayout = {
  /** Width / height of the image box. */
  aspect?: number;
  /** 0–1 of available width. */
  widthRatio?: number;
  /** Photos sit bottom; phone mockups center. */
  align?: 'bottom' | 'center';
};

export type GetStartedHeadlinePart = {
  text: string;
  /** Brand-blue span. */
  accent?: boolean;
};

export type GetStartedPreviewKind = 'home' | 'book';

export type GetStartedSlide = {
  id: string;
  imageLabel: string;
  headline: GetStartedHeadlinePart[];
  subtitle: string;
  layout?: GetStartedSlideLayout;
  /** Static photo (slide 1). */
  image?: ImageSourcePropType;
  /** Live HD phone mock of Home / Book with mock data (slides 2–3). */
  preview?: GetStartedPreviewKind;
};

/**
 * Three onboarding slides — shared composed chrome so logo / copy / CTA / legal
 * stay vertically aligned across every page.
 */
export const GET_STARTED_SLIDES: GetStartedSlide[] = [
  {
    id: 'connection',
    image: require('../../assets/student-model.optimized.png'),
    imageLabel: 'CampusCare students',
    headline: [
      { text: 'Your Direct Connection to the ' },
      { text: 'Health Services Office', accent: true },
    ],
    subtitle:
      'Seamlessly access dental and medical consultations, complete your health profiling, and secure medical certifications for sports, off-campus activities, and internships all in one platform.',
    layout: {
      aspect: 0.85,
      widthRatio: 0.92,
      align: 'bottom',
    },
  },
  {
    id: 'wellness',
    preview: 'home',
    imageLabel: 'CampusCare home dashboard',
    headline: [
      { text: 'Track Your\n' },
      { text: 'Wellness at a Glance', accent: true },
    ],
    subtitle:
      'Monitor your upcoming clinic appointments, check real-time vital signs, and stay updated on campus announcements instantly.',
    layout: {
      /** Near full-bleed phone — sized by band fill in GetStartedHero. */
      widthRatio: 0.94,
      align: 'center',
    },
  },
  {
    id: 'scheduling',
    preview: 'book',
    imageLabel: 'CampusCare book appointment',
    headline: [
      { text: 'Hassle-Free', accent: true },
      { text: '\nClinic Scheduling' },
    ],
    subtitle:
      'Book consultations with school physicians and specialists in just a few taps, anytime and anywhere on campus.',
    layout: {
      widthRatio: 0.94,
      align: 'center',
    },
  },
];
