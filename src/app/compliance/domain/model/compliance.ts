/** Checklist lifecycle; a `SUBMITTED` checklist is locked. */
export type ChecklistStatus = 'DRAFT' | 'SUBMITTED';
/** Result of one checklist item. */
export type ChecklistResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
export const CHECKLIST_RESULTS: readonly ChecklistResult[] = ['PASS', 'FAIL', 'NOT_APPLICABLE'];

export const CHECKLIST_LIMITS = { notesMax: 500, observationsMax: 2000 } as const;

/** One item of the OHS checklist template (authoritative list from the API). */
export interface ChecklistItemDefinition {
  readonly code: string;
  readonly label: string;
}

/** One answered checklist item. */
export interface ChecklistItemAnswer {
  readonly code: string;
  readonly result: ChecklistResult | null;
  readonly notes: string;
}

/** A weekly OHS safety checklist (US30). */
export interface WeeklyChecklist {
  readonly id: string;
  readonly inspectorStaffId: string;
  readonly inspectorName: string;
  readonly weekStartDate: string;
  readonly week: string;
  readonly status: ChecklistStatus;
  readonly score: number;
  readonly observations: string | null;
  readonly items: readonly { readonly code: string; readonly label: string; readonly result: string; readonly notes: string | null }[];
  readonly updatedAt: Date;
  readonly submittedAt: Date | null;
}

/** A checklist save (draft or submission). */
export interface ChecklistDraft {
  readonly checklistId: string | null;
  readonly inspectorStaffId: string;
  readonly inspectorName: string;
  readonly weekOf: string | null;
  readonly items: readonly { readonly code: string; readonly result: ChecklistResult; readonly notes: string | null }[];
  readonly observations: string | null;
  readonly status: ChecklistStatus;
}

/** Problems of an answered item. */
export type ChecklistItemProblem = 'missingResult' | 'failNeedsNotes' | 'notesTooLong';

/**
 * Validates one item: a result is required, a `FAIL` needs notes, notes are at most 500 characters.
 * @param answer - The answered item.
 */
export function checklistItemProblem(answer: ChecklistItemAnswer): ChecklistItemProblem | null {
  if (answer.result === null) {
    return 'missingResult';
  }
  if (answer.notes.length > CHECKLIST_LIMITS.notesMax) {
    return 'notesTooLong';
  }
  return answer.result === 'FAIL' && answer.notes.trim() === '' ? 'failNeedsNotes' : null;
}

/** Certificate urgency computed by the API. */
export type CertificateUrgency = 'VALID' | 'EXPIRES_WITHIN_30_DAYS' | 'EXPIRES_WITHIN_15_DAYS' | 'EXPIRED';

/** A maintenance certificate (US32). The document is referenced by URL; there is no upload. */
export interface MaintenanceCertificate {
  readonly id: string;
  readonly equipmentId: string;
  readonly equipmentName: string;
  readonly areaName: string;
  readonly technicianName: string;
  readonly certificationNumber: string;
  readonly workDescription: string | null;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly documentFileUrl: string | null;
  readonly urgency: CertificateUrgency;
  readonly daysUntilExpiry: number;
}

/** Input of a new certificate. */
export interface CertificateDraft {
  readonly technicianName: string;
  readonly certificationNumber: string;
  readonly workDescription: string | null;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly documentFileUrl: string | null;
}

const DAY_MS = 86_400_000;

/**
 * Documented certificate date rules: issued at most one day in the future, expiry after issue and
 * within ten years.
 */
export function certificateDatesProblem(issuedAt: Date, expiresAt: Date, now: Date = new Date()): 'issuedInFuture' | 'expiryBeforeIssue' | 'expiryTooFar' | null {
  if (issuedAt.getTime() > now.getTime() + DAY_MS) {
    return 'issuedInFuture';
  }
  if (expiresAt.getTime() <= issuedAt.getTime()) {
    return 'expiryBeforeIssue';
  }
  const limit = new Date(issuedAt);
  limit.setFullYear(limit.getFullYear() + 10);
  return expiresAt.getTime() > limit.getTime() ? 'expiryTooFar' : null;
}

/** Whether a document reference is an absolute http(s) URL. */
export function isDocumentUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

/** Upcoming expirations, including equipment without any certificate (US33). */
export interface CertificateExpirations {
  readonly generatedAt: Date;
  readonly withinDays: number;
  readonly items: readonly MaintenanceCertificate[];
  readonly equipmentWithoutCertificate: readonly { readonly equipmentId: string; readonly name: string; readonly areaName: string }[];
}

/** Compliance score (US31). */
export interface ComplianceScore {
  readonly score: number;
  readonly grade: string;
  readonly evaluatedAt: Date;
  readonly components: readonly { readonly name: string; readonly weight: number; readonly score: number; readonly explanation: string }[];
  readonly checklistWeeks: readonly { readonly weekStartDate: string; readonly bestSubmittedScore: number | null }[];
}

/** Maximum length of the base64 signature image. */
export const SIGNATURE_MAX_BASE64_LENGTH = 360_000;

/** The registered manager signature (US40). */
export interface ComplianceSignature {
  readonly signerName: string;
  readonly signerTitle: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly signedAt: Date;
}

/** A generated OHS report (US34). */
export interface OhsReport {
  readonly reportId: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly from: Date;
  readonly to: Date;
  readonly generatedAt: Date;
  readonly complianceScore: number;
  readonly isSigned: boolean;
}
