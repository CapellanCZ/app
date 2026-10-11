export type PrescriptionMedication = {
  name: string | null;
  strength: string | null;
  quantity: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  route?: string | null;
};

export type ConsultationPrescription = {
  medications: PrescriptionMedication[];
  updatedAt: string | null;
};

export type PrescriptionDiagnosticRequests = {
  catalog: 'physician' | 'dentist';
  selectedIds: string[];
  othersText?: string | null;
};

/** Official issued prescription from medical_certificates (web source of truth). */
export type IssuedPrescriptionDocument = {
  id: string;
  documentNumber: string;
  doctorName: string | null;
  licenseNumber: string | null;
  issuedAt: string | null;
  patientFullName: string;
  patientAddress: string | null;
  patientAge: string | null;
  patientSex: string | null;
  medications: PrescriptionMedication[];
  diagnosticLines: string[];
  documentFileUrl: string | null;
  status: string;
};
