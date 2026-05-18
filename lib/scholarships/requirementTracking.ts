import type {
  ApplicationStatus,
  ComplianceItem,
  ComplianceStatus,
  ScholarshipApplication,
  ScholarEnrollment,
} from './types';

export type RequirementTab = 'pending' | 'submitted' | 'under_review';

export type RequirementTrackItem = {
  id: string;
  kind: 'compliance' | 'application';
  title: string;
  subtitle: string;
  tab: RequirementTab;
  statusLabel: string;
  dateLabel: string;
  secondaryLabel: string;
  sortKey: string;
  complianceItem?: ComplianceItem;
  application?: ScholarshipApplication;
};

const COMPLIANCE_PENDING: ComplianceStatus[] = ['pending', 'rejected', 'overdue'];
const APPLICATION_PENDING: ApplicationStatus[] = ['draft'];
const APPLICATION_SUBMITTED: ApplicationStatus[] = ['submitted'];
const APPLICATION_UNDER_REVIEW: ApplicationStatus[] = ['under_review', 'needs_info'];

export const REQUIREMENT_TABS: { id: RequirementTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'under_review', label: 'Under Review' },
];

function complianceTab(status: ComplianceStatus): RequirementTab | null {
  if (COMPLIANCE_PENDING.includes(status)) return 'pending';
  if (status === 'submitted') return 'under_review';
  return null;
}

function applicationTab(status: ApplicationStatus): RequirementTab | null {
  if (APPLICATION_PENDING.includes(status)) return 'pending';
  if (APPLICATION_SUBMITTED.includes(status)) return 'submitted';
  if (APPLICATION_UNDER_REVIEW.includes(status)) return 'under_review';
  return null;
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatSubmittedDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Date pending';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function complianceStatusLabel(status: ComplianceStatus): string {
  if (status === 'overdue') return 'Overdue';
  if (status === 'rejected') return 'Resubmit';
  if (status === 'pending') return 'Pending';
  if (status === 'submitted') return 'Under Review';
  return status;
}

function applicationStatusLabel(status: ApplicationStatus): string {
  if (status === 'draft') return 'Pending';
  if (status === 'needs_info') return 'Needs Info';
  if (status === 'under_review') return 'Under Review';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

export function buildRequirementTrackItems(
  enrollment: ScholarEnrollment | null,
  applications: ScholarshipApplication[],
): RequirementTrackItem[] {
  const items: RequirementTrackItem[] = [];

  for (const item of enrollment?.complianceItems ?? []) {
    const tab = complianceTab(item.status);
    if (!tab) continue;
    const programName = enrollment?.program?.name ?? 'Scholarship';
    items.push({
      id: `compliance-${item.id}`,
      kind: 'compliance',
      title: item.name,
      subtitle: programName,
      tab,
      statusLabel: complianceStatusLabel(item.status),
      dateLabel: formatDueDate(item.dueDate),
      secondaryLabel:
        item.status === 'submitted'
          ? 'Awaiting verification'
          : item.daysUntilDue != null && item.daysUntilDue <= 0
            ? 'Due today'
            : item.daysUntilDue != null
              ? `${item.daysUntilDue} days left`
              : 'Action required',
      sortKey: item.dueDate,
      complianceItem: item,
    });
  }

  for (const app of applications) {
    if (app.isArchived) continue;
    const tab = applicationTab(app.status);
    if (!tab) continue;
    const programName = app.program?.name ?? 'Scholarship application';
    items.push({
      id: `application-${app.id}`,
      kind: 'application',
      title: programName,
      subtitle: app.referenceNumber ? `Ref. ${app.referenceNumber}` : 'Application',
      tab,
      statusLabel: applicationStatusLabel(app.status),
      dateLabel: formatSubmittedDate(app.submittedAt ?? app.createdAt),
      secondaryLabel:
        app.status === 'draft' ? 'Complete and submit' : tab === 'under_review' ? 'Staff reviewing' : 'Submitted',
      sortKey: app.submittedAt ?? app.createdAt,
      application: app,
    });
  }

  const tabOrder: Record<RequirementTab, number> = {
    pending: 0,
    submitted: 1,
    under_review: 2,
  };

  return items.sort((a, b) => {
    if (tabOrder[a.tab] !== tabOrder[b.tab]) return tabOrder[a.tab] - tabOrder[b.tab];
    return a.sortKey.localeCompare(b.sortKey);
  });
}

export function filterRequirementsByTab(
  items: RequirementTrackItem[],
  tab: RequirementTab,
): RequirementTrackItem[] {
  return items.filter((item) => item.tab === tab);
}

export function countPendingRequirements(items: RequirementTrackItem[]): number {
  return items.filter((item) => item.tab === 'pending').length;
}

/** Next pending item for the hub preview card (matches clinic upcoming-only preview). */
export function getHighlightedRequirement(items: RequirementTrackItem[]): RequirementTrackItem | null {
  const pending = items.filter((i) => i.tab === 'pending');
  if (pending.length === 0) return null;
  return [...pending].sort((a, b) => a.sortKey.localeCompare(b.sortKey))[0];
}
