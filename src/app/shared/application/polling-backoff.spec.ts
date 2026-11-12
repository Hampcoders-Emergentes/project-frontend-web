import { BehaviorSubject, of, throwError } from 'rxjs';
import { AppErrorException } from '@shared/application/app-error';
import { pollWhileVisible } from '@shared/application/polling';

describe('pollWhileVisible: 429 back-off', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits the Retry-After window after a 429, then resumes the regular interval', () => {
    const visibility = { visible$: new BehaviorSubject(true) };
    let calls = 0;
    const subscription = pollWhileVisible(visibility, 5_000, () => {
      calls++;
      return calls === 1
        ? throwError(
            () => new AppErrorException(429, 'Too Many Requests', '', null, null, undefined, 'RATE_LIMITED', 30),
          )
        : of(calls);
    }).subscribe();

    expect(calls).toBe(1);
    vi.advanceTimersByTime(29_999);
    expect(calls).toBe(1);
    vi.advanceTimersByTime(1);
    expect(calls).toBe(2);
    vi.advanceTimersByTime(5_000);
    expect(calls).toBe(3);
    subscription.unsubscribe();
  });

  it('uses a default window when a 429 carries no Retry-After value', () => {
    const visibility = { visible$: new BehaviorSubject(true) };
    let calls = 0;
    const subscription = pollWhileVisible(visibility, 5_000, () => {
      calls++;
      return throwError(() => new AppErrorException(429, 'Too Many Requests', '', null, null));
    }).subscribe();

    vi.advanceTimersByTime(59_999);
    expect(calls).toBe(1);
    vi.advanceTimersByTime(1);
    expect(calls).toBe(2);
    subscription.unsubscribe();
  });
});
