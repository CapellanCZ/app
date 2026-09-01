import type { QueueTicket } from '@/lib/health-service/types';

export type PatientQueueView = {
  ticketId: string;
  ticket: QueueTicket;
  station: string | null;
  serviceDate: string;
  appointmentId: string | null;
  appointmentTimeLabel: string | null;
  staffName: string | null;
  staffSpecialty: string | null;
};
