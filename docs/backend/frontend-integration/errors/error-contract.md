# Error contract

Every error response of the API — any `4xx` or `5xx`, from any layer — has **one shape**: an RFC 7807 problem document
served as `application/problem+json`. There are no plain-text bodies, no empty error bodies and no `{ message }` variants
anymore.

## 1. The envelope

```ts
interface ProblemDetailsResponse {
  type: string;          // RFC 9110 section URI for the status (or "about:blank")
  title: string;         // short, status-level summary: "Not Found", "Conflict"...
  status: number;        // same as the HTTP status
  detail: string;        // human-readable, sanitized message (English, free-form) — display/log only
  instance: string;      // request path, e.g. "/api/v1/stores/st-123/alerts"
  traceId: string;       // W3C trace id; quote it when reporting a problem
  errorCode: string;     // ALWAYS present, stable UPPER_SNAKE_CASE code (see §4) — branch on this
  errors?: Record<string, string[]>;        // validation failures only: field -> list of field CODES
  errorMessages?: Record<string, string[]>; // same keys, original English messages (when the server had text)
  retryAfterSeconds?: number;               // 429 only (same as the Retry-After header)
  [extension: string]: unknown;             // extra data kept from a domain response (see §4)
}
```

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "Resource not found.",
  "instance": "/api/v1/stores/st-123/alerts/alert-9",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
  "errorCode": "RESOURCE_NOT_FOUND"
}
```

### Sanitized `detail`

Every `429` and `503` carries a `Retry-After` header in seconds (the producer's value when it has one, otherwise
60 s for 429 and 30 s for 503), mirrored as `retryAfterSeconds`. `type` stays the RFC section link of the status; there
are no per-error type URIs — the code is in `errorCode`.

`detail` never contains internal representations: value-object `ToString()` output (`Email { Value = a@b.c }` becomes
`a@b.c`), namespaced type names, inner-exception chains or stack traces are stripped at the HTTP boundary
(`ProblemDetailSanitizer`), and it is capped at 500 characters. `5xx` responses always carry the generic text.

### Where it is produced

| Source | Mechanism (code) |
|---|---|
| Controller results (`BadRequest`, `NotFound`, `Conflict`, `StatusCode(403)`, `Unauthorized()`, results of authorization filters…) | Global `ProblemDetailsResultFilter` (`Shared/Infrastructure/Interfaces/ASP/ErrorHandling`) rewrites every result with status ≥ 400. |
| Automatic model validation (`[ApiController]`) | `ValidationProblemDetails` enriched with `instance` and `traceId` (`AddProblemDetails().CustomizeProblemDetails`). |
| Unhandled exceptions | `GlobalExceptionHandler` (`IExceptionHandler`): see §2 for the mapping; `500` never exposes internals. |
| IAM request-authorization middleware (missing/invalid token, deleted user, inactive account) | Writes the envelope directly (was `text/plain`). |
| JWT bearer challenge / forbid (`[Microsoft.AspNetCore.Authorization.Authorize]`, `Forbid()`) | `JwtBearerEvents.OnChallenge` / `OnForbidden`. `401` also carries `WWW-Authenticate: Bearer`. |
| Rate limiter `429` (global `/api` limiter and the contact-form policy) | `RateLimiterOptions.OnRejected`: `Retry-After` header + envelope with `errorCode: "RATE_LIMITED"`. |
| Anything else that ends without a body (unknown route `404`, `405`, Stripe webhook `502/503`) | `UseStatusCodePages` fills in the envelope. |

### Client strategy (Angular)

```ts
export interface ApiError { status: number; code: string; title: string; detail: string; traceId?: string; fields?: Record<string, string[]>; retryAfterSeconds?: number; raw: ProblemDetailsResponse; }

