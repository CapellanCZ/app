# CampusCare — Feature Brainstorm (mobile)

> Working notes with Boss. Locked against live Supabase project `CampusCare` (`zrteblltvshgcienhytm`).
> Last updated: 2026-07-31

## Shared product rules

- Mobile clients: **student** + **faculty** (UI may say “professor”; DB uses `patient_type = 'faculty'`).
- Staff / super-admin / Excel import / capacity config: **web repo only**.
- No clinical PHI on mobile — no `medical_notes`, consultations, vitals, certificates content beyond “issued/pending” if we ever show status.
- Same Supabase project as web: **CampusCare**.
- **One campus clinic** only.
- Auth: **OTP** (no password register on mobile). Accounts exist after web Excel import → `patients` (+ `auth.users` link).

---

## Live schema map (from MCP — do not invent parallel tables)

| Mobile concept | Supabase reality |
|----------------|------------------|
| Logged-in campus user | `patients` where `auth_user_id = auth.uid()` |
| Role | `patients.patient_type` ∈ `student` \| `faculty` |
| Staff (not mobile) | `users` + `web_role` (admin/nurse/physician/dentist/…) |
| Book / request visit | Prefer **`consultation_requests`** (already: pending → approved/declined/rescheduled) |
| Confirmed calendar visit | `appointments` (`pending`…`confirmed`…`no_show`) after staff approval |
| Staff hours | `doctor_availability` + `clinic_office_hours` |
| Walk-in / day-of flow | `health_queue_tickets` (stations: nurse / physician / dentist) |
| Clinic pause | `clinic_break_status` / `staff_break_status` |
| Announcements | `announcements` (published only) |

**Boss rule:** Mobile booking UX should submit a **consultation request** (or create `appointments` only if web already does that for self-serve). We align to **request → clinic confirms**, which matches your web “max slots + staff confirm” model and reduces slot hoarding.

---

## 1. `auth` — OTP login only (LOCKED)

**Flow**
1. User enters **campus email** (must already exist as enrolled `patients.email` / auth user from Excel import).
2. Supabase sends **OTP**.
3. User enters OTP → session.
4. App loads `patients` row by `auth_user_id` → route to student/faculty home.
5. If no `patients` row → block with “Not enrolled — contact clinic admin.”

**Not on mobile:** register, password signup, role picker, Excel import.

**Security:** rate-limit OTP; never expose staff `users` table to patients.

---

## 2. `booking` — Request a visit (LOCKED direction)

**Happy path (prototype)**
1. Pick **service / station** (General / Nurse / Physician / Dentist — mirror queue stations + web services).
2. Pick **preferred date** (within booking window).
3. Pick **preferred time** from availability derived from `doctor_availability` ∩ `clinic_office_hours` ∩ not on break ∩ capacity remaining.
4. Short **reason** (non-clinical free text, length-capped) — maps to `consultation_requests.reason`.
5. Submit → status **`pending`** until nurse/staff approves on web.
6. User sees request under Appointments as “Pending confirmation”.

**Capacity:** Web owns max slots per day/provider. Mobile only shows times that still have capacity; never overbook.

**Same-day:** **Walk-in / queue only** for same-day (see §6). Scheduled booking = **tomorrow → +14 days**. Prevents last-minute slot sniping for scheduled capacity.

---

## 3. `appointment` — Lifecycle + anti-abuse (BOSS STANDARD — LOCKED FOR PROTOTYPE)

Real campus clinics fail when students spam book/cancel to hold slots. We prototype **policies**, not vibes.

### Status model (already in DB)
`pending` → `confirmed` → `in_progress` → `completed`  
also: `rescheduled` | `cancelled` | `no_show`

For **requests**: `pending` → `approved` | `declined` | `rescheduled` | `cancelled` | `completed`

### Anti-abuse rules (enforce in DB + UI)

