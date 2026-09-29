-- Allow authenticated patients to read their own issued/printed medical documents
-- (prescriptions, certificates, etc.) so mobile can show the official HSO form.
-- Staff policies remain unchanged.

DROP POLICY IF EXISTS "patients_select_own_issued_medical_documents"
  ON public.medical_certificates;

CREATE POLICY "patients_select_own_issued_medical_documents"
  ON public.medical_certificates
  FOR SELECT
  TO authenticated
  USING (
    status IN ('issued', 'printed')
    AND patient_id IN (
      SELECT p.id
      FROM public.patients p
      WHERE p.auth_user_id = (SELECT auth.uid())
    )
  );
