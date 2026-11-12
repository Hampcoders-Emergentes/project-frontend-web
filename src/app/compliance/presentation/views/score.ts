import { Component, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ComplianceStore } from '@compliance/application/compliance.store';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Compliance score and grade (US31) with the weighted components computed by the API. */
@Component({
  imports: [TranslatePipe, ErrorNotice, StatePanel, LocalizedDatePipe, LocalizedNumberPipe],
  selector: 'app-compliance-score-view',
  template: `
    <section class="ui-stack" aria-labelledby="score-title">
      <h2 id="score-title">{{ 'compliance.score.title' | translate }}</h2>
      @if (store.score.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.score.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="store.loadScore(storeId())" />
      } @else if (store.score.data(); as s) {
        <div class="ui-grid">
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'compliance.score.score' | translate }}</p><p class="ui-kpi__value">{{ s.score | localizedNumber: 0 }}/100</p></div>
          <div class="ui-kpi"><p class="ui-kpi__label">{{ 'compliance.score.grade' | translate }}</p><p class="ui-kpi__value">{{ s.grade }}</p></div>
        </div>
        <p class="text-meta ui-flush">{{ 'compliance.score.evaluated' | translate: { time: (s.evaluatedAt | localizedDate: 'dateTime') } }}</p>
        <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'compliance.score.components' | translate">
          <table class="ui-table">
            <caption>{{ 'compliance.score.components' | translate }}</caption>
            <thead><tr><th scope="col">{{ 'compliance.score.component' | translate }}</th><th scope="col" class="num">{{ 'compliance.score.weight' | translate }}</th>
              <th scope="col" class="num">{{ 'compliance.score.score' | translate }}</th><th scope="col">{{ 'compliance.score.explanation' | translate }}</th></tr></thead>
            <tbody>
              @for (c of s.components; track c.name) {
                <tr><th scope="row">{{ 'compliance.score.names.' + c.name | translate }}</th><td class="num">{{ c.weight | localizedNumber: 0 }}</td>
                  <td class="num">{{ c.score | localizedNumber: 0 }}</td><td class="text-meta">{{ c.explanation }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'compliance.score.weeks' | translate">
          <table class="ui-table">
            <caption>{{ 'compliance.score.weeks' | translate }}</caption>
            <thead><tr><th scope="col">{{ 'compliance.checklist.week' | translate }}</th><th scope="col" class="num">{{ 'compliance.score.bestScore' | translate }}</th></tr></thead>
            <tbody>
              @for (w of s.checklistWeeks; track w.weekStartDate) {
                <tr><th scope="row">{{ w.weekStartDate }}</th><td class="num">{{ w.bestSubmittedScore === null ? ('compliance.score.notSubmitted' | translate) : w.bestSubmittedScore }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class ComplianceScoreView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(ComplianceStore);

  constructor() {
    whenChanged(this.storeId, (storeId) => this.store.loadScore(storeId));
  }
}
