/** Formats a date for an `<input type="datetime-local">` in the user's local time. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Formats a date for an `<input type="date">` in the user's local time. */
export function toDateInputValue(date: Date): string {
  return toDateTimeLocalValue(date).slice(0, 10);
}

/**
 * Parses a `datetime-local` or `date` input value as local time; null when empty or invalid.
 * Adapters serialise the resulting instant with an explicit offset.
 */
export function fromLocalInputValue(value: string): Date | null {
  if (value === '') {
    return null;
  }
  const date = new Date(value.length === 10 ? `${value}T00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}
