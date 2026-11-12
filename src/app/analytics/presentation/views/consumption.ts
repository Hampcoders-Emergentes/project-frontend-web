import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { DateRange } from '@shared/domain/date-range';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import type { Granularity } from '@analytics/domain/model/energy';
import { BarChart, type BarDatum } from '@shared/presentation/components/bar-chart/bar-chart';
import { DateRangeForm } from '@shared/presentation/components/date-range-form/date-range-form';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedCurrencyPipe } from '@shared/presentation/pipes/localized-currency.pipe';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Store and equipment energy consumption (US24) with CSV export. */
@Component({
  imports: [TranslatePipe, BarChart, DateRangeForm, ErrorNotice, StatePanel, LocalizedCurrencyPipe, LocalizedNumberPipe],
  selector: 'app-consumption-view',
  template: `
    <section class="ui-stack" aria-labelledby="consumption-title">
      <h2 id="consumption-title">{{ 'analytics.consumption.title' | translate }}</h2>
      <app-date-range-form idPrefix="cons" [legend]="'analytics.consumption.title' | translate" (rangeChange)="setRange($event)">
        <div class="ui-field">
          <label class="ui-field__label" for="cons-granularity">{{ 'analytics.consumption.granularity' | translate }}</label>
          <select class="ui-input" id="cons-granularity" [value]="granularity()" (change)="setGranularity($event)">
            <option value="hourly">{{ 'analytics.granularity.hourly' | translate }}</option>
            <option value="daily">{{ 'analytics.granularity.daily' | translate }}</option>
          </select>
        </div>
      </app-date-range-form>
      <div class="ui-actions">
        <button class="ui-button ui-button--secondary ui-button--small" type="button" [disabled]="store.exportState.submitting()" (click)="exportCsv()">
          {{ (store.exportState.submitting() ? 'analytics.consumption.exporting' : 'analytics.consumption.exportCsv') | translate }}
        </button>
      </div>
      @if (store.exportState.error(); as failure) { <app-error-notice [error]="failure" /> }

      @if (store.consumption.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.consumption.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.consumption.data(); as data) {
        @if (data.series.length === 0) {
          <app-state-panel kind="empty" [heading]="'analytics.noData' | translate" [message]="'analytics.noDataMessage' | translate" />
        } @else {
          <div class="ui-kpi" style="max-width: 20rem">
            <p class="ui-kpi__label">{{ 'analytics.consumption.total' | translate }}</p>
            <p class="ui-kpi__value">{{ data.totalKwh | localizedNumber: 1 }} kWh</p>
            <p class="text-meta" style="margin: 0">{{ 'analytics.granularity.' + data.granularity | translate }}</p>
          </div>
          <app-bar-chart [data]="chart()" [caption]="'analytics.consumption.chart' | translate" unit="kWh"
            [labelHeader]="'analytics.period' | translate" [tableLabel]="'shared.chart.showTable' | translate" [gapLabel]="'shared.chart.noData' | translate" />
          <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'analytics.consumption.byEquipment' | translate">
            <table class="ui-table">
              <caption>{{ 'analytics.consumption.byEquipment' | translate }}</caption>
              <thead><tr>
                <th scope="col">{{ 'analytics.equipment' | translate }}</th>
                <th scope="col" class="num">kWh</th><th scope="col" class="num">{{ 'analytics.peakKw' | translate }}</th>
                <th scope="col" class="num">{{ 'analytics.samples' | translate }}</th>
              </tr></thead>
              <tbody>
                @for (e of data.equipment; track e.equipmentId) {
                  <tr>
                    <th scope="row">{{ e.equipmentName }}</th>
                    <td class="num">{{ e.kwh | localizedNumber: 2 }}</td><td class="num">{{ e.peakKw | localizedNumber: 2 }}</td>
                    <td class="num">{{ e.sampleCount === 0 ? ('analytics.insufficient' | translate) : e.sampleCount }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>

    <section class="ui-card ui-stack" aria-labelledby="eq-cons-title">
      <h2 id="eq-cons-title">{{ 'analytics.consumption.equipmentTitle' | translate }}</h2>
      <div class="ui-field" style="max-width: 24rem">
        <label class="ui-field__label" for="eq-cons-select">{{ 'analytics.equipment' | translate }}</label>
        <select class="ui-input" id="eq-cons-select" (change)="selectEquipment($event)">
          <option value="">{{ 'analytics.selectEquipment' | translate }}</option>
          @for (e of store.equipment.data() ?? []; track e.equipmentId) { <option [value]="e.equipmentId">{{ e.equipmentName }} · {{ e.areaName }}</option> }
        </select>
      </div>
      @if (selectedId()) {
        @if (store.equipmentConsumption.initialLoading()) {
          <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
        } @else if (store.equipmentConsumption.error(); as failure) {
          <app-error-notice [error]="failure" />
        } @else if (store.equipmentConsumption.data(); as eq) {
          @if (eq.sampleCount === 0) {
            <p class="ui-notice ui-notice--warning">{{ 'analytics.insufficientTelemetry' | translate }}</p>
          } @else {
            <dl class="ui-dl">
              <dt>kWh</dt><dd>{{ eq.kwh | localizedNumber: 2 }}</dd>
              <dt>{{ 'analytics.peakKw' | translate }}</dt><dd>{{ eq.peakKw | localizedNumber: 2 }} kW</dd>
              <dt>{{ 'analytics.averageKw' | translate }}</dt><dd>{{ eq.averageKw | localizedNumber: 2 }} kW</dd>
              <dt>{{ 'analytics.cost' | translate }}</dt><dd>{{ eq.cost.totalCost | localizedCurrency: eq.cost.currency }}</dd>
              <dt>{{ 'analytics.peakOffPeak' | translate }}</dt>
              <dd>{{ eq.cost.peakCost | localizedCurrency: eq.cost.currency }} / {{ eq.cost.offPeakCost | localizedCurrency: eq.cost.currency }}</dd>
              <dt>{{ 'analytics.timeZone' | translate }}</dt><dd>{{ eq.timeZone }}</dd>
            </dl>
          }
        }
      }
    </section>
  `,
  styles: ':host { display: grid; gap: var(--space-3); }',
})
export class ConsumptionView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  protected readonly granularity = signal<Granularity>('daily');
  private readonly range = signal<DateRange>(this.defaultRange());
  protected readonly selectedId = signal<string | null>(null);
  private readonly dateFormat = new LocalizedDatePipe();

  protected readonly chart = computed<BarDatum[]>(() =>
    (this.store.consumption.data()?.series ?? []).map((bucket) => ({
      label: this.dateFormat.transform(bucket.start, this.granularity() === 'hourly' ? 'dateTime' : 'date'),
      value: bucket.kwh,
    })),
  );

  constructor() {
    whenChanged(this.storeId, (storeId) => {
      this.store.loadEquipment(storeId);
      this.load();
    });
    redirectOnStoreNotFound(this.store.consumption.error);
  }

  protected setRange(range: DateRange): void {
    this.range.set(range);
    this.load();
    this.reloadEquipment();
  }

  protected setGranularity(event: Event): void {
    this.granularity.set((event.target as HTMLSelectElement).value === 'hourly' ? 'hourly' : 'daily');
    this.load();
  }

  protected load(): void {
    this.store.loadConsumption(this.storeId(), this.range(), this.granularity());
  }

  protected exportCsv(): void {
    this.store.exportCsv(this.storeId(), this.range(), this.granularity());
  }

  protected selectEquipment(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedId.set(id === '' ? null : id);
    this.reloadEquipment();
  }

  private reloadEquipment(): void {
    const ref = (this.store.equipment.data() ?? []).find((item) => item.equipmentId === this.selectedId());
    if (ref) {
      this.store.loadEquipmentConsumption(this.storeId(), ref, this.range());
    }
  }

  private defaultRange(): DateRange {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    return { from: new Date(today.getTime() - 6 * 86_400_000), to: new Date(today.getTime() + 86_400_000) };
  }
}
