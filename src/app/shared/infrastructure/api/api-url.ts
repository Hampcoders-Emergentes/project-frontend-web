import { environment } from '@env/environment';

/** REST base URL of the ElectroLink API: `{API_ORIGIN}/api/v1`. */
export const API_BASE_URL = `${environment.apiOrigin.replace(/\/+$/, '')}/api/v1`;

/** Realtime hub URL: `{API_ORIGIN}/hubs/alerts`. */
export const ALERTS_HUB_URL = `${environment.apiOrigin.replace(/\/+$/, '')}/hubs/alerts`;

/**
 * Builds a URL path from segments, encoding every segment so opaque ids are sent verbatim.
 * @example apiPath('stores', storeId, 'areas') -> '/stores/store-1/areas'
 */
export function apiPath(...segments: readonly string[]): string {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}
