import { useEffect, useMemo } from 'react';

import { resolveAvatarDisplayUrl } from '@/lib/profile/avatarUtils';

import { resolveAppointmentStaffDisplay } from './appointmentStaff';
import { useHealthServiceStore } from './healthServiceStore';
import type { Appointment } from './types';

export type AppointmentStaffRouteFallback = {
  doctorName?: string;
  specialtyLabel?: string;
  photoUrl?: string;
};

export type AppointmentStaffDisplay = {
  name: string;
  specialty: string;
  photoUrl: string | null;
};

function staffFromRouteFallback(
  routeFallback?: AppointmentStaffRouteFallback,
): AppointmentStaffDisplay {
  const rawPhoto = routeFallback?.photoUrl ?? null;
  return {
    name: routeFallback?.doctorName?.trim() || 'Clinic staff',
    specialty: routeFallback?.specialtyLabel?.trim() || 'Physician',
    photoUrl: resolveAvatarDisplayUrl(rawPhoto) ?? rawPhoto,
  };
}

function withResolvedPhoto(
  display: Omit<AppointmentStaffDisplay, 'photoUrl'> & { photoUrl?: string | null },
): AppointmentStaffDisplay {
  const rawPhoto = display.photoUrl ?? null;
  return {
    name: display.name,
    specialty: display.specialty,
    photoUrl: resolveAvatarDisplayUrl(rawPhoto) ?? rawPhoto,
  };
}

/** Load and return a single appointment row from the health-service store. */
export function useAppointmentFromStore(appointmentId: string | undefined): {
  appointment: Appointment | null;
  appointmentsLoaded: boolean;
} {
  const appointments = useHealthServiceStore((s) => s.appointments);
  const appointmentsLoaded = useHealthServiceStore((s) => s.appointmentsLoaded);
  const loadAppointments = useHealthServiceStore((s) => s.loadAppointments);

  useEffect(() => {
    if (!appointmentsLoaded) void loadAppointments();
  }, [appointmentsLoaded, loadAppointments]);

  const appointment = useMemo(() => {
    if (!appointmentId) return null;
    return appointments.find((item) => item.id === appointmentId) ?? null;
  }, [appointments, appointmentId]);

  return { appointment, appointmentsLoaded };
}

/**
 * Resolve doctor name, role, and photo for appointment modals/screens.
 * Store data wins over stale route params once appointments + staff are loaded.
 */
export function useAppointmentStaffDisplay(
  appointmentId: string | undefined,
  routeFallback?: AppointmentStaffRouteFallback,
): AppointmentStaffDisplay & {
  appointment: Appointment | null;
  ready: boolean;
} {
  const { appointment, appointmentsLoaded } = useAppointmentFromStore(appointmentId);
  const staff = useHealthServiceStore((s) => s.staff);
  const staffLoaded = useHealthServiceStore((s) => s.staffLoaded);
  const loadStaff = useHealthServiceStore((s) => s.loadStaff);

  useEffect(() => {
    if (!staffLoaded) void loadStaff();
  }, [staffLoaded, loadStaff]);

  const display = useMemo(() => {
    if (appointment) {
      return withResolvedPhoto(resolveAppointmentStaffDisplay(appointment, staff));
    }
    return staffFromRouteFallback(routeFallback);
  }, [appointment, staff, routeFallback?.doctorName, routeFallback?.specialtyLabel, routeFallback?.photoUrl]);

  return {
    ...display,
    appointment,
    ready: appointmentsLoaded && staffLoaded,
  };
}
