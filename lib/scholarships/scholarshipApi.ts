// ============================================
// SCHOLARSHIP API FUNCTIONS
// Direct Supabase queries for scholarship system
// ============================================

import { supabase } from '@/lib/supabase';
import type {
  ScholarshipProgram,
  ScholarshipProgramRow,
  ScholarshipRequirement,
  ScholarshipRequirementRow,
  ScholarshipApplication,
  ScholarshipApplicationRow,
  ApplicationDocument,
  ApplicationDocumentRow,
  ScholarEnrollment,
  ScholarEnrollmentRow,
  ComplianceItem,
  ComplianceItemRow,
  ComplianceSubmission,
  ComplianceSubmissionRow,
  CreateApplicationInput,
  UpdateApplicationInput,
  UploadDocumentInput,
  SubmitComplianceInput,
  ApplicationStatus,
} from './types';

// ============================================
// MAPPERS: DB row → TypeScript type
// ============================================

const mapProgramRow = (row: ScholarshipProgramRow): ScholarshipProgram => ({
  id: row.id,
  code: row.code,
  name: row.name,
  shortDescription: row.short_description,
  fullDescription: row.full_description,
  status: row.status as ScholarshipProgram['status'],
  applicationOpenDate: row.application_open_date,
  applicationCloseDate: row.application_close_date,
  academicYear: row.academic_year,
  term: row.term,
  minGpa: row.min_gpa,
  maxGpa: row.max_gpa,
  yearLevels: row.year_levels,
  programs: row.programs,
  tuitionDiscountPercent: row.tuition_discount_percent,
  miscDiscountPercent: row.misc_discount_percent,
  monthlyStipend: row.monthly_stipend,
  totalSlots: row.total_slots,
  filledSlots: row.filled_slots,
  sponsorName: row.sponsor_name,
  sponsorDescription: row.sponsor_description,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  publishedAt: row.published_at,
  archivedAt: row.archived_at,
});

