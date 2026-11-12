import type { AuthenticatedUser } from '@iam/domain/model/authenticated-user';

/** The in-memory session of this tab. The access token is never persisted. */
export interface ClientSession {
  readonly user: AuthenticatedUser;
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Epoch ms; used only to refresh proactively, never as authorization. */
  readonly accessTokenExpiresAt: number;
}

/** Access-token lifetime configured by the API (20 minutes), used when `exp` cannot be read. */
export const ACCESS_TOKEN_FALLBACK_LIFETIME_MS = 20 * 60 * 1000;

/** Refresh this long before the access token expires (the API validates with zero clock skew). */
export const PROACTIVE_REFRESH_LEAD_MS = 60 * 1000;

/**
 * Whether an access token is (about to be) unusable.
 * @param session - The session.
 * @param now - Epoch ms.
 */
export function needsRefresh(session: ClientSession, now: number): boolean {
  return session.accessTokenExpiresAt - PROACTIVE_REFRESH_LEAD_MS <= now;
}
