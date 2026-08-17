-- Unify "visit completed": whatever clinic table finishes the consult,
-- normalize onto appointments.status = completed, then notify the patient.

CREATE OR REPLACE FUNCTION public.insert_patient_visit_completed_notification(
  p_appointment_id uuid,
  p_patient_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_doctor_name text;
BEGIN
  IF p_appointment_id IS NULL THEN
    RETURN;
  END IF;

  IF p_patient_id IS NOT NULL THEN
    SELECT p.auth_user_id INTO v_user_id
    FROM public.patients p
    WHERE p.id = p_patient_id;
  END IF;

  IF v_user_id IS NULL THEN
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
      AND n.metadata->>'appointment_id' = p_appointment_id::text
      AND (
        n.metadata->>'queue_milestone' = 'visit_completed'
        OR lower(n.title) IN ('visit completed', 'consultation completed')
      )
  ) THEN
    RETURN;
  END IF;

  SELECT u.full_name INTO v_doctor_name
  FROM public.appointments a
  LEFT JOIN public.users u ON u.id = a.doctor_id
  WHERE a.id = p_appointment_id;

  INSERT INTO public.notifications (user_id, type, title, body, href, metadata)
  VALUES (
    v_user_id,
    'appointment',
    'Visit Completed',
    format(
      'Your consultation with %s is done. You can review this visit anytime.',
      coalesce(nullif(trim(v_doctor_name), ''), 'your campus provider')
    ),
    format('/visit-completed?id=%s', p_appointment_id),
    jsonb_build_object(
      'appointment_id', p_appointment_id,
      'queue_milestone', 'visit_completed',
      'category', 'health',
      'notification_type', 'success',
      'source', 'Health Service'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_visit_completed(
  p_appointment_id uuid,
  p_patient_id uuid DEFAULT NULL,
  p_source text DEFAULT 'unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_patient_id uuid := p_patient_id;
  v_prev_status text;
BEGIN
  IF p_appointment_id IS NULL THEN
    RETURN;
  END IF;

  SELECT a.patient_id, a.status::text
  INTO v_patient_id, v_prev_status
  FROM public.appointments a
  WHERE a.id = p_appointment_id;

  IF v_patient_id IS NULL AND p_patient_id IS NOT NULL THEN
    v_patient_id := p_patient_id;
  END IF;

  IF v_prev_status IN ('cancelled', 'no_show') THEN
    RETURN;
  END IF;

  IF v_prev_status IS DISTINCT FROM 'completed' THEN
    UPDATE public.appointments a
    SET
      status = 'completed'::public.appointment_status,
      updated_at = now()
    WHERE a.id = p_appointment_id
      AND a.status::text IS DISTINCT FROM 'completed'
      AND a.status::text NOT IN ('cancelled', 'no_show');
  END IF;

  UPDATE public.health_queue_tickets t
  SET
    status = 'completed',
    updated_at = now()
  WHERE t.appointment_id = p_appointment_id
    AND t.status IS DISTINCT FROM 'completed';

  PERFORM public.insert_patient_visit_completed_notification(p_appointment_id, v_patient_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_patient_appointment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status::text = 'completed'
  THEN
    PERFORM public.insert_patient_visit_completed_notification(NEW.id, NEW.patient_id);

    UPDATE public.health_queue_tickets t
    SET status = 'completed', updated_at = now()
    WHERE t.appointment_id = NEW.id
      AND t.status IS DISTINCT FROM 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_notify_completed ON public.appointments;
CREATE TRIGGER trg_appointments_notify_completed
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_patient_appointment_completed();

CREATE OR REPLACE FUNCTION public.on_appointment_consultation_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.completed_at IS NULL
     AND NEW.completed_at IS NOT NULL
     AND NEW.appointment_id IS NOT NULL
  THEN
    PERFORM public.finalize_visit_completed(NEW.appointment_id, NEW.patient_id, 'appointment_consultations');
  ELSIF TG_OP = 'INSERT'
     AND NEW.completed_at IS NOT NULL
     AND NEW.appointment_id IS NOT NULL
  THEN
    PERFORM public.finalize_visit_completed(NEW.appointment_id, NEW.patient_id, 'appointment_consultations');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_consultations_completed ON public.appointment_consultations;
CREATE TRIGGER trg_appointment_consultations_completed
AFTER INSERT OR UPDATE OF completed_at ON public.appointment_consultations
FOR EACH ROW
EXECUTE FUNCTION public.on_appointment_consultation_completed();

CREATE OR REPLACE FUNCTION public.on_consultation_status_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_appointment_id uuid;
  v_status text;
BEGIN
  v_status := lower(COALESCE(NEW.status, ''));
  IF v_status NOT IN ('completed', 'complete', 'done', 'finished') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND lower(COALESCE(OLD.status, '')) = v_status THEN
    RETURN NEW;
  END IF;

  IF NEW.queue_ticket_id IS NOT NULL THEN
    SELECT t.appointment_id INTO v_appointment_id
    FROM public.health_queue_tickets t
    WHERE t.id = NEW.queue_ticket_id;
  END IF;

  IF v_appointment_id IS NULL AND NEW.consultation_request_id IS NOT NULL THEN
    SELECT t.appointment_id INTO v_appointment_id
    FROM public.health_queue_tickets t
    WHERE t.consultation_request_id = NEW.consultation_request_id
    ORDER BY t.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_appointment_id IS NOT NULL THEN
    PERFORM public.finalize_visit_completed(v_appointment_id, NEW.patient_id, 'consultations');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consultations_status_completed ON public.consultations;
CREATE TRIGGER trg_consultations_status_completed
AFTER INSERT OR UPDATE OF status ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.on_consultation_status_completed();

CREATE OR REPLACE FUNCTION public.on_queue_ticket_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.appointment_id IS NOT NULL
  THEN
    PERFORM public.finalize_visit_completed(NEW.appointment_id, NEW.patient_id, 'health_queue_tickets');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_health_queue_tickets_completed ON public.health_queue_tickets;
CREATE TRIGGER trg_health_queue_tickets_completed
AFTER UPDATE OF status ON public.health_queue_tickets
FOR EACH ROW
EXECUTE FUNCTION public.on_queue_ticket_completed();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'appointment_consultations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_consultations';
  END IF;
END $$;
