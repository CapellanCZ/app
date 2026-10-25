# CampusCare security operations checklist

Client-side hardening is in the app repo. These steps must be completed in
Supabase / Play Console / EAS for production.

## 1. Edge Function webhook secret (Critical)

1. Generate a secret (≥32 random chars).
2. Set Edge secret: `supabase secrets set EDGE_WEBHOOK_SECRET=<secret>`
3. Redeploy: `send-push`, `send-appointment-email` (keep `verify_jwt` disabled for pg_net).
4. Apply migration `20261026090000_edge_webhook_secret_headers.sql`.
5. Insert the same secret (as a privileged DB role):

```sql
insert into private.app_secrets(name, value)
values ('edge_webhook_secret', '<secret>')
on conflict (name) do update
  set value = excluded.value, updated_at = now();
```

Until step 5, push/email triggers skip HTTP calls (fail closed).

## 2. RLS verification (High)

Run Supabase Security Advisors and confirm policies on:

- `appointments`, `patients`, `consultations`, `patient_records`, `users`
- `health_queue_tickets`, `health_vital_signs`
- Storage buckets (`avatars`, medical documents)

Patient mobile uses the anon key; RLS is the real authorization layer.

## 3. Staff `app_metadata`

Clinic admin routes/APIs require `app_metadata.role` (or `primary_role`) in
`staff|admin|physician|doctor|nurse|dentist|clinic_staff`. Set via Auth Admin
API — never via client-editable `user_metadata`.

## 4. Env hygiene

- Do not commit `.env.local`. Use EAS Environment Variables for builds.
- Anon/publishable keys in the client are expected; never ship `service_role`.

## 5. Google Play Console (manual)

- Data safety form (health / personal info)
- Privacy policy URL
- Account deletion pathway (if accounts are created)
- Exact alarm / notification permission declarations
- Target API: Expo SDK 57 + `expo-build-properties` pins `compileSdkVersion` /
  `targetSdkVersion` **36** (required by current AndroidX deps and Play’s
  Aug 31, 2026 update policy)
- App Signing by Google Play
- Restrict Firebase Android API key (package + SHA-1/256)

## 6. Rotate if history leaked secrets

If `.env.local` or privileged keys were ever committed publicly, rotate the
anon key only if policy requires; always rotate any accidentally committed
`service_role` / Resend keys.
