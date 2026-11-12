/**
 * Default configuration (unit tests and builds without `fileReplacements`). Production builds use
 * `environment.generated.ts`, written by `scripts/generate-environment.mjs` from `API_ORIGIN`.
 * `apiOrigin` is the origin of the ElectroLink API; the REST base URL is `{apiOrigin}/api/v1` and the
 * realtime hub is `{apiOrigin}/hubs/alerts`.
 */
export const environment = {
  production: true,
  apiOrigin: 'http://localhost:8080',
};
