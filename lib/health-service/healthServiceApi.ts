/**
 * API-shaped surface for Health Service data. Replace implementation with Supabase-backed calls later.
 */
import {
  getHealthAppointmentsSnapshot,
  useHealthServiceStore,
} from './healthServiceStore';
import { MOCK_STAFF } from './mockStaff';
import { getSlotLabelsForPeriod, isStaffWorkingOnDate } from './slotUtils';
import type { Appointment, SlotPeriod, Staff } from './types';

function dateKey(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export type HealthServiceApi = {
  listStaff(): Promise<Staff[]>;
  getOpenSlotLabels(staffId: string, day: Date, period: SlotPeriod): Promise<string[]>;
  isWorking(staffId: string, day: Date): Promise<boolean>;
  /** Pending + confirmed; excludes cancelled. */
  listMyAppointments(): Promise<Appointment[]>;
  bookAppointment(input: { staffId: string; day: Date; startLabel: string }): Promise<void>;
  cancelAppointment(id: string): Promise<void>;
  /** Provider approves a pending booking; arrival ticket is created automatically (mock). */
  confirmAppointmentByProvider(id: string): Promise<void>;
};

function createMockHealthServiceApi(): HealthServiceApi {
  return {
    async listStaff() {
      return MOCK_STAFF;
    },
    async getOpenSlotLabels(staffId, day, period) {
      return getSlotLabelsForPeriod(staffId, dateKey(day), period);
    },
    async isWorking(staffId, day) {
      return isStaffWorkingOnDate(staffId, day);
    },
    async listMyAppointments() {
      return getHealthAppointmentsSnapshot().filter((a) => a.status !== 'cancelled');
    },
    async bookAppointment(input) {
      useHealthServiceStore.getState().bookAppointment(input);
    },
    async cancelAppointment(id) {
      useHealthServiceStore.getState().cancelAppointment(id);
    },
    async confirmAppointmentByProvider(id) {
      useHealthServiceStore.getState().confirmAppointmentByProvider(id);
    },
  };
}

let singleton: HealthServiceApi | null = null;

export function getHealthServiceApi(): HealthServiceApi {
  if (!singleton) singleton = createMockHealthServiceApi();
  return singleton;
}
