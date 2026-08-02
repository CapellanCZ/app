-- Patient profile photos for the mobile app
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.patients.avatar_url IS 'Storage path or URL for patient profile photo (mobile app)';

-- Patients may only change their own avatar_url (not other columns)
CREATE OR REPLACE FUNCTION public.set_my_patient_avatar(p_avatar_url text)
RETURNS text
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
    avatar_url = NULLIF(trim(p_avatar_url), ''),
    updated_at = now()
  WHERE auth_user_id = auth.uid()
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Patient not found for current user';
  END IF;

  RETURN p_avatar_url;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_patient_avatar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_patient_avatar(text) TO authenticated;