> **STATUS: APPROVED by product owner — 2026-07-31.** Do not weaken without updating this doc.

| # | Rule | Prototype default | Why |
|---|------|-------------------|-----|
| A | Max active pipeline | **1** pending request **OR** **1** upcoming confirmed appointment (not both stacking) | Stops slot farming |
| B | Booking window | Schedule from **D+1 to D+14**; no scheduled same-day | Same-day = queue |
| C | Cancel cutoff | Cancel allowed until **24h before** `starts_at` / `schedule_at` | Protects clinic planning |
| D | Late cancel | After cutoff → only clinic can cancel; user sees “Contact clinic” | Stops day-before gaming |
| E | Reschedule | **Max 1** patient-initiated reschedule per appointment; then must complete or clinic-assisted | Stops infinite shuffle |
| F | Cancel quota | **Max 3** patient cancellations / rolling **30 days** | Stops cancel-rebook loops |
| G | No-show | Staff marks `no_show`; after **2 no-shows / semester** → booking freeze until admin clears | Classic university clinic policy |
| H | Cooldown after cancel | **12h** before a new request after self-cancel | Soft brake on thrashing |
| I | Double-book | Unique active appointment per patient overlapping time; unique slot capacity server-side | Integrity |
| J | Break / closed | No booking when clinic/staff `is_on_break` or office hours closed | Matches web flags |

**Reschedule UX:** dedicated “Reschedule” that creates a new preferred slot + marks old as `rescheduled` (staff may need to re-confirm) — **not** silent cancel+new with unlimited retries.

**Panel story:** “Students request visits; clinic confirms against real capacity. Limits on pending bookings, cancellations, reschedules, and no-shows prevent abuse while keeping access fair.”

---

## 4. `schedule` — Single clinic availability (LOCKED)

- **One clinic** (university).
- Slot length: **debating** → prototype default **30 minutes** until web config says otherwise (configurable constant / clinic setting later).
- Mobile **reads** `clinic_office_hours` + `doctor_availability` + breaks; **never writes** schedules.
- Filter by station/provider type when booking dentist vs physician vs nurse.

---

## 5. `profile` — From `patients` (LOCKED source)

**Show (read-only from import / `patients`):**
- `full_name`, `email`, `patient_type`, `student_id` / `employee_id`, `affiliation`, `phone` (if present)

**Do NOT show on mobile:**
- `medical_notes`, `patient_records.*` clinical fields, allergies chart, etc.

**Editable on mobile:** theme only (local).

---

## 6. `queue` — Day-of / walk-in (ADD TO ROADMAP)

Your DB already has a serious queue system (`health_queue_tickets`). For a complete university clinic prototype, mobile should eventually support:

1. **Check in** for today’s confirmed appointment → join station queue.
2. See **ticket code**, position, estimated wait, station.
3. Rules: can’t hold active `waiting` ticket + spam rejoin (`rejoin_count` already exists) — respect web limits.
4. Expired / no_show tickets handled by staff.

**Boss decision:** Add feature folder `queue` in next skeleton pass (after auth+booking+appointment screens exist), so we don’t ignore real clinic flow.

---

## Decision log

| # | Topic | Decision |
|---|-------|----------|
| 1 | Credentials | **OTP** |
| 2 | Services / capacity | Web owns catalog + max slots; mobile requests within remaining capacity; staff confirms |
| 3 | Abuse / lifecycle | Boss standard §3 — **APPROVED 2026-07-31** |
| 4 | Clinics / slot length | **1 clinic**; slot length default **30m** pending debate |
| 5 | Profile | From `patients` via MCP schema |
| 6 | Role naming | DB `faculty` = app “professor” label if desired |

---

## Open (only if you veto boss defaults)

~~Reply “approve policies” or change numbers~~ → **APPROVED 2026-07-31.**

Next engineering step: domain types matching DB enums + Supabase client wiring (migration steps 4–5) + add `queue` feature skeleton.
