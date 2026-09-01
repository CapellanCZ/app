-- When a campus announcement is published, notify every enrolled patient.
-- Inserts into public.notifications → app realtime toast + send-push webhook.

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
    IF NEW.status IS DISTINCT FROM 'published' OR NEW.audience IS DISTINCT FROM 'All' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM 'published'
       OR NEW.audience IS DISTINCT FROM 'All'
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

DROP TRIGGER IF EXISTS trg_announcements_notify_patients ON public.announcements;
CREATE TRIGGER trg_announcements_notify_patients
  AFTER INSERT OR UPDATE OF status, audience ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_patients_announcement_published();

-- Realtime: refresh home carousel when a published announcement arrives.
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
