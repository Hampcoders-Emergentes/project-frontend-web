import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpInterceptorFn,
  type HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, type Observable, switchMap, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '@shared/infrastructure/api/api-url';
import {
  PUBLIC_REQUEST,
  RETRIED_AFTER_REFRESH,
  SESSION_TOKEN_BRIDGE,
} from '@shared/infrastructure/http/session-token-bridge';

const REFRESHED_TOKEN_HEADER = 'X-Refreshed-Token';

function isApiRequest(request: HttpRequest<unknown>): boolean {
  return request.url.startsWith(`${API_BASE_URL}/`);
}

function withBearer(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token === null ? request : request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Attaches the bearer token to protected API requests, stores the access token of an
 * `X-Refreshed-Token` response header, and on the first `401` waits for the single-flight session
 * renewal and retries the request exactly once. Public requests never carry the token nor refresh.
 * `403` is never retried.
 */
export const authenticationInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request) || request.context.get(PUBLIC_REQUEST)) {
    return next(request);
  }
  const bridge = inject(SESSION_TOKEN_BRIDGE);
  const token = bridge.accessToken();
  const captureRefreshedToken = (event: HttpEvent<unknown>): void => {
    if (event instanceof HttpResponse) {
      const refreshed = event.headers.get(REFRESHED_TOKEN_HEADER);
      if (refreshed) {
        bridge.acceptRefreshedToken(refreshed);
      }
    }
  };

  return next(withBearer(request, token)).pipe(
    tap(captureRefreshedToken),
    catchError((error: unknown): Observable<HttpEvent<unknown>> => {
      const canRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.context.get(RETRIED_AFTER_REFRESH);
      if (!canRefresh) {
        return throwError(() => error);
      }
      request.context.set(RETRIED_AFTER_REFRESH, true);
      return bridge.renewAfterRejection(token).pipe(
        catchError(() => throwError(() => error)),
        switchMap((renewed) => next(withBearer(request, renewed)).pipe(tap(captureRefreshedToken))),
      );
    }),
  );
};
