import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { normalizeHttpError } from '@shared/infrastructure/http/problem-details';

describe('normalizeHttpError: machine codes and Retry-After', () => {
  it('reads errorCode and never derives it from detail', () => {
    const error = normalizeHttpError(
      new HttpErrorResponse({
        status: 400,
        error: {
          title: 'Bad Request',
          detail: 'EMAIL_ALREADY_REGISTERED',
          traceId: 't-2',
          errorCode: 'VALIDATION_FAILED',
          errors: { Email: ['EMAIL_ALREADY_REGISTERED'] },
        },
      }),
    );
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fields).toEqual({ email: ['EMAIL_ALREADY_REGISTERED'] });
  });

  it('keeps a null code when the payload has none, even if detail looks like one', () => {
    const error = normalizeHttpError(
      new HttpErrorResponse({ status: 403, error: { title: 'Forbidden', detail: 'ACCOUNT_NOT_ACTIVE' } }),
    );
    expect(error.code).toBeNull();
  });

  it('reads the Retry-After header of a 429 in seconds', () => {
    const error = normalizeHttpError(
      new HttpErrorResponse({
        status: 429,
        headers: new HttpHeaders({ 'Retry-After': '42' }),
        error: { title: 'Too Many Requests', errorCode: 'RATE_LIMITED' },
      }),
    );
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.retryAfterSeconds).toBe(42);
  });

  it('falls back to the body retryAfterSeconds when the header is absent', () => {
    const error = normalizeHttpError(
      new HttpErrorResponse({ status: 429, error: { title: 'Too Many Requests', retryAfterSeconds: 7 } }),
    );
    expect(error.retryAfterSeconds).toBe(7);
  });

  it('has no retry window for a body-less or non-positive Retry-After', () => {
    const bodyless = normalizeHttpError(new HttpErrorResponse({ status: 503 }));
    const zero = normalizeHttpError(
      new HttpErrorResponse({ status: 503, headers: new HttpHeaders({ 'Retry-After': '0' }), error: { title: 'x' } }),
    );
    expect(bodyless.retryAfterSeconds).toBeNull();
    expect(zero.retryAfterSeconds).toBeNull();
  });
});
