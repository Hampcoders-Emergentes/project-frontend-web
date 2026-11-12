import { Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EXPIRATION_WINDOW_DAYS, ComplianceStore } from '@compliance/application/compliance.store';
import {
  certificateDatesProblem,
  type CertificateUrgency,
  isDocumentUrl,
} from '@compliance/domain/model/compliance';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag, type StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';
import { fromLocalInputValue } from '@shared/presentation/forms/date-input';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

const URGENCY_APPEARANCE: Readonly<Record<CertificateUrgency, StatusAppearance>> = {
  VALID: { tone: 'success', icon: 'file-check' },
  EXPIRES_WITHIN_30_DAYS: { tone: 'warning', icon: 'clock' },
  EXPIRES_WITHIN_15_DAYS: { tone: 'warning', icon: 'alert-triangle' },
  EXPIRED: { tone: 'critical', icon: 'alert-octagon' },
};

/**
 * Maintenance certificates (US32) and upcoming expirations (US33). The certificate document is a URL
 * reference: the API has no upload endpoint, so no file upload is offered.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, StatePanel, StatusTag, LocalizedDatePipe],
  selector: 'app-certificates-view',
  templateUrl: './certificates.html',
})
export class CertificatesView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(ComplianceStore);
  protected readonly urgency = URGENCY_APPEARANCE;
  protected readonly windowDays = EXPIRATION_WINDOW_DAYS;
  protected readonly selectedEquipmentId = signal<string>('');
  protected readonly datesProblem = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    technicianName: ['', [Validators.required, Validators.pattern(/\S/)]],
    certificationNumber: ['', [Validators.required, Validators.pattern(/\S/)]],
    workDescription: [''],
    issuedAt: ['', Validators.required],
    expiresAt: ['', Validators.required],
    documentFileUrl: [''],
  });

  constructor() {
    whenChanged(this.storeId, (storeId) => {
      this.store.loadEquipment(storeId);
      this.store.loadExpirations(storeId);
    });
    effect(() => applyServerFieldErrors(this.form, this.store.certificateState.error()));
  }

  protected selectEquipment(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedEquipmentId.set(id);
    this.store.certificateState.clear();
    if (id !== '') {
      this.store.loadCertificates(this.storeId(), id, 1);
    }
  }

  protected urlInvalid(): boolean {
    const value = this.form.controls.documentFileUrl.value;
    return value.trim() !== '' && !isDocumentUrl(value);
  }

  protected register(): void {
    const raw = this.form.getRawValue();
    const issuedAt = fromLocalInputValue(raw.issuedAt);
    const expiresAt = fromLocalInputValue(raw.expiresAt);
    const problem = issuedAt === null || expiresAt === null ? null : certificateDatesProblem(issuedAt, expiresAt);
    this.datesProblem.set(problem === null ? null : `compliance.certificates.problems.${problem}`);
    this.form.markAllAsTouched();
    if (this.form.invalid || problem !== null || this.urlInvalid() || issuedAt === null || expiresAt === null || this.selectedEquipmentId() === '') {
      return;
    }
    this.store.registerCertificate(
      this.storeId(),
      this.selectedEquipmentId(),
      {
        technicianName: raw.technicianName.trim(),
        certificationNumber: raw.certificationNumber.trim(),
        workDescription: raw.workDescription.trim() === '' ? null : raw.workDescription.trim(),
        issuedAt,
        expiresAt,
        documentFileUrl: raw.documentFileUrl.trim() === '' ? null : raw.documentFileUrl.trim(),
      },
      () => this.form.reset(),
    );
  }
}
