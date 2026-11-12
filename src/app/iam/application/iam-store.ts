import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, type Observable, of, type Subscription, take, tap, timer } from 'rxjs';
import { MutationState } from '@shared/application/async-resource';
import { toAppError } from '@shared/application/app-error';
import type {
  PasswordChangeInput,
  PasswordResetInput,
  SignInCredential,
} from '@iam/application/contracts/iam-contracts';
import {
  type ClientSession,
  needsRefresh,
  PROACTIVE_REFRESH_LEAD_MS,
} from '@iam/application/state/client-session';
import {
  ChangePasswordUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from '@iam/application/use-cases/password-use-cases';
import {
  AcceptRefreshedTokenUseCase,
  RefreshSessionUseCase,
  RestoreSessionUseCase,
  SignInUseCase,
  SignOutUseCase,
} from '@iam/application/use-cases/session-use-cases';

/**
 * Session status:
 * - `restoring`: the startup refresh is running; guards wait for it;
 * - `anonymous`: no session;
 * - `authenticated`: an `Active` account with a usable token pair;
 * - `inactive`: the account is not `Active` (403); access is denied without retry;
 * - `unreachable`: the API could not be reached during restoration.
 */
export type SessionStatus = 'restoring' | 'anonymous' | 'authenticated' | 'inactive' | 'unreachable';

/** Why the last session ended, for the sign-in screen. */
export type SessionEndReason = 'signedOut' | 'expired' | 'passwordReset' | null;

/** Signal state of the IAM session; side effects are delegated to use cases. */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly restoreUseCase = inject(RestoreSessionUseCase);
  private readonly refreshUseCase = inject(RefreshSessionUseCase);
  private readonly signInUseCase = inject(SignInUseCase);
  private readonly signOutUseCase = inject(SignOutUseCase);
  private readonly acceptRefreshedTokenUseCase = inject(AcceptRefreshedTokenUseCase);
  private readonly requestPasswordResetUseCase = inject(RequestPasswordResetUseCase);
  private readonly resetPasswordUseCase = inject(ResetPasswordUseCase);
  private readonly changePasswordUseCase = inject(ChangePasswordUseCase);

  private readonly sessionSignal = signal<ClientSession | null>(null);
  private readonly statusSignal = signal<SessionStatus>('anonymous');
  private readonly endReasonSignal = signal<SessionEndReason>(null);
  private proactiveRefresh: Subscription | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly endReason = this.endReasonSignal.asReadonly();
  readonly currentUser = computed(() => this.sessionSignal()?.user ?? null);
  readonly accessToken = computed(() => this.sessionSignal()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this.statusSignal() === 'authenticated');
  private readonly status$ = toObservable(this.statusSignal);

  readonly signInState = new MutationState();
  readonly passwordResetRequestState = new MutationState();
  readonly passwordResetState = new MutationState();
  readonly passwordChangeState = new MutationState();

  /** Restores the session at startup; guards wait for it through `whenSessionResolved`. */
  restoreSession(): void {
    this.statusSignal.set('restoring');
    this.restoreUseCase.execute().subscribe((outcome) => {
      if (outcome.kind === 'restored') {
        this.startSession(outcome.session);
      } else {
        this.statusSignal.set(outcome.kind);
      }
    });
  }

  /** Emits once the startup restoration has resolved. */
  whenSessionResolved(): Observable<SessionStatus> {
    return this.statusSignal() !== 'restoring'
      ? of(this.statusSignal())
      : this.status$.pipe(
          filter((status) => status !== 'restoring'),
          take(1),
        );
  }

  signIn(credential: SignInCredential, onSuccess: () => void): void {
    this.signInState.run(this.signInUseCase.execute(credential), (session) => {
      this.endReasonSignal.set(null);
      this.startSession(session);
      onSuccess();
    }, (error) => {
      if (error.status === 403) {
        this.statusSignal.set('inactive');
      }
    });
  }

  /**
   * Obtains a usable access token after one was rejected with `401`, sharing a single refresh.
   * A definitive refresh failure ends the session as expired.
   */
  renewAfterRejection(rejectedToken: string | null): Observable<string> {
    const session = this.sessionSignal();
    if (session !== null && session.accessToken !== rejectedToken && !needsRefresh(session, Date.now())) {
      return of(session.accessToken);
    }
    return this.refreshUseCase.execute().pipe(
      tap({
        next: (renewed) => this.startSession(renewed),
        error: (error: unknown) => this.handleRefreshFailure(error),
      }),
      map((renewed) => renewed.accessToken),
    );
  }

  /** Stores an access token received in `X-Refreshed-Token`. */
  acceptRefreshedToken(accessToken: string): void {
    const session = this.sessionSignal();
    if (session !== null && session.accessToken !== accessToken) {
      this.startSession(this.acceptRefreshedTokenUseCase.execute(session, accessToken));
    }
  }

  signOut(): void {
    this.endSession('signedOut');
  }

  requestPasswordReset(email: string): void {
    this.passwordResetRequestState.run(this.requestPasswordResetUseCase.execute(email));
  }

  resetPassword(input: PasswordResetInput): void {
    this.passwordResetState.run(this.resetPasswordUseCase.execute(input), () => {
      this.sessionSignal.set(null);
      this.statusSignal.set('anonymous');
      this.endReasonSignal.set('passwordReset');
    });
  }

  changePassword(input: PasswordChangeInput, onSuccess?: () => void): void {
    const user = this.currentUser();
    if (user !== null) {
      this.passwordChangeState.run(this.changePasswordUseCase.execute(user.id, input), () => onSuccess?.());
    }
  }

  private startSession(session: ClientSession): void {
    this.sessionSignal.set(session);
    this.statusSignal.set('authenticated');
    this.scheduleProactiveRefresh(session);
  }

  private scheduleProactiveRefresh(session: ClientSession): void {
    this.proactiveRefresh?.unsubscribe();
    const dueIn = Math.max(0, session.accessTokenExpiresAt - PROACTIVE_REFRESH_LEAD_MS - Date.now());
    this.proactiveRefresh = timer(dueIn).subscribe(() => {
      this.refreshUseCase.execute().subscribe({
        next: (renewed) => this.startSession(renewed),
        error: (error: unknown) => this.handleRefreshFailure(error),
      });
    });
  }

  private handleRefreshFailure(error: unknown): void {
    const status = toAppError(error).status;
    if (status === 403) {
      this.endSession('expired');
      this.statusSignal.set('inactive');
    } else if (status >= 400 && status < 500) {
      this.endSession('expired');
    }
    // Network/server failures keep the session; the next request or timer tries again.
  }

  private endSession(reason: SessionEndReason): void {
    this.proactiveRefresh?.unsubscribe();
    this.proactiveRefresh = null;
    this.signOutUseCase.execute();
    this.sessionSignal.set(null);
    this.statusSignal.set('anonymous');
    this.endReasonSignal.set(reason);
  }
}
