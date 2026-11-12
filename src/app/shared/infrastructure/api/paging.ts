import type { Page } from '@shared/application/page';

/** `PagedResponse<T>`: list envelope with totals. */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

/** `HasMorePageResponse<T>`: list envelope without totals. */
export interface HasMorePageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Maps either list envelope to the application paging model.
 * @param response - The envelope.
 * @param mapItem - Maps one resource.
 */
export function toPage<R, T>(
  response: PagedResponse<R> | HasMorePageResponse<R>,
  mapItem: (resource: R) => T,
): Page<T> {
  const withTotals = 'totalCount' in response;
  return {
    items: response.items.map(mapItem),
    page: response.page,
    pageSize: response.pageSize,
    hasMore: response.hasMore,
    totalCount: withTotals ? response.totalCount : null,
    totalPages: withTotals ? response.totalPages : null,
  };
}
