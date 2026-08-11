-- Allow linked patients to read their own clinic queue tickets.
CREATE POLICY "patients_select_own_queue_tickets"
ON public.health_queue_tickets
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM public.patients p WHERE p.auth_user_id = auth.uid()
  )
  OR appointment_id IN (
    SELECT a.id FROM public.appointments a
    INNER JOIN public.patients p ON p.id = a.patient_id
    WHERE p.auth_user_id = auth.uid()
  )
);
