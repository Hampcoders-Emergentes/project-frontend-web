import { inject, Injectable } from '@angular/core';
import { defer, map, type Observable } from 'rxjs';
import type { Page } from '@shared/application/page';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import { serializeRange } from '@shared/infrastructure/api/date-serialization';
import { type HasMorePageResponse, toPage } from '@shared/infrastructure/api/paging';
import { clientValidationError } from '@shared/infrastructure/http/problem-details';
import type { ActiveAlerts, Alert, AlertChanges, AlertHistoryFilter } from '@alerts/domain/model/alert';
import type { AlertsPort } from '@alerts/application/ports/alerts.port';
import {
  type AlertChangesResponse,
  type AlertResponse,
  toAlert,
  toAlertChanges,
} from '@alerts/infrastructure/alert-assembler';

interface ActiveAlertsResponse {
  generatedAtUtc: string;
  openCritical: number;
  openNonCritical: number;
  hasCriticalLeakage: boolean;
  latestSequence?: number;
  items: AlertResponse[];
}

/** AlertsApi implements AlertsPort against the alert-management endpoints. */
@Injectable({ providedIn: 'root' })
export class AlertsApi implements AlertsPort {
  private readonly api = inject(ApiClient);

  getActive(storeId: string): Observable<ActiveAlerts> {
    return this.api.get<ActiveAlertsResponse>(apiPath('stores', storeId, 'alerts', 'active')).pipe(
      map((r) => ({
        generatedAt: new Date(r.generatedAtUtc),
        openCritical: r.openCritical,
        openNonCritical: r.openNonCritical,
        hasCriticalLeakage: r.hasCriticalLeakage,
        latestSequence: r.latestSequence ?? 0,
        items: r.items.map(toAlert),
      })),
    );
  }

  getChanges(storeId: string, afterSequence: number): Observable<AlertChanges> {
    return this.api
      .get<AlertChangesResponse>(apiPath('stores', storeId, 'alerts', 'changes'), { afterSequence })
      .pipe(map(toAlertChanges));
  }

  getHistory(storeId: string, filter: AlertHistoryFilter, page: number): Observable<Page<Alert>> {
    return defer(() => {
      // Both or neither: a half-specified range is rejected before sending.
      if ((filter.from === null) !== (filter.to === null)) {
        throw clientValidationError('range', 'invalid');
      }
      const range = filter.from !== null && filter.to !== null ? serializeRange({ from: filter.from, to: filter.to }) : null;
      return this.api.get<HasMorePageResponse<AlertResponse>>(apiPath('stores', storeId, 'alerts'), {
        status: filter.status,
        severity: filter.severity,
        equipmentId: filter.equipmentId,
        from: range?.from,
        to: range?.to,
        page,
        pageSize: 20,
      });
    }).pipe(map((response) => toPage(response, toAlert)));
  }

  getAlert(storeId: string, areaId: string, equipmentId: string, alertId: string): Observable<Alert> {
    return this.api
      .get<AlertResponse>(apiPath('stores', storeId, 'areas', areaId, 'equipment', equipmentId, 'alerts', alertId))
      .pipe(map(toAlert));
  }

  acknowledge(storeId: string, areaId: string, equipmentId: string, alertId: string): Observable<Alert> {
    return this.api
      .post<AlertResponse>(
        `${apiPath('stores', storeId, 'areas', areaId, 'equipment', equipmentId, 'alerts', alertId)}/acknowledgement`,
        null,
      )
      .pipe(map(toAlert));
  }

  assign(alertId: string, technicianId: string, technicianName: string | null): Observable<Alert> {
    const body = technicianName === null ? { technicianId } : { technicianId, technicianName };
    return this.api.post<AlertResponse>(`${apiPath('alerts', alertId)}/assign`, body).pipe(map(toAlert));
  }

  resolve(alertId: string, notes: string | null): Observable<Alert> {
    return this.api
      .post<AlertResponse>(`${apiPath('alerts', alertId)}/resolve`, notes === null ? {} : { notes })
      .pipe(map(toAlert));
  }
}