const mapRequirementRow = (row: ScholarshipRequirementRow): ScholarshipRequirement => ({
  id: row.id,
  programId: row.program_id,
  itemType: row.item_type as ScholarshipRequirement['itemType'],
  name: row.name,
  description: row.description,
  isRequired: row.is_required,
  allowedFileTypes: row.allowed_file_types,
  maxFileSizeMb: row.max_file_size_mb,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapApplicationRow = (row: ScholarshipApplicationRow): ScholarshipApplication => ({
  id: row.id,
  programId: row.program_id,
  studentId: row.student_id,
  status: row.status as ScholarshipApplication['status'],
  referenceNumber: row.reference_number,
  currentGpa: row.current_gpa,
  currentYearLevel: row.current_year_level,
  currentProgram: row.current_program,
  enrollmentStatus: row.enrollment_status,
  familyIncomeRange: row.family_income_range,
  hasSiblingsInSchool: row.has_siblings_in_school,
  personalStatement: row.personal_statement,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at,
  reviewNotes: row.review_notes,
  rejectionReason: row.rejection_reason,
  academicScore: row.academic_score,
  financialNeedScore: row.financial_need_score,
  interviewScore: row.interview_score,
  totalScore: row.total_score,
  submittedAt: row.submitted_at,
  decidedAt: row.decided_at,
  isArchived: row.is_archived,
  archivedAt: row.archived_at,
  archivedReason: row.archived_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapDocumentRow = (row: ApplicationDocumentRow): ApplicationDocument => ({
  id: row.id,
  applicationId: row.application_id,
  requirementId: row.requirement_id,
  originalFilename: row.original_filename,
  storageBucket: row.storage_bucket,
  storagePath: row.storage_path,
  fileType: row.file_type as ApplicationDocument['fileType'],
  fileSizeBytes: row.file_size_bytes,
  mimeType: row.mime_type,
  uploadedBy: row.uploaded_by,
  verifiedBy: row.verified_by,
  verifiedAt: row.verified_at,
  verificationStatus: row.verification_status as ApplicationDocument['verificationStatus'],
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEnrollmentRow = (row: ScholarEnrollmentRow): ScholarEnrollment => ({
  id: row.id,
  programId: row.program_id,
  studentId: row.student_id,
  applicationId: row.application_id,
  status: row.status as ScholarEnrollment['status'],
  referenceNumber: row.reference_number,
  academicYear: row.academic_year,
  term: row.term,
  yearLevel: row.year_level,
  currentGpa: row.current_gpa,
  gpaLastUpdated: row.gpa_last_updated,
  contractSignedAt: row.contract_signed_at,
  contractSigneeName: row.contract_signee_name,
  assignedCounselor: row.assigned_counselor,
  totalDisbursed: row.total_disbursed,
  lastDisbursementAt: row.last_disbursement_at,
  statusChangedAt: row.status_changed_at,
  statusChangedBy: row.status_changed_by,
  statusReason: row.status_reason,
  startedAt: row.started_at,
  expectedEndAt: row.expected_end_at,
  endedAt: row.ended_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapComplianceItemRow = (row: ComplianceItemRow): ComplianceItem => ({
  id: row.id,
  enrollmentId: row.enrollment_id,
  itemType: row.item_type as ComplianceItem['itemType'],
  name: row.name,
  description: row.description,
  dueDate: row.due_date,
  gracePeriodDays: row.grace_period_days,
  reminderDaysBefore: row.reminder_days_before,
  allowedFileTypes: row.allowed_file_types,
  maxFileSizeMb: row.max_file_size_mb,
  status: row.status as ComplianceItem['status'],
  waivedBy: row.waived_by,
  waivedAt: row.waived_at,
  waiveReason: row.waive_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapComplianceSubmissionRow = (row: ComplianceSubmissionRow): ComplianceSubmission => ({
  id: row.id,
  itemId: row.item_id,
  enrollmentId: row.enrollment_id,
  originalFilename: row.original_filename,
  storageBucket: row.storage_bucket,
  storagePath: row.storage_path,
  fileType: row.file_type as ComplianceSubmission['fileType'],
  fileSizeBytes: row.file_size_bytes,
  mimeType: row.mime_type,
  submittedAt: row.submitted_at,
  submittedBy: row.submitted_by,
  verifiedBy: row.verified_by,
  verifiedAt: row.verified_at,
  verificationStatus: row.verification_status as ComplianceSubmission['verificationStatus'],
  staffNotes: row.staff_notes,
  isResubmission: row.is_resubmission,
  previousSubmissionId: row.previous_submission_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ============================================
// PROGRAMS
// ============================================

export async function getPrograms(): Promise<ScholarshipProgram[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scholarship_programs')
    .select('*')
    .eq('status', 'open')
    .order('application_close_date', { ascending: true });

  if (error) throw error;
  return (data as ScholarshipProgramRow[] || []).map(mapProgramRow);
}

export async function getProgramById(id: string): Promise<ScholarshipProgram & { requirements: ScholarshipRequirement[] }> {
  if (!supabase) throw new Error('Supabase not initialized');

  const [programRes, requirementsRes] = await Promise.all([
    supabase.from('scholarship_programs').select('*').eq('id', id).single(),
    supabase
      .from('scholarship_requirements')
      .select('*')
      .eq('program_id', id)
      .order('sort_order', { ascending: true }),
  ]);

  if (programRes.error) throw programRes.error;
  if (requirementsRes.error) throw requirementsRes.error;

  return {
    ...mapProgramRow(programRes.data as ScholarshipProgramRow),
    requirements: (requirementsRes.data as ScholarshipRequirementRow[] || []).map(mapRequirementRow),
  };
}

// ============================================
// APPLICATIONS
// ============================================

export async function getMyApplications(): Promise<ScholarshipApplication[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scholarship_applications')
    .select(`
      *,
      program:scholarship_programs(*)
    `)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data as (ScholarshipApplicationRow & { program: ScholarshipProgramRow })[] || []).map(row => ({
    ...mapApplicationRow(row),
    program: mapProgramRow(row.program),
  }));
}

export async function getApplicationById(id: string): Promise<ScholarshipApplication & { documents: ApplicationDocument[] }> {
  if (!supabase) throw new Error('Supabase not initialized');

  const [appRes, docsRes] = await Promise.all([
    supabase
      .from('scholarship_applications')
      .select(`
        *,
        program:scholarship_programs(*)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('application_documents')
      .select(`
        *,
        requirement:scholarship_requirements(*)
      `)
      .eq('application_id', id),
  ]);

  if (appRes.error) throw appRes.error;
  if (docsRes.error) throw docsRes.error;

  const appRow = appRes.data as ScholarshipApplicationRow & { program: ScholarshipProgramRow };
  const docRows = docsRes.data as (ApplicationDocumentRow & { requirement: ScholarshipRequirementRow })[] || [];

  return {
    ...mapApplicationRow(appRow),
    program: mapProgramRow(appRow.program),
    documents: docRows.map(row => ({
      ...mapDocumentRow(row),
      requirement: mapRequirementRow(row.requirement),
    })),
  };
}

export async function createApplication(input: CreateApplicationInput): Promise<ScholarshipApplication> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('scholarship_applications')
    .insert({
      program_id: input.programId,
      student_id: user.id,
      status: 'draft',
      current_gpa: input.currentGpa,
      current_year_level: input.currentYearLevel,
      current_program: input.currentProgram,
      enrollment_status: input.enrollmentStatus,
      family_income_range: input.familyIncomeRange,
      has_siblings_in_school: input.hasSiblingsInSchool,
      personal_statement: input.personalStatement,
    })
    .select()
    .single();

  if (error) throw error;
  return mapApplicationRow(data as ScholarshipApplicationRow);
}

export async function updateApplication(id: string, input: UpdateApplicationInput): Promise<ScholarshipApplication> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scholarship_applications')
    .update({
      current_gpa: input.currentGpa,
      current_year_level: input.currentYearLevel,
      current_program: input.currentProgram,
      enrollment_status: input.enrollmentStatus,
      family_income_range: input.familyIncomeRange,
      has_siblings_in_school: input.hasSiblingsInSchool,
      personal_statement: input.personalStatement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft') // Only drafts can be edited
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Application not found or not in draft status');
  return mapApplicationRow(data as ScholarshipApplicationRow);
}

export async function submitApplication(id: string): Promise<ScholarshipApplication> {
  if (!supabase) throw new Error('Supabase not initialized');

  // First check if all required documents are uploaded
  const { data: docs, error: docsError } = await supabase
    .from('application_documents')
    .select(`
      *,
      requirement:scholarship_requirements(is_required)
    `)
    .eq('application_id', id);

  if (docsError) throw docsError;

  const requiredDocs = (docs || []).filter(d => (d.requirement as unknown as { is_required: boolean }).is_required);
  if (requiredDocs.length === 0) {
    // Get requirements to check
    const { data: app } = await supabase
      .from('scholarship_applications')
      .select('program_id')
      .eq('id', id)
      .single();
    
    if (app) {
      const { data: reqs } = await supabase
        .from('scholarship_requirements')
        .select('*')
        .eq('program_id', app.program_id)
        .eq('is_required', true);
      
      if (reqs && reqs.length > 0) {
        throw new Error(`Missing ${reqs.length} required document(s)`);
      }
    }
  }

  const { data, error } = await supabase
    .from('scholarship_applications')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft')
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Application not found or already submitted');
  return mapApplicationRow(data as ScholarshipApplicationRow);
}

export async function archiveApplication(id: string, reason?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from('scholarship_applications')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_reason: reason || 'User deleted',
    })
    .eq('id', id)
    .eq('status', 'draft'); // Only drafts can be deleted

  if (error) throw error;
}

// ============================================
// DOCUMENTS
// ============================================

export async function uploadApplicationDocument(input: UploadDocumentInput): Promise<ApplicationDocument> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upload to storage
  const filePath = `${user.id}/${input.applicationId}/${Date.now()}_${input.fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('scholarship-docs')
    .upload(filePath, input.file, {
      contentType: input.mimeType,
    });

  if (uploadError) throw uploadError;

  // Create database record
  const { data, error } = await supabase
    .from('application_documents')
    .insert({
      application_id: input.applicationId,
      requirement_id: input.requirementId,
      original_filename: input.fileName,
      storage_bucket: 'scholarship-docs',
      storage_path: filePath,
      file_type: input.fileName.endsWith('.pdf') ? 'other' : 'id_photo', // Simplified - improve based on actual type
      file_size_bytes: input.file.size,
      mime_type: input.mimeType,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Rollback storage upload
    await supabase.storage.from('scholarship-docs').remove([filePath]);
    throw error;
  }

  return {
    ...mapDocumentRow(data as ApplicationDocumentRow),
    publicUrl: getDocumentPublicUrl('scholarship-docs', filePath),
  };
}

export async function deleteApplicationDocument(docId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');

  // Get document info first
  const { data: doc, error: fetchError } = await supabase
    .from('application_documents')
    .select('*')
    .eq('id', docId)
    .single();

  if (fetchError) throw fetchError;
  if (!doc) throw new Error('Document not found');

  const docRow = doc as ApplicationDocumentRow;

  // Delete from storage
  await supabase.storage.from(docRow.storage_bucket).remove([docRow.storage_path]);

  // Delete from database
  const { error } = await supabase
    .from('application_documents')
    .delete()
    .eq('id', docId)
    .eq('verification_status', 'pending'); // Only pending docs can be deleted

  if (error) throw error;
}

export function getDocumentPublicUrl(bucket: string, path: string): string {
  if (!supabase) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ============================================
// ENROLLMENTS (My Scholarship)
// ============================================

export async function getMyActiveEnrollment(): Promise<ScholarEnrollment & { program: ScholarshipProgram; complianceItems: ComplianceItem[] } | null> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scholar_enrollments')
    .select(`
      *,
      program:scholarship_programs(*),
      complianceItems:compliance_items(
        *,
        submission:compliance_submissions(*)
      )
    `)
    .in('status', ['active', 'compliant', 'at_risk', 'probation'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    throw error;
  }

  if (!data) return null;

  const row = data as ScholarEnrollmentRow & { 
    program: ScholarshipProgramRow;
    complianceItems: (ComplianceItemRow & { submission: ComplianceSubmissionRow })[];
  };

  return {
    ...mapEnrollmentRow(row),
    program: mapProgramRow(row.program),
    complianceItems: row.complianceItems.map(item => ({
      ...mapComplianceItemRow(item),
      submission: item.submission ? mapComplianceSubmissionRow(item.submission) : undefined,
      daysUntilDue: Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      isOverdue: new Date(item.due_date) < new Date() && item.status !== 'waived',
    })),
  };
}

export async function getEnrollmentHistory(): Promise<ScholarEnrollment[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scholar_enrollments')
    .select(`
      *,
      program:scholarship_programs(*)
    `)
    .in('status', ['suspended', 'terminated', 'completed'])
    .order('ended_at', { ascending: false });

  if (error) throw error;
  
  return (data as (ScholarEnrollmentRow & { program: ScholarshipProgramRow })[] || []).map(row => ({
    ...mapEnrollmentRow(row),
    program: mapProgramRow(row.program),
  }));
}

// ============================================
// COMPLIANCE SUBMISSIONS
// ============================================

export async function submitComplianceItem(input: SubmitComplianceInput): Promise<ComplianceSubmission> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upload to storage
  const filePath = `${user.id}/compliance/${input.enrollmentId}/${input.itemId}/${Date.now()}_${input.fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('scholarship-docs')
    .upload(filePath, input.file, {
      contentType: input.mimeType,
    });

  if (uploadError) throw uploadError;

  // Create submission record
  const { data, error } = await supabase
    .from('compliance_submissions')
    .insert({
      item_id: input.itemId,
      enrollment_id: input.enrollmentId,
      original_filename: input.fileName,
      storage_bucket: 'scholarship-docs',
      storage_path: filePath,
      file_type: input.fileName.endsWith('.pdf') ? 'other' : 'certificate',
      file_size_bytes: input.file.size,
      mime_type: input.mimeType,
      submitted_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Rollback storage
    await supabase.storage.from('scholarship-docs').remove([filePath]);
    throw error;
  }

  // Update compliance item status
  await supabase
    .from('compliance_items')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', input.itemId);

  return {
    ...mapComplianceSubmissionRow(data as ComplianceSubmissionRow),
    publicUrl: getDocumentPublicUrl('scholarship-docs', filePath),
  };
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToApplication(
  applicationId: string,
  callback: (payload: { eventType: string; new: ScholarshipApplication; old: ScholarshipApplication | null }) => void
) {
  if (!supabase) throw () => {};

  return supabase
    .channel(`application:${applicationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'scholarship_applications',
        filter: `id=eq.${applicationId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: mapApplicationRow(payload.new as ScholarshipApplicationRow),
          old: payload.old ? mapApplicationRow(payload.old as ScholarshipApplicationRow) : null,
        });
      }
    )
    .subscribe();
}

export function subscribeToComplianceItems(
  enrollmentId: string,
  callback: (payload: { eventType: string; new: ComplianceItem; old: ComplianceItem | null }) => void
) {
  if (!supabase) throw () => {};

  return supabase
    .channel(`compliance:${enrollmentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'compliance_items',
        filter: `enrollment_id=eq.${enrollmentId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: mapComplianceItemRow(payload.new as ComplianceItemRow),
          old: payload.old ? mapComplianceItemRow(payload.old as ComplianceItemRow) : null,
        });
      }
    )
    .subscribe();
}
