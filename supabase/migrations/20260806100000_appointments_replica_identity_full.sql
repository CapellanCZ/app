-- Include full previous row in realtime UPDATE payloads so we can detect
-- pending → confirmed / cancelled transitions client-side.
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
