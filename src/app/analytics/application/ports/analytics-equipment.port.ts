import type { Observable } from 'rxjs';

/** What analytics needs about an equipment to request its consumption. */
export interface AnalyticsEquipmentRef {
  readonly equipmentId: string;
  readonly equipmentName: string;
  readonly areaId: string;
  readonly areaName: string;
}

/** Consumer-owned port implemented by a stores facade. */
export abstract class AnalyticsEquipmentPort {
  abstract listEquipment(storeId: string): Observable<readonly AnalyticsEquipmentRef[]>;
}
