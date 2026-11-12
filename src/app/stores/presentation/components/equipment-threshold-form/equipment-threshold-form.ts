import { Component, effect, inject, input, output } from '@angular/core';
import { type AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, type ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import type { AppError } from '@shared/application/app-error';
import {
  type ElectricalThresholds,
  THRESHOLD_FIELDS,
  type ThresholdField,
  thresholdProblem,
} from '@stores/domain/model/equipment-safety';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';

function thresholdValidator(field: ThresholdField) {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const problem = thresholdProblem(field, control.value);
    return problem === null ? null : { [problem]: true };
  };
}

/**
 * The eight electrical thresholds of an equipment (US18). The API defines no temperature threshold,
 * so none is offered. All values are sent together (full-body `PUT`, last write wins).
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice],
  selector: 'app-equipment-threshold-form',
  template: `
    <section class="ui-card ui-stack" aria-labelledby="thresholds-title">
      <div>
        <h2 id="thresholds-title">{{ 'stores.thresholds.title' | translate }}</h2>
        <p class="ui-field__hint">{{ 'stores.thresholds.noTemperature' | translate }}</p>
      </div>
      @if (error(); as failure) {
        <app-error-notice [error]="failure" />
      }
      @if (saved()) {
        <p class="ui-notice ui-notice--success" role="status">{{ 'stores.thresholds.saved' | translate }}</p>
      }
      <form class="ui-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="ui-form-grid">
          @for (item of fields; track item.field) {
            <div class="ui-field">
              <label class="ui-field__label" [for]="'th-' + item.field">
                {{ 'stores.thresholds.fields.' + item.field | translate }}
                @if (item.unit) { <span class="text-meta">({{ item.unit }})</span> }
              </label>
              <input class="ui-input tnum" type="number" inputmode="decimal" [step]="item.field === 'minPowerFactor' ? 0.01 : 'any'"
                [id]="'th-' + item.field" [formControlName]="item.field"
                [attr.aria-invalid]="invalid(item.field) || null"
                [attr.aria-describedby]="invalid(item.field) ? 'th-' + item.field + '-error' : null" />
              @if (invalid(item.field)) {
                <p class="ui-field__error" [id]="'th-' + item.field + '-error'">{{ errorText(item.field) | translate }}</p>
              }
            </div>
          }
        </div>
        <div class="ui-actions">
          <button class="ui-button" type="submit" [disabled]="submitting()">
            {{ (submitting() ? 'shared.actions.saving' : 'shared.actions.save') | translate }}
          </button>
        </div>
      </form>
    </section>
  `,
})
export class EquipmentThresholdForm {
  readonly thresholds = input<ElectricalThresholds | null>(null);
  readonly submitting = input(false);
  readonly error = input<AppError | null>(null);
  readonly saved = input(false);
  readonly save = output<ElectricalThresholds>();

  protected readonly fields = THRESHOLD_FIELDS;
  private readonly fb = inject(NonNullableFormBuilder);
  private control(field: ThresholdField) {
    return this.fb.control<number | null>(null, thresholdValidator(field));
  }

  protected readonly form = this.fb.group({
    nominalVoltage: this.control('nominalVoltage'),
    maxConsumptionWatts: this.control('maxConsumptionWatts'),
    maxCurrentAmps: this.control('maxCurrentAmps'),
    minPowerFactor: this.control('minPowerFactor'),
    nominalFrequency: this.control('nominalFrequency'),
    disconnectionThresholdMin: this.control('disconnectionThresholdMin'),
    normalLimitAmps: this.control('normalLimitAmps'),
    alertLimitAmps: this.control('alertLimitAmps'),
  });

  constructor() {
    effect(() => {
      const thresholds = this.thresholds();
      if (thresholds !== null) {
        this.form.reset({ ...thresholds });
      }
    });
    effect(() => applyServerFieldErrors(this.form, this.error()));
  }

  protected invalid(field: ThresholdField): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  protected errorText(field: ThresholdField): string {
    const control = this.form.controls[field];
    if (control.hasError('server')) {
      return 'stores.thresholds.serverRejected';
    }
    if (control.hasError('range')) {
      return field === 'minPowerFactor' ? 'stores.thresholds.powerFactorRange' : 'stores.thresholds.nonNegative';
    }
    return 'shared.validation.required';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.save.emit({
      nominalVoltage: Number(raw.nominalVoltage),
      maxConsumptionWatts: Number(raw.maxConsumptionWatts),
      maxCurrentAmps: Number(raw.maxCurrentAmps),
      minPowerFactor: Number(raw.minPowerFactor),
      nominalFrequency: Number(raw.nominalFrequency),
      disconnectionThresholdMin: Number(raw.disconnectionThresholdMin),
      normalLimitAmps: Number(raw.normalLimitAmps),
      alertLimitAmps: Number(raw.alertLimitAmps),
    });
  }
}
