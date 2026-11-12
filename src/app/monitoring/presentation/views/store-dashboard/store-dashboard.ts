import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import { MONITORING_POLL_MS, MonitoringStore } from '@monitoring/application/monitoring.store';
import {
  type ElectricalReading,
  type OperationalState,
  type RiskLevel,
  riskRank,
} from '@monitoring/domain/model/monitoring';
import { ReadingValues } from '@monitoring/presentation/components/reading-values/reading-values';
import { GRID_APPEARANCE, RISK_APPEARANCE, STATE_APPEARANCE } from '@monitoring/presentation/risk-appearance';
import { ErrorNotice } from '@shared/presentation/components/error-notice/error-notice';
import { Freshness } from '@shared/presentation/components/freshness/freshness';
import { Icon } from '@shared/presentation/components/icon/icon';
import { Skeleton } from '@shared/presentation/components/skeleton/skeleton';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { redirectOnStoreNotFound } from '@shared/presentation/routing/store-not-found';
import { whenChanged } from '@shared/presentation/routing/when-changed';

/** One equipment card: dashboard status merged with its grid risk and last reading. */
interface EquipmentCard {
  readonly equipmentId: string;
  readonly areaId: string;
  readonly name: string;
  readonly areaName: string;
  readonly state: OperationalState;
  readonly riskLevel: RiskLevel;
  readonly reading: ElectricalReading | null;
  readonly openCriticalAlerts: number;
  readonly openNonCriticalAlerts: number;
}

/** Store monitoring dashboard (US08, US16, US21): counts, grid KPIs and equipment risk cards. */
@Component({
  imports: [RouterLink, TranslatePipe, ErrorNotice, Freshness, Icon, Skeleton, StatePanel, StatusTag, ReadingValues, LocalizedNumberPipe],
  selector: 'app-store-dashboard-view',
  templateUrl: './store-dashboard.html',
})
export class StoreDashboardView {
  readonly storeId = input.required<string>();
  protected readonly monitoring = inject(MonitoringStore);
  protected readonly summary = this.monitoring.summary;
  protected readonly grid = this.monitoring.grid;
  protected readonly riskAppearance = RISK_APPEARANCE;
  protected readonly gridAppearance = GRID_APPEARANCE;
  protected readonly stateAppearance = STATE_APPEARANCE;
  protected readonly pollSeconds = MONITORING_POLL_MS.dashboard / 1000;
  protected readonly riskLevels: readonly RiskLevel[] = ['CRITICAL_RISK', 'WARNING', 'DISCONNECTED', 'UNKNOWN', 'SAFE'];

  protected readonly cards = computed<EquipmentCard[]>(() => {
    const summary = this.summary.data();
    const grid = this.grid.data();
    if (summary === null) {
      return [];
    }
    const gridById = new Map((grid?.equipment ?? []).map((item) => [item.equipmentId, item]));
    return summary.equipment
      .map((item) => {
        const gridItem = gridById.get(item.equipmentId);
        return {
          equipmentId: item.equipmentId,
          areaId: item.areaId,
          name: item.name,
          areaName: item.areaName,
          state: item.state,
          // Without grid data the risk is unknown, never assumed safe.
          riskLevel: gridItem?.riskLevel ?? 'UNKNOWN',
          reading: gridItem?.lastReading ?? null,
          openCriticalAlerts: item.openCriticalAlerts,
          openNonCriticalAlerts: item.openNonCriticalAlerts,
        };
      })
      .sort((a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel) || a.name.localeCompare(b.name));
  });

  constructor() {
    let subscription: Subscription | null = null;
    whenChanged(this.storeId, (storeId) => {
      subscription?.unsubscribe();
      subscription = this.monitoring.watchDashboard(storeId);
    });
    inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());
    redirectOnStoreNotFound(this.summary.error);
  }
}
