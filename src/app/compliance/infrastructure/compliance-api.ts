import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';
import { toAppError } from '@shared/application/app-error';
import type { DownloadedFile } from '@shared/application/file-saver.port';
import type { Page } from '@shared/application/page';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import { toIsoInstant } from '@shared/infrastructure/api/date-serialization';
import { type HasMorePageResponse, type PagedResponse, toPage } from '@shared/infrastructure/api/paging';
import type {
  CertificateDraft,
  CertificateExpirations,
  CertificateUrgency,
  ChecklistDraft,
  ChecklistItemDefinition,
  ChecklistStatus,
  ComplianceScore,
  ComplianceSignature,
  MaintenanceCertificate,
  OhsReport,
  WeeklyChecklist,
} from '@compliance/domain/model/compliance';
import type { CompliancePort } from '@compliance/application/ports/compliance.port';

interface ChecklistResponse {
  id: string;
  inspectorStaffId: string;
  inspectorName: string;
  weekStartDate: string;
  week: string;
  status: string;
  score: number;
  observations: string | null;
  items: { code: string; label: string; result: string; notes: string | null }[];
  updatedAtUtc: string;
  submittedAtUtc: string | null;
}

interface CertificateResponse {
  id: string;
  equipmentId: string;
  equipmentName: string;
  areaName: string;
  technicianName: string;
  certificationNumber: string;
  workDescription: string | null;
  issuedAtUtc: string;
  expiresAtUtc: string;
  documentFileUrl: string | null;
  urgency: string;
  daysUntilExpiry: number;
}

interface SignatureResponse {
  signerName: string;
  signerTitle: string;
  widthPx: number;
  heightPx: number;
  signedAtUtc: string;
}

interface OhsReportResponse {
  reportId: string;
  fileName: string;
  sizeBytes: number;
  fromUtc: string;
  toUtc: string;
  generatedAtUtc: string;
  complianceScore: number;
  isSigned: boolean;
}

const URGENCIES: readonly CertificateUrgency[] = ['VALID', 'EXPIRES_WITHIN_30_DAYS', 'EXPIRES_WITHIN_15_DAYS', 'EXPIRED'];

function toChecklist(r: ChecklistResponse): WeeklyChecklist {
  return {
    id: r.id,
    inspectorStaffId: r.inspectorStaffId,
    inspectorName: r.inspectorName,
    weekStartDate: r.weekStartDate,
    week: r.week,
    status: r.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT',
    score: r.score,
    observations: r.observations,
    items: r.items,
    updatedAt: new Date(r.updatedAtUtc),
    submittedAt: r.submittedAtUtc === null ? null : new Date(r.submittedAtUtc),
  };
}

function toCertificate(r: CertificateResponse): MaintenanceCertificate {
  return {
    id: r.id,
    equipmentId: r.equipmentId,
    equipmentName: r.equipmentName,
    areaName: r.areaName,
    technicianName: r.technicianName,
    certificationNumber: r.certificationNumber,
    workDescription: r.workDescription,
    issuedAt: new Date(r.issuedAtUtc),
    expiresAt: new Date(r.expiresAtUtc),
    documentFileUrl: r.documentFileUrl,
    // Unknown urgency is treated as expired (needs attention), never as valid.
    urgency: URGENCIES.find((u) => u === r.urgency) ?? 'EXPIRED',
    daysUntilExpiry: r.daysUntilExpiry,
  };
}

function toSignature(r: SignatureResponse): ComplianceSignature {
  return { signerName: r.signerName, signerTitle: r.signerTitle, widthPx: r.widthPx, heightPx: r.heightPx, signedAt: new Date(r.signedAtUtc) };
}

function toReport(r: OhsReportResponse): OhsReport {
  return {
    reportId: r.reportId,
    fileName: r.fileName,
    sizeBytes: r.sizeBytes,
    from: new Date(r.fromUtc),
    to: new Date(r.toUtc),
    generatedAt: new Date(r.generatedAtUtc),
    complianceScore: r.complianceScore,
    isSigned: r.isSigned,
  };
}

/** ComplianceApi implements CompliancePort against `/stores/{id}/compliance/*` and certificates. */
@Injectable({ providedIn: 'root' })
export class ComplianceApi implements CompliancePort {
  private readonly api = inject(ApiClient);

  getChecklistTemplate(storeId: string): Observable<readonly ChecklistItemDefinition[]> {
    return this.api
      .get<{ items: ChecklistItemDefinition[] }>(`${this.path(storeId, 'checklists')}/template`)
      .pipe(map((r) => r.items.map(({ code, label }) => ({ code, label }))));
  }

