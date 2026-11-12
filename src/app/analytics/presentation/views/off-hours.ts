import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { DateRange } from '@shared/domain/date-range';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import { DateRangeForm } from '@shared/presentation/components/date-range-form/date-range-form';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedCurrencyPipe } from '@shared/presentation/pipes/localized-currency.pipe';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Off-hours / standby consumption (US27); depends on configured opening hours. */
@Component({
  imports: [RouterLink, TranslatePipe, DateRangeForm, ErrorNotice, StatePanel, LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-off-hours-view',
  template: `
    <section class="ui-stack" aria-labelledby="oh-title">
      <h2 id="oh-title">{{ 'analytics.offHours.title' | translate }}</h2>
      @if (store.openingHours.data(); as hours) {
        @if (!hours.isConfigured) {
          <div class="ui-notice ui-notice--warning">
            <p class="ui-notice__body">{{ 'analytics.offHours.notConfigured' | translate }}</p>
            <a class="ui-button ui-button--secondary ui-button--small" routerLink="../opening-hours">{{ 'analytics.offHours.configure' | translate }}</a>
          </div>
        }
      }
      <app-date-range-form idPrefix="oh" [legend]="'analytics.offHours.title' | translate" (rangeChange)="range.set($event); load()">
        <div class="ui-field">
          <label class="ui-field__label" for="oh-threshold">{{ 'analytics.offHours.threshold' | translate }} (kW)</label>
          <input class="ui-input tnum" id="oh-threshold" type="number" min="0" step="0.01" [value]="threshold()" (change)="setThreshold($event)" />
        </div>
      </app-date-range-form>

      @if (store.offHours.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.offHours.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.offHours.data(); as data) {
        <div class="ui-grid">
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'analytics.offHours.total' | translate }}</p><p class="ui-kpi__value">{{ data.totalKwh | localizedNumber: 2 }} kWh</p>
            <p class="text-meta ui-flush">{{ data.totalCost | localizedCurrency: data.currency }} · {{ data.timeZone }}</p></div>
        </div>
        @if (data.episodes.length === 0) {
          <app-state-panel kind="empty" [heading]="'analytics.offHours.none' | translate" [message]="'analytics.offHours.noneMessage' | translate" />
        } @else {
          <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'analytics.offHours.episodes' | translate">
            <table class="ui-table">
              <caption>{{ 'analytics.offHours.episodes' | translate }}</caption>
              <thead><tr>
                <th scope="col">{{ 'analytics.equipment' | translate }}</th><th scope="col">{{ 'shared.labels.from' | translate }}</th>
                <th scope="col">{{ 'shared.labels.to' | translate }}</th><th scope="col" class="num">kWh</th>
                <th scope="col" class="num">{{ 'analytics.peakKw' | translate }}</th><th scope="col" class="num">{{ 'analytics.cost' | translate }}</th>
              </tr></thead>
              <tbody>
                @for (e of data.episodes; track $index) {
                  <tr><th scope="row">{{ e.equipmentName }}</th><td>{{ e.start | localizedDate: 'dateTime' }}</td><td>{{ e.end | localizedDate: 'dateTime' }}</td>
                    <td class="num">{{ e.kwh | localizedNumber: 2 }}</td><td class="num">{{ e.peakKw | localizedNumber: 2 }}</td><td class="num">{{ e.cost | localizedCurrency: data.currency }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
})
export class OffHoursView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  protected readonly threshold = signal(0.1);
  protected readonly range = signal<DateRange>((() => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    return { from: new Date(today.getTime() - 6 * 86_400_000), to: new Date(today.getTime() + 86_400_000) };
  })());

  constructor() {
    whenChanged(this.storeId, (storeId) => {
      this.store.loadOpeningHours(storeId);
      this.load();
    });
  }

  protected setThreshold(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value) && value >= 0) {
      this.threshold.set(value);
      this.load();
    }
  }

  protected load(): void {
    this.store.loadOffHours(this.storeId(), this.range(), this.threshold());
  }
}
