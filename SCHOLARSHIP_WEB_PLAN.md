# CampusCare — Scholarship Web Admin Plan
> Hand this document to the web team. Everything here is derived from the existing mobile app schema and implemented flows.

---

## 1. Project Context

The mobile app (React Native / Expo) already has a fully working scholarship module for students. The web admin is the **staff-side counterpart** — SDAO staff manage programs, review applications, verify compliance documents, and monitor scholars.

Both the mobile app and the web admin **share the same Supabase project**.

| | Mobile (Student) | Web (SDAO Staff) |
|---|---|---|
| Auth | Supabase Auth (student accounts) | Supabase Auth (staff accounts) |
| Database | Supabase `lgqfkuvswbvqljixashq` | Same project |
| Realtime | Subscribed to own enrollment + compliance | Subscribed to new submissions + applications |
| Storage | Uploads to `scholarship-docs` bucket | Downloads/previews from same bucket |

---

## 2. Supabase Project Details

```
Project ID : lgqfkuvswbvqljixashq
Region     : ap-northeast-1 (Tokyo)
URL        : https://lgqfkuvswbvqljixashq.supabase.co
```

Staff access is gated by the existing `is_sdao_staff()` RLS function which checks:
- `profiles.user_role = 'staff'`
- `profiles.office = 'sdao'`
- `profiles.account_status = 'approved'`

---

## 3. Database Tables (All Existing)

### Core Scholarship Tables

| Table | Description |
|---|---|
| `scholarship_programs` | Scholarship offerings (White, Gold, Academic Excellence, etc.) |
| `scholarship_requirements` | Document templates per program (used as reference when creating compliance items) |
| `scholarship_applications` | One-time student application with personal info and uploaded docs |
| `application_documents` | Files uploaded by student during application |
| `scholar_enrollments` | One row per scholar — tracks GPA, status, year level across all terms |
| `scholarship_terms` | Academic term periods — staff activates one term at a time |
| `compliance_items` | Documents required from a scholar for a specific term |
| `compliance_submissions` | Files uploaded by student against a compliance item |
| `scholarship_approvals` | Immutable audit log of every staff action |

### Key Column Reference

**`scholarship_programs`**
```
id, code, name, short_description, full_description,
status (draft | open | closed | archived),
application_open_date, application_close_date,
academic_year, term,
min_gpa, max_gpa, year_levels[], programs[],
tuition_discount_percent, misc_discount_percent,
total_slots, filled_slots,
sponsor_name, sponsor_description,
published_at, archived_at, created_at, updated_at
```

**`scholarship_applications`**
```
id, program_id, student_id,
status (draft | submitted | under_review | needs_info | approved | rejected | withdrawn),
reference_number,
current_gpa, current_year_level, current_program,
personal_statement, family_income_range,
has_siblings_in_school,
review_notes, rejection_reason,
reviewed_by, reviewed_at, submitted_at, decided_at,
created_at, updated_at
```

**`scholar_enrollments`**
```
id, program_id, student_id, application_id,
status (active | at_risk | probation | suspended | terminated | completed),
reference_number,
academic_year, term, year_level,
current_gpa, gpa_last_updated,
contract_signed_at, contract_signee_name,
status_changed_at, status_changed_by, status_reason,
assigned_counselor,
started_at, expected_end_at, ended_at,
created_at, updated_at
```

**`scholarship_terms`**
```
id, academic_year, term (1st | 2nd | 3rd), label,
compliance_open_date, compliance_close_date,
is_active (only one true at a time),
created_by, created_at, updated_at
```

**`compliance_items`**
```
id, enrollment_id, term_id,
item_type (grades | enrollment_proof | good_moral | medical_clearance |
           community_service | interview | contract_signing | other),
name, description,
due_date, grace_period_days,
allowed_file_types[],
status (pending | submitted | verified | rejected | overdue | waived),
waived_by, waived_at, waive_reason,
created_at, updated_at
```

