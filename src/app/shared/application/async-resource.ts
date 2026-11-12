import { computed, signal } from '@angular/core';
import { type Observable, type Subscription } from 'rxjs';
import { type AppError, toAppError } from '@shared/application/app-error';
import type { PollOutcome } from '@shared/application/polling';

interface ResourceSnapshot<T> {
  readonly key: string | null;
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: AppError | null;
  readonly lastUpdatedAt: Date | null;
}

const EMPTY_SNAPSHOT: ResourceSnapshot<never> = {
  key: null,
  data: null,
  loading: false,
  error: null,
  lastUpdatedAt: null,
};

/**
 * Signal state of one asynchronously loaded value, keyed (typically by `storeId` plus a query) so
 * results of a previous key are never shown for another one. Stores compose it; it holds no business
 * logic.
 *
 * - `stale` is true when the last refresh failed while older data is still shown.
 * - Loading a different key clears the previous data first.
 */
export class AsyncResource<T> {
  private readonly snapshot = signal<ResourceSnapshot<T>>(EMPTY_SNAPSHOT);
  private subscription: Subscription | null = null;

  readonly key = computed(() => this.snapshot().key);
  readonly data = computed(() => this.snapshot().data);
  readonly loading = computed(() => this.snapshot().loading);
  readonly error = computed(() => this.snapshot().error);
  readonly lastUpdatedAt = computed(() => this.snapshot().lastUpdatedAt);
  readonly stale = computed(() => this.snapshot().error !== null && this.snapshot().data !== null);
  /** True while the first load of the current key is unresolved (nothing to show yet). */
  readonly initialLoading = computed(() => this.snapshot().loading && this.snapshot().data === null);

  /**
   * Loads the value for a key, cancelling any load in flight.
   * @param key - The cache key (store id plus query).
   * @param source - The observable producing the value.
   */
  load(key: string, source: Observable<T>): void {
    this.subscription?.unsubscribe();
    this.snapshot.update((current) =>
      current.key === key
        ? { ...current, loading: true }
        : { ...EMPTY_SNAPSHOT, key, loading: true },
    );
    this.subscription = source.subscribe({
      next: (data) => this.accept(key, data),
      error: (error: unknown) => this.reject(key, toAppError(error)),
    });
  }

  /**
   * Follows a stream of poll outcomes for a key (see `pollWhileVisible`). The caller owns the returned
   * subscription and ends it when the view goes away.
   */
  follow(key: string, outcomes: Observable<PollOutcome<T>>): Subscription {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.snapshot.update((current) =>
      current.key === key ? { ...current, loading: true } : { ...EMPTY_SNAPSHOT, key, loading: true },
    );
    return outcomes.subscribe((outcome) =>
      outcome.ok ? this.accept(key, outcome.value) : this.reject(key, outcome.error),
    );
  }

  /** Accepts a value produced elsewhere (a poll, a mutation result, a realtime event). */
  accept(key: string, data: T): void {
    this.snapshot.set({ key, data, loading: false, error: null, lastUpdatedAt: new Date() });
  }

  /** Records a failure for a key, keeping older data of the same key (then shown as stale). */
  reject(key: string, error: AppError): void {
    this.snapshot.update((current) =>
      current.key === key
        ? { ...current, loading: false, error }
        : { ...EMPTY_SNAPSHOT, key, error },
    );
  }

  /** Updates the current data in place (for example after a mutation). */
  patch(update: (data: T) => T): void {
    this.snapshot.update((current) =>
      current.data === null ? current : { ...current, data: update(current.data) },
    );
  }

  /** Clears everything, for example when the active store changes. */
  reset(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.snapshot.set(EMPTY_SNAPSHOT);
  }
}

/**
 * Signal state of a user mutation: `submitting` disables the submit control, `error` holds the last
 * failure. Mutations are never retried automatically.
 */
export class MutationState {
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<AppError | null>(null);
  private readonly succeededAtSignal = signal<Date | null>(null);

  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly succeededAt = this.succeededAtSignal.asReadonly();

  /**
   * Runs a mutation unless one is already in flight.
   * @param source - The mutation observable.
   * @param onSuccess - Called with the result.
   * @param onError - Called with the normalised error.
   * @returns False when ignored because another submission is in flight.
   */
  run<R>(
    source: Observable<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: AppError) => void,
  ): boolean {
    if (this.submittingSignal()) {
      return false;
    }
    this.submittingSignal.set(true);
    this.errorSignal.set(null);
    source.subscribe({
      next: (result) => {
        this.submittingSignal.set(false);
        this.succeededAtSignal.set(new Date());
        onSuccess?.(result);
      },
      error: (error: unknown) => {
        const appError = toAppError(error);
        this.submittingSignal.set(false);
        this.errorSignal.set(appError);
        onError?.(appError);
      },
      complete: () => this.submittingSignal.set(false),
    });
    return true;
  }

  /** Clears the feedback of the last submission. */
  clear(): void {
    this.errorSignal.set(null);
    this.succeededAtSignal.set(null);
  }
}
