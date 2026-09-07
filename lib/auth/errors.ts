/**
 * Expected auth / enrollment gaps — callers should soft-fail without console.error.
 */
export class NotAuthenticatedError extends Error {
  readonly code = 'NOT_AUTHENTICATED' as const;

  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'NotAuthenticatedError';
  }
}

export class PatientNotLinkedError extends Error {
  readonly code = 'PATIENT_NOT_LINKED' as const;

  constructor(message = 'Patient not found') {
    super(message);
    this.name = 'PatientNotLinkedError';
  }
}

export function isExpectedUnauthDataError(error: unknown): boolean {
  if (error instanceof NotAuthenticatedError || error instanceof PatientNotLinkedError) {
    return true;
  }
  if (!(error instanceof Error)) return false;
  return error.message === 'Not authenticated' || error.message === 'Patient not found';
}
