// ============================================
// WELFARE OFFICE TYPES (matches database enum)
// ============================================
export type WelfareOffice = 'health' | 'counseling' | 'sdao' | 'discipline';

export const WELFARE_OFFICE_LABELS: Record<WelfareOffice, string> = {
  health: 'Health Services Clinic',
  counseling: 'Counseling & Guidance Office',
  sdao: 'Student Development & Affairs',
  discipline: 'Discipline Office',
};

// ============================================
// REFERRAL STATUS
// ============================================
export type ReferralStatus = 'pending' | 'in_review' | 'scheduled' | 'completed' | 'cancelled';

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ============================================
// REFERRAL CATEGORY
// ============================================
export type ReferralCategory =
  | 'mental_health'
  | 'physical_health'
  | 'behavioral'
  | 'academic'
  | 'family_issue'
  | 'bullying'
  | 'disciplinary'
  | 'financial'
  | 'other';

export const CATEGORY_LABELS: Record<ReferralCategory, string> = {
  mental_health: 'Mental Health',
  physical_health: 'Physical Health',
  behavioral: 'Behavioral',
  academic: 'Academic Concern',
  family_issue: 'Family Issue',
  bullying: 'Bullying',
  disciplinary: 'Disciplinary',
  financial: 'Financial',
  other: 'Other',
};

// ============================================
// PRIORITY (ADMIN ONLY - never shown to students)
// ============================================
export type ReferralPriority = 'normal' | 'urgent' | 'critical';

export const PRIORITY_LABELS: Record<ReferralPriority, string> = {
  normal: 'Normal',
  urgent: 'Urgent',
  critical: 'Critical',
};

// ============================================
// STUDENT-FACING REFERRAL (from student_referrals view)
// NO priority, NO internal_notes, NO attachments, NO staff details
// ============================================
export type StudentReferral = {
  id: string;
  referenceId: string;
  studentId: string;
  fromService: WelfareOffice;
  toService: WelfareOffice;
  status: ReferralStatus;
  category: ReferralCategory;
  reason: string;
  appointmentDate?: string;
  appointmentLocation?: string;
  studentNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

// ============================================
// ADMIN-FACING REFERRAL (full table access)
// Includes all fields for staff/admin dashboards
// ============================================
export type AdminReferral = StudentReferral & {
  // Admin-only fields
  priority: ReferralPriority;
  reasonSummary?: string;
  referredBy?: string;
  assignedTo?: string;
  internalNotes?: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  isArchived: boolean;
};

// ============================================
// LEGACY TYPE (for backward compatibility during migration)
// ============================================
export type Referral = StudentReferral;

// ============================================
// FILTER & SORTING TYPES
// ============================================
export type ReferralFilter = {
  status?: ReferralStatus | 'all';
  category?: ReferralCategory | 'all';
  fromService?: WelfareOffice | 'all';
  searchQuery?: string;
};

export type ReferralSort = {
  field: 'createdAt' | 'updatedAt' | 'appointmentDate' | 'status';
  direction: 'asc' | 'desc';
};
