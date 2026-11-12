import { Component, effect, inject, input } from '@angular/core';
import { type AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, type ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsStore } from '@analytics/application/analytics.store';
import { DAYS_OF_WEEK, type DayOfWeek, isValidClockTime, type OpeningDay } from '@analytics/domain/model/energy';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { whenChanged } from '@shared/presentation/routing/when-changed';

function dayValidator(group: AbstractControl): ValidationErrors | null {
  const value = group.value as { open: boolean; openTime: string; closeTime: string };
  return !value.open || (isValidClockTime(value.openTime) && isValidClockTime(value.closeTime)) ? null : { time: true };
}

/** Store opening hours (US26), in the store time zone; days left closed are not sent. */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, ErrorNotice, StatePanel],
  selector: 'app-opening-hours-view',
  template: `
    <section class="ui-stack" aria-labelledby="hours-title">
      <h2 id="hours-title">{{ 'analytics.openingHours.title' | translate }}</h2>
      @if (store.openingHours.initialLoading()) {
        <app-state-panel kind="loading" [heading]="'shared.states.loading' | translate" />
      } @else if (store.openingHours.error(); as failure) {
        <app-error-notice [error]="failure" [retryable]="true" (retry)="store.loadOpeningHours(storeId())" />
      } @else if (store.openingHours.data(); as hours) {
        <p class="text-meta" style="margin: 0">{{ 'analytics.timeZone' | translate }}: {{ hours.timeZone }}</p>
        @if (!hours.isConfigured) { <p class="ui-notice ui-notice--warning">{{ 'analytics.openingHours.notConfigured' | translate }}</p> }
        @if (store.openingHoursState.error(); as failure) { <app-error-notice [error]="failure" /> }
        @if (store.openingHoursState.succeededAt()) { <p class="ui-notice ui-notice--success" role="status">{{ 'analytics.openingHours.saved' | translate }}</p> }
        <form class="ui-card ui-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="ui-table-wrap" role="region" tabindex="0" [attr.aria-label]="'analytics.openingHours.title' | translate">
            <table class="ui-table">
              <thead><tr><th scope="col">{{ 'analytics.openingHours.day' | translate }}</th><th scope="col">{{ 'analytics.openingHours.open' | translate }}</th>
                <th scope="col">{{ 'analytics.openingHours.opens' | translate }}</th><th scope="col">{{ 'analytics.openingHours.closes' | translate }}</th></tr></thead>
              <tbody formArrayName="days">
                @for (day of form.controls.days.controls; track $index; let i = $index) {
                  <tr [formGroupName]="i">
                    <th scope="row">{{ 'analytics.daysOfWeek.' + days[i] | translate }}</th>
                    <td><label class="ui-check"><input type="checkbox" formControlName="open" /><span class="sr-only">{{ 'analytics.openingHours.openOn' | translate: { day: ('analytics.daysOfWeek.' + days[i] | translate) } }}</span></label></td>
                    <td><input class="ui-input" type="time" formControlName="openTime" [attr.aria-label]="('analytics.openingHours.opens' | translate) + ' ' + ('analytics.daysOfWeek.' + days[i] | translate)" [attr.aria-invalid]="day.invalid || null" /></td>
                    <td><input class="ui-input" type="time" formControlName="closeTime" [attr.aria-label]="('analytics.openingHours.closes' | translate) + ' ' + ('analytics.daysOfWeek.' + days[i] | translate)" [attr.aria-invalid]="day.invalid || null" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (form.invalid && form.touched) { <p class="ui-field__error" role="alert">{{ 'analytics.openingHours.invalid' | translate }}</p> }
          <div><button class="ui-button" type="submit" [disabled]="store.openingHoursState.submitting()">{{ (store.openingHoursState.submitting() ? 'shared.actions.saving' : 'shared.actions.save') | translate }}</button></div>
        </form>
      }
    </section>
  `,
})
export class OpeningHoursView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(AnalyticsStore);
  protected readonly days = DAYS_OF_WEEK;
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    days: this.fb.array(
      DAYS_OF_WEEK.map(() => this.fb.group({ open: [false], openTime: ['08:00'], closeTime: ['22:00'] }, { validators: dayValidator })),
    ),
  });

  constructor() {
    whenChanged(this.storeId, (storeId) => this.store.loadOpeningHours(storeId));
    effect(() => {
      const hours = this.store.openingHours.data();
      if (hours === null) {
        return;
      }
      DAYS_OF_WEEK.forEach((name, index) => {
        const day = hours.days.find((item) => item.dayOfWeek === name);
        this.form.controls.days.at(index).setValue(
          day ? { open: true, openTime: day.openTime, closeTime: day.closeTime } : { open: false, openTime: '08:00', closeTime: '22:00' },
        );
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const days: OpeningDay[] = this.form.getRawValue().days.flatMap((day, index) => {
      const dayOfWeek: DayOfWeek | undefined = DAYS_OF_WEEK[index];
      return day.open && dayOfWeek ? [{ dayOfWeek, openTime: day.openTime, closeTime: day.closeTime }] : [];
    });
    this.store.saveOpeningHours(this.storeId(), days);
  }
}