**`compliance_submissions`**
```
id, item_id, enrollment_id,
original_filename, storage_bucket, storage_path,
file_type, file_size_bytes, mime_type,
submitted_at, submitted_by,
verification_status (pending | submitted | verified | rejected),
verified_by, verified_at, staff_notes,
is_resubmission, previous_submission_id,
created_at, updated_at
```

**`scholarship_approvals`** (audit — insert only, never update/delete)
```
id, entity_type (application | enrollment | compliance),
entity_id, action, previous_status, new_status,
actor_id, acted_at, notes, student_message,
metadata (jsonb), created_at
```

---

## 4. Stored Function

```sql
-- Bulk-creates compliance items for ALL active/at_risk/probation scholars in one call
SELECT * FROM public.bulk_create_compliance_items(
  p_term_id := '<term-uuid>',
  p_items   := '[
    {
      "item_type": "grades",
      "name": "Latest Copy of Grades",
      "description": "Official grade printout from the Registrar.",
      "due_date": "2026-06-15",
      "allowed_file_types": ["pdf","jpg","png"],
      "grace_period_days": 3
    },
    ...
  ]'::jsonb
);
-- Returns: (enrollment_id, items_created) per scholar
```

---

## 5. Storage Bucket

```
Bucket : scholarship-docs
Access : Private (RLS enforced)
Path   : {student_uuid}/{application_id|enrollment_id}/{filename}
```

To generate a signed URL for file preview:
```ts
const { data } = await supabase.storage
  .from('scholarship-docs')
  .createSignedUrl(storagePath, 60); // 60 seconds
```

---

## 6. Scholar Lifecycle

```
[Student applies on mobile]
        ↓
scholarship_applications (status = submitted)
        ↓
[Staff reviews on web — verifies each application_document]
        ↓
  Approve → scholar_enrollments created (status = active)
  Reject  → application status = rejected, student notified
        ↓
[Staff activates new term on web]
        ↓
bulk_create_compliance_items() called
→ compliance_items created for all active scholars
→ Students notified on mobile
        ↓
[Student uploads each compliance item on mobile]
        ↓
compliance_submissions inserted
compliance_items.status → submitted
→ Web compliance queue updates via realtime
        ↓
[Staff verifies/rejects each submission on web]
        ↓
  Verified → compliance_items.status = verified
  Rejected → status = rejected, student sees it on mobile (realtime), re-uploads
        ↓
[If scholar fails GPA or compliance — staff manually changes status]
active → at_risk → probation → suspended → terminated
(each change requires a reason, written to scholarship_approvals)
```


---

## 8. Pages to Build

### 8.1 `/scholarships` — Dashboard
**Purpose:** Daily overview for SDAO staff

Widgets:
- Active scholars count
- This term's compliance progress (X of Y fully verified)
- Pending applications needing review
- Submissions awaiting verification (action queue count)
- Overdue compliance items count

Charts:
- Applications by status (bar)
- Scholar status distribution (donut)

---

### 8.2 `/scholarships/programs` — Program Management
**List:** code, name, academic year, term, status badge, slots (filled/total), open date, actions
**Filters:** status, academic_year, term, search

**Create/Edit form fields:**
- Code (unique), Name, Short description, Full description
- Sponsor name + description
- Academic year, Term, Open date, Close date
- Tuition discount %, Misc discount %
- Min GPA, Max GPA, Year levels (multi), Programs/courses (multi)
- Total slots

**Status actions:** Save Draft → Publish → Close → Archive

**Requirements tab (inside program):**
- Draggable list per program
- Fields: item_type, name, description, is_required, allowed_file_types, max_file_size_mb
- Add / Edit / Delete

---

### 8.3 `/scholarships/applications` — Application Queue
**List columns:** Reference #, Student name, Student ID, Program, GPA, Submitted date, Status badge
**Filters:** status, program, date range, search

**Application detail `/scholarships/applications/[id]`:**

Left — Student info:
- Name, student ID, email, year level, program, GPA
- Personal statement, family income range, siblings in school

Right — Documents:
- One row per program requirement
- Per row: requirement name → file preview/download → status badge → Verify ✅ / Reject ❌

