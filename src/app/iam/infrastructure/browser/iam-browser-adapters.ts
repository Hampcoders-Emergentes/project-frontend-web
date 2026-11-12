import { DOCUMENT, inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import type { PersistedSession } from '@iam/application/contracts/iam-contracts';
import type {
  RefreshLockPort,
  SessionStoragePort,
  TokenExpirationPort,
} from '@iam/application/ports/iam-ports';

const SESSION_KEY = 'electrolink.session';
const REFRESH_LOCK = 'electrolink.session.refresh';

function isPersistedSession(value: unknown): value is PersistedSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const user = record['user'];
  return (
    typeof record['refreshToken'] === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    typeof (user as Record<string, unknown>)['id'] === 'string' &&
    typeof (user as Record<string, unknown>)['email'] === 'string'
  );
}

/**
 * Persists the refresh token and user in `localStorage` (shared by tabs, survives reloads). The access
 * token stays in memory only.
 *
 * SECURITY LIMITATION: the API takes the refresh token in a JSON body and offers no HttpOnly cookie, so
 * it must be readable by scripts on this origin; an XSS could read it.
 */
@Injectable({ providedIn: 'root' })
export class BrowserSessionStorage implements SessionStoragePort {
  private readonly document = inject(DOCUMENT);

  load(): PersistedSession | null {
    try {
      const raw = this.storage()?.getItem(SESSION_KEY) ?? null;
      const parsed: unknown = raw === null ? null : JSON.parse(raw);
      return isPersistedSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  save(session: PersistedSession): void {
    try {
      this.storage()?.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Storage blocked or full: the session lives in memory for this tab only.
    }
  }

  clear(): void {
    try {
      this.storage()?.removeItem(SESSION_KEY);
    } catch {
      // Nothing could have been persisted.
    }
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

/** Reads `exp` from the JWT payload. The token is not validated on the client. */
@Injectable({ providedIn: 'root' })
export class JwtTokenExpiration implements TokenExpirationPort {
  readExpiresAt(accessToken: string): number | null {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }
    try {
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const exp: unknown = (JSON.parse(json) as Record<string, unknown>)['exp'];
      return typeof exp === 'number' ? exp * 1000 : null;
    } catch {
      return null;
    }
  }
}

/** Cross-tab exclusive section using the Web Locks API; runs directly where it is unsupported. */
@Injectable({ providedIn: 'root' })
export class WebLocksRefreshLock implements RefreshLockPort {
  private readonly document = inject(DOCUMENT);

  runExclusive<T>(work: () => Observable<T>): Observable<T> {
    const locks = this.document.defaultView?.navigator.locks;
    if (!locks) {
      return work();
    }
    return new Observable<T>((subscriber) => {
      locks
        .request(REFRESH_LOCK, () => firstValueFrom(work()))
        .then(
          (value) => {
            subscriber.next(value);
            subscriber.complete();
          },
          (error: unknown) => subscriber.error(error),
        );
    });
  }
}
