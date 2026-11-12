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
  detail: string;        // human-readable, specific message (English, free-form)
  instance: string;      // request path, e.g. "/api/v1/stores/st-123/alerts"
  traceId: string;       // W3C trace id; quote it when reporting a problem
  errors?: Record<string, string[]>; // only for validation failures (400)
  [extension: string]: unknown;      // extra data kept from a domain response (see §3)
}
```

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "Resource not found.",
  "instance": "/api/v1/stores/st-123/alerts/alert-9",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00"
}
```

### Where it is produced

| Source | Mechanism (code) |
|---|---|
| Controller results (`BadRequest`, `NotFound`, `Conflict`, `StatusCode(403)`, `Unauthorized()`, results of authorization filters…) | Global `ProblemDetailsResultFilter` (`Shared/Infrastructure/Interfaces/ASP/ErrorHandling`) rewrites every result with status ≥ 400. |
| Automatic model validation (`[ApiController]`) | `ValidationProblemDetails` enriched with `instance` and `traceId` (`AddProblemDetails().CustomizeProblemDetails`). |
| Unhandled exceptions | `GlobalExceptionHandler` (`IExceptionHandler`): see §2 for the mapping; `500` never exposes internals. |
| IAM request-authorization middleware (missing/invalid token, deleted user, inactive account) | Writes the envelope directly (was `text/plain`). |
| JWT bearer challenge / forbid (`[Microsoft.AspNetCore.Authorization.Authorize]`, `Forbid()`) | `JwtBearerEvents.OnChallenge` / `OnForbidden`. `401` also carries `WWW-Authenticate: Bearer`. |
| Anything else that ends without a body (rate limiter `429`, unknown route `404`, `405`, Stripe webhook `502/503`) | `UseStatusCodePages` fills in the envelope. |

### Client strategy (Angular)

```ts
export interface ApiError { status: number; title: string; detail: string; traceId?: string; fields?: Record<string, string[]>; raw: ProblemDetailsResponse; }

export function toApiError(err: HttpErrorResponse): ApiError {
  const p = (err.error ?? {}) as ProblemDetailsResponse;
  return {
    status: err.status,
    title: p.title ?? err.statusText,
    detail: p.detail ?? p.title ?? err.message,
    traceId: p.traceId,
    fields: p.errors,
    raw: p,
  };
}
```

Branch on `status` first; show `detail`; map `errors` keys onto form controls. Never parse `detail` for logic (it is
English free text and may change). A status-`0` `HttpErrorResponse` (network/CORS) has no body.

## 2. Status-code catalog

| Status | Meaning in this API | `detail` examples | Where |
|---|---|---|---|
| **400** | Invalid input, invalid pagination/date range, domain validation, unsupported format, `ArgumentException`/`InvalidIdException` | `granularity must be hourly or daily.` / validation (`errors` present) | Everywhere |
| **401** | No/invalid/expired access token; account of the token deleted; invalid refresh token; wrong credentials; invalid Edge API key | `A valid access token is required.`, `The access token is invalid or has expired.`, `Invalid username or password` | Everywhere except public routes |
| **403** | Account not active; access role not allowed; no eligible profile; edge device not allow-listed; `UnauthorizedAccessException` (e.g. caller is not a technician) | `The account is not active.`, `Your access role does not allow this action.` | Role-gated and ownership routes |
| **404** | Not found — **also** when the resource belongs to someone else (deliberate non-disclosure); unknown route | `Resource not found.` | Owner-scoped routes |
| **409** | Duplicate or illegal state transition; optimistic-concurrency conflict (`DbUpdateConcurrencyException`); `Idempotency-Key` still being processed | `Device serial number already exists.` | Assets, Planning, Profiles, Store management, idempotent POSTs |
| **422** | Business precondition failed (completing an execution without evidence; matching could not assign); `Idempotency-Key` reused with another payload | `No candidates available…` (+ `assigned`, `requestId` extensions on matching) | Monitoring complete, matching execute, idempotent POSTs |
| **429** | Per-IP limit on `POST /contact-requests` (5 per 10 min) or per-email daily limit | `Too many requests. Please try again later.` | Public contact form |
| **500** | Unexpected error, or required server configuration absent (e.g. `EdgeApi:ApiKey`) | `An unexpected error occurred.` | Any |
| **502** | Payment provider (Stripe) failure while processing a webhook | `An upstream provider failed.` | Stripe webhook |
| **503** | AI provider unavailable (device onboarding) or Stripe webhook secret not configured | `The service is temporarily unavailable.` | Profiles device onboarding, Stripe webhook |

### Exception mapping of `GlobalExceptionHandler` (exceptions no controller caught)

| Exception | Status |
|---|---|
| `BadHttpRequestException` | its own status (400/413…) |
| `KeyNotFoundException` | 404 |
| `ArgumentException` (incl. `ArgumentNullException`, `ArgumentOutOfRangeException`), `InvalidIdException` | 400 |
| `UnauthorizedAccessException` | 403 |
| `DbUpdateConcurrencyException` | 409 |
| client disconnected (`OperationCanceledException` on an aborted request) | nothing written |
| anything else | 500 (logged with the trace id) |

## 3. Domain error vocabulary

There are no numeric/machine error codes: the domain message becomes `detail`, with the status shown below.

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
| `InactiveAccountException` on sign-in/refresh/refresh-claims | 403 |
| Invalid, expired or **reused** refresh token | 401 |
| Public sign-up with a role other than `User`, passwords mismatch, email already in use, weak password | 400 |
| Reset token invalid/expired/used; password policy violation | 400 |
| `forgot-password` | **always 200** (does not reveal whether the email exists) |

## 4. Examples

Concrete payloads are in [`examples/`](./examples) (the `_description`, `_status` and `_contentType` members are
annotations, not part of the body):

- [`400-bad-request.json`](./examples/400-bad-request.json) and [`400-validation-problem.json`](./examples/400-validation-problem.json)
- [`401-unauthorized.json`](./examples/401-unauthorized.json)
- [`403-forbidden.json`](./examples/403-forbidden.json)
- [`404-not-found.json`](./examples/404-not-found.json)
- [`409-conflict.json`](./examples/409-conflict.json)
- [`422-unprocessable.json`](./examples/422-unprocessable.json)
- [`429-too-many-requests.json`](./examples/429-too-many-requests.json)
