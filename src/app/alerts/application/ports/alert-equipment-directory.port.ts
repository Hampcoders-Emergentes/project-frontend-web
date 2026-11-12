import type { Observable } from 'rxjs';

/** What the alerts context needs about an equipment: its name and the area that addresses it. */
export interface AlertEquipmentRef {
  readonly equipmentId: string;
  readonly equipmentName: string;
  readonly areaId: string;
  readonly areaName: string;
}

/**
 * Consumer-owned port: equipment of a store, to label alerts and address the equipment-scoped alert
 * endpoints (acknowledgement, detail). Implemented by a stores facade.
 */
export abstract class AlertEquipmentDirectoryPort {
  abstract listEquipment(storeId: string): Observable<readonly AlertEquipmentRef[]>;
}
