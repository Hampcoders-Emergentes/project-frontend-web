import { Component, effect, inject, input, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ComplianceStore } from '@compliance/application/compliance.store';
import {
  CHECKLIST_LIMITS,
  CHECKLIST_RESULTS,
  checklistItemProblem,
  type ChecklistResult,
  type ChecklistStatus,
  type WeeklyChecklist,
} from '@compliance/domain/model/compliance';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { toDateInputValue } from '@shared/presentation/forms/date-input';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

type ItemGroup = FormGroup<{ code: FormControl<string>; label: FormControl<string>; result: FormControl<ChecklistResult | ''>; notes: FormControl<string> }>;

/**
 * Weekly 13-point OHS checklist (US30): save a draft (re-saving updates it) or submit, which locks it.
 * Every save carries an `Idempotency-Key`, reused only when the same submission is retried.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, ErrorNotice, StatePanel, LocalizedDatePipe],
  selector: 'app-compliance-checklist-view',
  templateUrl: './checklist.html',
})
export class ComplianceChecklistView {
  readonly storeId = input.required<string>();
  protected readonly store = inject(ComplianceStore);
  protected readonly results = CHECKLIST_RESULTS;
  protected readonly limits = CHECKLIST_LIMITS;
  protected readonly draftId = signal<string | null>(null);
  protected readonly confirmingSubmit = signal(false);
  protected readonly page = signal(1);

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    inspectorStaffId: ['', [Validators.required, Validators.pattern(/\S/)]],
    inspectorName: ['', [Validators.required, Validators.pattern(/\S/)]],
    weekOf: [toDateInputValue(new Date())],
    observations: ['', Validators.maxLength(CHECKLIST_LIMITS.observationsMax)],
    items: this.fb.array<ItemGroup>([]),
  });

  constructor() {
    whenChanged(this.storeId, (storeId) => {
      this.draftId.set(null);
      this.store.loadChecklistData(storeId);
    });
    effect(() => {
      const template = this.store.template.data();
      if (template !== null && this.form.controls.items.length === 0) {
        template.forEach((item) =>
          this.form.controls.items.push(
            this.fb.group({
              code: [item.code],
              label: [item.label],
              result: this.fb.control<ChecklistResult | ''>(''),
              notes: [''],
            }),
          ),
        );
      }
    });
    redirectOnStoreNotFound(this.store.template.error);
  }

  protected itemProblem(group: ItemGroup): string | null {
    const value = group.getRawValue();
    const problem = checklistItemProblem({ code: value.code, result: value.result === '' ? null : value.result, notes: value.notes });
    return problem === null ? null : `compliance.checklist.problems.${problem}`;
  }

  protected showItemProblem(group: ItemGroup): boolean {
    return group.touched && this.itemProblem(group) !== null;
  }

  /** Continues editing an existing draft. */
  protected editDraft(checklist: WeeklyChecklist): void {
    this.draftId.set(checklist.id);
    this.form.patchValue({
      inspectorStaffId: checklist.inspectorStaffId,
      inspectorName: checklist.inspectorName,
      weekOf: checklist.weekStartDate,
      observations: checklist.observations ?? '',
    });
    this.form.controls.items.controls.forEach((group) => {
      const saved = checklist.items.find((item) => item.code === group.controls.code.value);
      const result = CHECKLIST_RESULTS.find((r) => r === saved?.result) ?? '';
      group.patchValue({ result, notes: saved?.notes ?? '' });
    });
  }

  protected save(status: ChecklistStatus): void {
    this.form.markAllAsTouched();
    const invalidItems = this.form.controls.items.controls.some((group) => this.itemProblem(group) !== null);
    if (this.form.invalid || invalidItems) {
      return;
    }
    if (status === 'SUBMITTED' && !this.confirmingSubmit()) {
      this.confirmingSubmit.set(true);
      return;
    }
    this.confirmingSubmit.set(false);
    const raw = this.form.getRawValue();
    this.store.saveChecklist(
      this.storeId(),
      {
        checklistId: this.draftId(),
        inspectorStaffId: raw.inspectorStaffId.trim(),
        inspectorName: raw.inspectorName.trim(),
        weekOf: raw.weekOf === '' ? null : raw.weekOf,
        observations: raw.observations.trim() === '' ? null : raw.observations.trim(),
        status,
        items: raw.items.map((item) => ({
          code: item.code,
          result: item.result === '' ? 'NOT_APPLICABLE' : item.result,
          notes: item.notes.trim() === '' ? null : item.notes.trim(),
        })),
      },
      (saved) => this.draftId.set(saved.status === 'DRAFT' ? saved.id : null),
    );
  }

  protected changePage(offset: -1 | 1): void {
    this.page.update((page) => Math.max(1, page + offset));
    this.store.loadChecklists(this.storeId(), this.page());
  }
}
