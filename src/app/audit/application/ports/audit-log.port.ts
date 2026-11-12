import type { Observable } from 'rxjs';
import type { Page } from '@shared/application/page';
import type { AuditEntry, AuditFilter } from '@audit/domain/model/audit-entry';

/** Store audit log (has-more paging, no totals). */
export abstract class AuditLogPort {
  abstract list(storeId: string, filter: AuditFilter, page: number): Observable<Page<AuditEntry>>;
}
