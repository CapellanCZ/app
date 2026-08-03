-- Allow enrolled patients to read published campus-wide announcements + attachments/files.

CREATE OR REPLACE FUNCTION public.is_enrolled_patient()
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
  );
$$;

REVOKE ALL ON FUNCTION public.is_enrolled_patient() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_enrolled_patient() TO authenticated;

DROP POLICY IF EXISTS "patients read published announcements" ON public.announcements;
CREATE POLICY "patients read published announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.is_enrolled_patient()
    AND status = 'published'
    AND audience = 'All'
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
        AND a.audience = 'All'
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
        AND a.audience = 'All'
    )
  );
