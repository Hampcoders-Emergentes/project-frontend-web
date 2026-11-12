import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  expand,
  map,
  type Observable,
  of,
  switchMap,
  takeWhile,
  timer,
} from 'rxjs';
import { type AppError, toAppError } from '@shared/application/app-error';

/**
 * PageVisibilityPort reports whether the page is visible, so polling pauses in hidden tabs.
 * Declared as an abstract class so it can be used as an Angular DI token.
 */
export abstract class PageVisibilityPort {
  /** Emits the current visibility immediately and on every change. */
  abstract readonly visible$: Observable<boolean>;
}

/** One poll outcome: the loaded value or the normalised failure. */
export type PollOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

/** Statuses that end polling: the session or the access to the resource is gone. */
const TERMINAL_STATUSES = new Set([401, 403, 404]);

/** Back-off after a `429` that carries no `Retry-After` value. */
const DEFAULT_RATE_LIMIT_BACKOFF_MS = 60_000;

function isTerminal<T>(outcome: PollOutcome<T>): boolean {
  return !outcome.ok && TERMINAL_STATUSES.has(outcome.error.status);
}

/**
 * Delay before the next poll. After a `429` the wait is the server's `Retry-After` window (no request is
 * sent until it expires); otherwise the regular interval applies.
 */
function nextDelayMs<T>(outcome: PollOutcome<T>, intervalMs: number): number {
  if (!outcome.ok && outcome.error.status === 429) {
    const seconds = outcome.error.retryAfterSeconds;
    return seconds === null ? DEFAULT_RATE_LIMIT_BACKOFF_MS : seconds * 1000;
  }
  return intervalMs;
}

/** Runs one load and turns its result or failure into an outcome. */
function attempt<T>(load: () => Observable<T>): Observable<PollOutcome<T>> {
  return load().pipe(
    map((value): PollOutcome<T> => ({ ok: true, value })),
    catchError((error: unknown) => of<PollOutcome<T>>({ ok: false, error: toAppError(error) })),
  );
}

/**
 * Loads now, then again after each delay (see `nextDelayMs`), until a terminal outcome. Requests never
 * overlap: the next delay starts only after the previous load has answered.
 */
function pollLoop<T>(intervalMs: number, load: () => Observable<T>): Observable<PollOutcome<T>> {
  return attempt(load).pipe(
    expand((outcome) =>
      isTerminal(outcome)
        ? EMPTY
        : timer(nextDelayMs(outcome, intervalMs)).pipe(switchMap(() => attempt(load))),
    ),
  );
}

/**
 * Polls `load` every `intervalMs` while the page is visible (immediately on becoming visible), never
 * overlapping requests. A `429` pauses polling for its `Retry-After` window. Failures are emitted as
 * outcomes; a `401`, `403` or `404` outcome is emitted and then polling stops.
 * @param visibility - The page visibility source.
 * @param intervalMs - The polling interval.
 * @param load - Produces one value.
 */
export function pollWhileVisible<T>(
  visibility: PageVisibilityPort,
  intervalMs: number,
  load: () => Observable<T>,
): Observable<PollOutcome<T>> {
  return visibility.visible$.pipe(
    switchMap((visible) => (visible ? pollLoop(intervalMs, load) : EMPTY)),
    takeWhile((outcome) => !isTerminal(outcome), true),
  );
}

/**
 * Polls `load` only while realtime updates are not live, as the documented fallback: while `live$` is
 * true it loads once (to reconcile, since realtime events are not replayed) and then relies on events;
 * when the connection drops it resumes polling every `intervalMs`. Pauses in hidden tabs, honours
 * `Retry-After` after a `429`, and stops on `401`/`403`/`404`, like `pollWhileVisible`.
 * @param visibility - The page visibility source.
 * @param live$ - Whether realtime updates are currently delivered.
 * @param intervalMs - The fallback polling interval.
 * @param load - Produces one value.
 */
export function pollWithRealtimeFallback<T>(
  visibility: PageVisibilityPort,
  live$: Observable<boolean>,
  intervalMs: number,
  load: () => Observable<T>,
): Observable<PollOutcome<T>> {
  return combineLatest([visibility.visible$, live$.pipe(distinctUntilChanged())]).pipe(
    switchMap(([visible, live]) => {
      if (!visible) {
        return EMPTY;
      }
      return live ? attempt(load) : pollLoop(intervalMs, load);
    }),
    takeWhile((outcome) => !isTerminal(outcome), true),
  );
}
