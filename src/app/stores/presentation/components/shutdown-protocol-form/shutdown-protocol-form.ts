import { Component, effect, inject, input, output } from '@angular/core';
import { type FormArray, type FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import type { AppError } from '@shared/application/app-error';
import {
  type SafeToCleanRule,
  SHUTDOWN_PROTOCOL_LIMITS,
  type ShutdownProtocol,
} from '@stores/domain/model/equipment-safety';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/** The protocol as edited. */
export interface ShutdownProtocolDraft {
  readonly shutdownSteps: string[];
  readonly emergencyIsolationSteps: string[];
  readonly safeToCleanRule: SafeToCleanRule;
}

type StepList = 'shutdownSteps' | 'emergencyIsolationSteps';

/**
 * Shutdown and emergency-isolation steps of an equipment (US12), 1-30 steps each, plus the
 * safe-to-clean rule the kitchen panel evaluates. Steps can be reordered with buttons (keyboard
 * accessible, no drag-only interaction).
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, Icon, LocalizedDatePipe],
  selector: 'app-shutdown-protocol-form',
  templateUrl: './shutdown-protocol-form.html',
})
export class ShutdownProtocolForm {
  readonly protocol = input<ShutdownProtocol | null>(null);
  readonly submitting = input(false);
  readonly error = input<AppError | null>(null);
  readonly saved = input(false);
  readonly save = output<ShutdownProtocolDraft>();

  protected readonly limits = SHUTDOWN_PROTOCOL_LIMITS;
  protected readonly lists: readonly StepList[] = ['shutdownSteps', 'emergencyIsolationSteps'];
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    shutdownSteps: this.fb.array<FormControl<string>>([]),
    emergencyIsolationSteps: this.fb.array<FormControl<string>>([]),
    maxDeEnergizedCurrentAmps: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
    maxReadingAgeMinutes: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
    requireNoActiveCriticalAlerts: [true],
  });

  constructor() {
    effect(() => {
      const protocol = this.protocol();
      if (protocol !== null) {
        this.resetSteps('shutdownSteps', protocol.shutdownSteps);
        this.resetSteps('emergencyIsolationSteps', protocol.emergencyIsolationSteps);
        this.form.patchValue({
          maxDeEnergizedCurrentAmps: protocol.safeToCleanRule.maxDeEnergizedCurrentAmps,
          maxReadingAgeMinutes: protocol.safeToCleanRule.maxReadingAgeMinutes,
          requireNoActiveCriticalAlerts: protocol.safeToCleanRule.requireNoActiveCriticalAlerts,
        });
        this.form.markAsPristine();
      }
    });
  }

  protected steps(list: StepList): FormArray<FormControl<string>> {
    return this.form.controls[list];
  }

  protected addStep(list: StepList): void {
    if (this.steps(list).length < this.limits.maxSteps) {
      this.steps(list).push(this.stepControl(''));
    }
  }

  protected removeStep(list: StepList, index: number): void {
    if (this.steps(list).length > this.limits.minSteps) {
      this.steps(list).removeAt(index);
    }
  }

  protected moveStep(list: StepList, index: number, offset: -1 | 1): void {
    const array = this.steps(list);
    const target = index + offset;
    if (target < 0 || target >= array.length) {
      return;
    }
    const control = array.at(index);
    array.removeAt(index);
    array.insert(target, control);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.save.emit({
      shutdownSteps: raw.shutdownSteps,
      emergencyIsolationSteps: raw.emergencyIsolationSteps,
      safeToCleanRule: {
        maxDeEnergizedCurrentAmps: Number(raw.maxDeEnergizedCurrentAmps),
        maxReadingAgeMinutes: Number(raw.maxReadingAgeMinutes),
        requireNoActiveCriticalAlerts: raw.requireNoActiveCriticalAlerts,
      },
    });
  }

  private stepControl(value: string): FormControl<string> {
    return this.fb.control(value, [Validators.required, Validators.pattern(/\S/)]);
  }

  private resetSteps(list: StepList, steps: readonly string[]): void {
    const array = this.steps(list);
    array.clear();
    (steps.length > 0 ? steps : ['']).forEach((step) => array.push(this.stepControl(step)));
  }
}
