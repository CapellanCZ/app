import type { ImageSourcePropType } from 'react-native';

export type GetStartedSlideLayout = {
  /** Width / height of the image box. Defaults to portrait photo framing. */
  aspect?: number;
  /** 0–1 of available width. */
  widthRatio?: number;
  /** Align inside the hero area. Photos sit on the bottom; icons center. */
  align?: 'bottom' | 'center';
};

export type GetStartedSlide = {
  id: string;
  image: ImageSourcePropType;
  imageLabel: string;
  /** First line of the 2-line headline. */
  headlineLead: string;
  /** Second line of the 2-line headline. */
  headlineAccent: string;
  subtitle: string;
  layout?: GetStartedSlideLayout;
};

/** Three onboarding slides for the get-started screen. */
export const GET_STARTED_SLIDES: GetStartedSlide[] = [
  {
    id: 'students',
    image: require('../../assets/student-model.optimized.png'),
    imageLabel: 'CampusCare students',
    headlineLead: 'Shaping the Future of',
    headlineAccent: 'HealthCare',
    subtitle: 'Book your appointment visits faster with the Health Service Office.',
  },
  {
    id: 'care',
    image: require('../../assets/images/booking/doctor-hero.png'),
    imageLabel: 'Campus health providers',
    headlineLead: 'Care When You',
    headlineAccent: 'Need It Most',
    subtitle: 'See school doctors and nurses without the wait or the paperwork pile-up.',
  },
  {
    id: 'book',
    image: require('../../assets/3d-calendar.png'),
    imageLabel: 'Appointment calendar',
    headlineLead: 'Your Schedule,',
    headlineAccent: 'Your Visit',
    subtitle: 'Pick a time that works, get reminders, and show up ready.',
    // Square icon — center in the hero, don't use full-bleed portrait framing.
    layout: {
      aspect: 1,
      widthRatio: 0.62,
      align: 'center',
    },
  },
];
