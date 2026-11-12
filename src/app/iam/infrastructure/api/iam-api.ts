import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import type {
  AuthenticationResult,
  PasswordChangeInput,
  PasswordResetInput,
  SignInCredential,
  SignUpInput,
} from '@iam/application/contracts/iam-contracts';
import type { AuthenticationPort } from '@iam/application/ports/iam-ports';

/** `AuthenticatedUserResponse`. */
interface AuthenticatedUserResponse {
  userId: string;
  email: string;
  token: string;
  refreshToken: string;
}

/** `MessageResponse` (ignored: its text is never shown). */
interface MessageResponse {
  message: string;
}

function toResult(response: AuthenticatedUserResponse): AuthenticationResult {
  return {
    user: { id: response.userId, email: response.email },
    accessToken: response.token,
    refreshToken: response.refreshToken,
  };
}

/** IamApi implements AuthenticationPort against `/auth/*` and `/users/{id}/password`. */
@Injectable({ providedIn: 'root' })
export class IamApi implements AuthenticationPort {
  private readonly api = inject(ApiClient);

  signIn(credential: SignInCredential): Observable<AuthenticationResult> {
    return this.api
      .post<AuthenticatedUserResponse>('/auth/sign-in', { email: credential.email, password: credential.password }, { anonymous: true })
      .pipe(map(toResult));
  }

  signUp(input: SignUpInput): Observable<AuthenticationResult> {
    return this.api
      .post<AuthenticatedUserResponse>(
        '/auth/sign-up',
        {
          email: input.email,
          password: input.password,
          passwordConfirmation: input.passwordConfirmation,
          // The API accepts only `User` on public sign-up (docs: api/enums.md, AccessRole).
          role: 'User',
        },
        { anonymous: true },
      )
      .pipe(map(toResult));
  }

  refresh(refreshToken: string): Observable<AuthenticationResult> {
    return this.api
      .post<AuthenticatedUserResponse>('/auth/refresh', { refreshToken }, { anonymous: true })
      .pipe(map(toResult));
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.api
      .post<MessageResponse>('/auth/forgot-password', { email }, { anonymous: true })
      .pipe(map(() => undefined));
  }

  resetPassword(input: PasswordResetInput): Observable<void> {
    return this.api
      .post<MessageResponse>(
        '/auth/reset-password',
        {
          resetToken: input.resetToken,
          newPassword: input.newPassword,
          newPasswordConfirmation: input.newPasswordConfirmation,
        },
        { anonymous: true },
      )
      .pipe(map(() => undefined));
  }

  changePassword(userId: string, input: PasswordChangeInput): Observable<void> {
    return this.api
      .put<MessageResponse>(`${apiPath('users', userId)}/password`, {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      })
      .pipe(map(() => undefined));
  }
}
