import { inject, Injectable } from '@angular/core';
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
import { CompliancePort } from '@compliance/application/ports/compliance.port';
import { ComplianceEquipmentPort, type ComplianceEquipmentRef } from '@compliance/application/ports/compliance-equipment.port';

@Injectable({ providedIn: 'root' })
export class GetChecklistTemplateUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string): Observable<readonly ChecklistItemDefinition[]> { return this.port.getChecklistTemplate(storeId); }
}

/** Saves a draft or submits (locks) the weekly checklist; the key is reused when the same action is retried. */
@Injectable({ providedIn: 'root' })
export class SubmitComplianceChecklistUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, draft: ChecklistDraft, idempotencyKey: string): Observable<WeeklyChecklist> {
    return this.port.saveChecklist(storeId, draft, idempotencyKey);
  }
}

@Injectable({ providedIn: 'root' })
export class ListChecklistsUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, status: ChecklistStatus | null, page: number): Observable<Page<WeeklyChecklist>> {
    return this.port.listChecklists(storeId, status, page);
  }
}

@Injectable({ providedIn: 'root' })
export class RegisterMaintenanceCertificateUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, equipmentId: string, draft: CertificateDraft, idempotencyKey: string): Observable<MaintenanceCertificate> {
    return this.port.registerCertificate(storeId, equipmentId, draft, idempotencyKey);
  }
}

@Injectable({ providedIn: 'root' })
export class ListMaintenanceCertificatesUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, equipmentId: string, page: number): Observable<Page<MaintenanceCertificate>> {
    return this.port.listCertificates(storeId, equipmentId, page);
  }
}

@Injectable({ providedIn: 'root' })
export class GetCertificateExpirationsUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, withinDays: number): Observable<CertificateExpirations> { return this.port.getExpirations(storeId, withinDays); }
}

@Injectable({ providedIn: 'root' })
export class GetComplianceScoreUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string): Observable<ComplianceScore> { return this.port.getScore(storeId); }
}

@Injectable({ providedIn: 'root' })
export class UploadComplianceSignatureUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, signerName: string, signerTitle: string, imageBase64: string): Observable<ComplianceSignature> {
    return this.port.registerSignature(storeId, signerName.trim(), signerTitle.trim(), imageBase64);
  }
}

@Injectable({ providedIn: 'root' })
export class GetComplianceSignatureUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string): Observable<ComplianceSignature | null> { return this.port.getSignature(storeId); }
}

@Injectable({ providedIn: 'root' })
export class GetSignatureImageUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string): Observable<DownloadedFile> { return this.port.getSignatureImage(storeId); }
}

@Injectable({ providedIn: 'root' })
export class GenerateOhsReportUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, from: Date | null, to: Date | null): Observable<OhsReport> { return this.port.generateOhsReport(storeId, from, to); }
}

@Injectable({ providedIn: 'root' })
export class ListOhsReportsUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, page: number): Observable<Page<OhsReport>> { return this.port.listOhsReports(storeId, page); }
}

@Injectable({ providedIn: 'root' })
export class DownloadOhsReportUseCase {
  private readonly port = inject(CompliancePort);
  execute(storeId: string, report: OhsReport): Observable<DownloadedFile> { return this.port.downloadOhsReport(storeId, report); }
}

@Injectable({ providedIn: 'root' })
export class ListComplianceEquipmentUseCase {
  private readonly port = inject(ComplianceEquipmentPort);
  execute(storeId: string): Observable<readonly ComplianceEquipmentRef[]> { return this.port.listEquipment(storeId); }
}
