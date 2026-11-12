/** Maximum span accepted by every ranged API query (half-open `[from, to)`). */
export const MAX_RANGE_DAYS = 31;

const DAY_MS = 86_400_000;

/** A half-open instant range `[from, to)`. */
export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

/** Why a date range is not acceptable for the API. */
export type DateRangeProblem = 'invalid' | 'notOrdered' | 'tooLong';

/**
 * Validates a range against the API rule: both ends valid, `from < to`, at most 31 days.
 * @param range - The range to check.
 * @returns The problem, or null when the range is valid.
 */
export function dateRangeProblem(range: DateRange): DateRangeProblem | null {
  const from = range.from.getTime();
  const to = range.to.getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) {
    return 'invalid';
  }
  if (from >= to) {
    return 'notOrdered';
  }
  return to - from > MAX_RANGE_DAYS * DAY_MS ? 'tooLong' : null;
}

/**
 * The range covering the last `days` days up to `now`.
 * @param days - Number of days (1..31).
 * @param now - The end instant.
 */
export function lastDays(days: number, now: Date = new Date()): DateRange {
  return { from: new Date(now.getTime() - days * DAY_MS), to: now };
}