Action bar:
| Button | DB Write |
|---|---|
| Mark Under Review | `applications.status = under_review` |
| Request More Info | `applications.status = needs_info` + message stored |
| Approve | `applications.status = approved` + INSERT into `scholar_enrollments` + INSERT initial compliance items |
| Reject | `applications.status = rejected` + `rejection_reason` |

Every action → INSERT into `scholarship_approvals`.

---

### 8.4 `/scholarships/scholars` — Scholar Management
**List columns:** Reference #, Student, Program, Year Level, GPA, Status badge, Term, Started
**Filters:** status, program, academic_year, GPA range, search

**Scholar detail `/scholarships/scholars/[id]`:**

Tabs:

**Overview**
- GPA inline edit → `scholar_enrollments.current_gpa` + `gpa_last_updated = now()`
- Status change → `StatusChangeDialog`:
  - Select: active / at_risk / probation / suspended / terminated / completed
  - Required: reason text
  - Writes: `scholar_enrollments.status`, `status_changed_at`, `status_reason` + `scholarship_approvals`

**Compliance (current term)**
- All `compliance_items` for `term_id = active term`
- Per item: name, type, due date, status badge, submitted file preview
- Actions: Verify ✅ / Reject ❌ (with staff_notes) / Waive (with reason)
- "Add Item" button → add one-off compliance item for this scholar

**All Terms History**
- Accordion per term, shows all items and final statuses

**Audit Log**
- Timeline from `scholarship_approvals` for this enrollment + application
- Columns: action, actor name, date, notes

---

### 8.5 `/scholarships/compliance` — Verification Queue (Primary Daily Page)
**Purpose:** Staff's main screen — review all pending document submissions

**List columns:** Student, Program, Item name, Type, Submitted date, Status
**Default filter:** `compliance_items.status = submitted`
**Filters:** term, program, item_type, status, search

**Per row actions:**
- Preview button → `DocumentPreviewModal` (signed URL, PDF viewer or image)
- Verify ✅ → `compliance_submissions.verification_status = verified` + `compliance_items.status = verified`
- Reject ❌ → notes input → both set to `rejected` → mobile student sees update via realtime
- Bulk select → Verify All / Reject All

---

### 8.6 `/scholarships/terms` — Term Management
**List:** All terms, label, open/close dates, active badge

**Create term:** academic_year, term, label, compliance_open_date, compliance_close_date

**Activate term flow:**
1. Staff clicks "Activate"
2. `BulkComplianceDrawer` opens:
   - Staff selects document types from `scholarship_requirements` templates (or custom)
   - Sets due date per document type
   - Preview: "Will create X items across Y scholars"
3. Confirm → calls `bulk_create_compliance_items(term_id, items[])`
4. All active/at_risk/probation scholars get items created
5. Push notification sent to all affected students

---

### 8.7 `/scholarships/reports` — Exports
- Scholars list (CSV/Excel): name, student ID, program, GPA, status, started date
- Applications: filter by program, date range, status
- Compliance summary: per term, per program — % verified, % overdue, % pending

---

## 9. Realtime Subscriptions the Web Should Listen To

```ts
// New application submitted by student
supabase.channel('applications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'scholarship_applications'
  }, () => refetchApplicationCount())
  .subscribe()

// Student uploads a compliance document
supabase.channel('compliance-queue')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'compliance_items',
    filter: 'status=eq.submitted'
  }, () => refetchComplianceQueue())
  .subscribe()
```

---

## 10. Mobile ↔ Web Responsibility Matrix

| Action | Mobile (Student) | Web (Staff) |
|---|---|---|
| Browse open programs | ✅ Read | ✅ Create / Edit / Publish |
| Submit application + docs | ✅ Write | — |
| Review application | — | ✅ Verify docs / Approve / Reject |
| View scholarship status | ✅ Read (realtime) | — |
| Upload compliance documents | ✅ Write | — |
| Verify / reject compliance docs | — | ✅ Write (realtime pushes to mobile) |
| View compliance status | ✅ Read (realtime) | ✅ Read + action |
| Change scholar status (GPA, probation) | — | ✅ Write |
| Manage terms + bulk item creation | — | ✅ Write |
| View audit history | — | ✅ Read |
| Export reports | — | ✅ Read |

