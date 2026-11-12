import { inject, Injectable } from '@angular/core';
import { AsyncResource } from '@shared/application/async-resource';
import type { Page } from '@shared/application/page';
import type { AuditEntry, AuditFilter } from '@audit/domain/model/audit-entry';
import { GetStoreAuditLogUseCase } from '@audit/application/use-cases/get-store-audit-log.use-case';

/** Store audit log state (US41), loaded on demand. */
@Injectable({ providedIn: 'root' })
export class AuditLogStore {
  private readonly listUseCase = inject(GetStoreAuditLogUseCase);
  readonly entries = new AsyncResource<Page<AuditEntry>>();

  load(storeId: string, filter: AuditFilter, page: number): void {
    this.entries.load(`${storeId}|${JSON.stringify(filter)}|${page}`, this.listUseCase.execute(storeId, filter, page));
  }
}
