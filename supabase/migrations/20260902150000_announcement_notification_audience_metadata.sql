-- Store announcement audience on notification rows + keep audience-aware fan-out.

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
      'announcement_audience', NEW.audience,
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
