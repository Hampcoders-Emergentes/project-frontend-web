import { computed, DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable, Subscription } from 'rxjs';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import type { Page } from '@shared/application/page';
import { PageVisibilityPort, pollWithRealtimeFallback } from '@shared/application/polling';
import {
  type ActiveAlerts,
  type Alert,
  type AlertHistoryFilter,
  withReceivedAlert,
} from '@alerts/domain/model/alert';
import type { AlertEquipmentRef } from '@alerts/application/ports/alert-equipment-directory.port';
import { AlertStreamPort } from '@alerts/application/ports/alerts.port';
import {
  AcknowledgeAlertUseCase,
  AssignAlertUseCase,
  GetActiveAlertsUseCase,
  GetAlertDetailUseCase,
  GetAlertHistoryUseCase,
  ListAlertEquipmentUseCase,
  ResolveAlertUseCase,
  SyncActiveAlertsUseCase,
} from '@alerts/application/use-cases/alert-use-cases';

/** Active alerts are polled about every 30 s, only while realtime updates are not live. */
export const ACTIVE_ALERTS_POLL_MS = 30_000;

/**
 * Alert management state (US17, US19, US20, US23): active alerts (polling + realtime), history,
 * detail and the acknowledge/assign/resolve workflow. A `409` reloads the alert and the active list.
 */
@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly visibility = inject(PageVisibilityPort);
  private readonly activeUseCase = inject(GetActiveAlertsUseCase);
  private readonly syncActiveUseCase = inject(SyncActiveAlertsUseCase);
  private readonly historyUseCase = inject(GetAlertHistoryUseCase);
  private readonly detailUseCase = inject(GetAlertDetailUseCase);
  private readonly acknowledgeUseCase = inject(AcknowledgeAlertUseCase);
  private readonly assignUseCase = inject(AssignAlertUseCase);
  private readonly resolveUseCase = inject(ResolveAlertUseCase);
  private readonly equipmentUseCase = inject(ListAlertEquipmentUseCase);

  readonly active = new AsyncResource<ActiveAlerts>();
  readonly history = new AsyncResource<Page<Alert>>();
  readonly equipment = new AsyncResource<readonly AlertEquipmentRef[]>();
  readonly selected = new AsyncResource<Alert>();
  readonly workflowState = new MutationState();
  readonly equipmentById = computed(
    () => new Map((this.equipment.data() ?? []).map((item) => [item.equipmentId, item])),
  );

  private readonly stream = inject(AlertStreamPort);
  private storeId: string | null = null;
  private lastHistory: { filter: AlertHistoryFilter; page: number } | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.stream.received$.pipe(takeUntilDestroyed(destroyRef)).subscribe((alert) => {
      if (this.storeId !== null && this.active.key() === this.storeId) {
        this.active.patch((current) => withReceivedAlert(current, alert));
      }
    });
    // Events are not replayed: whenever the connection becomes live again (initial connect and every
    // reconnect) the fallback loader runs once and fetches only the changes after the cursor.
  }

  watchActive(storeId: string): Subscription {
    this.storeId = storeId;
    this.loadEquipment(storeId);
    return this.active.follow(
      storeId,
      pollWithRealtimeFallback(this.visibility, this.stream.live$, ACTIVE_ALERTS_POLL_MS, () =>
        this.syncActiveUseCase.execute(storeId, this.active.key() === storeId ? this.active.data() : null),
      ),
    );
  }

  loadEquipment(storeId: string): void {
    if (this.equipment.key() !== storeId || this.equipment.error() !== null) {
      this.equipment.load(storeId, this.equipmentUseCase.execute(storeId));
    }
  }

  loadHistory(storeId: string, filter: AlertHistoryFilter, page: number): void {
    this.storeId = storeId;
    this.lastHistory = { filter, page };
    this.history.load(
      `${storeId}|${JSON.stringify(filter)}|${page}`,
      this.historyUseCase.execute(storeId, filter, page),
    );
  }

  /** Opens an alert, re-reading it through its equipment (the only single-alert endpoint). */
  open(storeId: string, alert: Alert): void {
    this.workflowState.clear();
    this.selected.accept(alert.id, alert);
    const areaId = this.equipmentById().get(alert.equipmentId)?.areaId;
    if (areaId !== undefined) {
      this.selected.load(alert.id, this.detailUseCase.execute(storeId, areaId, alert.equipmentId, alert.id));
    }
  }

  close(): void {
    this.selected.reset();
    this.workflowState.clear();
  }

  acknowledge(storeId: string, alert: Alert): void {
    const areaId = this.equipmentById().get(alert.equipmentId)?.areaId;
    if (areaId === undefined) {
      return;
    }
    this.runWorkflow(storeId, alert, this.acknowledgeUseCase.execute(storeId, areaId, alert.equipmentId, alert.id));
  }

  assign(storeId: string, alert: Alert, technicianId: string, technicianName: string): void {
    this.runWorkflow(storeId, alert, this.assignUseCase.execute(alert.id, technicianId, technicianName));
  }

  resolve(storeId: string, alert: Alert, notes: string): void {
    this.runWorkflow(storeId, alert, this.resolveUseCase.execute(alert.id, notes));
  }

  private runWorkflow(storeId: string, alert: Alert, command: Observable<Alert>): void {
    this.workflowState.run(
      command,
      (updated) => {
        this.selected.accept(updated.id, updated);
        this.afterChange(storeId);
      },
      (error) => {
        if (error.status === 409) {
          this.open(storeId, alert);
          this.afterChange(storeId);
        }
      },
    );
  }

  private afterChange(storeId: string): void {
    this.refreshActive();
    if (this.lastHistory !== null) {
      this.loadHistory(storeId, this.lastHistory.filter, this.lastHistory.page);
    }
  }

  private refreshActive(): void {
    if (this.storeId !== null) {
      this.active.load(this.storeId, this.activeUseCase.execute(this.storeId));
    }
  }
}
