export type PrescriptionMedication = {
  name: string | null;
  strength: string | null;
  quantity: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
};

export type ConsultationPrescription = {
  medications: PrescriptionMedication[];
  updatedAt: string | null;
};
