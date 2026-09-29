import type { PrescriptionDiagnosticRequests } from '@/lib/consultation/types';

type DiagnosticOption = {
  id: string;
  label: string;
  isOthers?: boolean;
};

const PHYSICIAN: DiagnosticOption[] = [
  { id: 'cbc', label: 'Complete Blood Count (CBC)' },
  { id: 'ua', label: 'Urinalysis (UA)' },
  { id: 'fecalysis', label: 'Fecalysis / Stool Examination' },
  { id: 'fbs', label: 'Fasting Blood Sugar (FBS)' },
  { id: 'blood_glucose', label: 'Blood Glucose' },
  { id: 'lipid_profile', label: 'Lipid Profile' },
  { id: 'blood_typing', label: 'Blood Typing' },
  { id: 'pregnancy_test', label: 'Pregnancy Test' },
  { id: 'chest_xray', label: 'Chest X-ray' },
  { id: 'ecg', label: 'Electrocardiogram (ECG)' },
  { id: 'ultrasound', label: 'Ultrasound' },
  { id: 'others', label: 'Others', isOthers: true },
];

const DENTIST: DiagnosticOption[] = [
  { id: 'periapical_xray', label: 'Periapical X-ray' },
  { id: 'bitewing_xray', label: 'Bitewing X-ray' },
  { id: 'panoramic_xray', label: 'Panoramic X-ray' },
  { id: 'others', label: 'Others', isOthers: true },
];

/** Mirror web `formatDiagnosticRequestLines` for patient-facing Rx display. */
export function formatDiagnosticRequestLines(
  input: PrescriptionDiagnosticRequests | null | undefined,
): string[] {
  if (!input?.selectedIds?.length) return [];
  const options = input.catalog === 'dentist' ? DENTIST : PHYSICIAN;
  const selected = new Set(input.selectedIds);
  const lines: string[] = [];

  for (const option of options) {
    if (!selected.has(option.id)) continue;
    if (option.isOthers) {
      const custom = input.othersText?.trim();
      if (custom) lines.push(custom);
      continue;
    }
    lines.push(option.label);
  }

  return lines;
}
