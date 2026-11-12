import { Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { dateRangeProblem } from '@shared/domain/date-range';
import { ShiftRosterStore } from '@stores/application/shift-roster.store';
import { isValidShiftWindow, type ShiftAssignment } from '@stores/domain/model/shift-roster';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Freshness } from '@shared/presentation/components/freshness/freshness';
import { Icon } from '@shared/presentation/components/icon/icon';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { fromLocalInputValue, toDateInputValue, toDateTimeLocalValue } from '@shared/presentation/forms/date-input';
import { applyServerFieldErrors } from '@shared/presentation/forms/server-field-errors';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

const DAY_MS = 86_400_000;

/**
 * Shift roster and on-duty staff (US23, US35). Workers are roster entries (code, name, role), not
 * login accounts: no account is created here.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, ErrorNotice, Freshness, Icon, Pagination, StatePanel, LocalizedDatePipe],
  selector: 'app-shift-roster-view',
  templateUrl: './shift-roster.html',
})
export class ShiftRosterView {
  readonly storeId = input.required<string>();
  protected readonly roster = inject(ShiftRosterStore);
  protected readonly pendingRemoval = signal<ShiftAssignment | null>(null);
  protected readonly rangeError = signal<string | null>(null);

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly today = new Date(new Date().setHours(0, 0, 0, 0));
  protected readonly windowForm = this.fb.group({
    from: [toDateInputValue(this.today), Validators.required],
    to: [toDateInputValue(new Date(this.today.getTime() + 7 * DAY_MS)), Validators.required],
  });
  protected readonly page = signal(1);

  protected readonly shiftForm = this.fb.group({
    workerCode: ['', [Validators.required, Validators.pattern(/\S/)]],
    workerName: ['', [Validators.required, Validators.pattern(/\S/)]],
    role: ['', [Validators.required, Validators.pattern(/\S/)]],
    startsAt: [toDateTimeLocalValue(new Date()), Validators.required],
    endsAt: [toDateTimeLocalValue(new Date(Date.now() + 8 * 3_600_000)), Validators.required],
  });
  protected readonly windowInvalid = signal(false);

  constructor() {
    whenChanged(this.storeId, (storeId) => {
      this.roster.loadOnDuty(storeId);
      this.loadWindow();
    });
    effect(() => applyServerFieldErrors(this.shiftForm, this.roster.scheduleState.error()));
    redirectOnStoreNotFound(this.roster.onDuty.error);
  }

  protected applyWindow(): void {
    this.page.set(1);
    this.loadWindow();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.loadWindow();
  }

  protected schedule(): void {
    const raw = this.shiftForm.getRawValue();
    const startsAt = fromLocalInputValue(raw.startsAt);
    const endsAt = fromLocalInputValue(raw.endsAt);
    const windowOk = startsAt !== null && endsAt !== null && isValidShiftWindow({ startsAt, endsAt });
    this.windowInvalid.set(!windowOk);
    if (this.shiftForm.invalid || !windowOk || startsAt === null || endsAt === null) {
      this.shiftForm.markAllAsTouched();
      return;
    }
    this.roster.schedule(
      this.storeId(),
      { workerCode: raw.workerCode, workerName: raw.workerName, role: raw.role, startsAt, endsAt },
      () => this.shiftForm.patchValue({ workerCode: '', workerName: '', role: '' }),
    );
  }

  protected confirmRemoval(): void {
    const shift = this.pendingRemoval();
    this.pendingRemoval.set(null);
    if (shift !== null) {
      this.roster.remove(this.storeId(), shift.id);
    }
  }

  private loadWindow(): void {
    const from = fromLocalInputValue(this.windowForm.controls.from.value);
    const toDay = fromLocalInputValue(this.windowForm.controls.to.value);
    const to = toDay === null ? null : new Date(toDay.getTime() + DAY_MS);
    const problem = from === null || to === null ? 'invalid' : dateRangeProblem({ from, to });
    this.rangeError.set(problem === null ? null : `shared.dateRange.${problem}`);
    if (problem === null && from !== null && to !== null) {
      this.roster.loadAssignments(this.storeId(), { from, to, page: this.page() });
    }
  }
}
