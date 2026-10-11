-- Allow pre-login enrollment check from the mobile app (anon).
-- Only returns boolean; does not expose patient rows.

CREATE OR REPLACE FUNCTION public.email_on_patient_roster(normalized_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_records pr
    WHERE lower(btrim(pr.email)) = lower(btrim(normalized_email))
  )
  OR EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE lower(btrim(p.email)) = lower(btrim(normalized_email))
  );
$function$;

REVOKE ALL ON FUNCTION public.email_on_patient_roster(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_on_patient_roster(text) TO anon, authenticated;

COMMENT ON FUNCTION public.email_on_patient_roster(text) IS
  'Returns true when email exists on patients or patient_records (web-imported roster). Used by mobile before OTP.';
