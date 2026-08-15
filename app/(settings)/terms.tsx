import { LegalDocumentScreen } from '@/components/settings/LegalDocumentScreen';

const SECTIONS = [
  {
    heading: 'Acceptance of Terms',
    body: 'By accessing or using CampusCare, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use the application.',
  },
  {
    heading: 'Use of the Application',
    body: 'CampusCare is intended solely for enrolled students, faculty, and authorized staff of the institution. You agree to use the application only for lawful purposes and in accordance with these Terms.',
  },
  {
    heading: 'Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. Any activity conducted under your account is your responsibility. Report unauthorized access immediately to the IT Support Office.',
  },
  {
    heading: 'Health & Welfare Services',
    body: 'Information provided through the Health Service and Welfare modules is for campus coordination purposes only. CampusCare does not replace professional medical advice, diagnosis, or treatment.',
  },
  {
    heading: 'Data Accuracy',
    body: 'You agree to provide accurate and current information when using the application. Providing false or misleading information may result in suspension of access and appropriate disciplinary action.',
  },
  {
    heading: 'Intellectual Property',
    body: 'All content, design, logos, and features within CampusCare are the intellectual property of the institution. You may not reproduce, distribute, or modify any part of the application without prior written consent.',
  },
  {
    heading: 'Limitation of Liability',
    body: 'The institution and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the application or inability to access it.',
  },
  {
    heading: 'Modifications',
    body: 'We reserve the right to update these Terms at any time. Continued use of the application after changes constitutes your acceptance of the revised Terms.',
  },
  {
    heading: 'Contact',
    body: 'For questions regarding these Terms, please contact the Office of the Registrar or the IT Support Office.',
  },
];

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Use"
      lastUpdated="April 2025"
      intro="Please read these Terms of Use carefully before using the CampusCare mobile application. They set out your rights and responsibilities as a campus user."
      sections={SECTIONS}
      footerNote="Need help with these terms? Contact IT Support at"
      footerEmail="support@campuscare.edu.ph"
    />
  );
}
