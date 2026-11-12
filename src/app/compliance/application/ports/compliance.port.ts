import type { Observable } from 'rxjs';
import type { DownloadedFile } from '@shared/application/file-saver.port';
import type { Page } from '@shared/application/page';
import type {
  CertificateDraft,
  CertificateExpirations,
  ChecklistDraft,
  ChecklistItemDefinition,
  ChecklistStatus,
  ComplianceScore,
  ComplianceSignature,
  MaintenanceCertificate,
  OhsReport,
  WeeklyChecklist,
} from '@compliance/domain/model/compliance';

/** OHS compliance of a store. Mutations that support it carry an `Idempotency-Key`. */
export abstract class CompliancePort {
  abstract getChecklistTemplate(storeId: string): Observable<readonly ChecklistItemDefinition[]>;
  abstract saveChecklist(storeId: string, draft: ChecklistDraft, idempotencyKey: string): Observable<WeeklyChecklist>;
  abstract listChecklists(storeId: string, status: ChecklistStatus | null, page: number): Observable<Page<WeeklyChecklist>>;
  abstract registerCertificate(storeId: string, equipmentId: string, draft: CertificateDraft, idempotencyKey: string): Observable<MaintenanceCertificate>;
  abstract listCertificates(storeId: string, equipmentId: string, page: number): Observable<Page<MaintenanceCertificate>>;
  abstract getExpirations(storeId: string, withinDays: number): Observable<CertificateExpirations>;
  abstract getScore(storeId: string): Observable<ComplianceScore>;
  abstract registerSignature(storeId: string, signerName: string, signerTitle: string, imageBase64: string): Observable<ComplianceSignature>;
  /** Emits null when no signature is registered. */
  abstract getSignature(storeId: string): Observable<ComplianceSignature | null>;
  abstract getSignatureImage(storeId: string): Observable<DownloadedFile>;
  /** Synchronous generation: may take several seconds. */
  abstract generateOhsReport(storeId: string, from: Date | null, to: Date | null): Observable<OhsReport>;
  abstract listOhsReports(storeId: string, page: number): Observable<Page<OhsReport>>;
  abstract downloadOhsReport(storeId: string, report: OhsReport): Observable<DownloadedFile>;
}

/** Compliance notices pushed in realtime (`ComplianceNotice`); the payload is not trusted. */
export abstract class ComplianceNoticePort {
  abstract readonly notices$: Observable<void>;
}
