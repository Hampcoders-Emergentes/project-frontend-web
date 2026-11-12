import type { AuthenticatedUser } from '@iam/domain/model/authenticated-user';

/** Credentials of `POST /auth/sign-in`. */
export interface SignInCredential {
  readonly email: string;
  readonly password: string;
}

/** The token pair and user issued by sign-in or refresh. */
export interface AuthenticationResult {
  readonly user: AuthenticatedUser;
  readonly accessToken: string;
  readonly refreshToken: string;
}

/** Input of the password reset that completes the emailed link. */
export interface PasswordResetInput {
  readonly resetToken: string;
  readonly newPassword: string;
  readonly newPasswordConfirmation: string;
}

/** Input of the signed-in password change. */
export interface PasswordChangeInput {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/** What survives a page reload: the refresh token and the user (never the access token). */
export interface PersistedSession {
  readonly user: AuthenticatedUser;
  readonly refreshToken: string;
}
