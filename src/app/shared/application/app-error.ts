/**
 * The single safe error shape of the application (RFC 7807 normalised by infrastructure).
 *
 * - `status` is the HTTP status; `0` means a network/CORS failure without a response.
 * - `detail` is English free text from the backend: it may be shown for support but is never parsed.
 * - `fields` maps request property names to validation messages (from the problem `errors`).
 * - `raw` keeps the original payload for diagnostics only; it is never rendered.
 */
export interface AppError {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly traceId: string | null;
  readonly fields?: Readonly<Record<string, readonly string[]>>;
  readonly raw: unknown;
}

/** Marker class so stores can tell normalised errors from programming errors. */
export class AppErrorException extends Error implements AppError {
  override readonly name = 'AppErrorException';

  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail: string,
    readonly traceId: string | null,
    readonly raw: unknown,
    readonly fields?: Readonly<Record<string, readonly string[]>>,
  ) {
    super(`HTTP ${status}: ${title}`);
  }
}

/**
 * Narrows any thrown value to the application error shape. Unknown failures become a status-0 error.
 * @param error - The thrown value.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppErrorException) {
    return error;
  }
  return { status: 0, title: 'Unexpected error', detail: '', traceId: null, raw: error };
}

/** The UI category of an error, chosen from its status only. */
export type AppErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'businessRule'
  | 'rateLimited'
  | 'server'
  | 'network';

/**
 * Classifies an error by HTTP status, the only allowed branching criterion.
 * @param error - The normalised error.
 */
export function errorKindOf(error: AppError): AppErrorKind {
  switch (error.status) {
    case 0:
      return 'network';
    case 400:
      return 'validation';
    case 401:
      return 'unauthenticated';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    case 422:
      return 'businessRule';
    case 429:
      return 'rateLimited';
    default:
      return error.status >= 500 ? 'server' : 'validation';
  }
}

/** Translation key of the generic message of an error kind (`shared.errors.<kind>`). */
export function errorMessageKey(error: AppError): string {
  return `shared.errors.${errorKindOf(error)}`;
}
