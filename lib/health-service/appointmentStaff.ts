import { resolveAvatarDisplayUrl } from '@/lib/profile/avatarUtils';

import type { Appointment, Staff, StaffRole } from './types';

const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  doctor: 'Physician',
  nurse: 'Nurse',
  dentist: 'Dentist',
};

/** Map `appointments.provider_type` / `users.primary_role` to app staff role. */
export function mapProviderTypeToStaffRole(providerType: string | null | undefined): StaffRole | null {
  const normalized = String(providerType ?? '').toLowerCase();
  if (normalized === 'physician' || normalized === 'doctor') return 'doctor';
  if (normalized === 'nurse') return 'nurse';
  if (normalized === 'dentist') return 'dentist';
  return null;
}

export function specialtyLabelForProviderType(providerType: string | null | undefined): string {
  const role = mapProviderTypeToStaffRole(providerType);
  return role ? STAFF_ROLE_LABEL[role] : 'Physician';
}

/**
 * When legacy rows have `provider_type` but no `doctor_id`, infer the provider
 * only when exactly one active staff member matches that role.
 */
export function inferStaffFromProviderType(
  providerType: string | null | undefined,
  staffList: Staff[],
): Staff | null {
  const role = mapProviderTypeToStaffRole(providerType);
  if (!role) return null;

  const matches = staffList.filter((member) => member.role === role);
  return matches.length === 1 ? matches[0] : null;
}

type AppointmentStaffSource = Pick<
  Appointment,
  'staffId' | 'staffName' | 'staffSpecialty' | 'staffPhotoUrl' | 'providerType'
>;

/** Single place to resolve doctor name / role for list cards and navigation. */
export function resolveAppointmentStaffDisplay(
  appointment: AppointmentStaffSource,
  staffList: Staff[],
): { name: string; specialty: string; photoUrl?: string | null } {
  const staffMember = appointment.staffId
    ? staffList.find((member) => member.id === appointment.staffId)
    : undefined;
  const inferred = inferStaffFromProviderType(appointment.providerType, staffList);

  const rawPhoto = appointment.staffPhotoUrl ?? staffMember?.photoUrl ?? inferred?.photoUrl;

  return {
    name:
      appointment.staffName?.trim() ||
      staffMember?.name?.trim() ||
      inferred?.name?.trim() ||
      'Clinic staff',
    specialty:
      appointment.staffSpecialty ||
      staffMember?.specialtyLabel ||
      inferred?.specialtyLabel ||
      specialtyLabelForProviderType(appointment.providerType),
    photoUrl: resolveAvatarDisplayUrl(rawPhoto) ?? rawPhoto ?? null,
  };
}
