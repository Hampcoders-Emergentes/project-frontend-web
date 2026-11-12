import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { DateRange } from '@shared/domain/date-range';
import type { Page } from '@shared/application/page';
import type {
  DashboardSummary,
  EquipmentRisk,
  EquipmentTelemetry,
  GridStatusSnapshot,
  Measurement,
  StoreConnectivity,
} from '@monitoring/domain/model/monitoring';
import { MonitoringPort } from '@monitoring/application/ports/monitoring.port';

@Injectable({ providedIn: 'root' })
export class GetStoreDashboardSummaryUseCase {
  private readonly monitoring = inject(MonitoringPort);
  execute(storeId: string): Observable<DashboardSummary> {
    return this.monitoring.getDashboardSummary(storeId);
  }
}

@Injectable({ providedIn: 'root' })
export class GetGridStatusUseCase {
  private readonly monitoring = inject(MonitoringPort);
  execute(storeId: string): Observable<GridStatusSnapshot> {
    return this.monitoring.getGridStatus(storeId);
  }
}

@Injectable({ providedIn: 'root' })
export class GetEquipmentRiskLevelUseCase {
  private readonly monitoring = inject(MonitoringPort);
  execute(storeId: string, areaId: string, equipmentId: string): Observable<EquipmentRisk> {
    return this.monitoring.getRiskLevel(storeId, areaId, equipmentId);
  }
}

@Injectable({ providedIn: 'root' })
export class GetLatestTelemetryUseCase {
  private readonly monitoring = inject(MonitoringPort);
  execute(storeId: string, areaId: string, equipmentId: string): Observable<EquipmentTelemetry> {
    return this.monitoring.getTelemetry(storeId, areaId, equipmentId);
  }
}

@Injectable({ providedIn: 'root' })
export class GetMeasurementHistoryUseCase {
  private readonly monitoring = inject(MonitoringPort);
  execute(storeId: string, areaId: string, equipmentId: string, range: DateRange, page: number): Observable<Page<Measurement>> {
    return this.monitoring.getMeasurements(storeId, areaId, equipmentId, range, page);
  }
}

@Injectable({ providedIn: 'root' })
export class GetSensorConnectivityUseCase {
  private readonly monitoring = inject(MonitoringPort);
  execute(storeId: string): Observable<StoreConnectivity> {
    return this.monitoring.getConnectivity(storeId);
  }
}
