import { TestBed } from '@angular/core/testing';
import { HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, of } from 'rxjs';
import type { RealtimeStatus } from '@shared/application/realtime-connection.port';
import { pollWithRealtimeFallback } from '@shared/application/polling';
import { SESSION_TOKEN_BRIDGE, type SessionTokenBridge } from '@shared/infrastructure/http/session-token-bridge';
import {
  HUB_CONNECTION_FACTORY,
  type HubConnectionLike,
  RESTART_DELAYS_MS,
  SignalRRealtimeConnection,
} from '@shared/infrastructure/realtime/signalr-realtime-connection';

/** Minimal in-memory stand-in for a SignalR HubConnection. */
class FakeHubConnection implements HubConnectionLike {
  state = HubConnectionState.Disconnected;
  failNextStart = false;
  readonly invoked: { method: string; args: unknown[] }[] = [];
  private readonly handlers = new Map<string, ((...args: unknown[]) => void)[]>();
  private closeCallback: (error?: Error) => void = () => undefined;
  private reconnectingCallback: (error?: Error) => void = () => undefined;
  private reconnectedCallback: (id?: string) => void = () => undefined;

  constructor(readonly accessTokenFactory: () => string) {}

  start(): Promise<void> {
    if (this.failNextStart) {
      this.failNextStart = false;
      return Promise.reject(new Error('unreachable'));
    }
    this.state = HubConnectionState.Connected;
    return Promise.resolve();
  }
  stop(): Promise<void> {
    this.state = HubConnectionState.Disconnected;
    return Promise.resolve();
  }
  invoke(method: string, ...args: unknown[]): Promise<unknown> {
    this.invoked.push({ method, args });
    return Promise.resolve(undefined);
  }
  on(method: string, handler: (...args: unknown[]) => void): void {
    this.handlers.set(method, [...(this.handlers.get(method) ?? []), handler]);
  }
  off(method: string, handler: (...args: unknown[]) => void): void {
    this.handlers.set(method, (this.handlers.get(method) ?? []).filter((h) => h !== handler));
  }
  onclose(callback: (error?: Error) => void): void { this.closeCallback = callback; }
  onreconnecting(callback: (error?: Error) => void): void { this.reconnectingCallback = callback; }
  onreconnected(callback: (id?: string) => void): void { this.reconnectedCallback = callback; }

  emit(method: string, payload: unknown): void {
    (this.handlers.get(method) ?? []).forEach((handler) => handler(payload));
  }
  simulateDrop(): void {
    this.state = HubConnectionState.Reconnecting;
    this.reconnectingCallback();
  }
  simulateReconnected(): void {
    this.state = HubConnectionState.Connected;
    this.reconnectedCallback('id');
  }
  simulateClose(): void {
    this.state = HubConnectionState.Disconnected;
    this.closeCallback();
  }
}

describe('SignalRRealtimeConnection', () => {
  let fake: FakeHubConnection;
  let connection: SignalRRealtimeConnection;
  let statuses: RealtimeStatus[];
  let reconnects: number;
  const bridge: SessionTokenBridge = {
    accessToken: () => 'access-token',
    renewAfterRejection: () => of('access-token'),
    acceptRefreshedToken: () => undefined,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        { provide: SESSION_TOKEN_BRIDGE, useValue: bridge },
        { provide: HUB_CONNECTION_FACTORY, useValue: (factory: () => string) => (fake = new FakeHubConnection(factory)) },
      ],
    });
    connection = TestBed.inject(SignalRRealtimeConnection);
    statuses = [];
    reconnects = 0;
    connection.status$.subscribe((status) => statuses.push(status));
    connection.reconnected$.subscribe(() => reconnects++);
  });

  afterEach(() => vi.useRealTimers());

  it('connects with the in-memory access token and reports connected', async () => {
    connection.start().subscribe();
    await vi.advanceTimersByTimeAsync(0);
    expect(fake.accessTokenFactory()).toBe('access-token');
    expect(statuses).toEqual(['disconnected', 'connecting', 'connected']);
    expect(reconnects).toBe(0);
  });

  it('relays hub events and invokes hub methods only when connected', async () => {
    const received: unknown[] = [];
    connection.on('ReceiveAlert').subscribe((payload) => received.push(payload));
    let failed = false;
    connection.invoke('JoinStore', 'store-1').subscribe({ error: () => (failed = true) });
    expect(failed).toBe(true);

    connection.start().subscribe();
    await vi.advanceTimersByTimeAsync(0);
    connection.invoke('JoinStore', 'store-1').subscribe();
    await vi.advanceTimersByTimeAsync(0);
    fake.emit('ReceiveAlert', { id: 'alert-1' });
    expect(fake.invoked).toEqual([{ method: 'JoinStore', args: ['store-1'] }]);
    expect(received).toEqual([{ id: 'alert-1' }]);
  });

  it('reports reconnecting and emits reconnected after an automatic reconnect', async () => {
    connection.start().subscribe();
    await vi.advanceTimersByTimeAsync(0);
    fake.simulateDrop();
    expect(statuses.at(-1)).toBe('reconnecting');
    fake.simulateReconnected();
    expect(statuses.at(-1)).toBe('connected');
    expect(reconnects).toBe(1);
  });

  it('keeps retrying after the connection closes and emits reconnected once back', async () => {
    connection.start().subscribe();
    await vi.advanceTimersByTimeAsync(0);
    fake.simulateClose();
    expect(statuses.at(-1)).toBe('disconnected');
    await vi.advanceTimersByTimeAsync(RESTART_DELAYS_MS[0] ?? 0);
    expect(statuses.at(-1)).toBe('connected');
    expect(reconnects).toBe(1);
  });

  it('retries a failed first start and then emits reconnected so owners rejoin', async () => {
    fake.failNextStart = true;
    connection.start().subscribe({ error: () => undefined });
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe('disconnected');
    await vi.advanceTimersByTimeAsync(RESTART_DELAYS_MS[0] ?? 0);
    expect(statuses.at(-1)).toBe('connected');
    expect(reconnects).toBe(1);
  });

  it('does not restart after an intentional stop', async () => {
    connection.start().subscribe();
    await vi.advanceTimersByTimeAsync(0);
    connection.stop().subscribe();
    await vi.advanceTimersByTimeAsync(0);
    fake.simulateClose();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(statuses.at(-1)).toBe('disconnected');
  });
});

describe('pollWithRealtimeFallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('polls while not live, loads once when live, and resumes polling on disconnect', () => {
    const live$ = new BehaviorSubject(false);
    let calls = 0;
    const subscription = pollWithRealtimeFallback({ visible$: new BehaviorSubject(true) }, live$, 1_000, () => {
      calls++;
      return of(calls);
    }).subscribe();

    vi.advanceTimersByTime(2_000);
    expect(calls).toBe(3); // t=0, 1 s, 2 s

    live$.next(true);
    expect(calls).toBe(4); // one reconciliation load on going live
    vi.advanceTimersByTime(10_000);
    expect(calls).toBe(4); // no polling while live

    live$.next(false);
    vi.advanceTimersByTime(0);
    expect(calls).toBe(5); // fallback polling resumes immediately
    subscription.unsubscribe();
  });
});
