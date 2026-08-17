-- Patient queue milestones: 5th, 3rd, next (standing 1), and called.
-- Inserts into public.notifications so the app toasts via existing realtime.

CREATE OR REPLACE FUNCTION public.queue_ticket_sort_key(p_queue_number integer, p_queue_position integer, p_created_at timestamptz)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_queue_number::bigint,
    p_queue_position::bigint,
    (EXTRACT(EPOCH FROM COALESCE(p_created_at, '1970-01-01'::timestamptz)) * 1000)::bigint
  );
$$;

CREATE OR REPLACE FUNCTION public.queue_ticket_standing(p_ticket_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  me record;
  standing integer;
BEGIN
  SELECT
    t.id,
    COALESCE(t.service_date, (t.created_at AT TIME ZONE 'Asia/Manila')::date) AS service_date,
    public.queue_ticket_sort_key(t.queue_number, t.queue_position, t.created_at) AS sort_key
  INTO me
  FROM public.health_queue_tickets t
  WHERE t.id = p_ticket_id;

  IF me.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT 1 + COUNT(*)::integer
  INTO standing
  FROM public.health_queue_tickets t
  WHERE COALESCE(t.service_date, (t.created_at AT TIME ZONE 'Asia/Manila')::date) = me.service_date
    AND t.status IN ('waiting', 'checked_in', 'idle')
    AND public.queue_ticket_sort_key(t.queue_number, t.queue_position, t.created_at) < me.sort_key;

  RETURN standing;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_patient_queue_notification(
  p_ticket_id uuid,
  p_patient_id uuid,
  p_appointment_id uuid,
  p_milestone text,
  p_title text,
  p_body text,
  p_notification_type text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_href text;
BEGIN
  IF p_milestone IS NULL OR p_title IS NULL THEN
    RETURN;
  END IF;

  IF p_patient_id IS NOT NULL THEN
    SELECT p.auth_user_id INTO v_user_id
    FROM public.patients p
    WHERE p.id = p_patient_id;
  END IF;

  IF v_user_id IS NULL AND p_appointment_id IS NOT NULL THEN
    SELECT p.auth_user_id INTO v_user_id
    FROM public.appointments a
    JOIN public.patients p ON p.id = a.patient_id
    WHERE a.id = p_appointment_id;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.user_id = v_user_id
      AND n.metadata->>'ticket_id' = p_ticket_id::text
      AND n.metadata->>'queue_milestone' = p_milestone
  ) THEN
    RETURN;
  END IF;

  v_href := CASE
    WHEN p_appointment_id IS NOT NULL THEN '/health-service/appointment/' || p_appointment_id::text
    ELSE '/appointments'
  END;

  INSERT INTO public.notifications (user_id, type, title, body, href, metadata)
  VALUES (
    v_user_id,
    'queue',
    p_title,
    p_body,
    v_href,
    jsonb_build_object(
      'ticket_id', p_ticket_id,
      'queue_milestone', p_milestone,
      'appointment_id', p_appointment_id,
      'notification_type', COALESCE(p_notification_type, 'info'),
      'category', 'health',
      'source', 'Health Service'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_queue_standing_notifications(p_service_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  standing integer;
BEGIN
  IF p_service_date IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT t.id, t.patient_id, t.appointment_id
    FROM public.health_queue_tickets t
    WHERE COALESCE(t.service_date, (t.created_at AT TIME ZONE 'Asia/Manila')::date) = p_service_date
      AND t.status IN ('waiting', 'checked_in', 'idle')
  LOOP
    standing := public.queue_ticket_standing(r.id);
    IF standing IS NULL THEN
      CONTINUE;
    END IF;

    IF standing = 5 THEN
      PERFORM public.insert_patient_queue_notification(
        r.id, r.patient_id, r.appointment_id,
        'standing_5',
        '5th In Queue',
        'You are 5th in line. Stay nearby — your turn is coming up.',
        'info'
      );
    ELSIF standing = 3 THEN
      PERFORM public.insert_patient_queue_notification(
        r.id, r.patient_id, r.appointment_id,
        'standing_3',
        '3rd In Queue',
        'You are 3rd in line. Please stay close to the clinic area.',
        'warning'
      );
    ELSIF standing = 1 THEN
      PERFORM public.insert_patient_queue_notification(
        r.id, r.patient_id, r.appointment_id,
        'standing_1',
        'You''re Next',
        'You are next in the queue. Please stay ready to be called.',
        'warning'
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_patient_queue_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_service_date date;
  v_station text;
BEGIN
  v_service_date := COALESCE(
    NEW.service_date,
    OLD.service_date,
    ((COALESCE(NEW.created_at, OLD.created_at, now()) AT TIME ZONE 'Asia/Manila')::date)
  );

  IF TG_OP = 'UPDATE'
     AND NEW.status = 'called'
     AND OLD.status IS DISTINCT FROM 'called' THEN
    v_station := COALESCE(NULLIF(TRIM(NEW.station), ''), 'clinic');
    PERFORM public.insert_patient_queue_notification(
      NEW.id,
      NEW.patient_id,
      NEW.appointment_id,
      'called',
      'It''s Your Turn',
      'Please proceed to the ' || v_station || ' station and present your queue ticket.',
      'info'
    );
  END IF;

  IF (
    TG_OP = 'INSERT'
    AND NEW.status IN ('waiting', 'checked_in', 'idle', 'called')
  ) OR (
    TG_OP = 'UPDATE'
    AND (
      OLD.status IS DISTINCT FROM NEW.status
      OR OLD.queue_position IS DISTINCT FROM NEW.queue_position
      OR OLD.queue_number IS DISTINCT FROM NEW.queue_number
    )
  ) THEN
    PERFORM public.refresh_queue_standing_notifications(v_service_date);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS health_queue_tickets_patient_notify ON public.health_queue_tickets;
CREATE TRIGGER health_queue_tickets_patient_notify
AFTER INSERT OR UPDATE OF status, queue_position, queue_number, station
ON public.health_queue_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_patient_queue_milestones();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'health_queue_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.health_queue_tickets;
  END IF;
END $$;
