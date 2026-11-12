import type { Observable } from 'rxjs';

/** Lifecycle of the realtime connection as the UI needs it. */
export type RealtimeStatus = 'unavailable' | 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * RealtimeConnectionPort is the generic lifecycle of the single realtime hub connection. It knows no
 * event names, payloads or hub-method semantics: every bounded context maps its own events and decides
 * which hub methods to invoke. Declared as an abstract class so it can be used as an Angular DI token.
 */
export abstract class RealtimeConnectionPort {
  /** Current status; `unavailable` when no realtime client is installed or configured. */
  abstract readonly status$: Observable<RealtimeStatus>;

  /** Emits after every successful automatic reconnection (groups are lost on disconnect). */
  abstract readonly reconnected$: Observable<void>;

  /** Starts the connection if it is not started; resolves when connected (or unavailable). */
  abstract start(): Observable<void>;

  /** Stops the connection, for example on sign-out or after the access token was replaced. */
  abstract stop(): Observable<void>;

  /** Invokes a hub method. Fails when the connection is unavailable or the hub rejects the call. */
  abstract invoke(method: string, ...args: unknown[]): Observable<void>;

  /** Streams the raw payloads of one hub event; mapping belongs to the owning context. */
  abstract on(event: string): Observable<unknown>;
}
