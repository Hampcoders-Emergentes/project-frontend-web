import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import { dateRangeProblem } from '@shared/domain/date-range';
import { ACTIVE_ALERTS_POLL_MS, AlertsStore } from '@alerts/application/alerts.store';
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  type Alert,
  type AlertHistoryFilter,
  type AlertSeverity,
  type AlertStatus,
} from '@alerts/domain/model/alert';
import {
  AlertDetailDialog,
  type AssignIntent,
} from '@alerts/presentation/components/alert-detail-dialog/alert-detail-dialog';
import { AlertTable } from '@alerts/presentation/components/alert-table/alert-table';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Freshness } from '@shared/presentation/components/freshness/freshness';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { fromLocalInputValue } from '@shared/presentation/forms/date-input';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

const EMPTY_FILTER: AlertHistoryFilter = { status: null, severity: null, equipmentId: null, from: null, to: null };

/** Alert center: active alerts (polled, realtime when available) and filtered history. */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, AlertDetailDialog, AlertTable, ErrorNotice, Freshness, StatePanel],
  selector: 'app-alert-center-view',
  templateUrl: './alert-center.html',
})
export class AlertCenterView {
  readonly storeId = input.required<string>();
  protected readonly alerts = inject(AlertsStore);
  protected readonly statuses = ALERT_STATUSES;
  protected readonly severities = ALERT_SEVERITIES;
  protected readonly pollSeconds = ACTIVE_ALERTS_POLL_MS / 1000;
  protected readonly page = signal(1);
  protected readonly filter = signal<AlertHistoryFilter>(EMPTY_FILTER);
  protected readonly rangeProblem = signal<string | null>(null);
  protected readonly selectedEquipment = computed(() => {
    const alert = this.alerts.selected.data();
    return alert === null ? null : (this.alerts.equipmentById().get(alert.equipmentId) ?? null);
  });

  protected readonly filterForm = inject(NonNullableFormBuilder).group({
    status: [''],
    severity: [''],
    equipmentId: [inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId') ?? ''],
    from: [''],
    to: [''],
  });

  constructor() {
    let subscription: Subscription | null = null;
    whenChanged(this.storeId, (storeId) => {
      subscription?.unsubscribe();
      subscription = this.alerts.watchActive(storeId);
      this.applyFilter();
    });
    inject(DestroyRef).onDestroy(() => {
      subscription?.unsubscribe();
      this.alerts.close();
    });
    redirectOnStoreNotFound(this.alerts.active.error);
  }

  protected applyFilter(): void {
    const raw = this.filterForm.getRawValue();
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
      status: ALERT_STATUSES.find((s): s is AlertStatus => s === raw.status) ?? null,
      severity: ALERT_SEVERITIES.find((s): s is AlertSeverity => s === raw.severity) ?? null,
      equipmentId: raw.equipmentId === '' ? null : raw.equipmentId,
      from,
      to,
    });
    this.page.set(1);
    this.loadHistory();
  }

  protected clearFilter(): void {
    this.filterForm.reset({ status: '', severity: '', equipmentId: '', from: '', to: '' });
    this.applyFilter();
  }

  protected changePage(offset: -1 | 1): void {
    this.page.update((page) => Math.max(1, page + offset));
    this.loadHistory();
  }

  protected loadHistory(): void {
    this.alerts.loadHistory(this.storeId(), this.filter(), this.page());
  }

  protected open(alert: Alert): void {
    this.alerts.open(this.storeId(), alert);
  }

  protected acknowledge(alert: Alert): void {
    this.alerts.acknowledge(this.storeId(), alert);
  }

  protected assign(alert: Alert, intent: AssignIntent): void {
    this.alerts.assign(this.storeId(), alert, intent.technicianId, intent.technicianName);
  }

  protected resolve(alert: Alert, notes: string): void {
    this.alerts.resolve(this.storeId(), alert, notes);
  }
}
