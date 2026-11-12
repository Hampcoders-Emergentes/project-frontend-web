import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { errorKindOf, toAppError } from '@shared/application/app-error';
import { IdempotentAction } from '@shared/application/idempotency-key.port';
import { PageVisibilityPort, pollWhileVisible, type PollOutcome } from '@shared/application/polling';
import { appendUniqueById } from '@shared/application/page';
import { dateRangeProblem, MAX_RANGE_DAYS } from '@shared/domain/date-range';
import { toPage } from '@shared/infrastructure/api/paging';
import { normalizeHttpError } from '@shared/infrastructure/http/problem-details';

describe('normalizeHttpError (RFC 7807)', () => {
  it('maps a validation problem to the safe error shape with camelCase field keys', () => {
    const error = normalizeHttpError(
      new HttpErrorResponse({
        status: 400,
        error: { title: 'Bad Request', status: 400, detail: 'One or more validation errors occurred.', traceId: 't-1', errors: { Name: ['Required'] } },
      }),
    );
    expect(error.status).toBe(400);
    expect(error.traceId).toBe('t-1');
    expect(error.fields).toEqual({ name: ['Required'] });
    expect(errorKindOf(error)).toBe('validation');
  });

  it('treats a body-less failure as a network error', () => {
    const error = normalizeHttpError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));
    expect(errorKindOf(error)).toBe('network');
    expect(error.fields).toBeUndefined();
  });

  it('turns unknown thrown values into status 0', () => {
    expect(toAppError(new Error('boom')).status).toBe(0);
  });
});

describe('dateRangeProblem', () => {
  const day = 86_400_000;
  it('accepts a half-open range of exactly 31 days', () => {
    expect(dateRangeProblem({ from: new Date(0), to: new Date(MAX_RANGE_DAYS * day) })).toBeNull();
  });
  it('rejects longer, reversed and invalid ranges', () => {
    expect(dateRangeProblem({ from: new Date(0), to: new Date(MAX_RANGE_DAYS * day + 1) })).toBe('tooLong');
    expect(dateRangeProblem({ from: new Date(day), to: new Date(day) })).toBe('notOrdered');
    expect(dateRangeProblem({ from: new Date('x'), to: new Date() })).toBe('invalid');
  });
});

describe('paging', () => {
  it('maps both envelopes to one model, with null totals when absent', () => {
    const withTotals = toPage({ items: [1], page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasMore: false }, (n) => n * 2);
    const hasMore = toPage({ items: [1], page: 2, pageSize: 20, hasMore: true }, (n) => n);
    expect(withTotals.items).toEqual([2]);
    expect(withTotals.totalCount).toBe(1);
    expect(hasMore.totalCount).toBeNull();
    expect(hasMore.hasMore).toBe(true);
  });

  it('de-duplicates accumulated pages by id', () => {
    expect(appendUniqueById([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }]).map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('IdempotentAction', () => {
  it('reuses the key for the same payload and renews it when the payload changes', () => {
    let counter = 0;
    const action = new IdempotentAction({ create: () => `key-${++counter}` });
    const first = action.keyFor({ a: 1 });
    expect(action.keyFor({ a: 1 })).toBe(first);
    expect(action.keyFor({ a: 2 })).not.toBe(first);
    action.complete();
    expect(action.keyFor({ a: 2 })).toBe('key-3');
  });
});

describe('pollWhileVisible', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('stops after a 403 outcome', () => {
    const visibility: PageVisibilityPort = { visible$: new BehaviorSubject(true) };
    const outcomes: PollOutcome<number>[] = [];
    let completed = false;
    pollWhileVisible(visibility, 1_000_000, () =>
      throwError(() => normalizeHttpError(new HttpErrorResponse({ status: 403, error: { title: 'Forbidden' } }))),
    ).subscribe({ next: (outcome) => outcomes.push(outcome), complete: () => (completed = true) });
    vi.advanceTimersByTime(0);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.ok).toBe(false);
    expect(completed).toBe(true);
  });

  it('does not poll while the page is hidden', () => {
    const visible$ = new BehaviorSubject(false);
    let calls = 0;
    const subscription = pollWhileVisible({ visible$ }, 1_000_000, () => {
      calls++;
      return of(1);
    }).subscribe();
    expect(calls).toBe(0);
    vi.advanceTimersByTime(5_000);
    expect(calls).toBe(0);
    visible$.next(true);
    vi.advanceTimersByTime(0);
    expect(calls).toBe(1);
    subscription.unsubscribe();
  });
});
