import * as api from './scholarshipApi';

type RefCountedSubscription = {
  count: number;
  cleanup: (() => void) | null;
  key: string | null;
};

const programsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
  key: null,
};

const myApplicationsSubscription: RefCountedSubscription = {
  count: 0,
  cleanup: null,
  key: null,
};

const complianceSubscriptions = new Map<string, RefCountedSubscription>();

function releaseSlot(slot: RefCountedSubscription) {
  slot.count = Math.max(0, slot.count - 1);
  if (slot.count === 0 && slot.cleanup) {
    slot.cleanup();
    slot.cleanup = null;
    slot.key = null;
  }
}

export function acquireProgramsSubscription(onChange: () => void): () => void {
  programsSubscription.count += 1;
  if (!programsSubscription.cleanup) {
    programsSubscription.cleanup = api.subscribeToPrograms(onChange);
    programsSubscription.key = 'programs';
  }
  return () => releaseSlot(programsSubscription);
}

export function acquireMyApplicationsSubscription(
  studentId: string,
  onChange: () => void,
): () => void {
  if (
    myApplicationsSubscription.cleanup &&
    myApplicationsSubscription.key &&
    myApplicationsSubscription.key !== studentId
  ) {
    myApplicationsSubscription.cleanup();
    myApplicationsSubscription.cleanup = null;
    myApplicationsSubscription.count = 0;
  }

  myApplicationsSubscription.count += 1;
  myApplicationsSubscription.key = studentId;

  if (!myApplicationsSubscription.cleanup) {
    myApplicationsSubscription.cleanup = api.subscribeToMyApplications(studentId, onChange);
  }

  return () => releaseSlot(myApplicationsSubscription);
}

export function acquireComplianceSubscription(
  enrollmentId: string,
  onChange: () => void,
): () => void {
  let slot = complianceSubscriptions.get(enrollmentId);
  if (!slot) {
    slot = { count: 0, cleanup: null, key: enrollmentId };
    complianceSubscriptions.set(enrollmentId, slot);
  }

  slot.count += 1;

  if (!slot.cleanup) {
    slot.cleanup = api.subscribeToComplianceItems(enrollmentId, () => {
      onChange();
    });
  }

  return () => {
    releaseSlot(slot!);
    if (slot!.count === 0) {
      complianceSubscriptions.delete(enrollmentId);
    }
  };
}
