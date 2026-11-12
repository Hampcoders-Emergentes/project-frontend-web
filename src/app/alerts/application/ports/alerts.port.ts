import type { Observable } from 'rxjs';
import type { Page } from '@shared/application/page';
import type { ActiveAlerts, Alert, AlertChanges, AlertHistoryFilter } from '@alerts/domain/model/alert';

/** Alert queries and workflow commands. A `409` means the alert already moved on. */
export abstract class AlertsPort {
  abstract getActive(storeId: string): Observable<ActiveAlerts>;
  /** Alerts whose latest change is after `afterSequence`, one page at a time (see `hasMore`). */
  abstract getChanges(storeId: string, afterSequence: number): Observable<AlertChanges>;
  abstract getHistory(storeId: string, filter: AlertHistoryFilter, page: number): Observable<Page<Alert>>;
  abstract getAlert(storeId: string, areaId: string, equipmentId: string, alertId: string): Observable<Alert>;
  abstract acknowledge(storeId: string, areaId: string, equipmentId: string, alertId: string): Observable<Alert>;
  abstract assign(alertId: string, technicianId: string, technicianName: string | null): Observable<Alert>;
  abstract resolve(alertId: string, notes: string | null): Observable<Alert>;
}

/** Realtime alerts of the joined store (`ReceiveAlert`), best-effort and not replayed. */
export abstract class AlertStreamPort {
  abstract readonly received$: Observable<Alert>;
  abstract readonly reconnected$: Observable<void>;
  /** True while realtime alerts are delivered; polling is only the fallback when false. */
  abstract readonly live$: Observable<boolean>;
}
