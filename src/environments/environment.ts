/**
 * Production configuration. `apiOrigin` is the origin of the ElectroLink API; the REST base URL is
 * `{apiOrigin}/api/v1` and the realtime hub is `{apiOrigin}/hubs/alerts`. Replace it per deployment.
 */
export const environment = {
  production: true,
  apiOrigin: 'http://localhost:8080',
};
