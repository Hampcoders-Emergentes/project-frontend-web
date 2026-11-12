import { inject, Injectable } from '@angular/core';
import { type Observable, shareReplay } from 'rxjs';
import type { EquipmentLocation } from '@stores/domain/model/store-hierarchy';
import { LoadEquipmentCatalogUseCase } from '@stores/application/use-cases/store-hierarchy-use-cases';

const CACHE_TTL_MS = 60_000;

/**
 * EquipmentCatalogFacade exposes, to other bounded contexts, the minimum they need about a store's
 * equipment: id, name and owning area (to address equipment-scoped endpoints and to label data). It is
 * bound to each consumer's own port in `provideStores()`. Results are cached per store for one minute.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentCatalogFacade {
  private readonly loadCatalog = inject(LoadEquipmentCatalogUseCase);
  private readonly cache = new Map<string, { readonly at: number; readonly value: Observable<readonly EquipmentLocation[]> }>();

  listEquipment(storeId: string): Observable<readonly EquipmentLocation[]> {
    const cached = this.cache.get(storeId);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return cached.value;
    }
    // Only the active store is kept: switching stores drops the other store's catalog.
    this.cache.clear();
    const value = this.loadCatalog.execute(storeId).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.cache.set(storeId, { at: Date.now(), value });
    return value;
  }
}