---

## 11. Status Enums Reference

```ts
// scholarship_programs.status
type ProgramStatus = 'draft' | 'open' | 'closed' | 'archived'

// scholarship_applications.status
type ApplicationStatus =
  'draft' | 'submitted' | 'under_review' |
  'needs_info' | 'approved' | 'rejected' | 'withdrawn'

// scholar_enrollments.status
type ScholarStatus =
  'active' | 'at_risk' | 'probation' |
  'suspended' | 'terminated' | 'completed'

// compliance_items.status
type ComplianceStatus =
  'pending' | 'submitted' | 'verified' |
  'rejected' | 'overdue' | 'waived'

// compliance_items.item_type
type ComplianceItemType =
  'grades' | 'enrollment_proof' | 'good_moral' |
  'medical_clearance' | 'community_service' |
  'interview' | 'contract_signing' | 'other'
```

---

## 12. What to Build First (Priority Order)

2. **Terms page** — Activate term + bulk compliance item creation (unlocks the whole flow)
3. **Compliance queue** — Most-used daily page, highest value
4. **Applications queue** — Review + approve → creates enrollments
5. **Scholars page** — GPA updates + status changes
6. **Programs page** — Create/edit scholarship offerings
7. **Dashboard** — Aggregate stats
8. **Reports** — CSV exports

---

## 13. Mobile ↔ Web Cross-Check (Verified Against Source Code)

> Cross-checked against `lib/scholarships/scholarshipApi.ts` and `lib/scholarships/scholarshipStore.ts`

### ✅ Processes that are fully implemented on mobile and need a matching web action

| Mobile does | Web must do (counterpart) |
|---|---|
| `createApplication()` → status = `draft` | Web sees it only when status = `submitted` |
| `submitApplication()` → status = `submitted`, validates all required docs uploaded | Web receives it in the Applications queue |
| `uploadApplicationDocument()` → uploads to `scholarship-docs/{userId}/{applicationId}/` | Web previews via signed URL from same path |
| `deleteApplicationDocument()` → only allowed while `verification_status = pending` | Web must NOT verify a doc the student deleted (check existence before verifying) |
| `submitComplianceItem()` → uploads to `scholarship-docs/{userId}/compliance/{enrollmentId}/{itemId}/` | Web previews from this exact path in compliance queue |
| `getMyActiveEnrollment()` → fetches `status IN (active, compliant, at_risk, probation)` | Web must set one of these statuses — `compliant` is also a valid active status |
| `getEnrollmentHistory()` → fetches `status IN (suspended, terminated, completed)` | Web sets these terminal statuses to end the enrollment |
| `terminateScholarship()` → **DELETES the enrollment row** + sends notification | ⚠️ Web must do the same: DELETE enrollment row (not just status update) and INSERT into `notifications` table |
| `subscribeToComplianceItems(enrollmentId)` → mobile listens for ANY change | Web must UPDATE `compliance_items.status` — mobile reflects it instantly |
| `subscribeToMyApplications(studentId)` → mobile listens for status changes | Web must UPDATE `scholarship_applications.status` — mobile reflects it instantly |
| `subscribeToPrograms()` → mobile refreshes list on any program change | Web publish/close/archive triggers mobile list refresh automatically |

---

### ⚠️ Gaps found — things the plan was missing

**1. `compliant` is a valid scholar status**
- Mobile fetches enrollments where `status IN ('active', 'compliant', 'at_risk', 'probation')`
- The plan listed statuses as: `active | at_risk | probation | suspended | terminated | completed`
- **Fix:** Add `compliant` as a status — it means "active AND all compliance verified for this term"
- Web should be able to set: `active → compliant` (auto or manual after all items verified)

