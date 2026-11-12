import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, type Observable, tap } from 'rxjs';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import { RealtimeConnectionPort, type RealtimeStatus } from '@shared/application/realtime-connection.port';
import { bootstrapFor, type Store, type StoreBootstrap } from '@stores/domain/model/store-hierarchy';
import {
  CreateStoreUseCase,
  GetStoreUseCase,
  ListStoresUseCase,
  SwitchStoreChannelUseCase,
} from '@stores/application/use-cases/store-directory-use-cases';

const DIRECTORY_KEY = 'owned-stores';

/**
 * Owned stores, the active store and the post-sign-in bootstrap decision. The active store is set only
 * after the route guard verified ownership of the `:storeId` route parameter.
 */
@Injectable({ providedIn: 'root' })
export class StoreDirectoryStore {
  private readonly listStoresUseCase = inject(ListStoresUseCase);
  private readonly getStoreUseCase = inject(GetStoreUseCase);
  private readonly createStoreUseCase = inject(CreateStoreUseCase);
  private readonly switchChannelUseCase = inject(SwitchStoreChannelUseCase);

  readonly stores = new AsyncResource<readonly Store[]>();
  readonly createState = new MutationState();
  private readonly activeStoreSignal = signal<Store | null>(null);
  private bootstrapDone = false;

  readonly activeStore = this.activeStoreSignal.asReadonly();
  readonly bootstrap = computed<StoreBootstrap | null>(() => {
    const stores = this.stores.data();
    return stores === null ? null : bootstrapFor(stores);
  });
  readonly realtimeStatus = toSignal<RealtimeStatus, RealtimeStatus>(inject(RealtimeConnectionPort).status$, {
    initialValue: 'unavailable',
  });

  loadStores(): void {
    this.stores.load(
      DIRECTORY_KEY,
      this.listStoresUseCase.execute().pipe(map((page) => page.items)),
    );
  }

  /**
   * Whether the automatic single-store selection should happen; true only once per session, so the
   * store list stays reachable afterwards.
   */
  consumeAutomaticSelection(): boolean {
    if (this.bootstrapDone) {
      return false;
    }
    this.bootstrapDone = true;
    return true;
  }

  /** Verifies that the caller owns the store (fails with `404` otherwise). */
  verifyAccess(storeId: string): Observable<Store> {
    return this.getStoreUseCase.execute(storeId);
  }

  /** Makes a verified store active, moving the realtime membership and clearing store-keyed state. */
  activate(store: Store): void {
    const previous = this.activeStoreSignal();
    this.activeStoreSignal.set(store);
    if (previous?.id !== store.id) {
      this.switchChannelUseCase.execute(previous?.id ?? null, store.id);
    }
  }

  createStore(name: string, address: string): Observable<Store> {
    return this.createStoreUseCase.execute(name, address).pipe(
      tap((store) => this.stores.patch((stores) => [...stores, store])),
    );
  }

  submitCreateStore(name: string, address: string, onCreated: (store: Store) => void): void {
    this.createState.run(this.createStore(name, address), onCreated);
  }
}
