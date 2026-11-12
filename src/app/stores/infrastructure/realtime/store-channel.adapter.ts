import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RealtimeConnectionPort } from '@shared/application/realtime-connection.port';
import type { StoreChannelPort } from '@stores/application/ports/stores-ports';

/** Hub method and event names owned by the stores context. */
const JOIN_STORE = 'JoinStore';
const LEAVE_STORE = 'LeaveStore';
const SHIFT_HANDOVER = 'ShiftHandover';

/**
 * Store membership on `/hubs/alerts` and the `ShiftHandover` event. The handover payload is treated as
 * informational: consumers reload the on-duty data instead of trusting it. `JoinStore` is invoked again
 * after every reconnect, since groups are lost on disconnect.
 */
@Injectable({ providedIn: 'root' })
export class StoreChannelAdapter implements StoreChannelPort {
  private readonly connection = inject(RealtimeConnectionPort);
  private joinedStoreId: string | null = null;

  readonly shiftHandovers$: Observable<void> = this.connection.on(SHIFT_HANDOVER).pipe(map(() => undefined));
  readonly reconnected$: Observable<void> = this.connection.reconnected$;

  constructor() {
    this.connection.reconnected$.subscribe(() => {
      if (this.joinedStoreId !== null) {
        this.connection.invoke(JOIN_STORE, this.joinedStoreId).subscribe({ error: () => undefined });
      }
    });
  }

  join(storeId: string): Observable<void> {
    this.joinedStoreId = storeId;
    return new Observable<void>((subscriber) =>
      this.connection.start().subscribe({
        next: () => this.connection.invoke(JOIN_STORE, storeId).subscribe(subscriber),
        error: (error: unknown) => subscriber.error(error),
      }),
    );
  }

  leave(storeId: string): Observable<void> {
    if (this.joinedStoreId === storeId) {
      this.joinedStoreId = null;
    }
    return this.connection.invoke(LEAVE_STORE, storeId);
  }
}
