import { Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/**
 * Predictive maintenance warnings (US29). Equipment with insufficient telemetry is listed apart: no
 * prediction is not the same as healthy.
 */
@Component({
  imports: [TranslatePipe, ErrorNotice, StatePanel, LocalizedDatePipe],
  selector: 'app-maintenance-view',
  template: `
    <section class="ui-stack" aria-labelledby="pred-title">
      <div class="ui-section-header" style="margin: 0">
        <h2 id="pred-title">{{ 'analytics.maintenance.title' | translate }}</h2>
        <div class="ui-field">
          <label class="ui-field__label" for="pred-days">{{ 'analytics.maintenance.horizon' | translate }}</label>
          <select class="ui-input" id="pred-days" [value]="days()" (change)="setDays($event)">
            @for (option of [7, 14, 30]; track option) { <option [value]="option">{{ 'analytics.maintenance.days' | translate: { days: option } }}</option> }
          </select>
        </div>
      </div>
      @if (store.predictions.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.predictions.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.predictions.data(); as data) {
        <p class="text-meta" style="margin: 0">{{ 'analytics.maintenance.analysed' | translate: { count: data.analysedEquipment, time: (data.generatedAt | localizedDate: 'dateTime') } }}</p>
        @if (data.insufficientDataEquipmentIds.length > 0) {
          <p class="ui-notice ui-notice--warning">{{ 'analytics.maintenance.insufficient' | translate: { count: data.insufficientDataEquipmentIds.length } }}</p>
        }
        @if (data.predictions.length === 0) {
          <app-state-panel kind="empty" [heading]="'analytics.maintenance.none' | translate" [message]="'analytics.maintenance.noneMessage' | translate" />
        } @else {
          <ul class="ui-grid" style="list-style: none; margin: 0; padding: 0">
            @for (p of data.predictions; track p.equipmentId) {
              <li class="ui-card ui-stack" style="gap: var(--space-1)">
                <h3>{{ p.equipmentName }}</h3>
                <p class="ui-tag ui-tag--warning" style="margin: 0; justify-self: start">{{ 'analytics.maintenance.severity' | translate: { severity: p.severity } }}</p>
                @if (p.daysToPowerFactorLimit !== null) {
                  <p style="margin: 0">{{ 'analytics.maintenance.daysToLimit' | translate: { days: p.daysToPowerFactorLimit } }}</p>
                }
                @for (f of p.findings; track f.code) {
                  <div><strong>{{ f.description }}</strong><br /><span class="text-meta">{{ f.recommendedAction }}</span></div>
                }
                @if (p.recommendedWindow; as w) {
                  <p class="text-meta" style="margin: 0">{{ 'analytics.maintenance.window' | translate }}: {{ w.start | localizedDate: 'dateTime' }} – {{ w.end | localizedDate: 'dateTime' }}</p>
                }
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class MaintenanceView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  protected readonly days = signal(14);

  constructor() {
    whenChanged(this.storeId, () => this.load());
  }

  protected setDays(event: Event): void {
    this.days.set(Number((event.target as HTMLSelectElement).value) || 14);
    this.load();
  }

  protected load(): void {
    this.store.loadPredictions(this.storeId(), this.days());
  }
}
