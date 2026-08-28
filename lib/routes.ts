/**
 * Centralized route constants.
 *
 * Prefer these over hard-coded strings in `router.push()` / `router.replace()`.
 * Keeps route changes in one place and enables IDE autocompletion.
 */
export const ROUTES = {
  // --- Tabs ---
  tabs: '/(tabs)',
  home: '/(tabs)',
  notifications: '/notifications',
  profile: '/(tabs)/profiles',

  // --- Stack screens (reachable from Home quick actions) ---
  appointments: '/appointments',
  vitalSigns: '/vital-signs',

  // --- Auth ---
  login: '/login',
  notEnrolled: '/(auth)/not-enrolled',
  logout: '/logout',

  // --- Features ---
  healthService: '/health-service',
  healthServiceAppointments: '/appointments',
  healthServiceDoctors: '/(tabs)/book',
  visitCompleted: '/visit-completed',

  // --- Settings ---
  personalInfo: '/personal-info',
  security: '/security',
  notificationSettings: '/notification-settings',
  helpCenter: '/help-center',
  terms: '/terms',
  privacy: '/privacy',
  about: '/about',
} as const;
