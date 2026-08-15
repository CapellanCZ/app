import { LegalDocumentScreen } from '@/components/settings/LegalDocumentScreen';

const SECTIONS = [
  {
    heading: 'Information We Collect',
    body: 'We collect information you provide directly, such as your name, student ID, email address, year level, program, and health-related details you submit through the application. We also collect usage data to improve the application experience.',
  },
  {
    heading: 'How We Use Your Information',
    body: 'Your information is used to provide and personalize the CampusCare experience, process clinic appointment bookings, send campus-related notifications, and comply with institutional policies.',
  },
  {
    heading: 'Data Sharing',
    body: 'We do not sell or rent your personal information to third parties. Your data may be shared with authorized university offices (e.g., Health Service Office) strictly for service delivery purposes.',
  },
  {
    heading: 'Health Information',
    body: 'Health-related information submitted through the Health Service module is treated with the highest level of confidentiality. Access is restricted to authorized health service personnel only.',
  },
  {
    heading: 'Data Retention',
    body: 'We retain your personal data for the duration of your enrollment and for a period thereafter as required by institutional records policies. You may request deletion of non-essential data by contacting the Data Privacy Officer.',
  },
  {
    heading: 'Security',
    body: 'We implement technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet is 100% secure.',
  },
  {
    heading: 'Your Rights',
    body: 'Under applicable data privacy laws, you have the right to access, correct, and request deletion of your personal data. To exercise these rights, contact our Data Privacy Officer at privacy@campuscare.edu.ph.',
  },
  {
    heading: 'Cookies & Analytics',
    body: 'CampusCare may use anonymized analytics to understand usage patterns and improve the application. No personally identifiable information is used for analytics purposes.',
  },
  {
    heading: 'Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. We will notify you of significant changes through the application or via your registered email. Continued use after changes implies acceptance.',
  },
  {
    heading: 'Contact Us',
    body: 'For privacy concerns or questions, contact our Data Privacy Officer or visit the Office of the Registrar during working hours.',
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      lastUpdated="April 2025"
      intro="This Privacy Policy describes how CampusCare collects, uses, and protects your personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173)."
      sections={SECTIONS}
      footerNote="Questions about your data? Reach the Data Privacy Officer at"
      footerEmail="privacy@campuscare.edu.ph"
    />
  );
}
