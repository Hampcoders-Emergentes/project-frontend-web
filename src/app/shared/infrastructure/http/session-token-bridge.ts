import { HttpContext, HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * The generic token plumbing the shared HTTP layer needs from the context that owns authentication
 * (IAM). It never exposes storage or refresh internals.
 */
export interface SessionTokenBridge {
  /** The current in-memory access token, or null without a session. */
  accessToken(): string | null;
  /**
   * Obtains a usable access token after `rejectedToken` was refused with `401`, sharing one refresh
   * (single flight). Fails when the session cannot be renewed; the owner then ends the session.
   */
  renewAfterRejection(rejectedToken: string | null): Observable<string>;
  /** Replaces the access token with one received in an `X-Refreshed-Token` response header. */
  acceptRefreshedToken(token: string): void;
}

export const SESSION_TOKEN_BRIDGE = new InjectionToken<SessionTokenBridge>('SESSION_TOKEN_BRIDGE');

/** Marks a request that must not carry the bearer token nor trigger a refresh (public auth routes). */
export const PUBLIC_REQUEST = new HttpContextToken<boolean>(() => false);

/** Marks a request already retried once after a refresh. */
export const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

/** Context of a public (anonymous) API request. */
export function publicRequestContext(): HttpContext {
  return new HttpContext().set(PUBLIC_REQUEST, true);
}