  saveChecklist(storeId: string, draft: ChecklistDraft, idempotencyKey: string): Observable<WeeklyChecklist> {
    const body: Record<string, unknown> = {
      inspectorStaffId: draft.inspectorStaffId,
      inspectorName: draft.inspectorName,
      items: draft.items.map((item) => (item.notes === null ? { code: item.code, result: item.result } : { ...item })),
      status: draft.status,
    };
    if (draft.checklistId !== null) body['checklistId'] = draft.checklistId;
    if (draft.weekOf !== null) body['weekOf'] = draft.weekOf;
    if (draft.observations !== null) body['observations'] = draft.observations;
    return this.api.post<ChecklistResponse>(this.path(storeId, 'checklists'), body, { idempotencyKey }).pipe(map(toChecklist));
  }

  listChecklists(storeId: string, status: ChecklistStatus | null, page: number): Observable<Page<WeeklyChecklist>> {
    return this.api
      .get<HasMorePageResponse<ChecklistResponse>>(this.path(storeId, 'checklists'), { status, page, pageSize: 10 })
      .pipe(map((r) => toPage(r, toChecklist)));
  }

  registerCertificate(storeId: string, equipmentId: string, draft: CertificateDraft, idempotencyKey: string): Observable<MaintenanceCertificate> {
    const body: Record<string, unknown> = {
      technicianName: draft.technicianName,
      certificationNumber: draft.certificationNumber,
      issuedAt: toIsoInstant(draft.issuedAt),
      expiresAt: toIsoInstant(draft.expiresAt),
    };
    if (draft.workDescription !== null) body['workDescription'] = draft.workDescription;
    if (draft.documentFileUrl !== null) body['documentFileUrl'] = draft.documentFileUrl;
    return this.api
      .post<CertificateResponse>(apiPath('stores', storeId, 'equipment', equipmentId, 'certificates'), body, { idempotencyKey })
      .pipe(map(toCertificate));
  }

  listCertificates(storeId: string, equipmentId: string, page: number): Observable<Page<MaintenanceCertificate>> {
    return this.api
      .get<PagedResponse<CertificateResponse>>(apiPath('stores', storeId, 'equipment', equipmentId, 'certificates'), { page, pageSize: 20 })
      .pipe(map((r) => toPage(r, toCertificate)));
  }

  getExpirations(storeId: string, withinDays: number): Observable<CertificateExpirations> {
    return this.api
      .get<{ generatedAtUtc: string; withinDays: number; items: CertificateResponse[]; equipmentWithoutCertificate: { equipmentId: string; name: string; areaName: string }[] }>(
        this.path(storeId, 'expirations'),
        { withinDays },
      )
      .pipe(
        map((r) => ({
          generatedAt: new Date(r.generatedAtUtc),
          withinDays: r.withinDays,
          items: r.items.map(toCertificate),
          equipmentWithoutCertificate: r.equipmentWithoutCertificate,
        })),
      );
  }

  getScore(storeId: string): Observable<ComplianceScore> {
    return this.api
      .get<{ score: number; grade: string; evaluatedAtUtc: string; components: ComplianceScore['components']; checklistWeeks: ComplianceScore['checklistWeeks'] }>(
        this.path(storeId, 'score'),
      )
      .pipe(map((r) => ({ score: r.score, grade: r.grade, evaluatedAt: new Date(r.evaluatedAtUtc), components: r.components, checklistWeeks: r.checklistWeeks })));
  }

  registerSignature(storeId: string, signerName: string, signerTitle: string, imageBase64: string): Observable<ComplianceSignature> {
    return this.api.post<SignatureResponse>(this.path(storeId, 'signature'), { signerName, signerTitle, imageBase64 }).pipe(map(toSignature));
  }

  getSignature(storeId: string): Observable<ComplianceSignature | null> {
    return this.api.get<SignatureResponse>(this.path(storeId, 'signature')).pipe(
      map(toSignature),
      // The store was verified by the route guard, so a 404 here means "no signature registered yet".
      catchError((error: unknown) => (toAppError(error).status === 404 ? of(null) : throwError(() => error))),
    );
  }

  getSignatureImage(storeId: string): Observable<DownloadedFile> {
    return this.api.getFile(`${this.path(storeId, 'signature')}/image`, 'signature.png');
  }

  generateOhsReport(storeId: string, from: Date | null, to: Date | null): Observable<OhsReport> {
    const body = from !== null && to !== null ? { from: toIsoInstant(from), to: toIsoInstant(to) } : {};
    return this.api.post<OhsReportResponse>(`${this.path(storeId, 'reports')}/generate`, body).pipe(map(toReport));
  }

  listOhsReports(storeId: string, page: number): Observable<Page<OhsReport>> {
    return this.api.get<PagedResponse<OhsReportResponse>>(this.path(storeId, 'reports'), { page, pageSize: 20 }).pipe(map((r) => toPage(r, toReport)));
  }

  downloadOhsReport(storeId: string, report: OhsReport): Observable<DownloadedFile> {
    return this.api.getFile(`${this.path(storeId, 'reports')}/${encodeURIComponent(report.reportId)}/download`, report.fileName);
  }

  private path(storeId: string, resource: string): string {
    return apiPath('stores', storeId, 'compliance', resource);
  }
}
