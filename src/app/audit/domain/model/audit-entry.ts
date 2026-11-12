/** One operational audit entry of a store (US41). Reads are not logged unless the server enables it. */
export interface AuditEntry {
  readonly id: string;
  readonly userId: string | null;
  readonly action: string;
  readonly resource: string;
  readonly httpMethod: string;
  readonly path: string;
  readonly statusCode: number;
  readonly status: string;
  readonly ipAddress: string | null;
  readonly timestamp: Date;
}

/** Audit filters; dates are a half-open range of at most 31 days (both or neither). */
export interface AuditFilter {
  readonly from: Date | null;
  readonly to: Date | null;
  readonly action: string | null;
  readonly status: string | null;
  readonly operatorId: string | null;
  readonly resource: string | null;
}

/** Whether the request failed (`4xx`/`5xx`). */
export function isFailedAuditEntry(entry: AuditEntry): boolean {
  return entry.statusCode >= 400;
}
