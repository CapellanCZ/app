/**
 * Centralized route constants.
 *
 * Prefer these over hard-coded strings in `router.push()` / `router.replace()`.
 * Keeps route changes in one place and enables IDE autocompletion.
 */
export const ROUTES = {
  // --- Tabs ---
  tabs: '/(tabs)',
  home: '/health-service',
  appointments: '/(tabs)/appointments',
  notifications: '/(tabs)/notification',
  profile: '/(tabs)/profiles',

  // --- Auth ---
  login: '/login',
  notEnrolled: '/(auth)/not-enrolled',
  logout: '/logout',

  // --- Features ---
  healthService: '/health-service',
  healthServiceAppointments: '/health-service/appointments',
  referrals: '/referrals',

  // --- Settings ---
  personalInfo: '/personal-info',
  security: '/security',
  notificationSettings: '/notification-settings',
  helpCenter: '/help-center',
  terms: '/terms',
  privacy: '/privacy',
  about: '/about',
} as const;
