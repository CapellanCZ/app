import { create } from 'zustand';

import { getStaffById } from './mockStaff';
import type { Appointment, QueueTicket } from './types';

function dateKey(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfDay(x);
}

/** Deterministic mock ticket created when a provider confirms an appointment. */
export function createArrivalTicketForAppointment(appointmentId: string): QueueTicket {
  let h = 0;
  for (let i = 0; i < appointmentId.length; i++) h = (h * 31 + appointmentId.charCodeAt(i)) | 0;
  const n = Math.abs(h);
  const letter = String.fromCharCode(65 + (n % 26));
  const num = (n % 89) + 10;
  let h2 = 0;
  const s = `${appointmentId}-wait`;
  for (let i = 0; i < s.length; i++) h2 = (h2 * 31 + s.charCodeAt(i)) | 0;
  return {
    code: `${letter}${num}`,
    position: (n % 12) + 1,
    estimatedMinutes: (Math.abs(h2) % 40) + 5,
    status: 'waiting',
  };
}

/** Pending / cancelled never carry a ticket; confirmed always has one (generated on confirm). */
export function withConsistentArrivalTicket(a: Appointment): Appointment {
  if (a.status === 'pending' || a.status === 'cancelled') {
    return { ...a, arrivalTicket: undefined };
  }
  return {
    ...a,
    arrivalTicket: a.arrivalTicket ?? createArrivalTicketForAppointment(a.id),
  };
}

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);

const seedAppointments: Appointment[] = [
  withConsistentArrivalTicket({
    id: 'ap-1',
    staffId: 'hs-3',
    dateKey: dateKey(today),
    startLabel: '10:40 AM',
    status: 'pending',
  }),
  withConsistentArrivalTicket({
    id: 'ap-2',
    staffId: 'hs-4',
    dateKey: dateKey(tomorrow),
    startLabel: '2:00 PM',
    status: 'confirmed',
    arrivalTicket: createArrivalTicketForAppointment('ap-2'),
  }),
];

type HealthServiceState = {
  appointments: Appointment[];
  bookAppointment: (input: {
    staffId: string;
    day: Date;
    startLabel: string;
  }) => void;
  /** Mock: provider approves a pending request — status becomes confirmed and an arrival ticket is created. */
  confirmAppointmentByProvider: (id: string) => void;
  cancelAppointment: (id: string) => void;
};

export const useHealthServiceStore = create<HealthServiceState>((set, get) => ({
  appointments: seedAppointments,

  bookAppointment: ({ staffId, day, startLabel }) => {
    const id = `ap-${Date.now()}`;
    const ap: Appointment = {
      id,
      staffId,
      dateKey: dateKey(day),
      startLabel,
      status: 'pending',
      arrivalTicket: undefined,
    };
    set({ appointments: [...get().appointments, ap].map(withConsistentArrivalTicket) });
  },

  confirmAppointmentByProvider: (id) => {
    set({
      appointments: get()
        .appointments.map((a) => {
          if (a.id !== id || a.status !== 'pending') return a;
          return {
            ...a,
            status: 'confirmed' as const,
            arrivalTicket: createArrivalTicketForAppointment(a.id),
          };
        })
        .map(withConsistentArrivalTicket),
    });
  },

  cancelAppointment: (id) => {
    set({
      appointments: get()
        .appointments.map((a) =>
          a.id === id
            ? { ...a, status: 'cancelled' as const, arrivalTicket: undefined }
            : a,
        )
        .map(withConsistentArrivalTicket),
    });
  },
}));

export function getHealthAppointmentsSnapshot(): Appointment[] {
  return useHealthServiceStore.getState().appointments;
}

export function staffNameForAppointment(a: Appointment): string {
  return getStaffById(a.staffId)?.name ?? 'Health staff';
}
