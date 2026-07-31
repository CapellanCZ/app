import { create } from 'zustand';

import { fetchPatientByAuthUserId } from './patientsApi';
import type { EnrollmentStatus, Patient } from './types';

type PatientState = {
  patient: Patient | null;
  enrollmentStatus: EnrollmentStatus;
  isLoading: boolean;
  fetchPatient: (authUserId: string) => Promise<Patient | null>;
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

  reset: () => {
    set({ patient: null, enrollmentStatus: 'unknown', isLoading: false });
  },
}));
