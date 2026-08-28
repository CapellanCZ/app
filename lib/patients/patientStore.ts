import { create } from 'zustand';

import type { EmergencyContact } from './emergencyContact';
import { fetchPatientByAuthUserId } from './patientsApi';
import type { EnrollmentStatus, Patient } from './types';

type PatientState = {
  patient: Patient | null;
  enrollmentStatus: EnrollmentStatus;
  isLoading: boolean;
  fetchPatient: (authUserId: string) => Promise<Patient | null>;
  patchEmergencyContact: (contact: EmergencyContact) => void;
  reset: () => void;
};

export const usePatientStore = create<PatientState>((set) => ({
  patient: null,
  enrollmentStatus: 'unknown',
  isLoading: false,

  fetchPatient: async (authUserId) => {
    set({ isLoading: true });
    try {
      const patient = await fetchPatientByAuthUserId(authUserId);
      set({
        patient,
        enrollmentStatus: patient ? 'enrolled' : 'not_enrolled',
        isLoading: false,
      });
      return patient;
    } catch (e) {
      console.error('[patients] fetchPatient failed:', e);
      set({ patient: null, enrollmentStatus: 'not_enrolled', isLoading: false });
      return null;
    }
  },

  patchEmergencyContact: (contact) =>
    set((state) =>
      state.patient
        ? {
            patient: {
              ...state.patient,
              emergency_contact_name: contact.name || null,
              emergency_contact_phone: contact.phone || null,
              emergency_contact_relationship: contact.relationship || null,
            },
          }
        : state,
    ),

  reset: () => {
    set({ patient: null, enrollmentStatus: 'unknown', isLoading: false });
  },
}));