**2. Termination = DELETE not status update**
- `terminateScholarship()` in the API **deletes the row** from `scholar_enrollments`, it does NOT set `status = terminated`
- **Fix:** Web terminate action must:
  1. INSERT into `notifications` table (category = `scholarships`, user_id = student)
  2. DELETE the `scholar_enrollments` row
  3. INSERT into `scholarship_approvals` audit log before deleting

**3. Notifications table must be written by web on key actions**
- Mobile's `notifySelf()` helper inserts into `public.notifications` for: application started, application submitted, termination
- Web must insert notifications for: approval, rejection, compliance verified, compliance rejected, status changes
- **Notification row format:**
```ts
{
  user_id: studentId,         // student's auth UUID
  category: 'scholarships',
  title: string,
  body: string,
  href: '/student-development-affairs',  // or '/my-scholarship'
  source: 'SDA Office',
  notification_type: 'success' | 'info' | 'error'
}
```

**4. Storage path convention (critical for file preview)**
- Application documents: `{studentId}/{applicationId}/{timestamp}_{filename}`
- Compliance submissions: `{studentId}/compliance/{enrollmentId}/{itemId}/{timestamp}_{filename}`
- Web must use `createSignedUrl()` not `getPublicUrl()` — bucket is **private**
```ts
// Correct way to get preview URL on web (private bucket)
const { data } = await supabase.storage
  .from('scholarship-docs')
  .createSignedUrl(storagePath, 60) // 60 sec expiry
```

**5. `application_documents` can only be deleted while `verification_status = pending`**
- The mobile enforces: `.eq('verification_status', 'pending')` on delete
- Web: once you verify or reject a document, it cannot be deleted — only the student can replace it by re-uploading (which creates a new row)

**6. Application `updateApplication()` only works on `status = draft`**
- Mobile enforces `.eq('status', 'draft')` on update
- Web cannot edit application content — only the student can while it's a draft
- Web can only change the **status** field (under_review, needs_info, approved, rejected)

**7. Realtime channels the web must emit to (mobile is listening)**
- `compliance_items` table → UPDATE `status` column → mobile `subscribeToComplianceItems()` fires
- `scholarship_applications` table → UPDATE `status` column → mobile `subscribeToMyApplications()` fires  
- `scholarship_programs` table → any change → mobile `subscribeToPrograms()` fires and refreshes list
- These are standard Postgres changes — just doing the UPDATE triggers it automatically, no extra code needed

---

### 📋 Correct Status Enums (updated)

```ts
// scholar_enrollments.status — CORRECTED (compliant added)
type ScholarStatus =
  'active' | 'compliant' | 'at_risk' | 'probation' |
  'suspended' | 'terminated' | 'completed'

// NOTE: 'terminated' means the row was DELETED, not just a status value
// The scholarship_approvals audit record should be inserted BEFORE deletion
```

---

### 🔔 Web Notifications Checklist

Every web action below must INSERT a row into `public.notifications`:

| Web action | notification_type | title | href |
|---|---|---|---|
| Approve application | `success` | "Scholarship Application Approved" | `/my-scholarship` |
| Reject application | `error` | "Scholarship Application Rejected" | `/student-development-affairs` |
| Request more info | `info` | "Additional Info Requested" | `/student-development-affairs` |
| Verify compliance item | `success` | "Document Verified" | `/my-scholarship` |
| Reject compliance item | `error` | "Document Rejected – Please Re-submit" | `/my-scholarship` |
| Change status to at_risk | `info` | "Scholarship Status Update" | `/my-scholarship` |
| Change status to probation | `error` | "Scholarship On Probation" | `/my-scholarship` |
| Terminate (delete) enrollment | `error` | "Scholarship Terminated" | `/student-development-affairs` |

---

*Generated from mobile app codebase — `campuscare-application` / `lib/scholarships/`*
*Supabase migration: `supabase/migrations/20260426_scholarships_system.sql`*
*Terms migration: `add_scholarship_terms_and_bulk_compliance`*
*Cross-checked: `lib/scholarships/scholarshipApi.ts` + `lib/scholarships/scholarshipStore.ts`*
