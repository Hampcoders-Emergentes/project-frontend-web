import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Page } from '@shared/application/page';
import type { ActiveAlerts, Alert, AlertHistoryFilter } from '@alerts/domain/model/alert';
import { AlertsPort } from '@alerts/application/ports/alerts.port';
import {
  AlertEquipmentDirectoryPort,
  type AlertEquipmentRef,
} from '@alerts/application/ports/alert-equipment-directory.port';

@Injectable({ providedIn: 'root' })
export class GetActiveAlertsUseCase {
  private readonly alerts = inject(AlertsPort);
  execute(storeId: string): Observable<ActiveAlerts> {
    return this.alerts.getActive(storeId);
  }
}

@Injectable({ providedIn: 'root' })
export class GetAlertHistoryUseCase {
  private readonly alerts = inject(AlertsPort);
  execute(storeId: string, filter: AlertHistoryFilter, page: number): Observable<Page<Alert>> {
    return this.alerts.getHistory(storeId, filter, page);
  }
}

@Injectable({ providedIn: 'root' })
export class GetAlertDetailUseCase {
  private readonly alerts = inject(AlertsPort);
  execute(storeId: string, areaId: string, equipmentId: string, alertId: string): Observable<Alert> {
    return this.alerts.getAlert(storeId, areaId, equipmentId, alertId);
  }
}

@Injectable({ providedIn: 'root' })
export class AcknowledgeAlertUseCase {
  private readonly alerts = inject(AlertsPort);
  execute(storeId: string, areaId: string, equipmentId: string, alertId: string): Observable<Alert> {
    return this.alerts.acknowledge(storeId, areaId, equipmentId, alertId);
  }
}

@Injectable({ providedIn: 'root' })
export class AssignAlertUseCase {
  private readonly alerts = inject(AlertsPort);
  execute(alertId: string, technicianId: string, technicianName: string): Observable<Alert> {
    const name = technicianName.trim();
    return this.alerts.assign(alertId, technicianId.trim(), name === '' ? null : name);
  }
}

@Injectable({ providedIn: 'root' })
export class ResolveAlertUseCase {
  private readonly alerts = inject(AlertsPort);
  execute(alertId: string, notes: string): Observable<Alert> {
    const trimmed = notes.trim();
    return this.alerts.resolve(alertId, trimmed === '' ? null : trimmed);
  }
}

/** Equipment names and areas, to label alerts and address equipment-scoped endpoints. */
@Injectable({ providedIn: 'root' })
export class ListAlertEquipmentUseCase {
  private readonly directory = inject(AlertEquipmentDirectoryPort);
  execute(storeId: string): Observable<readonly AlertEquipmentRef[]> {
    return this.directory.listEquipment(storeId);
  }
}
