/**
 * A shift-roster entry (US23, US35). Workers are roster entries identified by a worker code; they are
 * not IAM login accounts.
 */
export interface ShiftAssignment {
  readonly id: string;
  readonly workerCode: string;
  readonly workerName: string;
  readonly role: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly createdAt: Date;
}

/** Who is on duty at a moment, and who is accountable. */
export interface OnDutyStaff {
  readonly at: Date;
  readonly accountable: ShiftAssignment | null;
  readonly onDuty: readonly ShiftAssignment[];
}

/** Input of a new roster entry. */
export interface ShiftDraft {
  readonly workerCode: string;
  readonly workerName: string;
  readonly role: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

/**
 * A shift must end after it starts.
 * @param draft - The shift draft.
 */
export function isValidShiftWindow(draft: Pick<ShiftDraft, 'startsAt' | 'endsAt'>): boolean {
  return draft.endsAt.getTime() > draft.startsAt.getTime();
}

/** A shift-handover notice received in realtime; its payload is informational only. */
export interface ShiftHandoverNotice {
  readonly receivedAt: Date;
}
