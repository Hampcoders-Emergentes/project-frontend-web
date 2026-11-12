/**
 * The application paging model. Both API envelopes (`PagedResponse` with totals and
 * `HasMorePageResponse` without them) map to it; totals are null when the API does not send them.
 */
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly totalCount: number | null;
  readonly totalPages: number | null;
}

/** A page request; the API clamps pageSize to 1..100. */
export interface PageQuery {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Appends a page to accumulated items, de-duplicating by id (pages can shift while new data arrives).
 * @param current - The accumulated items.
 * @param next - The items of the next page.
 */
export function appendUniqueById<T extends { readonly id: string }>(
  current: readonly T[],
  next: readonly T[],
): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
}