export function toApiError(err: HttpErrorResponse): ApiError {
  const p = (err.error ?? {}) as ProblemDetailsResponse;
  const retryAfter = Number(err.headers?.get('Retry-After'));
  return {
    status: err.status,
    code: p.errorCode ?? (err.status === 0 ? 'NETWORK_ERROR' : 'REQUEST_FAILED'),
    title: p.title ?? err.statusText,
    detail: p.detail ?? p.title ?? err.message,
    traceId: p.traceId,
    fields: p.errors,              // field -> codes, e.g. { email: ['EMAIL_ALREADY_REGISTERED'] }
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : p.retryAfterSeconds,
    raw: p,
  };
}
```

Branch on `errorCode` (then `status`); translate field codes from `errors` onto form controls; show `detail` only as a
fallback. Never parse `detail` for logic (it is English free text and may change). Codes are only ever added: treat an
unknown code like the default code of its status. A status-`0` `HttpErrorResponse` (network/CORS) has no body.

## 2. Status-code catalog

| Status | Meaning in this API | `detail` examples | Where |
|---|---|---|---|
| **400** | Invalid input, invalid pagination/date range, domain validation, unsupported format, `ArgumentException`/`InvalidIdException` | `granularity must be hourly or daily.` / validation (`errors` present) | Everywhere |
| **401** | No/invalid/expired access token; account of the token deleted; invalid refresh token; wrong credentials; invalid Edge API key | `A valid access token is required.`, `The access token is invalid or has expired.`, `Invalid username or password` | Everywhere except public routes |
| **403** | Account not active; access role not allowed; no eligible profile; edge device not allow-listed; `UnauthorizedAccessException` (e.g. caller is not a technician) | `The account is not active.`, `Your access role does not allow this action.` | Role-gated and ownership routes |
| **404** | Not found — **also** when the resource belongs to someone else (deliberate non-disclosure); unknown route | `Resource not found.` | Owner-scoped routes |
| **409** | Duplicate or illegal state transition (`CONFLICT`); optimistic-concurrency conflict (`STALE_STATE`); report already being generated (`REPORT_IN_PROGRESS`); `Idempotency-Key` still being processed | `Device serial number already exists.` | Assets, Planning, Profiles, Store management, reports, idempotent POSTs |
| **422** | Business precondition failed (completing an execution without evidence; matching could not assign); `Idempotency-Key` reused with another payload | `No candidates available…` (+ `assigned`, `requestId` extensions on matching) | Monitoring complete, matching execute, idempotent POSTs |
| **429** | Global `/api` limit (default 300 req/min per user, 60 req/min per IP when anonymous; `RateLimiting:*`), per-IP limit on `POST /contact-requests` (5 per 10 min) or per-email daily limit. Always `Retry-After` (seconds) + `errorCode: "RATE_LIMITED"` | `Too many requests. Please try again later.` | Every `/api` route except edge/webhook routes |
| **500** | Unexpected error, or required server configuration absent (e.g. `EdgeApi:ApiKey`) | `An unexpected error occurred.` | Any |
| **502** | Payment provider (Stripe) failure while processing a webhook | `An upstream provider failed.` | Stripe webhook |
| **503** | AI provider unavailable (device onboarding) or Stripe webhook secret not configured. Always `Retry-After` (default 30 s) + `retryAfterSeconds` | `The service is temporarily unavailable.` | Profiles device onboarding, Stripe webhook |

### Exception mapping of `GlobalExceptionHandler` (exceptions no controller caught)

| Exception | Status |
|---|---|
| `BadHttpRequestException` | its own status (400/413…) |
| `KeyNotFoundException` | 404 |
| `ArgumentException` (incl. `ArgumentNullException`, `ArgumentOutOfRangeException`), `InvalidIdException` | 400 |
| `UnauthorizedAccessException` | 403 |
| `DbUpdateConcurrencyException` | 409 `STALE_STATE` |
| any 4xx-mapped exception implementing `ICodedError` | its own `errorCode` |
| client disconnected (`OperationCanceledException` on an aborted request) | nothing written |
| anything else | 500 (logged with the trace id) |

## 3. Error codes

`errorCode` is present on **every** error response. When nothing more specific applies it is the default code of the
HTTP status; specific situations override it. Field-level `errors` use the field codes below; the original English
text (when there was any) is under `errorMessages` with the same keys.

### Status defaults

| Status | `errorCode` |
|---|---|
| 400 | `VALIDATION_FAILED` |
| 401 | `UNAUTHENTICATED` |
| 403 | `FORBIDDEN` |
| 404 | `RESOURCE_NOT_FOUND` |
| 405 | `METHOD_NOT_ALLOWED` |
| 409 | `CONFLICT` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `BUSINESS_RULE_VIOLATED` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |
| 502 | `UPSTREAM_FAILURE` |
| 503 | `SERVICE_UNAVAILABLE` |
| other 4xx | `REQUEST_FAILED` |

### Specific codes

| `errorCode` | Status | When | `errors` |
|---|---|---|---|
| `EMAIL_ALREADY_REGISTERED` | 400 (kept for backward compatibility; not 409) | `POST /auth/sign-up` or `POST /staff-users` with an email that already has an account | `{ "email": ["EMAIL_ALREADY_REGISTERED"] }` |
| `PASSWORD_REJECTED` | 400 | Password and confirmation differ (sign-up, staff user, reset), reset password outside 8–128 characters | `{ "passwordConfirmation": ["PASSWORDS_DO_NOT_MATCH"] }`, `{ "newPassword": ["PASSWORD_LENGTH"] }`, `{ "newPasswordConfirmation": ["PASSWORDS_DO_NOT_MATCH"] }` |
| `VALIDATION_FAILED` | 400 | Model validation, domain `ArgumentException`, invalid email (`{ "email": ["INVALID_EMAIL"] }`), public sign-up with a staff role (`{ "role": ["ROLE_NOT_ALLOWED"] }`) | when field-specific |
| `ACCOUNT_NOT_ACTIVE` | 403 | Suspended / pending account: on sign-in, refresh, refresh-claims and on any authenticated request (IAM middleware) | — |
| `STORE_NOT_FOUND` | 404 | The store in the route is unknown or not owned by the caller (store hierarchy, alerts, kitchen layout, analytics, audit log). Other missing children of a store keep `RESOURCE_NOT_FOUND`. | — |
| `STALE_STATE` | 409 | Optimistic-concurrency conflict: the resource changed under you (device assignment, installation property, any unhandled `DbUpdateConcurrencyException`). Reload and retry. | — |
| `REPORT_IN_PROGRESS` | 409 | `POST .../analytics/reports` or `POST .../compliance/reports/generate` while the same caller's report for that store is still being generated. Retry when the first call returns. | — |
| `BUSINESS_RULE_VIOLATED` | 422 | Business precondition failed (completing an execution without evidence, matching could not assign, `Idempotency-Key` reused with another payload) | — |
| `RATE_LIMITED` | 429 | Throttled; `Retry-After` header and `retryAfterSeconds` give the wait in seconds | — |

### Field codes (values of `errors`)

| Code | Typical source |
|---|---|
| `REQUIRED` | `[Required]`, empty body |
| `INVALID_FORMAT` | JSON type/format errors, regular expressions |
| `INVALID_EMAIL` | email syntax |
| `TOO_SHORT` / `TOO_LONG` / `OUT_OF_RANGE` | length / range attributes |
| `MISMATCH` | compare attributes |
| `UNKNOWN_MEMBER` | unknown JSON property on a strict request |
| `EMAIL_ALREADY_REGISTERED`, `PASSWORDS_DO_NOT_MATCH`, `PASSWORD_LENGTH`, `ROLE_NOT_ALLOWED` | IAM |
| `INVALID` | anything else |

## 4. Domain error vocabulary

`detail` keeps the (sanitized) domain message, with the status shown below; `errorCode` is the specific code where §3
lists one, otherwise the status default.

When a controller returns a structured error body (for example the matching result
`{ requestId, assigned: false, failureReason }` with 422), its human-readable member becomes `detail` and **every other
member is kept as an extension** on the envelope (`requestId`, `assigned`, …). Sign-in failures that used to send
`{ message, error }` now send the specific cause (`error`) as `detail`.

### Profiles (`DomainExceptionFilter`)

| Exception | Status |
|---|---|
| `UnauthorizedProfileAccessException` | 403 |
| `InvalidProfileStatusException`, `DniAlreadyInUseException`, `TaxIdAlreadyInUseException` | 409 |
| `InvalidPhoneNumberException`, `InvalidDniException`, `InvalidTaxIdException`, `InvalidDateOfBirthException`, `UnderageUserException`, `InvalidServiceAreaException`, `InvalidBusinessRoleException`, `AtLeastOneSpecialtyRequiredException`, `AtLeastOneNotificationChannelRequiredException`, `ArgumentException` | 400 |
| `KeyNotFoundException` | 404 |

### Planning / assets / monitoring / subscriptions (per-controller `catch` blocks)

| Situation | Status |
|---|---|
| Recipe/catalog/request/assignment not found, wrong owner | 404 |
| `DuplicateRecipeNameException`, `RecipeAlreadyActive/Inactive`, `CannotDeactivateRecipeWithInProgressServices`, `CannotCancelAssignedRequest`, `DuplicateAssetException`, device not free stock, `InstallationRequestConflictException`, staff profile already exists | 409 |
| `InvalidPricing`, `InvalidDuration`, `InvalidWarrantyPeriod`, `InvalidQuantity`, `InsufficientStock`, `PriceIncreaseTooLarge`, `PriorityRequiresPremium`, `MonthlyRequestLimitExceeded`/`RequestLimitReached` (403 on request creation/confirm), `PropertyNotSelected`, `RecipeNotSelected` | 400 (or 403 for plan limits) |
| `UnauthorizedCatalogAccess`, `UnauthorizedRequestAccess`, `InactiveHomeowner`, non-owner profile | 403 |
| Execution completion precondition (`complete`) | 422 |

### IAM

| Situation | Status |
|---|---|
| Wrong email/password or any other sign-in failure | 401 |
| `InactiveAccountException` on sign-in/refresh/refresh-claims | 403 `ACCOUNT_NOT_ACTIVE` |
| Invalid, expired or **reused** refresh token | 401 |
| Public sign-up with a role other than `User` (`VALIDATION_FAILED`), passwords mismatch (`PASSWORD_REJECTED`), email already in use (`EMAIL_ALREADY_REGISTERED`), invalid email (`VALIDATION_FAILED`) | 400 |
| Reset token invalid/expired/used (`VALIDATION_FAILED`); password policy violation (`PASSWORD_REJECTED`) | 400 |
| `forgot-password` | **always 200** (does not reveal whether the email exists) |

## 5. Examples

Concrete payloads are in [`examples/`](./examples) (the `_description`, `_status` and `_contentType` members are
annotations, not part of the body):

- [`400-bad-request.json`](./examples/400-bad-request.json) and [`400-validation-problem.json`](./examples/400-validation-problem.json)
- [`401-unauthorized.json`](./examples/401-unauthorized.json)
- [`403-forbidden.json`](./examples/403-forbidden.json)
- [`404-not-found.json`](./examples/404-not-found.json)
- [`409-conflict.json`](./examples/409-conflict.json)
- [`422-unprocessable.json`](./examples/422-unprocessable.json)
- [`429-too-many-requests.json`](./examples/429-too-many-requests.json)
- [`400-email-already-registered.json`](./examples/400-email-already-registered.json)
- [`409-report-in-progress.json`](./examples/409-report-in-progress.json)
