/**
 * The single safe error shape of the application (RFC 7807 normalised by infrastructure).
 *
 * - `status` is the HTTP status; `0` means a network/CORS failure without a response.
 * - `code` is the stable `errorCode` of the API (UPPER_SNAKE_CASE). It is the only machine value clients
 *   branch on besides `status`; `null` when the response carried none.
 * - `detail` is English free text from the backend: it may be shown for support but is never parsed.
 * - `fields` maps request property names to field codes (from the problem `errors`).
 * - `retryAfterSeconds` is the wait a `429` or `503` asked for (from `Retry-After`), else `null`.
 * - `raw` keeps the original payload for diagnostics only; it is never rendered.
 */
export interface AppError {
  readonly status: number;
  readonly code: string | null;
  readonly title: string;
  readonly detail: string;
  readonly traceId: string | null;
  readonly fields?: Readonly<Record<string, readonly string[]>>;
  readonly retryAfterSeconds: number | null;
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
    readonly code: string | null = null,
    readonly retryAfterSeconds: number | null = null,
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
  return { status: 0, code: null, title: 'Unexpected error', detail: '', traceId: null, retryAfterSeconds: null, raw: error };
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

/** Translation keys of specific `errorCode`s, one table per context. */
export type ErrorCodeMessages = Readonly<Record<string, string>>;

/**
 * Translation key for an error: the table entry of its `errorCode` when there is one, otherwise the
 * generic key of its status. Unknown codes therefore fall back safely, and `detail` is never used.
 * @param error - The normalised error.
 * @param table - Specific messages of the calling context.
 */
export function errorMessageKeyFor(error: AppError, table: ErrorCodeMessages = {}): string {
  const code = error.code;
  if (code !== null && Object.prototype.hasOwnProperty.call(table, code)) {
    const specific = table[code];
    if (specific !== undefined) {
      return specific;
    }
  }
  return errorMessageKey(error);
}
