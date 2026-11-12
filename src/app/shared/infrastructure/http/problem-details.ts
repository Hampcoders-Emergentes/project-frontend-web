import { HttpErrorResponse } from '@angular/common/http';
import { AppErrorException } from '@shared/application/app-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readFields(record: Record<string, unknown>): Record<string, string[]> | undefined {
  const errors = record['errors'];
  if (!isRecord(errors)) {
    return undefined;
  }
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      // Field keys may be PascalCase or dotted paths; normalise the first letter for control mapping.
      const name = key.length > 0 ? key.charAt(0).toLowerCase() + key.slice(1) : key;
      fields[name] = value.filter((item): item is string => typeof item === 'string');
    }
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

/**
 * Normalises any HTTP failure into the RFC 7807 application error `{ status, title, detail, traceId,
 * fields?, raw }`. This is the only place where backend error payloads are read. A status-0 error is a
 * network/CORS failure without a body.
 * @param error - The thrown value.
 */
export function normalizeHttpError(error: unknown): AppErrorException {
  if (error instanceof AppErrorException) {
    return error;
  }
  if (!(error instanceof HttpErrorResponse)) {
    return new AppErrorException(0, 'Unexpected error', '', null, error);
  }
  const body: unknown = error.error;
  if (!isRecord(body)) {
    return new AppErrorException(error.status, error.statusText || 'Error', '', null, body);
  }
  return new AppErrorException(
    error.status,
    readString(body, 'title') ?? (error.statusText || 'Error'),
    readString(body, 'detail') ?? '',
    readString(body, 'traceId'),
    body,
    readFields(body),
  );
}

/**
 * Builds a client-side validation error with the same shape as a backend `400`, used when the adapter
 * boundary rejects a request before sending it (for example a date range longer than 31 days).
 * @param field - The request field at fault.
 * @param code - A stable machine code placed in the field messages (translated by the UI).
 */
export function clientValidationError(field: string, code: string): AppErrorException {
  return new AppErrorException(400, 'Bad Request', '', null, null, { [field]: [code] });
}
