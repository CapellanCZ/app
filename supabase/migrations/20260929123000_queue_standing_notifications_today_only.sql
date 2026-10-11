-- Restrict queue standing milestones (5th / 3rd / You're Next) to the ticket's
-- service date when that date is today in Asia/Manila.
-- Prevents "You're Next" when a future appointment is approved early.

CREATE OR REPLACE FUNCTION public.refresh_queue_standing_notifications(p_service_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  standing integer;
  v_today date;
BEGIN
  IF p_service_date IS NULL THEN
    RETURN;
  END IF;

  v_today := (timezone('Asia/Manila', now()))::date;
  -- Future (or past) service dates must not emit active-queue milestones.
  IF p_service_date IS DISTINCT FROM v_today THEN
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
