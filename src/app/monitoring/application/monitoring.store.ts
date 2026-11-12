import { inject, Injectable } from '@angular/core';
import type { Subscription } from 'rxjs';
import { AsyncResource } from '@shared/application/async-resource';
import type { Page } from '@shared/application/page';
import { PageVisibilityPort, pollWhileVisible } from '@shared/application/polling';
import type { DateRange } from '@shared/domain/date-range';
import type {
  DashboardSummary,
  EquipmentRisk,
  EquipmentTelemetry,
  GridStatusSnapshot,
  Measurement,
  StoreConnectivity,
} from '@monitoring/domain/model/monitoring';
import {
  GetEquipmentRiskLevelUseCase,
  GetGridStatusUseCase,
  GetLatestTelemetryUseCase,
  GetMeasurementHistoryUseCase,
  GetSensorConnectivityUseCase,
  GetStoreDashboardSummaryUseCase,
} from '@monitoring/application/use-cases/monitoring-use-cases';

/** Polling cadences (ms): dashboard/grid 15-30 s, risk/connectivity ~30 s, telemetry 10-30 s. */
export const MONITORING_POLL_MS = { dashboard: 20_000, risk: 30_000, telemetry: 15_000, connectivity: 30_000 } as const;

/**
 * Kitchen monitoring state. Polled sections pause in hidden tabs and stop on `401`/`403`/`404`;
 * views own the returned subscriptions. Every section is keyed by store (and equipment) id.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly visibility = inject(PageVisibilityPort);
  private readonly summaryUseCase = inject(GetStoreDashboardSummaryUseCase);
  private readonly gridUseCase = inject(GetGridStatusUseCase);
  private readonly riskUseCase = inject(GetEquipmentRiskLevelUseCase);
  private readonly telemetryUseCase = inject(GetLatestTelemetryUseCase);
  private readonly historyUseCase = inject(GetMeasurementHistoryUseCase);
  private readonly connectivityUseCase = inject(GetSensorConnectivityUseCase);

  readonly summary = new AsyncResource<DashboardSummary>();
  readonly grid = new AsyncResource<GridStatusSnapshot>();
  readonly risk = new AsyncResource<EquipmentRisk>();
  readonly telemetry = new AsyncResource<EquipmentTelemetry>();
  readonly history = new AsyncResource<Page<Measurement>>();
  readonly connectivity = new AsyncResource<StoreConnectivity>();

  watchDashboard(storeId: string): Subscription {
    const summary = this.summary.follow(
      storeId,
      pollWhileVisible(this.visibility, MONITORING_POLL_MS.dashboard, () => this.summaryUseCase.execute(storeId)),
    );
    summary.add(
      this.grid.follow(
        storeId,
        pollWhileVisible(this.visibility, MONITORING_POLL_MS.dashboard, () => this.gridUseCase.execute(storeId)),
      ),
    );
    return summary;
  }

  watchEquipment(storeId: string, areaId: string, equipmentId: string): Subscription {
    const key = `${storeId}|${areaId}|${equipmentId}`;
    const risk = this.risk.follow(
      key,
      pollWhileVisible(this.visibility, MONITORING_POLL_MS.risk, () => this.riskUseCase.execute(storeId, areaId, equipmentId)),
    );
    risk.add(
      this.telemetry.follow(
        key,
        pollWhileVisible(this.visibility, MONITORING_POLL_MS.telemetry, () =>
          this.telemetryUseCase.execute(storeId, areaId, equipmentId),
        ),
      ),
    );
    return risk;
  }

  /** Measurement history is loaded on demand only. */
  loadHistory(storeId: string, areaId: string, equipmentId: string, range: DateRange, page: number): void {
    this.history.load(
      `${storeId}|${equipmentId}|${range.from.toISOString()}|${range.to.toISOString()}|${page}`,
      this.historyUseCase.execute(storeId, areaId, equipmentId, range, page),
    );
  }

  watchConnectivity(storeId: string): Subscription {
    return this.connectivity.follow(
      storeId,
      pollWhileVisible(this.visibility, MONITORING_POLL_MS.connectivity, () => this.connectivityUseCase.execute(storeId)),
    );
  }
}
