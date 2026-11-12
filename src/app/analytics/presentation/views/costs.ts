import { Component, effect, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';
import { LocalizedCurrencyPipe } from '@shared/presentation/pipes/localized-currency.pipe';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** End-of-month cost projection (US28) and monthly energy budget (US28). */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, StatePanel, LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-costs-view',
  template: `
    <section class="ui-stack" aria-labelledby="proj-title">
      <h2 id="proj-title">{{ 'analytics.costs.projection' | translate }}</h2>
      @if (store.projection.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.projection.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.projection.data(); as p) {
        <div class="ui-grid">
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'analytics.costs.monthToDate' | translate }}</p>
            <p class="ui-kpi__value">{{ p.monthToDateCost | localizedCurrency: p.currency }}</p>
            <p class="text-meta ui-flush">{{ p.monthToDateKwh | localizedNumber: 1 }} kWh · {{ 'analytics.costs.elapsed' | translate: { elapsed: p.elapsedDays, total: p.daysInMonth } }}</p></div>
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'analytics.costs.projected' | translate }}</p>
            @if (p.elapsedDays === 0 || p.monthToDateKwh === 0) {
              <p class="ui-flush">{{ 'analytics.insufficientTelemetry' | translate }}</p>
            } @else {
              <p class="ui-kpi__value">{{ p.projectedCost | localizedCurrency: p.currency }}</p>
              <p class="text-meta ui-flush">{{ p.projectedKwh | localizedNumber: 1 }} kWh · {{ 'analytics.costs.method' | translate: { method: p.method } }}</p>
            }</div>
        </div>
        <p class="text-meta">{{ 'analytics.costs.generated' | translate: { time: (p.generatedAt | localizedDate: 'dateTime'), zone: p.timeZone } }}</p>
      }
    </section>

    <section class="ui-stack" aria-labelledby="budget-title">
      <h2 id="budget-title">{{ 'analytics.costs.budget' | translate }}</h2>
      @if (store.budgetStatus.error(); as failure) {
        <app-error-notice [error]="failure" />
      } @else if (store.budgetStatus.data(); as b) {
        @if (!b.hasBudget) {
          <p class="ui-notice">{{ 'analytics.costs.noBudget' | translate }}</p>
        } @else {
          <div class="ui-card ui-stack ui-stack--tight">
            @if (b.isWarning) {
              <p class="ui-tag ui-tag--warning ui-flush ui-self-start">{{ 'analytics.costs.warning' | translate }}</p>
            } @else {
              <p class="ui-tag ui-tag--success ui-flush ui-self-start">{{ 'analytics.costs.onTrack' | translate }}</p>
            }
            <label class="text-meta" for="budget-progress">{{ 'analytics.costs.consumedOf' | translate: { consumed: (b.consumedKwh | localizedNumber: 1), target: (b.targetKWh | localizedNumber: 1) } }}</label>
            <progress class="ui-progress" id="budget-progress" max="100" [value]="b.consumedPercentage ?? 0">{{ b.consumedPercentage ?? 0 }}%</progress>
            <dl class="ui-dl">
              <dt>{{ 'analytics.costs.consumedPct' | translate }}</dt><dd>{{ b.consumedPercentage === null ? ('analytics.notAvailable' | translate) : (b.consumedPercentage | localizedNumber: 1) + ' %' }}</dd>
              <dt>{{ 'analytics.costs.projectedPct' | translate }}</dt><dd>{{ b.projectedPercentage === null ? ('analytics.notAvailable' | translate) : (b.projectedPercentage | localizedNumber: 1) + ' %' }}</dd>
              <dt>{{ 'analytics.costs.remaining' | translate }}</dt><dd>{{ b.remainingKwh === null ? '—' : (b.remainingKwh | localizedNumber: 1) + ' kWh' }}</dd>
              <dt>{{ 'analytics.costs.alertAt' | translate }}</dt><dd>{{ b.alertThresholdPercentage === null ? '—' : b.alertThresholdPercentage + ' %' }}</dd>
            </dl>
          </div>
        }
      }

      <form class="ui-card ui-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <h3>{{ 'analytics.costs.setBudget' | translate }}</h3>
        @if (store.budgetState.error(); as failure) { @if (failure.status !== 400) { <app-error-notice [error]="failure" /> } }
        @if (store.budgetState.succeededAt()) { <p class="ui-notice ui-notice--success" role="status">{{ 'analytics.costs.saved' | translate }}</p> }
        <div class="ui-form-grid">
          <div class="ui-field"><label class="ui-field__label" for="b-year">{{ 'analytics.costs.year' | translate }}</label>
            <input class="ui-input tnum" id="b-year" type="number" formControlName="year" /></div>
          <div class="ui-field"><label class="ui-field__label" for="b-month">{{ 'analytics.costs.month' | translate }}</label>
            <input class="ui-input tnum" id="b-month" type="number" min="1" max="12" formControlName="month" /></div>
          <div class="ui-field"><label class="ui-field__label" for="b-target">{{ 'analytics.costs.target' | translate }} (kWh)</label>
            <input class="ui-input tnum" id="b-target" type="number" min="0" step="any" formControlName="targetKWh"
              [attr.aria-invalid]="(form.controls.targetKWh.invalid && form.controls.targetKWh.touched) || null" />
            @if (form.controls.targetKWh.invalid && form.controls.targetKWh.touched) { <p class="ui-field__error">{{ (form.controls.targetKWh.hasError('server') ? 'shared.validation.serverRejected' : 'analytics.costs.targetInvalid') | translate }}</p> }</div>
          <div class="ui-field"><label class="ui-field__label" for="b-alert">{{ 'analytics.costs.alertAt' | translate }} (%)</label>
            <input class="ui-input tnum" id="b-alert" type="number" min="0" max="100" step="any" formControlName="alertThresholdPercentage" />
            <p class="ui-field__hint">{{ 'shared.validation.optional' | translate }}</p></div>
        </div>
        <div><button class="ui-button" type="submit" [disabled]="store.budgetState.submitting()">{{ (store.budgetState.submitting() ? 'shared.actions.saving' : 'shared.actions.save') | translate }}</button></div>
      </form>
    </section>
  `,
  styles: ':host { display: grid; gap: var(--space-3); }',
})
export class CostsView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  private readonly now = new Date();
  protected readonly form = inject(NonNullableFormBuilder).group({
    year: [this.now.getFullYear(), [Validators.required, Validators.min(2000)]],
    month: [this.now.getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    targetKWh: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    alertThresholdPercentage: [null as number | null, [Validators.min(0), Validators.max(100)]],
  });

  constructor() {
    whenChanged(this.storeId, () => this.load());
    effect(() => applyServerFieldErrors(this.form, this.store.budgetState.error()));
  }

  protected load(): void {
    this.store.loadCosts(this.storeId(), this.now.getFullYear(), this.now.getMonth() + 1);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.store.saveBudget(this.storeId(), {
      year: Number(raw.year),
      month: Number(raw.month),
      targetKWh: Number(raw.targetKWh),
      alertThresholdPercentage: raw.alertThresholdPercentage === null ? null : Number(raw.alertThresholdPercentage),
    });
  }
}
