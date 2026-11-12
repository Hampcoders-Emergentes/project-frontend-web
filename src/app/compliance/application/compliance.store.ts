import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import { FileSaverPort } from '@shared/application/file-saver.port';
import { IdempotencyKeyPort, IdempotentAction } from '@shared/application/idempotency-key.port';
import type { Page } from '@shared/application/page';
import type {
  CertificateDraft,
  CertificateExpirations,
  ChecklistDraft,
  ChecklistItemDefinition,
  ComplianceScore,
  ComplianceSignature,
  MaintenanceCertificate,
  OhsReport,
  WeeklyChecklist,
} from '@compliance/domain/model/compliance';
import type { ComplianceEquipmentRef } from '@compliance/application/ports/compliance-equipment.port';
import { ComplianceNoticePort } from '@compliance/application/ports/compliance.port';
import {
  DownloadOhsReportUseCase,
  GenerateOhsReportUseCase,
  GetCertificateExpirationsUseCase,
  GetChecklistTemplateUseCase,
  GetComplianceScoreUseCase,
  GetComplianceSignatureUseCase,
  GetSignatureImageUseCase,
  ListChecklistsUseCase,
  ListComplianceEquipmentUseCase,
  ListMaintenanceCertificatesUseCase,
  ListOhsReportsUseCase,
  RegisterMaintenanceCertificateUseCase,
  SubmitComplianceChecklistUseCase,
  UploadComplianceSignatureUseCase,
} from '@compliance/application/use-cases/compliance-use-cases';

export const EXPIRATION_WINDOW_DAYS = 30;

/**
 * OHS compliance state (US30-US34, US40). Checklist saves and certificate registrations keep one
 * idempotency key per user action: retrying the same payload reuses it; changing the payload creates
 * a new one. A `409` on a checklist (locked, or the same key still processing) reloads the history.
 */
@Injectable({ providedIn: 'root' })
export class ComplianceStore {
  private readonly fileSaver = inject(FileSaverPort);
  private readonly templateUseCase = inject(GetChecklistTemplateUseCase);
  private readonly saveChecklistUseCase = inject(SubmitComplianceChecklistUseCase);
  private readonly listChecklistsUseCase = inject(ListChecklistsUseCase);
  private readonly registerCertificateUseCase = inject(RegisterMaintenanceCertificateUseCase);
  private readonly listCertificatesUseCase = inject(ListMaintenanceCertificatesUseCase);
  private readonly expirationsUseCase = inject(GetCertificateExpirationsUseCase);
  private readonly scoreUseCase = inject(GetComplianceScoreUseCase);
  private readonly uploadSignatureUseCase = inject(UploadComplianceSignatureUseCase);
  private readonly signatureUseCase = inject(GetComplianceSignatureUseCase);
  private readonly signatureImageUseCase = inject(GetSignatureImageUseCase);
  private readonly generateReportUseCase = inject(GenerateOhsReportUseCase);
  private readonly listReportsUseCase = inject(ListOhsReportsUseCase);
  private readonly downloadReportUseCase = inject(DownloadOhsReportUseCase);
  private readonly equipmentUseCase = inject(ListComplianceEquipmentUseCase);
  private readonly checklistAction: IdempotentAction;
  private readonly certificateAction: IdempotentAction;

  readonly template = new AsyncResource<readonly ChecklistItemDefinition[]>();
  readonly checklists = new AsyncResource<Page<WeeklyChecklist>>();
  readonly certificates = new AsyncResource<Page<MaintenanceCertificate>>();
  readonly expirations = new AsyncResource<CertificateExpirations>();
  readonly score = new AsyncResource<ComplianceScore>();
  readonly signature = new AsyncResource<ComplianceSignature | null>();
  readonly reports = new AsyncResource<Page<OhsReport>>();
  readonly equipment = new AsyncResource<readonly ComplianceEquipmentRef[]>();
  readonly checklistState = new MutationState();
  readonly certificateState = new MutationState();
  readonly signatureState = new MutationState();
  readonly reportState = new MutationState();
  readonly downloadState = new MutationState();
  private readonly noticeSignal = signal<Date | null>(null);
  readonly lastNotice = this.noticeSignal.asReadonly();
  private storeId: string | null = null;

