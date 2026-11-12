import { inject, Injectable } from '@angular/core';
import { type Observable, tap } from 'rxjs';
import type { PasswordChangeInput, PasswordResetInput } from '@iam/application/contracts/iam-contracts';
import { AuthenticationPort, SessionStoragePort } from '@iam/application/ports/iam-ports';

/** Requests the password-reset email (the API always answers success). */
@Injectable({ providedIn: 'root' })
export class RequestPasswordResetUseCase {
  private readonly authentication = inject(AuthenticationPort);

  execute(email: string): Observable<void> {
    return this.authentication.requestPasswordReset(email);
  }
}

/** Completes a password reset; a success ends every session, so local session data is discarded. */
@Injectable({ providedIn: 'root' })
export class ResetPasswordUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly storage = inject(SessionStoragePort);

  execute(input: PasswordResetInput): Observable<void> {
    return this.authentication.resetPassword(input).pipe(tap(() => this.storage.clear()));
  }
}

/** Changes the password of the signed-in user. */
@Injectable({ providedIn: 'root' })
export class ChangePasswordUseCase {
  private readonly authentication = inject(AuthenticationPort);

  execute(userId: string, input: PasswordChangeInput): Observable<void> {
    return this.authentication.changePassword(userId, input);
  }
}
