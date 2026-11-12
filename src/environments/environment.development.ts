/**
 * Development configuration (Docker Compose exposes the API on port 8080; the Angular dev origin
 * `http://localhost:4200` is allowed by the API CORS policy by default).
 */
export const environment = {
  production: false,
  apiOrigin: 'http://localhost:8080',
};
