-- Emergency contact for enrolled patients (mobile personal info)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;

COMMENT ON COLUMN public.patients.emergency_contact_name IS 'Emergency contact full name (patient-managed)';
COMMENT ON COLUMN public.patients.emergency_contact_phone IS 'Emergency contact phone (patient-managed)';
COMMENT ON COLUMN public.patients.emergency_contact_relationship IS 'Relationship to patient, e.g. Parent, Spouse';

CREATE OR REPLACE FUNCTION public.set_my_emergency_contact(
  p_name text,
  p_phone text,
  p_relationship text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.patients
  SET
    emergency_contact_name = NULLIF(trim(p_name), ''),
    emergency_contact_phone = NULLIF(trim(p_phone), ''),
    emergency_contact_relationship = NULLIF(trim(p_relationship), ''),
    updated_at = now()
  WHERE auth_user_id = auth.uid()
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Patient not found for current user';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_emergency_contact(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_emergency_contact(text, text, text) TO authenticated;
