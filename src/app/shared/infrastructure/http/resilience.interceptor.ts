import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';
import { API_BASE_URL } from '@shared/infrastructure/api/api-url';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const RATE_LIMIT_DELAY_MS = 5_000;

function retryAfterMs(error: HttpErrorResponse): number {
  const header = Number(error.headers.get('Retry-After'));
  return Number.isFinite(header) && header > 0 ? header * 1000 : RATE_LIMIT_DELAY_MS;
}

/**
 * Retries failed API `GET` requests with exponential back-off (at most 3 times) on network failures
 * (status 0) and `5xx`, and backs off once on `429`. Mutations are never retried automatically.
 */
export const resilienceInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method !== 'GET' || !request.url.startsWith(`${API_BASE_URL}/`)) {
    return next(request);
  }
  return next(request).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, attempt: number) => {
        if (!(error instanceof HttpErrorResponse)) {
          return throwError(() => error);
        }
        if (error.status === 429) {
          return attempt === 1 ? timer(retryAfterMs(error)) : throwError(() => error);
        }
        if (error.status === 0 || error.status >= 500) {
          return timer(BASE_DELAY_MS * 2 ** (attempt - 1));
        }
        return throwError(() => error);
      },
    }),
  );
};
