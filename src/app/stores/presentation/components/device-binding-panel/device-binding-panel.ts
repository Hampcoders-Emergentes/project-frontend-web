import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import type { AppError } from '@shared/application/app-error';
import type { DeviceBinding } from '@stores/domain/model/store-hierarchy';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/** Sensor link request: the installed device id and its edge gateway id. */
export interface BindingRequest {
  readonly deviceId: string;
  readonly edgeDeviceId: string;
}

/**
 * Shows the permanent sensor binding of an equipment (US16) or a form to create it. Binding cannot be
 * undone in this version, so the user confirms in a dialog before the request is sent; no unbind
 * action exists.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, ErrorNotice, Icon, LocalizedDatePipe],
  selector: 'app-device-binding-panel',
  templateUrl: './device-binding-panel.html',
})
export class DeviceBindingPanel {
  readonly binding = input<DeviceBinding | null>(null);
  readonly submitting = input(false);
  readonly error = input<AppError | null>(null);
  /** Emits once the user confirmed the permanent binding. */
  readonly bind = output<BindingRequest>();

  protected readonly confirming = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    deviceId: ['', [Validators.required, Validators.pattern(/\S/)]],
    edgeDeviceId: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    effect(() => applyServerFieldErrors(this.form, this.error()));
    effect(() => {
      if (this.binding() !== null) {
        this.confirming.set(false);
      }
    });
  }

  protected requestConfirmation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirming.set(true);
  }

  protected confirm(): void {
    const { deviceId, edgeDeviceId } = this.form.getRawValue();
    this.confirming.set(false);
    this.bind.emit({ deviceId: deviceId.trim(), edgeDeviceId: edgeDeviceId.trim() });
  }

  /** Translated message of a binding failure that is specific to this workflow. */
  protected messageKey(failure: AppError): string | null {
    switch (failure.status) {
      case 403:
        return 'stores.binding.errors.forbidden';
      case 409:
        return 'stores.binding.errors.conflict';
      default:
        return null;
    }
  }
}
