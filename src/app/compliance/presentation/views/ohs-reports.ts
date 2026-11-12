import { Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { DateRange } from '@shared/domain/date-range';
import { ComplianceStore } from '@compliance/application/compliance.store';
import { DateRangeForm } from '@shared/presentation/components/date-range-form/date-range-form';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/**
 * OHS PDF report generation and download (US34, TS04). Generation is synchronous on the API and may
 * take several seconds; the control shows a generating state meanwhile (no progress API exists).
 * Delivery by email depends on server SMTP configuration and is never promised here.
 */
@Component({
  imports: [TranslatePipe, DateRangeForm, ErrorNotice, Pagination, StatePanel, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-ohs-reports-view',
  template: `
    <section class="ui-stack" aria-labelledby="ohs-title">
      <h2 id="ohs-title">{{ 'compliance.reports.title' | translate }}</h2>
      <p class="ui-field__hint">{{ 'compliance.reports.hint' | translate }}</p>
      <app-date-range-form idPrefix="ohs" [legend]="'compliance.reports.title' | translate" [disabled]="store.reportState.submitting()"
        [submitLabel]="(store.reportState.submitting() ? 'compliance.reports.generating' : 'compliance.reports.generate') | translate"
        (rangeChange)="generate($event)" />
      @if (store.reportState.submitting()) { <p class="ui-notice" role="status">{{ 'compliance.reports.wait' | translate }}</p> }
      @if (store.reportState.error(); as failure) { <app-error-notice [error]="failure" /> }
      @if (store.downloadState.error(); as failure) { <app-error-notice [error]="failure" /> }

      @if (store.reports.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.reports.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.reports.data(); as result) {
        @if (result.items.length === 0) {
          <app-state-panel kind="empty" [heading]="'compliance.reports.none' | translate" />
        } @else {
          <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'compliance.reports.list' | translate">
            <table class="ui-table">
              <thead><tr><th scope="col">{{ 'compliance.reports.generatedAt' | translate }}</th><th scope="col">{{ 'compliance.reports.period' | translate }}</th>
                <th scope="col" class="num">{{ 'compliance.score.score' | translate }}</th><th scope="col">{{ 'compliance.reports.signed' | translate }}</th>
                <th scope="col" class="num">KB</th><th scope="col"><span class="sr-only">{{ 'shared.labels.actions' | translate }}</span></th></tr></thead>
              <tbody>
                @for (r of result.items; track r.reportId) {
                  <tr><th scope="row">{{ r.generatedAt | localizedDate: 'dateTime' }}</th>
                    <td>{{ r.from | localizedDate: 'date' }} – {{ r.to | localizedDate: 'date' }}</td>
                    <td class="num">{{ r.complianceScore | localizedNumber: 0 }}</td>
                    <td>{{ (r.isSigned ? 'compliance.reports.yes' : 'compliance.reports.no') | translate }}</td>
                    <td class="num">{{ r.sizeBytes / 1024 | localizedNumber: 1 }}</td>
                    <td><button class="ui-button ui-button--secondary ui-button--small" type="button" [disabled]="store.downloadState.submitting()" (click)="store.downloadReport(storeId(), r)">
                      {{ 'shared.actions.download' | translate }}<span class="sr-only"> {{ r.fileName }}</span></button></td></tr>
                }
              </tbody>
            </table>
          </div>
          @if (result.totalPages; as pages) { <app-pagination [page]="result.page" [pageCount]="pages" (pageChange)="page.set($event); load()" /> }
        }
      }
    </section>
  `,
})
export class OhsReportsView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(ComplianceStore);
  protected readonly page = signal(1);

  constructor() {
    whenChanged(this.storeId, () => this.load());
  }

  protected load(): void {
    this.store.loadReports(this.storeId(), this.page());
  }

  protected generate(range: DateRange): void {
    this.page.set(1);
    this.store.generateReport(this.storeId(), range.from, range.to);
  }
}
