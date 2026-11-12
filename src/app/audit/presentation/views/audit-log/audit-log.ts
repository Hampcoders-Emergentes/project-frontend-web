import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { dateRangeProblem } from '@shared/domain/date-range';
import { AuditLogStore } from '@audit/application/audit-log.store';
import { type AuditFilter, isFailedAuditEntry } from '@audit/domain/model/audit-entry';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { fromLocalInputValue } from '@shared/presentation/forms/date-input';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

const EMPTY: AuditFilter = { from: null, to: null, action: null, status: null, operatorId: null, resource: null };
const blankToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

/** Store operational audit log with filters (US41). */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, StatePanel, LocalizedDatePipe],
  selector: 'app-audit-log-view',
  template: `
    <div class="ui-stack">
      <header class="ui-page-header">
        <div>
          <h1 class="ui-page-header__title">{{ 'audit.title' | translate }}</h1>
          <p class="ui-page-header__subtitle">{{ 'audit.subtitle' | translate }}</p>
        </div>
      </header>

      <form class="ui-card ui-form ui-card--compact" [formGroup]="form" (ngSubmit)="apply()">
        <div class="ui-form-grid">
          @for (field of textFields; track field) {
            <div class="ui-field">
              <label class="ui-field__label" [for]="'audit-' + field">{{ 'audit.fields.' + field | translate }}</label>
              <input class="ui-input" [id]="'audit-' + field" [formControlName]="field" />
            </div>
          }
          <div class="ui-field"><label class="ui-field__label" for="audit-from">{{ 'shared.labels.from' | translate }}</label>
            <input class="ui-input" id="audit-from" type="datetime-local" formControlName="from" /></div>
          <div class="ui-field"><label class="ui-field__label" for="audit-to">{{ 'shared.labels.to' | translate }}</label>
            <input class="ui-input" id="audit-to" type="datetime-local" formControlName="to" /></div>
        </div>
        <p class="ui-field__hint">{{ 'shared.dateRange.hint' | translate }}</p>
        @if (rangeProblem(); as key) { <p class="ui-field__error" role="alert">{{ key | translate }}</p> }
        <div class="ui-actions">
          <button class="ui-button" type="submit">{{ 'shared.actions.apply' | translate }}</button>
          <button class="ui-button ui-button--ghost" type="button" (click)="clear()">{{ 'shared.actions.clear' | translate }}</button>
        </div>
      </form>

      @if (store.entries.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.entries.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="load()" />
      } @else if (store.entries.data(); as result) {
        @if (result.items.length === 0) {
          <app-state-panel kind="empty" [heading]="'audit.empty' | translate" [message]="'audit.emptyMessage' | translate" />
        } @else {
          <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'audit.title' | translate">
            <table class="ui-table">
              <thead><tr>
                <th scope="col">{{ 'audit.fields.timestamp' | translate }}</th><th scope="col">{{ 'audit.fields.action' | translate }}</th>
                <th scope="col">{{ 'audit.fields.resource' | translate }}</th><th scope="col">{{ 'audit.fields.request' | translate }}</th>
                <th scope="col">{{ 'audit.fields.status' | translate }}</th><th scope="col">{{ 'audit.fields.operatorId' | translate }}</th>
              </tr></thead>
              <tbody>
                @for (e of result.items; track e.id) {
                  <tr>
                    <th scope="row">{{ e.timestamp | localizedDate: 'dateTime' }}</th>
                    <td>{{ e.action }}</td><td>{{ e.resource }}</td>
                    <td><code>{{ e.httpMethod }} {{ e.path }}</code></td>
                    <td><span class="ui-tag" [class.ui-tag--warning]="failed(e)" [class.ui-tag--success]="!failed(e)">{{ e.statusCode }} · {{ e.status }}</span></td>
                    <td>{{ e.userId ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="ui-actions ui-actions--end">
            <button class="ui-button ui-button--secondary ui-button--small" type="button" [disabled]="page() === 1" (click)="changePage(-1)">{{ 'shared.pagination.previous' | translate }}</button>
            <span class="text-meta">{{ 'shared.pagination.page' | translate: { page: page() } }}</span>
            <button class="ui-button ui-button--secondary ui-button--small" type="button" [disabled]="!result.hasMore" (click)="changePage(1)">{{ 'shared.pagination.next' | translate }}</button>
          </div>
        }
      }
      <p class="text-meta">{{ 'audit.limitations' | translate }}</p>
    </div>
  `,
})
export class AuditLogView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AuditLogStore);
  protected readonly textFields = ['action', 'status', 'resource', 'operatorId'] as const;
  protected readonly page = signal(1);
  protected readonly filter = signal<AuditFilter>(EMPTY);
  protected readonly rangeProblem = signal<string | null>(null);
  protected readonly failed = isFailedAuditEntry;
  protected readonly form = inject(NonNullableFormBuilder).group({
    action: [''], status: [''], resource: [''], operatorId: [''], from: [''], to: [''],
  });

  constructor() {
    whenChanged(this.storeId, () => this.load());
    redirectOnStoreNotFound(this.store.entries.error);
  }

  protected apply(): void {
    const raw = this.form.getRawValue();
    const from = fromLocalInputValue(raw.from);
    const to = fromLocalInputValue(raw.to);
    let problem: string | null = null;
    if ((from === null) !== (to === null)) {
      problem = 'bothOrNeither';
    } else if (from !== null && to !== null) {
      problem = dateRangeProblem({ from, to });
    }
    this.rangeProblem.set(problem === null ? null : `shared.dateRange.${problem}`);
    if (problem !== null) {
      return;
    }
    this.filter.set({
      from, to,
      action: blankToNull(raw.action),
      status: blankToNull(raw.status),
      resource: blankToNull(raw.resource),
      operatorId: blankToNull(raw.operatorId),
    });
    this.page.set(1);
    this.load();
  }

  protected clear(): void {
    this.form.reset();
    this.apply();
  }

  protected changePage(offset: -1 | 1): void {
    this.page.update((page) => Math.max(1, page + offset));
    this.load();
  }

  protected load(): void {
    this.store.load(this.storeId(), this.filter(), this.page());
  }
}
