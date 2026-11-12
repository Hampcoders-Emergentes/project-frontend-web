import { type DateRange, dateRangeProblem } from '@shared/domain/date-range';
import { clientValidationError } from '@shared/infrastructure/http/problem-details';

/**
 * Serialises an instant as ISO 8601 with an explicit offset (`Z`), as every API request requires.
 * @param date - The instant.
 */
export function toIsoInstant(date: Date): string {
  return date.toISOString();
}

/**
 * Serialises a calendar date as `yyyy-MM-dd` using its local calendar fields.
 * @param date - The date.
 */
export function toDateOnly(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Parses an API timestamp; returns null for null input.
 * @param value - ISO 8601 text or null.
 */
export function parseInstant(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}

/**
 * Validates a half-open range at the adapter boundary and serialises it.
 * Throws a client-side `400` (field `range`, code `invalid|notOrdered|tooLong`) before any request.
 * @param range - The range to send.
 */
export function serializeRange(range: DateRange): { from: string; to: string } {
  const problem = dateRangeProblem(range);
  if (problem !== null) {
    throw clientValidationError('range', problem);
  }
  return { from: toIsoInstant(range.from), to: toIsoInstant(range.to) };
}
