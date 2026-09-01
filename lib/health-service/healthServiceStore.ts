import { create } from 'zustand';
import { resolveAppointmentStaffDisplay } from './appointmentStaff';
import { healthServiceApi } from './healthServiceApi';
import { acquireAppointmentsSubscription } from './realtimeSubscriptions';
import type { Appointment, Staff } from './types';

type HealthServiceState = {
  appointments: Appointment[];
  staff: Staff[];
  loading: boolean;
  /** True after the first appointments fetch finishes (success or error). */
  appointmentsLoaded: boolean;
  /** True after the first staff fetch finishes (success or error). */
  staffLoaded: boolean;
  error: string | null;
  
  // Actions
  loadAppointments: () => Promise<void>;
  loadStaff: () => Promise<void>;
  bookAppointment: (input: {
    staffId: string;
    day: Date;
    startLabel: string;
    symptoms?: string;
  }) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  /** Subscribe to real-time appointments changes. Returns unsubscribe fn. */
  subscribeAppointments: () => (() => void);
  /** Clear all data on logout. */
  reset: () => void;
};

export const useHealthServiceStore = create<HealthServiceState>((set, get) => ({
  appointments: [],
  staff: [],
  loading: false,
  appointmentsLoaded: false,
  staffLoaded: false,
  error: null,

  loadAppointments: async () => {
    set({ loading: true, error: null });
    try {
      const appointments = await healthServiceApi.listMyAppointments();
      set({ appointments, loading: false, appointmentsLoaded: true });
    } catch (error) {
      console.error('Failed to load appointments:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load appointments',
        loading: false,
        appointmentsLoaded: true,
      });
    }
  },

  loadStaff: async () => {
    set({ loading: true, error: null });
    try {
      const staff = await healthServiceApi.listStaff();
      set({ staff, loading: false, staffLoaded: true });
    } catch (error) {
      console.error('Failed to load staff:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load staff',
        loading: false,
        staffLoaded: true,
      });
    }
  },

  bookAppointment: async (input) => {
    set({ loading: true, error: null });
    try {
      await healthServiceApi.bookAppointment(input);
      // Reload appointments to get the new one
      await get().loadAppointments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to book appointment';
      if (!message.includes('already have an appointment on this day')) {
        console.error('Failed to book appointment:', error);
      }
      set({
        error: message,
        loading: false,
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  cancelAppointment: async (id) => {
    set({ loading: true, error: null });
    try {
      await healthServiceApi.cancelAppointment(id);
      // Update local state
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to cancel appointment',
        loading: false 
      });
      throw error;
    }
  },

  confirmAppointment: async (id) => {
    set({ loading: true, error: null });
    try {
      await healthServiceApi.confirmAppointmentByProvider(id);
      // Reload appointments to get the updated status and ticket
      await get().loadAppointments();
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to confirm appointment',
        loading: false 
      });
      throw error;
    }
  },

  refreshData: async () => {
    await Promise.all([
      get().loadAppointments(),
      get().loadStaff(),
    ]);
  },

  reset: () => {
    set({
      appointments: [],
      staff: [],
      loading: false,
      appointmentsLoaded: false,
      staffLoaded: false,
      error: null,
    });
  },

  subscribeAppointments: () => acquireAppointmentsSubscription(get),
}));

// Helper functions for backward compatibility
export function getHealthAppointmentsSnapshot(): Appointment[] {
  return useHealthServiceStore.getState().appointments;
}

export function staffNameForAppointment(
  staffId: string,
  appointmentId?: string,
): string {
  const state = useHealthServiceStore.getState();
  const appointment =
    (appointmentId
      ? state.appointments.find((item) => item.id === appointmentId)
      : undefined) ??
    (staffId ? state.appointments.find((item) => item.staffId === staffId) : undefined);

  if (!appointment) {
    const staff = staffId ? state.staff.find((member) => member.id === staffId) : undefined;
    return staff?.name || 'Clinic staff';
  }

  return resolveAppointmentStaffDisplay(appointment, state.staff).name;
}

export function staffDisplayForAppointment(appointment: Appointment): {
  name: string;
  specialty: string;
  photoUrl?: string | null;
} {
  const state = useHealthServiceStore.getState();
  return resolveAppointmentStaffDisplay(appointment, state.staff);
}
