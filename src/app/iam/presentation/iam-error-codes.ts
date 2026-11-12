import type { ErrorCodeMessages } from '@shared/application/app-error';

/** Translation keys of the IAM `errorCode`s (the code of the whole problem response). */
export const IAM_ERROR_CODE_MESSAGES: ErrorCodeMessages = {
  EMAIL_ALREADY_REGISTERED: 'iam.errorCodes.EMAIL_ALREADY_REGISTERED',
  PASSWORD_REJECTED: 'iam.errorCodes.PASSWORD_REJECTED',
  ACCOUNT_NOT_ACTIVE: 'iam.errorCodes.ACCOUNT_NOT_ACTIVE',
};

/** Translation keys of the field codes (`errors` of a `400`) that the IAM forms show under their inputs. */
export const IAM_FIELD_CODE_MESSAGES: ErrorCodeMessages = {
  EMAIL_ALREADY_REGISTERED: 'iam.errorCodes.EMAIL_ALREADY_REGISTERED',
  INVALID_EMAIL: 'iam.validation.email',
  PASSWORDS_DO_NOT_MATCH: 'iam.validation.passwordMismatch',
  PASSWORD_LENGTH: 'iam.validation.passwordLength',
};
