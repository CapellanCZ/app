import type { Staff } from './types';

export const MOCK_STAFF: Staff[] = [
  {
    id: 'hs-1',
    name: 'Dr. Maria Chen',
    role: 'doctor',
    specialtyLabel: 'General Medicine',
    priceLabel: 'Covered by student plan',
    rating: 4.9,
  },
  {
    id: 'hs-2',
    name: 'Dr. James Okonkwo',
    role: 'doctor',
    specialtyLabel: 'Sports Medicine',
    priceLabel: 'Covered by student plan',
    rating: 4.8,
  },
  {
    id: 'hs-3',
    name: 'Nurse Ana Ramos',
    role: 'nurse',
    specialtyLabel: 'Vitals & immunizations',
    priceLabel: 'Free',
    rating: 4.9,
  },
  {
    id: 'hs-4',
    name: 'Nurse Priya Shah',
    role: 'nurse',
    specialtyLabel: 'Triage & first aid',
    priceLabel: 'Free',
    rating: 4.7,
  },
  {
    id: 'hs-5',
    name: 'Dr. Leo Park',
    role: 'dentist',
    specialtyLabel: 'Dental screening',
    priceLabel: 'Co-pay may apply',
    rating: 4.8,
  },
];

export function getStaffById(id: string): Staff | undefined {
  return MOCK_STAFF.find((s) => s.id === id);
}
