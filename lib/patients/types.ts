export type PatientType = 'student' | 'faculty';

/** Safe mobile fields from `patients` — never include medical_notes. */
export type Patient = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  patient_type: PatientType;
  student_id: string | null;
  employee_id: string | null;
  affiliation: string | null;
  phone: string | null;
  /** Storage path or public URL in `avatars` bucket. */
  avatar_url: string | null;
};

export type EnrollmentStatus = 'unknown' | 'enrolled' | 'not_enrolled';