  constructor() {
    const keys = inject(IdempotencyKeyPort);
    this.checklistAction = new IdempotentAction(keys);
    this.certificateAction = new IdempotentAction(keys);
    inject(ComplianceNoticePort)
      .notices$.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        if (this.storeId !== null) {
          this.noticeSignal.set(new Date());
          this.loadExpirations(this.storeId);
        }
      });
  }

  loadChecklistData(storeId: string): void {
    this.storeId = storeId;
    this.template.load(storeId, this.templateUseCase.execute(storeId));
    this.loadChecklists(storeId, 1);
  }

  loadChecklists(storeId: string, page: number): void {
    this.checklists.load(`${storeId}|${page}`, this.listChecklistsUseCase.execute(storeId, null, page));
  }

  saveChecklist(storeId: string, draft: ChecklistDraft, onSaved: (checklist: WeeklyChecklist) => void): void {
    const key = this.checklistAction.keyFor({ storeId, draft });
    this.checklistState.run(
      this.saveChecklistUseCase.execute(storeId, draft, key),
      (saved) => {
        this.checklistAction.complete();
        this.loadChecklists(storeId, 1);
        onSaved(saved);
      },
      (error) => {
        if (error.status === 409) {
          this.loadChecklists(storeId, 1);
        }
        if (error.status >= 400 && error.status < 500 && error.status !== 409 && error.status !== 429) {
          // Definitive rejection: the next attempt is a new action.
          this.checklistAction.complete();
        }
      },
    );
  }

  loadEquipment(storeId: string): void {
    this.storeId = storeId;
    if (this.equipment.key() !== storeId || this.equipment.error() !== null) {
      this.equipment.load(storeId, this.equipmentUseCase.execute(storeId));
    }
  }

  loadCertificates(storeId: string, equipmentId: string, page: number): void {
    this.certificates.load(`${storeId}|${equipmentId}|${page}`, this.listCertificatesUseCase.execute(storeId, equipmentId, page));
  }

  registerCertificate(storeId: string, equipmentId: string, draft: CertificateDraft, onDone: () => void): void {
    const key = this.certificateAction.keyFor({ storeId, equipmentId, draft });
    this.certificateState.run(
      this.registerCertificateUseCase.execute(storeId, equipmentId, draft, key),
      () => {
        this.certificateAction.complete();
        this.loadCertificates(storeId, equipmentId, 1);
        this.loadExpirations(storeId);
        onDone();
      },
      (error) => {
        if (error.status >= 400 && error.status < 500 && error.status !== 409 && error.status !== 429) {
          this.certificateAction.complete();
        }
      },
    );
  }

  loadExpirations(storeId: string): void {
    this.storeId = storeId;
    this.expirations.load(storeId, this.expirationsUseCase.execute(storeId, EXPIRATION_WINDOW_DAYS));
  }

  loadScore(storeId: string): void {
    this.score.load(storeId, this.scoreUseCase.execute(storeId));
  }

  loadSignature(storeId: string): void {
    this.signature.load(storeId, this.signatureUseCase.execute(storeId));
  }

  /** The base64 image is kept in memory only for this submission. */
  registerSignature(storeId: string, signerName: string, signerTitle: string, imageBase64: string, onDone: () => void): void {
    this.signatureState.run(this.uploadSignatureUseCase.execute(storeId, signerName, signerTitle, imageBase64), (saved) => {
      this.signature.accept(storeId, saved);
      onDone();
    });
  }

  /** Loads the registered signature image for an in-memory preview (object URL). */
  previewSignature(storeId: string, onUrl: (url: string) => void): void {
    this.signatureImageUseCase.execute(storeId).subscribe({
      next: (file) => onUrl(this.fileSaver.preview(file)),
      error: () => undefined,
    });
  }

  releasePreview(url: string): void {
    this.fileSaver.revoke(url);
  }

  loadReports(storeId: string, page: number): void {
    this.reports.load(`${storeId}|${page}`, this.listReportsUseCase.execute(storeId, page));
  }

  generateReport(storeId: string, from: Date | null, to: Date | null): void {
    this.reportState.run(this.generateReportUseCase.execute(storeId, from, to), () => this.loadReports(storeId, 1));
  }

  downloadReport(storeId: string, report: OhsReport): void {
    this.downloadState.run(this.downloadReportUseCase.execute(storeId, report), (file) => this.fileSaver.save(file));
  }
}
