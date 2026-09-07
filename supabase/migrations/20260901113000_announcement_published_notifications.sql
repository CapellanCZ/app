-- Realtime + trigger for published announcements.
-- Audience-aware fan-out lives in 20260901063349_announcement_audience_by_patient_type.sql.

DROP TRIGGER IF EXISTS trg_announcements_notify_patients ON public.announcements;
CREATE TRIGGER trg_announcements_notify_patients
  AFTER INSERT OR UPDATE OF status, audience ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_patients_announcement_published();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  END IF;
END $$;
