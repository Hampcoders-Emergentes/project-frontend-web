import { inject, Injectable } from '@angular/core';
import { catchError, type Observable, of } from 'rxjs';
import type { Page } from '@shared/application/page';
import type { Store } from '@stores/domain/model/store-hierarchy';
import { StoreChannelPort, StoreDirectoryPort } from '@stores/application/ports/stores-ports';

/** Bootstrap page of the owned stores: `GET /stores?page=1&pageSize=100`. */
export const STORE_BOOTSTRAP_PAGE = { page: 1, pageSize: 100 } as const;

@Injectable({ providedIn: 'root' })
export class ListStoresUseCase {
  private readonly directory = inject(StoreDirectoryPort);

  execute(): Observable<Page<Store>> {
    return this.directory.listStores(STORE_BOOTSTRAP_PAGE);
  }
}

@Injectable({ providedIn: 'root' })
export class GetStoreUseCase {
  private readonly directory = inject(StoreDirectoryPort);

  execute(storeId: string): Observable<Store> {
    return this.directory.getStore(storeId);
  }
}

@Injectable({ providedIn: 'root' })
export class CreateStoreUseCase {
  private readonly directory = inject(StoreDirectoryPort);

  execute(name: string, address: string): Observable<Store> {
    return this.directory.createStore(name.trim(), address.trim());
  }
}

/**
 * Moves the realtime membership to the active store: `LeaveStore(previous)` then `JoinStore(next)`.
 * Membership is best-effort (polling remains the fallback), so failures are swallowed.
 */
@Injectable({ providedIn: 'root' })
export class SwitchStoreChannelUseCase {
  private readonly channel = inject(StoreChannelPort);

  execute(previousStoreId: string | null, nextStoreId: string): void {
    if (previousStoreId !== null && previousStoreId !== nextStoreId) {
      this.channel.leave(previousStoreId).pipe(catchError(() => of(undefined))).subscribe();
    }
    this.channel.join(nextStoreId).pipe(catchError(() => of(undefined))).subscribe();
  }
}
