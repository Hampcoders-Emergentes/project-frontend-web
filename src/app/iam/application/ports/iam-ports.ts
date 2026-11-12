import type { Observable } from 'rxjs';
import type {
  AuthenticationResult,
  PasswordChangeInput,
  PasswordResetInput,
  PersistedSession,
  SignInCredential,
  SignUpInput,
} from '@iam/application/contracts/iam-contracts';

/**
 * AuthenticationPort talks to the IAM endpoints. Failures are normalised application errors; a `401`
 * means invalid credentials or an unusable refresh token, a `403` an account that is not `Active`.
 */
export abstract class AuthenticationPort {
  abstract signIn(credential: SignInCredential): Observable<AuthenticationResult>;
  /** Creates a `User` account and returns its first token pair; a `400` rejects invalid input. */
  abstract signUp(input: SignUpInput): Observable<AuthenticationResult>;
  /** Rotates both tokens; the given refresh token is single-use. */
  abstract refresh(refreshToken: string): Observable<AuthenticationResult>;
  /** Always succeeds for well-formed input (no account enumeration). */
  abstract requestPasswordReset(email: string): Observable<void>;
  /** A success ends every session of the user. */
  abstract resetPassword(input: PasswordResetInput): Observable<void>;
  abstract changePassword(userId: string, input: PasswordChangeInput): Observable<void>;
}

/** SessionStoragePort persists what a reload needs: refresh token and user, never the access token. */
export abstract class SessionStoragePort {
  abstract load(): PersistedSession | null;
  abstract save(session: PersistedSession): void;
  abstract clear(): void;
}

/** TokenExpirationPort reads the `exp` declared by an access token (no signature validation). */
export abstract class TokenExpirationPort {
  /** @returns Epoch ms, or null when unreadable. */
  abstract readExpiresAt(accessToken: string): number | null;
}

/**
 * RefreshLockPort serialises token refreshes across the tabs of this browser, so two tabs never send
 * the same single-use refresh token (the API treats that as reuse and ends the session).
 */
export abstract class RefreshLockPort {
  abstract runExclusive<T>(work: () => Observable<T>): Observable<T>;
}
