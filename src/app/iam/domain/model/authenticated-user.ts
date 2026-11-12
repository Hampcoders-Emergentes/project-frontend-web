/**
 * The signed-in IAM user. A store manager is any active IAM user who owns stores; there is no
 * store-manager role. The id (`us-...`) is opaque.
 */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
}

/** Minimum and maximum password length accepted by IAM. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
