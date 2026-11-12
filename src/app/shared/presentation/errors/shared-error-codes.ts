import type { ErrorCodeMessages } from '@shared/application/app-error';

/**
 * Translation keys of the `errorCode`s every context can receive (throttling, optimistic concurrency and
 * report jobs). Context-specific codes live in each context's presentation folder.
 */
export const SHARED_ERROR_CODE_MESSAGES: ErrorCodeMessages = {
  RATE_LIMITED: 'shared.errorCodes.RATE_LIMITED',
  STALE_STATE: 'shared.errorCodes.STALE_STATE',
  REPORT_IN_PROGRESS: 'shared.errorCodes.REPORT_IN_PROGRESS',
};
