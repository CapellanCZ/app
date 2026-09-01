-- Show published announcements by patient role: All + matching Student/Faculty/Employee.
-- Excludes staff-only audiences (e.g. Dentist, Physician).

CREATE OR REPLACE FUNCTION public.is_mobile_announcement_audience(p_audience text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(coalesce(p_audience, ''))) IN ('all', 'student', 'faculty', 'employee');
$$;

CREATE OR REPLACE FUNCTION public.patient_matches_announcement_audience(
  p_patient_type text,
  p_audience text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.is_mobile_announcement_audience(p_audience)
    AND (
      lower(trim(p_audience)) = 'all'
      OR lower(trim(p_audience)) = lower(trim(coalesce(p_patient_type, '')))
    );
$$;

CREATE OR REPLACE FUNCTION public.announcement_visible_to_current_patient(p_audience text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.auth_user_id = (SELECT auth.uid())
      AND public.patient_matches_announcement_audience(p.patient_type::text, p_audience)
  );
$$;

REVOKE ALL ON FUNCTION public.announcement_visible_to_current_patient(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.announcement_visible_to_current_patient(text) TO authenticated;

DROP POLICY IF EXISTS "patients read published announcements" ON public.announcements;
CREATE POLICY "patients read published announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.is_enrolled_patient()
    AND status = 'published'
    AND public.announcement_visible_to_current_patient(audience)
  );

DROP POLICY IF EXISTS "patients read published announcement attachments" ON public.announcement_attachments;
CREATE POLICY "patients read published announcement attachments"
  ON public.announcement_attachments
  FOR SELECT
  TO authenticated
  USING (
    public.is_enrolled_patient()
    AND EXISTS (
      SELECT 1
      FROM public.announcements a
      WHERE a.id = announcement_attachments.announcement_id
        AND a.status = 'published'
        AND public.announcement_visible_to_current_patient(a.audience)
    )
  );

DROP POLICY IF EXISTS "patients read published announcement files" ON storage.objects;
CREATE POLICY "patients read published announcement files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'announcement-attachments'
    AND public.is_enrolled_patient()
    AND EXISTS (
      SELECT 1
      FROM public.announcement_attachments att
      JOIN public.announcements a ON a.id = att.announcement_id
      WHERE att.file_path = name
        AND a.status = 'published'
        AND public.announcement_visible_to_current_patient(a.audience)
    )
  );

CREATE OR REPLACE FUNCTION public.notify_patients_announcement_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_body text;
  v_plain text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'published'
       OR NOT public.is_mobile_announcement_audience(NEW.audience)
    THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM 'published'
       OR NOT public.is_mobile_announcement_audience(NEW.audience)
       OR OLD.status IS NOT DISTINCT FROM 'published'
    THEN
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  v_plain := trim(regexp_replace(coalesce(NEW.body, ''), '\s+', ' ', 'g'));
  v_body := left(v_plain, 140);
  IF length(v_plain) > 140 THEN
    v_body := v_body || '…';
  END IF;
  IF v_body = '' THEN
    v_body := 'Tap home to read the full announcement.';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, href, metadata)
  SELECT
    p.auth_user_id,
    'announcement',
    NEW.title,
    v_body,
    '/(tabs)',
    jsonb_build_object(
      'announcement_id', NEW.id,
      'category', 'campus',
      'notification_type', 'info',
      'source', 'CampusCare'
    )
  FROM public.patients p
  WHERE p.auth_user_id IS NOT NULL
    AND public.patient_matches_announcement_audience(p.patient_type::text, NEW.audience)
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = p.auth_user_id)
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = p.auth_user_id
        AND n.metadata->>'announcement_id' = NEW.id::text
    );

  RETURN NEW;
END;
$$;
