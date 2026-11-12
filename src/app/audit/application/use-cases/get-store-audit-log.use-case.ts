import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Page } from '@shared/application/page';
import type { AuditEntry, AuditFilter } from '@audit/domain/model/audit-entry';
import { AuditLogPort } from '@audit/application/ports/audit-log.port';

@Injectable({ providedIn: 'root' })
export class GetStoreAuditLogUseCase {
  private readonly port = inject(AuditLogPort);

  execute(storeId: string, filter: AuditFilter, page: number): Observable<Page<AuditEntry>> {
    return this.port.list(storeId, filter, page);
  }
}
