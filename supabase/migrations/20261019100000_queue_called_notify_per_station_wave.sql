-- Fix: "It's Your Turn" only fired once per ticket forever.
-- After nurse intake the same ticket returns to waiting at physician/dentist;
-- Call next correctly sets status=called, but insert_patient_queue_notification
-- skipped because milestone 'called' already existed from the nurse/first call.
-- Also: recalls (call_count bump while already called) and waiting→ongoing
-- (dentist Start consultation) never notified the patient.

DROP FUNCTION IF EXISTS public.insert_patient_queue_notification(uuid, uuid, uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.insert_patient_queue_notification(
  p_ticket_id uuid,
  p_patient_id uuid,
  p_appointment_id uuid,
  p_milestone text,
  p_title text,
  p_body text,
  p_notification_type text DEFAULT 'info',
  p_station text DEFAULT NULL,
  p_call_count integer DEFAULT NULL,
  p_intake_at text DEFAULT NULL
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

  -- Standing milestones: one per ticket+milestone (unchanged).
  -- Called / serving: one per ticket + station + call_count + intake wave
  -- so nurse → specialty Call next and recalls each notify the patient.
  IF p_milestone IN ('called', 'serving') THEN
    IF EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = v_user_id
        AND n.metadata->>'ticket_id' = p_ticket_id::text
        AND n.metadata->>'queue_milestone' = p_milestone
        AND COALESCE(n.metadata->>'station', '') = COALESCE(p_station, '')
        AND COALESCE(n.metadata->>'call_count', '') = COALESCE(p_call_count::text, '')
        AND COALESCE(n.metadata->>'intake_at', '') = COALESCE(p_intake_at, '')
    ) THEN
      RETURN;
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = v_user_id
        AND n.metadata->>'ticket_id' = p_ticket_id::text
        AND n.metadata->>'queue_milestone' = p_milestone
    ) THEN
      RETURN;
    END IF;
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
    jsonb_strip_nulls(jsonb_build_object(
      'ticket_id', p_ticket_id,
      'queue_milestone', p_milestone,
      'appointment_id', p_appointment_id,
      'notification_type', COALESCE(p_notification_type, 'info'),
      'category', 'health',
      'source', 'Health Service',
      'station', NULLIF(TRIM(COALESCE(p_station, '')), ''),
      'call_count', p_call_count,
      'intake_at', NULLIF(TRIM(COALESCE(p_intake_at, '')), '')
    ))
  );
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
  v_intake_at text;
  v_should_notify_turn boolean := false;
BEGIN
  v_service_date := COALESCE(
    NEW.service_date,
    OLD.service_date,
    ((COALESCE(NEW.created_at, OLD.created_at, now()) AT TIME ZONE 'Asia/Manila')::date)
  );

  v_station := COALESCE(NULLIF(TRIM(NEW.station), ''), 'clinic');
  v_intake_at := CASE
    WHEN NEW.intake_completed_at IS NOT NULL THEN NEW.intake_completed_at::text
    ELSE NULL
  END;

  -- First Call next (waiting/idle/… → called), recall (call_count bump while called),
  -- or dentist Start consultation (waiting → ongoing without a prior call).
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'called'
       AND (
         OLD.status IS DISTINCT FROM 'called'
         OR OLD.call_count IS DISTINCT FROM NEW.call_count
       ) THEN
      v_should_notify_turn := true;
    ELSIF NEW.status = 'ongoing'
       AND OLD.status IS DISTINCT FROM 'ongoing'
       AND OLD.status IS DISTINCT FROM 'called' THEN
      v_should_notify_turn := true;
    END IF;
  END IF;

  IF v_should_notify_turn THEN
    PERFORM public.insert_patient_queue_notification(
      NEW.id,
      NEW.patient_id,
      NEW.appointment_id,
      'called',
      'It''s Your Turn',
      'Please proceed to the ' || v_station || ' station and present your queue ticket.',
      'info',
      v_station,
      NEW.call_count,
      v_intake_at
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
AFTER INSERT OR UPDATE OF status, queue_position, queue_number, station, call_count
ON public.health_queue_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_patient_queue_milestones();
