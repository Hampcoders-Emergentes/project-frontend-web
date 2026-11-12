import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import { dateRangeProblem, type DateRange, lastDays } from '@shared/domain/date-range';
import { MonitoringStore } from '@monitoring/application/monitoring.store';
import { ReadingValues } from '@monitoring/presentation/components/reading-values/reading-values';
import { RISK_APPEARANCE, STATE_APPEARANCE } from '@monitoring/presentation/risk-appearance';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Freshness } from '@shared/presentation/components/freshness/freshness';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { fromLocalInputValue, toDateTimeLocalValue } from '@shared/presentation/forms/date-input';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** Equipment monitoring: risk level, latest telemetry (polled) and measurement history (on demand). */
@Component({
  imports: [
    ReactiveFormsModule, RouterLink, TranslatePipe, ErrorNotice, Freshness, Icon, StatePanel, StatusTag,
    ReadingValues, LocalizedDatePipe, LocalizedNumberPipe,
  ],
  selector: 'app-equipment-monitoring-view',
  templateUrl: './equipment-monitoring.html',
})
export class EquipmentMonitoringView {
  readonly storeId = input.required<string>();
  readonly areaId = input.required<string>();
  readonly equipmentId = input.required<string>();
  protected readonly monitoring = inject(MonitoringStore);
  protected readonly risk = this.monitoring.risk;
  protected readonly telemetry = this.monitoring.telemetry;
  protected readonly history = this.monitoring.history;
  protected readonly riskAppearance = RISK_APPEARANCE;
  protected readonly stateAppearance = STATE_APPEARANCE;

  private readonly initialRange = lastDays(1);
  protected readonly rangeForm = inject(NonNullableFormBuilder).group({
    from: [toDateTimeLocalValue(this.initialRange.from)],
    to: [toDateTimeLocalValue(this.initialRange.to)],
  });
  protected readonly range = signal<DateRange>(this.initialRange);
  protected readonly page = signal(1);
  protected readonly rangeProblem = signal<string | null>(null);
  protected readonly address = computed(() => ({ storeId: this.storeId(), areaId: this.areaId(), equipmentId: this.equipmentId() }));

  constructor() {
    let subscription: Subscription | null = null;
    whenChanged(this.address, ({ storeId, areaId, equipmentId }) => {
      subscription?.unsubscribe();
      subscription = this.monitoring.watchEquipment(storeId, areaId, equipmentId);
      this.loadHistory();
    });
    inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());
    redirectOnStoreNotFound(this.risk.error);
  }

  protected applyRange(): void {
    const from = fromLocalInputValue(this.rangeForm.controls.from.value);
    const to = fromLocalInputValue(this.rangeForm.controls.to.value);
    const problem = from === null || to === null ? 'invalid' : dateRangeProblem({ from, to });
    this.rangeProblem.set(problem === null ? null : `shared.dateRange.${problem}`);
    if (problem === null && from !== null && to !== null) {
      this.range.set({ from, to });
      this.page.set(1);
      this.loadHistory();
    }
  }

  protected changePage(offset: -1 | 1): void {
    this.page.update((page) => Math.max(1, page + offset));
    this.loadHistory();
  }

  protected loadHistory(): void {
    const { storeId, areaId, equipmentId } = this.address();
    this.monitoring.loadHistory(storeId, areaId, equipmentId, this.range(), this.page());
  }
}
