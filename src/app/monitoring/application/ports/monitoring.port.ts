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

/** Read-only kitchen monitoring of a store. */
export abstract class MonitoringPort {
  abstract getDashboardSummary(storeId: string): Observable<DashboardSummary>;
  abstract getGridStatus(storeId: string): Observable<GridStatusSnapshot>;
  abstract getRiskLevel(storeId: string, areaId: string, equipmentId: string): Observable<EquipmentRisk>;
  abstract getTelemetry(storeId: string, areaId: string, equipmentId: string): Observable<EquipmentTelemetry>;
  /** Half-open range of at most 31 days; validated before sending. */
  abstract getMeasurements(
    storeId: string,
    areaId: string,
    equipmentId: string,
    range: DateRange,
    page: number,
  ): Observable<Page<Measurement>>;
  abstract getConnectivity(storeId: string): Observable<StoreConnectivity>;
}
