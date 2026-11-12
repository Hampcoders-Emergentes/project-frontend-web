import { Injectable } from '@angular/core';
import { EMPTY, type Observable, of, throwError } from 'rxjs';
import type { RealtimeConnectionPort, RealtimeStatus } from '@shared/application/realtime-connection.port';

/**
 * Realtime connection used while no SignalR client is installed. `@microsoft/signalr` is not a
 * dependency of this project yet (adding it requires approval), so the connection reports
 * `unavailable` and every context relies on its polling fallback. Replace this binding in
 * `provideSharedInfrastructure()` with a SignalR-backed adapter once the dependency is approved:
 * it must connect to `ALERTS_HUB_URL` with an `accessTokenFactory` reading the in-memory token,
 * enable automatic reconnect and emit `reconnected$` after each reconnection.
 */
@Injectable({ providedIn: 'root' })
export class UnavailableRealtimeConnection implements RealtimeConnectionPort {
  readonly status$: Observable<RealtimeStatus> = of('unavailable');
  readonly reconnected$: Observable<void> = EMPTY;

  start(): Observable<void> {
    return of(undefined);
  }

  stop(): Observable<void> {
    return of(undefined);
  }

  invoke(method: string): Observable<void> {
    return throwError(() => new Error(`Realtime connection unavailable; cannot invoke ${method}.`));
  }

  on(): Observable<unknown> {
    return EMPTY;
  }
}
