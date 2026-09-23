-- Allow linked patients to read their own consultation rows
-- so completed appointment cards can show clinical_notes.

CREATE POLICY appointment_consultations_select_patient
ON public.appointment_consultations
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT p.id
    FROM public.patients p
    WHERE p.auth_user_id = (SELECT auth.uid())
  )
);
