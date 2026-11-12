import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
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

/**
 * Polls `load` every `intervalMs` while the page is visible (immediately on becoming visible), never
 * overlapping requests. Failures are emitted as outcomes; a `401`, `403` or `404` outcome is emitted
 * and then polling stops.
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
    switchMap((visible) =>
      visible
        ? timer(0, intervalMs).pipe(
            exhaustMap(() =>
              load().pipe(
                map((value): PollOutcome<T> => ({ ok: true, value })),
                catchError((error: unknown) =>
                  of<PollOutcome<T>>({ ok: false, error: toAppError(error) }),
                ),
              ),
            ),
          )
        : EMPTY,
    ),
    takeWhile((outcome) => outcome.ok || !TERMINAL_STATUSES.has(outcome.error.status), true),
  );
}

/**
 * Polls `load` only while realtime updates are not live, as the documented fallback: while `live$` is
 * true it loads once (to reconcile, since realtime events are not replayed) and then relies on events;
 * when the connection drops it resumes polling every `intervalMs`. Pauses in hidden tabs and stops on
 * `401`/`403`/`404`, like `pollWhileVisible`.
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
  const loadOnce = (): Observable<PollOutcome<T>> =>
    load().pipe(
      map((value): PollOutcome<T> => ({ ok: true, value })),
      catchError((error: unknown) => of<PollOutcome<T>>({ ok: false, error: toAppError(error) })),
    );
  return combineLatest([visibility.visible$, live$.pipe(distinctUntilChanged())]).pipe(
    switchMap(([visible, live]) => {
      if (!visible) {
        return EMPTY;
      }
      return live ? loadOnce() : timer(0, intervalMs).pipe(exhaustMap(loadOnce));
    }),
    takeWhile((outcome) => outcome.ok || !TERMINAL_STATUSES.has(outcome.error.status), true),
  );
}
