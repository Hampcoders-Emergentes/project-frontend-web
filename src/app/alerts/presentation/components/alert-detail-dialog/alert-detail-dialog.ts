import { Component, computed, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import type { AppError } from '@shared/application/app-error';
import { type Alert, nextAlertAction, RESOLUTION_NOTES_MAX_LENGTH } from '@alerts/domain/model/alert';
import type { AlertEquipmentRef } from '@alerts/application/ports/alert-equipment-directory.port';
import { SEVERITY_APPEARANCE, STATUS_APPEARANCE } from '@alerts/presentation/components/alert-table/alert-table';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/** Intent to assign a technician. */
export interface AssignIntent {
  readonly technicianId: string;
  readonly technicianName: string;
}

/**
 * Alert detail and the single valid next workflow step (acknowledge -> assign -> resolve). The
 * workflow is linear, so only one action is offered at a time; a `409` means the alert already moved
 * on and the parent reloads it.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, ErrorNotice, StatusTag, LocalizedDatePipe],
  selector: 'app-alert-detail-dialog',
  templateUrl: './alert-detail-dialog.html',
})
export class AlertDetailDialog {
  readonly alert = input.required<Alert>();
  readonly equipment = input<AlertEquipmentRef | null>(null);
  readonly submitting = input(false);
  readonly error = input<AppError | null>(null);
  readonly closed = output<void>();
  readonly acknowledge = output<void>();
  readonly assign = output<AssignIntent>();
  readonly resolve = output<string>();

  protected readonly notesMax = RESOLUTION_NOTES_MAX_LENGTH;
  protected readonly severityAppearance = SEVERITY_APPEARANCE;
  protected readonly statusAppearance = STATUS_APPEARANCE;
  protected readonly nextAction = computed(() => nextAlertAction(this.alert().status));

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly assignForm = this.fb.group({
    technicianId: ['', [Validators.required, Validators.pattern(/\S/)]],
    technicianName: [''],
  });
  protected readonly resolveForm = this.fb.group({
    notes: ['', Validators.maxLength(RESOLUTION_NOTES_MAX_LENGTH)],
  });

  protected submitAssign(): void {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    this.assign.emit(this.assignForm.getRawValue());
  }

  protected submitResolve(): void {
    if (this.resolveForm.invalid) {
      this.resolveForm.markAllAsTouched();
      return;
    }
    this.resolve.emit(this.resolveForm.getRawValue().notes);
  }
}
