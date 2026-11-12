import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type DateRange, dateRangeProblem } from '@shared/domain/date-range';
import { fromLocalInputValue, toDateInputValue } from '@shared/presentation/forms/date-input';

const DAY_MS = 86_400_000;

/**
 * Date-range picker by calendar days. The end day is inclusive for the user and converted to the
 * half-open API range `[from, to)`; ranges longer than 31 days or reversed are rejected with a
 * translated message before anything is requested.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe],
  selector: 'app-date-range-form',
  template: `
    <form class="ui-actions" [formGroup]="form" (ngSubmit)="submit()" [attr.aria-label]="legend()">
      <div class="ui-field">
        <label class="ui-field__label" [for]="idPrefix() + '-from'">{{ 'shared.labels.fromDay' | translate }}</label>
        <input class="ui-input" type="date" [id]="idPrefix() + '-from'" formControlName="from" [attr.aria-invalid]="problem() !== null || null" />
      </div>
      <div class="ui-field">
        <label class="ui-field__label" [for]="idPrefix() + '-to'">{{ 'shared.labels.toDay' | translate }}</label>
        <input class="ui-input" type="date" [id]="idPrefix() + '-to'" formControlName="to" [attr.aria-invalid]="problem() !== null || null"
          [attr.aria-describedby]="problem() ? idPrefix() + '-error' : null" />
      </div>
      <ng-content />
      <button class="ui-button ui-button--secondary ui-align-end" type="submit" [disabled]="disabled()">{{ submitLabel() ?? ('shared.actions.apply' | translate) }}</button>
    </form>
    @if (problem(); as key) {
      <p class="ui-field__error" role="alert" [id]="idPrefix() + '-error'">{{ key | translate }}</p>
    } @else {
      <p class="ui-field__hint">{{ 'shared.dateRange.hint' | translate }}</p>
    }
  `,
  styles: ':host { display: grid; gap: 0.375rem; }',
})
export class DateRangeForm implements OnInit {
  /** Unique prefix for input ids. */
  readonly idPrefix = input.required<string>();
  /** Translated accessible name of the form. */
  readonly legend = input<string | null>(null);
  readonly initial = input<DateRange | null>(null);
  readonly submitLabel = input<string | null>(null);
  readonly disabled = input(false);
  readonly rangeChange = output<DateRange>();

  protected readonly problem = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({ from: [''], to: [''] });

  ngOnInit(): void {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const initial = this.initial() ?? { from: new Date(today.getTime() - 6 * DAY_MS), to: new Date(today.getTime() + DAY_MS) };
    this.form.setValue({ from: toDateInputValue(initial.from), to: toDateInputValue(new Date(initial.to.getTime() - 1)) });
  }

  protected submit(): void {
    const from = fromLocalInputValue(this.form.controls.from.value);
    const toDay = fromLocalInputValue(this.form.controls.to.value);
    const to = toDay === null ? null : new Date(toDay.getFullYear(), toDay.getMonth(), toDay.getDate() + 1);
    const problem = from === null || to === null ? 'invalid' : dateRangeProblem({ from, to });
    this.problem.set(problem === null ? null : `shared.dateRange.${problem}`);
    if (problem === null && from !== null && to !== null) {
      this.rangeChange.emit({ from, to });
    }
  }
}
