# Security reference

## CORS

Configured in `Program.cs` (policy `FrontendPolicy`):

- Allowed origins come from `Cors:AllowedOrigins` (array in `appsettings.json`; env `Cors__AllowedOrigins__0`, `__1`…). Default when empty: `http://localhost:4200`.
- `*` is **rejected at startup** (credentials are enabled).
- `AllowAnyHeader()`, `AllowAnyMethod()`, `AllowCredentials()`.
- Trailing slashes are trimmed, so list origins as `https://app.example.com` (scheme + host + port, no path).
- Add every deployed web origin (store panel, landing, admin) explicitly; a missing origin shows up as a browser CORS error, not an API error.
- SignalR from a browser needs the same origin allowance.

## Transport

- `UseHttpsRedirection()` runs **only in Development**. In other environments TLS is expected to be terminated by the proxy; `ForwardedHeaders` (`X-Forwarded-For`, `X-Forwarded-Proto`) are honoured and the known-proxy lists are cleared (so any caller can set them). The Docker image listens on HTTP 8080.
- `AllowedHosts` is `*`.

## Rate limiting

Only one limiter exists (`contact-form`, applied to `POST /api/v1/contact-requests`): fixed window **5 requests per 10 minutes per client IP**, no queue → `429` (standard error envelope, written by the status-code-pages handler). A second business limit is a per-email daily quota (`Subscriptions:DemoRequests:MaxRequestsPerEmailPerDay`, default 3) → `429` with its own `detail`. The limiter applies to the submission only, not to `GET /contact-requests/{requestId}`. There is **no global/API-wide throttling**; do not rely on the server to protect polling loops — respect the polling guidance in [`../guides/frontend-conventions.md`](../guides/frontend-conventions.md).

## Input validation

- `[ApiController]` model validation → `400 ValidationProblemDetails` (DataAnnotations: `[Required]`, `[StringLength]`, `[Range]`, `[Url]`, `[EmailAddress]`, `[RegularExpression]`).
- Strict bodies: store-management, alerts, analytics, contact-request and many compliance payloads use `JsonUnmappedMemberHandling.Disallow` — sending an extra property (for example `ownerUserId`) is a 400. Other bodies silently ignore unknown properties.
- Names are trimmed server-side; identifiers must match their prefix format (`store-`, `area-`, `equipment-`, `prop-` …) or the call is 400/404.
- Date ranges on analytics/measurements/alerts/shifts: ISO 8601 **with explicit offset**, half-open `[from,to)`, max 31 days.
- Uploads: profile pictures go through `multipart/form-data` (`file`) or, preferably, through a signed direct-to-Cloudinary upload (see [`../integrations/cloudinary-file-storage.md`](../integrations/cloudinary-file-storage.md)). Signature images (`imageBase64`) are limited to 360,000 characters of base64.
- Webhook destinations for alert routing must be public `https` URLs (no localhost, private, link-local, `.local`/`.internal` hosts, no credentials in the URL, ≤ 254 chars) — enforced on save **and** again at delivery.

## Authorization model recap

| Layer | Rule |
|---|---|
| Global middleware | Everything requires a valid JWT of an `Active` user unless explicitly anonymous. |
| Role attributes | Admin/SuperAdmin/FieldManager gates on staff, dispatch, matching, service-execution creation. |
| Ownership | Store, alert, analytics, audit and compliance data belong to the **IAM user that created the store** (`ownerUserId`); *an `Admin` cannot read another user's store*. Assets/Planning/Profiles check the caller's technician/homeowner/company profile against the id in the route. Violations return `404` (non-disclosure) or `403`. |
| Edge key | Machine-only routes; never accepted for human routes. |

## Webhooks

### Inbound — Stripe

`POST /api/v1/webhooks/stripe` verifies the `Stripe-Signature` header with `Stripe:WebhookSecret`. Missing secret → `503`; missing/invalid signature → `400 { error: "Invalid signature" }`. Handled events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`; others are acknowledged with `200` and ignored. Delivery is **idempotent** (processed-event inbox keyed by Stripe event id). Frontends never call this route.

### Outbound — alert webhooks

Alert routes with channel `WEBHOOK` POST JSON to the configured HTTPS URL: `{ "event": "alert.raised", "alert": { alertId, storeId, storeName, areaName, equipmentId, equipmentName, anomalyType, severity, isCriticalLeakage, occurredAtUtc }, "subject": "...", "text": "..." }`. When `Notifications:Webhook:SigningSecret` is set the request carries
`X-Electrolink-Signature: sha256=<hex(HMAC_SHA256(secret, rawBody))>` — receivers must recompute over the **raw body bytes** and compare in constant time. Redirects are not followed; timeout = `Notifications:Webhook:TimeoutSeconds` (default 10 s); failures are retried by the dispatch worker.

## Audit logging

`AuditLoggingMiddleware` (IAM) records, asynchronously through a bounded in-memory queue (10,000 entries; entries are **dropped** when full) and batch persistence:

- every non-GET request by an authenticated user,
- every `401`/`403` response,
- every authentication-endpoint call and report downloads.

Not logged: successful Edge-key traffic, successful reads (unless `Audit:IncludeReads=true`), CORS preflights, `/health`, docs, realtime hub traffic.

Entry shape (`AuditLogEntryResponse`): `id`, `userId`, `storeId`, `action`, `resource`, `httpMethod`, `path`, `statusCode`, `status`, `ipAddress`, `timestampUtc`. Read it with `GET /api/v1/stores/{storeId}/audit-logs?from&to&action&status&operatorId&resource&page&pageSize` (default `pageSize=50`; envelope `{items,page,pageSize,hasMore}`); store owner only.

## Secrets & configuration the frontend must never contain

`TokenSettings:Secret`, `EdgeApi:ApiKey`, `Stripe:SecretKey`/`WebhookSecret`, `Cloudinary:ApiSecret`, AI provider keys, SMTP and SMS credentials. The only third-party values meant for the browser are the **Stripe publishable key** (`Stripe:PublishableKey`) and the per-upload Cloudinary signature returned by the API.

## Known security-relevant behaviours

See [`../diagnostics/KNOWN_LIMITATIONS.md`](../diagnostics/KNOWN_LIMITATIONS.md) (shared edge key, proxy-header trust, `GET /users/{id}` self-only, etc.).
