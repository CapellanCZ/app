import { supabase } from '@/lib/supabase';
import type { DisciplineCaseStep } from '@/components/discipline-office';
import type { NTEStatus } from '@/components/discipline-office/NTECard';

// ─── Types matching the DB schema ────────────────────────────────────────────

export type DBCase = {
  id: string;
  case_type: string;
  description: string;
  status: 'new' | 'ongoing' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  severity: 'minor' | 'major';
  progress_percent: number;
  current_step_index: number;
  case_steps: DisciplineCaseStep[];
  reported_at: string;
  student_id: string;
  student_name: string;
};

export type DBSanction = {
  id: string;
  sanction_type: string;
  description: string;
  status: string;
  due_date: string;
  notes: string;
  case_id: string | null;
  progress: { current: number; total: number; unit: string } | null;
  review_days_min: number | null;
  review_days_max: number | null;
  review_status_label: string | null;
  student_id: string;
  student_name: string;
};

export type DBNTE = {
  id: string;
  case_type: string;
  description: string;
  issued_at: string;
  deadline_at: string | null;
  status: NTEStatus;
  response_text: string | null;
  responded_at: string | null;
  case_id: string | null;
  student_id: string;
  student_name: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function completedSummary(steps: DisciplineCaseStep[], currentIndex: number): string {
  const completed = Math.min(currentIndex, steps.length);
  return `${completed} of ${steps.length} Completed`;
}

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetch all cases for a given student_id */
export async function fetchCasesByStudent(studentId: string): Promise<DBCase[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('discipline_cases')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) { console.error('[disciplineApi] fetchCasesByStudent', error); return []; }
  return (data ?? []) as DBCase[];
}

/** Fetch all sanctions for a given student_id */
export async function fetchSanctionsByStudent(studentId: string): Promise<DBSanction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('discipline_sanctions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) { console.error('[disciplineApi] fetchSanctionsByStudent', error); return []; }
  return (data ?? []) as DBSanction[];
}

/** Fetch all NTEs for a given student_id */
export async function fetchNTEsByStudent(studentId: string): Promise<DBNTE[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('discipline_nte')
    .select('*')
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false });
  if (error) { console.error('[disciplineApi] fetchNTEsByStudent', error); return []; }
  return (data ?? []) as DBNTE[];
}

/** Submit a student's written NTE response */
export async function submitNTEResponse(
  nteId: string,
  responseText: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase
    .from('discipline_nte')
    .update({
      status: 'responded',
      response_text: responseText,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', nteId);
  if (error) { console.error('[disciplineApi] submitNTEResponse', error); return { error: error.message }; }
  return { error: null };
}

// ─── Data mappers (DB → component props) ─────────────────────────────────────

export function mapCaseToCardProps(c: DBCase) {
  const steps: DisciplineCaseStep[] = Array.isArray(c.case_steps) ? c.case_steps : [];
  return {
    id: c.id,
    title: c.case_type,
    description: c.description,
    severity: (c.severity ?? 'minor') as 'minor' | 'major',
    progressPercent: c.progress_percent ?? 0,
    completedSummary: completedSummary(steps, c.current_step_index ?? 0),
    percentLabel: `${c.progress_percent ?? 0}%`,
    currentStepIndex: c.current_step_index ?? 0,
    steps,
  };
}

export function mapSanctionToCardProps(s: DBSanction) {
  const rawStatus = (s.status ?? '').toLowerCase().replace(' ', '_');
  const status = (['in_progress', 'pending', 'in_review'].includes(rawStatus)
    ? rawStatus
    : 'pending') as 'in_progress' | 'pending' | 'in_review';
  return {
    id: s.id,
    title: s.sanction_type,
    description: s.description || s.notes,
    caseTypeLabel: s.case_id ?? '',
    dueDateLabel: s.due_date,
    status,
    progress: s.progress ?? undefined,
    reviewDaysMin: s.review_days_min ?? undefined,
    reviewDaysMax: s.review_days_max ?? undefined,
    reviewStatusLabel: s.review_status_label ?? undefined,
  };
}

export function mapNTEToCardProps(n: DBNTE) {
  const deadlineAt = n.deadline_at ? new Date(n.deadline_at) : null;
  const isOverdue = deadlineAt ? deadlineAt < new Date() && n.status === 'pending_response' : false;
  return {
    id: n.id,
    caseType: n.case_type,
    description: n.description,
    issuedAtLabel: formatDateLabel(n.issued_at),
    deadlineLabel: deadlineAt ? formatDateLabel(n.deadline_at!) : undefined,
    status: n.status,
    isOverdue,
  };
}
