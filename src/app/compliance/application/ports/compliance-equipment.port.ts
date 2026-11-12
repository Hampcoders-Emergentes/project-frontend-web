import type { Observable } from 'rxjs';

/** What compliance needs about an equipment to register and list its maintenance certificates. */
export interface ComplianceEquipmentRef {
  readonly equipmentId: string;
  readonly equipmentName: string;
  readonly areaName: string;
}

/** Consumer-owned port implemented by a stores facade. */
export abstract class ComplianceEquipmentPort {
  abstract listEquipment(storeId: string): Observable<readonly ComplianceEquipmentRef[]>;
}
