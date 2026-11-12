import { type EnvironmentProviders, inject, Injectable, makeEnvironmentProviders } from '@angular/core';
import { defer, map, type Observable } from 'rxjs';
import type { Page } from '@shared/application/page';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import { serializeRange } from '@shared/infrastructure/api/date-serialization';
import { type HasMorePageResponse, toPage } from '@shared/infrastructure/api/paging';
import { clientValidationError } from '@shared/infrastructure/http/problem-details';
import type { AuditEntry, AuditFilter } from '@audit/domain/model/audit-entry';
import { AuditLogPort } from '@audit/application/ports/audit-log.port';

interface AuditLogEntryResponse {
  id: number;
  userId: string | null;
  action: string;
  resource: string;
  httpMethod: string;
  path: string;
  statusCode: number;
  status: string;
  ipAddress: string | null;
  timestampUtc: string;
}

/** Adapter of `GET /stores/{id}/audit-logs`. */
@Injectable({ providedIn: 'root' })
export class AuditLogApi implements AuditLogPort {
  private readonly api = inject(ApiClient);

  list(storeId: string, filter: AuditFilter, page: number): Observable<Page<AuditEntry>> {
    return defer(() => {
      if ((filter.from === null) !== (filter.to === null)) {
        throw clientValidationError('range', 'invalid');
      }
      const range = filter.from !== null && filter.to !== null ? serializeRange({ from: filter.from, to: filter.to }) : null;
      return this.api.get<HasMorePageResponse<AuditLogEntryResponse>>(apiPath('stores', storeId, 'audit-logs'), {
        from: range?.from,
        to: range?.to,
        action: filter.action,
        status: filter.status,
        operatorId: filter.operatorId,
        resource: filter.resource,
        page,
        pageSize: 50,
      });
    }).pipe(
      map((response) =>
        toPage(response, (r) => ({
          id: String(r.id),
          userId: r.userId,
          action: r.action,
          resource: r.resource,
          httpMethod: r.httpMethod,
          path: r.path,
          statusCode: r.statusCode,
          status: r.status,
          ipAddress: r.ipAddress,
          timestamp: new Date(r.timestampUtc),
        })),
      ),
    );
  }
}

/** Binds the audit ports. */
export function provideAudit(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AuditLogPort, useExisting: AuditLogApi }]);
}
