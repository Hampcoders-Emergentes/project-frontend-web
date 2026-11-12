import { inject, Injectable } from '@angular/core';
import { catchError, defer, finalize, map, type Observable, of, shareReplay, throwError } from 'rxjs';
import { AppErrorException, toAppError } from '@shared/application/app-error';
import type { AuthenticationResult, SignInCredential } from '@iam/application/contracts/iam-contracts';
import {
  AuthenticationPort,
  RefreshLockPort,
  SessionStoragePort,
  TokenExpirationPort,
} from '@iam/application/ports/iam-ports';
import {
  ACCESS_TOKEN_FALLBACK_LIFETIME_MS,
  type ClientSession,
} from '@iam/application/state/client-session';

/** Builds the in-memory session from an authentication result and persists the reload data. */
@Injectable({ providedIn: 'root' })
export class EstablishSessionUseCase {
  private readonly storage = inject(SessionStoragePort);
  private readonly expiration = inject(TokenExpirationPort);

  execute(result: AuthenticationResult): ClientSession {
    const expiresAt =
      this.expiration.readExpiresAt(result.accessToken) ??
      Date.now() + ACCESS_TOKEN_FALLBACK_LIFETIME_MS;
    this.storage.save({ user: result.user, refreshToken: result.refreshToken });
    return { ...result, accessTokenExpiresAt: expiresAt };
  }
}

/** Signs in with email and password. */
@Injectable({ providedIn: 'root' })
export class SignInUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly establish = inject(EstablishSessionUseCase);

  execute(credential: SignInCredential): Observable<ClientSession> {
    return this.authentication.signIn(credential).pipe(map((result) => this.establish.execute(result)));
  }
}

/**
 * Rotates the token pair with the newest persisted refresh token.
 *
 * - One refresh at a time per tab (callers share it) and across tabs (exclusive lock); the refresh
 *   token is re-read inside the lock, so a token rotated by another tab is never replayed.
 * - A `4xx` answer is definitive: the persisted session is cleared. Network/server failures keep it.
 */
@Injectable({ providedIn: 'root' })
export class RefreshSessionUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly storage = inject(SessionStoragePort);
  private readonly lock = inject(RefreshLockPort);
  private readonly establish = inject(EstablishSessionUseCase);
  private inFlight: Observable<ClientSession> | null = null;

  execute(): Observable<ClientSession> {
    this.inFlight ??= this.lock
      .runExclusive(() =>
        defer(() => {
          const persisted = this.storage.load();
          if (persisted === null) {
            return throwError(
              () => new AppErrorException(401, 'Unauthorized', 'No persisted session.', null, null),
            );
          }
          return this.authentication.refresh(persisted.refreshToken);
        }),
      )
      .pipe(
        map((result) => this.establish.execute(result)),
        catchError((error: unknown) => {
          const status = toAppError(error).status;
          if (status >= 400 && status < 500) {
            this.storage.clear();
          }
          return throwError(() => error);
        }),
        finalize(() => (this.inFlight = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.inFlight;
  }
}

/** Result of restoring a session at startup. */
export type RestoreOutcome =
  | { readonly kind: 'restored'; readonly session: ClientSession }
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'inactive' }
  | { readonly kind: 'unreachable' };

/** Restores the session at startup through a silent refresh of the persisted refresh token. */
@Injectable({ providedIn: 'root' })
export class RestoreSessionUseCase {
  private readonly storage = inject(SessionStoragePort);
  private readonly refresh = inject(RefreshSessionUseCase);

  execute(): Observable<RestoreOutcome> {
    return defer(() => {
      if (this.storage.load() === null) {
        return of<RestoreOutcome>({ kind: 'anonymous' });
      }
      return this.refresh.execute().pipe(
        map((session): RestoreOutcome => ({ kind: 'restored', session })),
        catchError((error: unknown) => {
          const status = toAppError(error).status;
          if (status === 403) {
            return of<RestoreOutcome>({ kind: 'inactive' });
          }
          return of<RestoreOutcome>(status >= 400 && status < 500 ? { kind: 'anonymous' } : { kind: 'unreachable' });
        }),
      );
    });
  }
}

/**
 * Ends the session on this client. The API has no sign-out endpoint, so the persisted refresh token is
 * discarded locally (it expires server-side).
 */
@Injectable({ providedIn: 'root' })
export class SignOutUseCase {
  private readonly storage = inject(SessionStoragePort);

  execute(): void {
    this.storage.clear();
  }
}

/** Replaces the access token with one the API sent in `X-Refreshed-Token`. */
@Injectable({ providedIn: 'root' })
export class AcceptRefreshedTokenUseCase {
  private readonly expiration = inject(TokenExpirationPort);

  execute(session: ClientSession, accessToken: string): ClientSession {
    return {
      ...session,
      accessToken,
      accessTokenExpiresAt:
        this.expiration.readExpiresAt(accessToken) ?? Date.now() + ACCESS_TOKEN_FALLBACK_LIFETIME_MS,
    };
  }
}
