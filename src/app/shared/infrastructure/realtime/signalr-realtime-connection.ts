import { DestroyRef, inject, Injectable, InjectionToken } from '@angular/core';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, defer, distinctUntilChanged, filter, from, map, Observable, Subject, take, timer } from 'rxjs';
import type { RealtimeConnectionPort, RealtimeStatus } from '@shared/application/realtime-connection.port';
import { ALERTS_HUB_URL } from '@shared/infrastructure/api/api-url';
import { SESSION_TOKEN_BRIDGE } from '@shared/infrastructure/http/session-token-bridge';

/** The part of a SignalR `HubConnection` this adapter uses (a real `HubConnection` satisfies it). */
export interface HubConnectionLike {
  readonly state: HubConnectionState;
  start(): Promise<void>;
  stop(): Promise<void>;
  invoke(methodName: string, ...args: unknown[]): Promise<unknown>;
  on(methodName: string, handler: (...args: unknown[]) => void): void;
  off(methodName: string, handler: (...args: unknown[]) => void): void;
  onclose(callback: (error?: Error) => void): void;
  onreconnecting(callback: (error?: Error) => void): void;
  onreconnected(callback: (connectionId?: string) => void): void;
}

/** Builds the hub connection; replaced in tests. */
export type HubConnectionFactory = (accessTokenFactory: () => string) => HubConnectionLike;

export const HUB_CONNECTION_FACTORY = new InjectionToken<HubConnectionFactory>('HUB_CONNECTION_FACTORY', {
  providedIn: 'root',
  factory: () => (accessTokenFactory) =>
    new HubConnectionBuilder()
      .withUrl(ALERTS_HUB_URL, { accessTokenFactory })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build(),
});

/** Delays (ms) of the restarts attempted after SignalR's own automatic reconnect gives up. */
export const RESTART_DELAYS_MS: readonly number[] = [5_000, 10_000, 30_000, 60_000];

/**
 * SignalR implementation of the realtime connection to `{apiOrigin}/hubs/alerts`.
 *
 * - The access token is read from memory through `accessTokenFactory` on every (re)connect, so a
 *   reconnection always uses the current token (the hub does not re-check it after connecting).
 * - SignalR's automatic reconnect handles short drops; if it gives up, or the first start fails, the
 *   adapter keeps retrying with back-off (60 s cap) while a session exists.
 * - `reconnected$` emits whenever the connection is re-established after a drop or a failed start:
 *   group membership is lost then, and events are not replayed, so owners rejoin and re-fetch.
 * - Event names and hub-method semantics stay in the owning contexts; this class only relays them.
 */
@Injectable({ providedIn: 'root' })
export class SignalRRealtimeConnection implements RealtimeConnectionPort {
  private readonly tokens = inject(SESSION_TOKEN_BRIDGE);
  private readonly statusSubject = new BehaviorSubject<RealtimeStatus>('disconnected');
  private readonly reconnectedSubject = new Subject<void>();
  private readonly connection: HubConnectionLike;
  private starting: Promise<void> | null = null;
  private stoppedOnPurpose = false;
  private everConnected = false;
  private restartAttempt = 0;
  private restartTimer: { unsubscribe(): void } | null = null;

  readonly status$: Observable<RealtimeStatus> = this.statusSubject.pipe(distinctUntilChanged());
  readonly reconnected$: Observable<void> = this.reconnectedSubject.asObservable();

  constructor() {
    this.connection = inject(HUB_CONNECTION_FACTORY)(() => this.tokens.accessToken() ?? '');
    this.connection.onreconnecting(() => this.statusSubject.next('reconnecting'));
    this.connection.onreconnected(() => this.markConnected());
    this.connection.onclose(() => {
      this.statusSubject.next('disconnected');
      if (!this.stoppedOnPurpose) {
        this.scheduleRestart();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.restartTimer?.unsubscribe();
      void this.connection.stop();
    });
  }

  start(): Observable<void> {
    return defer(() => {
      this.stoppedOnPurpose = false;
      if (this.connection.state === HubConnectionState.Connected) {
        return from(Promise.resolve());
      }
      if (this.connection.state === HubConnectionState.Reconnecting) {
        // SignalR is already reconnecting: resolve once it is back.
        return this.statusSubject.pipe(filter((status) => status === 'connected'), take(1), map(() => undefined));
      }
      return from(this.startOnce());
    });
  }

  stop(): Observable<void> {
    return defer(() => {
      this.stoppedOnPurpose = true;
      this.restartTimer?.unsubscribe();
      this.restartTimer = null;
      return from(this.connection.stop());
    });
  }

  invoke(method: string, ...args: unknown[]): Observable<void> {
    return defer(() => {
      if (this.connection.state !== HubConnectionState.Connected) {
        throw new Error(`Realtime connection is not connected; cannot invoke ${method}.`);
      }
      return from(this.connection.invoke(method, ...args)).pipe(map(() => undefined));
    });
  }

  on(event: string): Observable<unknown> {
    return new Observable<unknown>((subscriber) => {
      const handler = (payload: unknown): void => subscriber.next(payload);
      this.connection.on(event, handler);
      return () => this.connection.off(event, handler);
    });
  }

  private startOnce(): Promise<void> {
    if (this.starting !== null) {
      return this.starting;
    }
    if (this.tokens.accessToken() === null) {
      return Promise.reject(new Error('No session: the realtime connection is not started.'));
    }
    this.statusSubject.next('connecting');
    this.starting = this.connection
      .start()
      .then(() => this.markConnected())
      .catch((error: unknown) => {
        this.statusSubject.next('disconnected');
        this.scheduleRestart();
        throw error;
      })
      .finally(() => (this.starting = null));
    return this.starting;
  }

  private markConnected(): void {
    const wasConnectedBefore = this.everConnected;
    const recovering = this.restartAttempt > 0;
    this.everConnected = true;
    this.restartAttempt = 0;
    this.statusSubject.next('connected');
    if (wasConnectedBefore || recovering) {
      this.reconnectedSubject.next();
    }
  }

  private scheduleRestart(): void {
    if (this.restartTimer !== null || this.stoppedOnPurpose || this.tokens.accessToken() === null) {
      return;
    }
    const delay = RESTART_DELAYS_MS[Math.min(this.restartAttempt, RESTART_DELAYS_MS.length - 1)] ?? 60_000;
    this.restartAttempt++;
    this.restartTimer = timer(delay).subscribe(() => {
      this.restartTimer = null;
      if (this.connection.state === HubConnectionState.Disconnected) {
        this.startOnce().catch(() => undefined);
      }
    });
  }
}
