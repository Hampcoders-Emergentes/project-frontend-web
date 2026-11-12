import { Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { DateRange } from '@shared/domain/date-range';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import { DateRangeForm } from '@shared/presentation/components/date-range-form/date-range-form';
import { DataQualityTag } from '@shared/presentation/components/data-quality/data-quality';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedCurrencyPipe } from '@shared/presentation/pipes/localized-currency.pipe';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

const DAY = 86_400_000;

/** Compares two periods (US25). A zero baseline shows the change as "not available". */
@Component({
  imports: [TranslatePipe, DateRangeForm, DataQualityTag, ErrorNotice, StatePanel, LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-comparison-view',
  template: `
    <section class="ui-stack" aria-labelledby="cmp-title">
      <h2 id="cmp-title">{{ 'analytics.comparison.title' | translate }}</h2>
      <div class="ui-form-grid">
        <div class="ui-card ui-stack ui-stack--tight ui-card--compact">
          <h3>{{ 'analytics.comparison.period1' | translate }}</h3>
          <app-date-range-form idPrefix="cmp1" [initial]="period1()" [legend]="'analytics.comparison.period1' | translate" (rangeChange)="period1.set($event); compare()" />
        </div>
        <div class="ui-card ui-stack ui-stack--tight ui-card--compact">
          <h3>{{ 'analytics.comparison.period2' | translate }}</h3>
          <app-date-range-form idPrefix="cmp2" [initial]="period2()" [legend]="'analytics.comparison.period2' | translate" (rangeChange)="period2.set($event); compare()" />
        </div>
      </div>

      @if (store.comparison.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.comparison.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="compare()" />
      } @else if (store.comparison.data(); as c) {
        @if (c.insufficientData) {
          <app-data-quality quality="insufficient" />
          <p class="text-meta ui-flush">{{ 'analytics.insufficientTelemetry' | translate }}</p>
        } @else {
        <div class="ui-grid">
          @for (p of [c.period1, c.period2]; track $index) {
            <div class="ui-kpi">
              <p class="ui-kpi__label">{{ ($index === 0 ? 'analytics.comparison.period1' : 'analytics.comparison.period2') | translate }}</p>
              <p class="ui-kpi__value">{{ p.kwh | localizedNumber: 1 }} kWh</p>
              <p class="text-meta ui-flush">{{ p.cost | localizedCurrency: c.currency }} · {{ 'analytics.comparison.perDay' | translate: { value: (p.averageDailyKwh | localizedNumber: 1) } }}</p>
              <p class="text-meta ui-flush">{{ p.from | localizedDate: 'date' }} – {{ p.to | localizedDate: 'date' }} ({{ p.days }} {{ 'analytics.days' | translate }})</p>
            </div>
          }
          <div class="ui-kpi">
            <p class="ui-kpi__label">{{ 'analytics.comparison.change' | translate }}</p>
            <p class="ui-kpi__value">{{ c.kwhChangePercent === null ? ('analytics.notAvailable' | translate) : (c.kwhChangePercent | localizedNumber: 1) + ' %' }}</p>
            <p class="text-meta ui-flush">{{ c.kwhDifference | localizedNumber: 1 }} kWh · {{ c.costDifference | localizedCurrency: c.currency }}</p>
            @if (c.kwhChangePercent === null) { <p class="text-meta ui-flush">{{ 'analytics.comparison.zeroBaseline' | translate }}</p> }
          </div>
        </div>
        @if (c.period1.kwh === 0 || c.period2.kwh === 0) {
          <p class="ui-notice ui-notice--warning">{{ 'analytics.comparison.partial' | translate }}</p>
        }
        <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'analytics.consumption.byEquipment' | translate">
          <table class="ui-table">
            <thead><tr>
              <th scope="col">{{ 'analytics.equipment' | translate }}</th>
              <th scope="col" class="num">{{ 'analytics.comparison.period1' | translate }} (kWh)</th>
              <th scope="col" class="num">{{ 'analytics.comparison.period2' | translate }} (kWh)</th>
              <th scope="col" class="num">{{ 'analytics.comparison.change' | translate }}</th>
            </tr></thead>
            <tbody>
              @for (e of c.equipment; track e.equipmentId) {
                <tr>
                  <th scope="row">{{ e.equipmentName }}</th>
                  <td class="num">{{ e.period1Kwh | localizedNumber: 2 }}</td>
                  <td class="num">{{ e.period2Kwh | localizedNumber: 2 }}</td>
                  <td class="num">{{ e.kwhChangePercent === null ? ('analytics.notAvailable' | translate) : (e.kwhChangePercent | localizedNumber: 1) + ' %' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        }
      }
    </section>
  `,
})
export class ComparisonView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  private readonly today = new Date(new Date().setHours(0, 0, 0, 0));
  protected readonly period2 = signal<DateRange>({ from: new Date(this.today.getTime() - 6 * DAY), to: new Date(this.today.getTime() + DAY) });
  protected readonly period1 = signal<DateRange>({ from: new Date(this.today.getTime() - 13 * DAY), to: new Date(this.today.getTime() - 6 * DAY) });

  constructor() {
    whenChanged(this.storeId, () => this.compare());
  }

  protected compare(): void {
    this.store.compare(this.storeId(), this.period1(), this.period2());
  }
}
