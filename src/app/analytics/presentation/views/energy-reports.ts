import { Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { DateRange } from '@shared/domain/date-range';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import type { EnergyReport, EnergyReportFormat } from '@analytics/domain/model/energy';
import { DateRangeForm } from '@shared/presentation/components/date-range-form/date-range-form';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/**
 * Energy report generation (US24/TS04). Reports are generated synchronously by the API (several
 * seconds, no progress information), so the submit control shows a generating state until it answers.
 */
@Component({
  imports: [TranslatePipe, DateRangeForm, ErrorNotice, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-energy-reports-view',
  template: `
    <section class="ui-stack" aria-labelledby="rep-title">
      <h2 id="rep-title">{{ 'analytics.reports.title' | translate }}</h2>
      <app-date-range-form idPrefix="rep" [legend]="'analytics.reports.title' | translate" [disabled]="store.reportState.submitting()"
        [submitLabel]="(store.reportState.submitting() ? 'analytics.reports.generating' : 'analytics.reports.generate') | translate"
        (rangeChange)="generate($event)">
        <div class="ui-field">
          <label class="ui-field__label" for="rep-format">{{ 'analytics.reports.format' | translate }}</label>
          <select class="ui-input" id="rep-format" [value]="format()" (change)="setFormat($event)">
            <option value="pdf">PDF</option><option value="csv">CSV</option>
          </select>
        </div>
      </app-date-range-form>
      @if (store.reportState.submitting()) {
        <p class="ui-notice" role="status" aria-live="polite">{{ 'analytics.reports.wait' | translate }}</p>
      }
      @if (store.reportState.error(); as failure) { <app-error-notice [error]="failure" /> }
      @if (store.downloadState.error(); as failure) { <app-error-notice [error]="failure" /> }

      @if (reports().length === 0) {
        <p class="text-meta">{{ 'analytics.reports.none' | translate }}</p>
      } @else {
        <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'analytics.reports.generated' | translate">
          <table class="ui-table">
            <caption>{{ 'analytics.reports.generated' | translate }}</caption>
            <thead><tr><th scope="col">{{ 'analytics.reports.file' | translate }}</th><th scope="col">{{ 'analytics.period' | translate }}</th>
              <th scope="col" class="num">KB</th><th scope="col">{{ 'analytics.reports.expires' | translate }}</th><th scope="col"><span class="sr-only">{{ 'shared.labels.actions' | translate }}</span></th></tr></thead>
            <tbody>
              @for (r of reports(); track r.reportId) {
                <tr>
                  <th scope="row">{{ r.fileName }}</th>
                  <td>{{ r.from | localizedDate: 'date' }} – {{ r.to | localizedDate: 'date' }}</td>
                  <td class="num">{{ r.sizeBytes / 1024 | localizedNumber: 1 }}</td>
                  <td>{{ r.expiresAt | localizedDate: 'dateTime' }}</td>
                  <td><button class="ui-button ui-button--secondary ui-button--small" type="button" [disabled]="store.downloadState.submitting()" (click)="download(r)">
                    {{ 'shared.actions.download' | translate }}<span class="sr-only"> {{ r.fileName }}</span></button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class EnergyReportsView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  protected readonly format = signal<EnergyReportFormat>('pdf');

  protected reports(): readonly EnergyReport[] {
    return this.store.generatedReports.key() === this.storeId() ? (this.store.generatedReports.data() ?? []) : [];
  }

  protected setFormat(event: Event): void {
    this.format.set((event.target as HTMLSelectElement).value === 'csv' ? 'csv' : 'pdf');
  }

  protected generate(range: DateRange): void {
    this.store.generateReport(this.storeId(), range, this.format());
  }

  protected download(report: EnergyReport): void {
    this.store.downloadReport(this.storeId(), report);
  }
}
