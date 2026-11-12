# Authentication

## Mechanisms in use

| Mechanism | Used by | Header / transport |
|---|---|---|
| **Bearer JWT (HS256)** | All human clients (web app, kitchen panel UI, mobile) | `Authorization: Bearer <accessToken>` |
| **Opaque refresh token** (rotating) | Session renewal | JSON body of `POST /api/v1/auth/refresh` |
| **Edge API key** | Edge/gateway firmware and server-to-server calls (`/api/v1/iot/edge/*`, `/api/v1/alerts/dispatch`, `GET /iot/devices/{id}/relay/history`) | `X-Api-Key: <EdgeApi:ApiKey>` (constant-time comparison) |
| **Stripe signature** | Stripe → `POST /api/v1/webhooks/stripe` | `Stripe-Signature` |
| **SignalR access token** | Browser WebSocket upgrade to `/hubs/*` | query string `?access_token=<jwt>` (only accepted on paths starting with `/hubs`) |

There is no session cookie, no OAuth/OIDC provider and no social login in this codebase. CORS is configured `AllowCredentials`, but nothing relies on cookies.

## Token lifetimes (`appsettings.json → TokenSettings`)

| Setting | Default | Meaning |
|---|---|---|
| `AccessTokenMinutes` | **20** | Access-token lifetime. Validation uses `ClockSkew = 0` — a token is rejected the second it expires. |
| `RefreshTokenDays` | **14** | Refresh-token lifetime. |
| `Issuer` / `Audience` | `electrolink-api` / `electrolink-clients` | Validated on every request. |
| `Secret` | *(environment variable `TokenSettings__Secret`, ≥ 32 chars)* | Startup fails if missing. |

## Access-token claims

The JWT is created by `TokenService.GenerateToken`. Payload claims (before a profile exists only the first four are present):

| Claim | Value |
|---|---|
| user id (`ClaimTypes.NameIdentifier`) | IAM user id, `us-…`. **Not** a profile id. |
| email (`ClaimTypes.Email`) | user email |
| role (`ClaimTypes.Role`) and `access_role` | `AccessRole`: `User` \| `Admin` \| `SuperAdmin` \| `Maker` \| `FieldManager` |
| `profileId` | `prof-…` (after profile completion) |
| `profileStatus` | `Incomplete` \| `Active` \| … |
| `businessRole` | `Technician` \| `HomeOwner` \| `Company` |
| `roleSubjectId` | `tech-…` \| `ho-…` \| `comp-…` — the technician/homeowner/company id used in owner-scoped routes |
| `subscriptionTier` | tier string (`FREE` when unknown) |
| `iss`, `aud`, `exp`, `nbf`/`iat` | standard |

> The profile-derived claims are written at token issue time, but the server no longer trusts that snapshot: `CurrentClaimsTransformation` (`IClaimsTransformation`) replaces `role`/`access_role`, `profileId`, `profileStatus`, `businessRole`, `roleSubjectId` and `subscriptionTier` with the current values from IAM and Profiles on each request (cached per user for up to 30 s). Endpoints that change them for the caller — `POST /profiles/me/complete/*`, `POST /profiles/me/deactivate`, `POST /profiles/me/reactivate`, `POST /subscriptions/me/cancel` — evict that cache and return a fresh access token in the `X-Refreshed-Token` response header; store it in place of the old access token. `POST /api/v1/auth/refresh-claims` still exists but is optional.

Clients must treat the JWT as opaque for authorization decisions; the server re-loads the user on every request (see below). Decoding it client-side to route the UI (role, businessRole, profileStatus) is fine.

## Request authorization pipeline

1. `UseAuthentication()` validates signature/issuer/audience/lifetime.
2. `UseAuditLogging()` (before authorization so 401/403 are audited).
3. `RequestAuthorizationMiddleware` (IAM):
   - Endpoints marked with the IAM `[AllowAnonymous]` skip authentication (sign-in, sign-up, refresh, forgot/reset password, contact requests, Stripe webhook, `/health`, OpenAPI, Scalar).
   - If the endpoint carries `AllowEdgeApiKey` (incl. `RequireEdgeApiKey`) **and** `X-Api-Key` is present and valid → request proceeds as *machine* (no user).
   - Otherwise a Bearer token is required (`?access_token=` for `/hubs/*`). Failures: `401` with the standard error envelope (`detail`: `A valid access token is required.` / `The access token is invalid or has expired.` / `The account of this access token no longer exists.`).
   - The user is re-loaded from the database; `status != Active` → `403` (`detail`: `The account is not active.`) (a valid token does **not** keep a suspended account working).
4. Attribute filters: IAM `[Authorize]` (401 if no user), `[RequireAccessRole(...)]` (403 if role not listed). JWT challenge/forbid (`[Microsoft.AspNetCore.Authorization.Authorize]`, `Forbid()`) answer through `JwtBearerEvents.OnChallenge`/`OnForbidden` with the same envelope (401 adds `WWW-Authenticate: Bearer`). Store-management, alerts, analytics and audit routes additionally require a **human** user (an Edge key alone gets 401).

## Flows

### Sign-up → profile → claims

1. `POST /api/v1/auth/sign-up` `{ email, password, passwordConfirmation, role: "User" }` → `201 AuthenticatedUserResponse { userId, email, token, refreshToken }`. Only `role: "User"` is accepted publicly (others → 400). Password length 8–128.
2. `POST /api/v1/profiles/me/complete/{technician|homeowner|company}` creates the business profile (201).
3. Read the `X-Refreshed-Token` header of step 2 and replace the access token (it contains `profileId`, `businessRole`, `roleSubjectId`, `subscriptionTier`). `POST /api/v1/auth/refresh-claims` → `{ token }` returns the same token on demand.

### Sign-in

`POST /api/v1/auth/sign-in` `{ email, password }` → `200 AuthenticatedUserResponse`. Failure → `401` (`{ message, error }`); inactive account → `403 { message }`. There is no lockout/captcha in code; do not expose whether the email exists (the error text is generic: "Invalid username or password").

### Refresh and rotation

`POST /api/v1/auth/refresh` `{ "refreshToken": "<current>" }` → `200 AuthenticatedUserResponse` containing a **new access token and a new refresh token**. The old refresh token is single-use:

- Refresh tokens are stored **hashed** server-side.
- Presenting an already-used token is treated as **reuse detection** (`Refresh token reuse detected`) → `401`; discard the session and send the user to sign-in.
- Expired token → `401`. Inactive account → `403`.

Recommended client behaviour: refresh proactively ~60 s before `exp`, serialize refreshes (single-flight; two parallel refreshes with the same token will make the second look like reuse), and on any 401 from refresh clear local state.

### Change password (signed in)

`PUT /api/v1/users/{id}/password` `{ currentPassword, newPassword }` — `id` must be the caller's own user id (403 otherwise). Wrong current password → 400.

### Password recovery

Two equivalent route pairs exist (`/auth/forgot-password|reset-password` and `/auth/forgot-password|reset-password`); use either.

1. `POST …/forgot-password` `{ email }` → **always `200`** `{ message: "If the email exists, a reset link has been sent." }` (no account enumeration).
2. The server emails a link built from `PasswordReset:FrontendUrl` (default `http://localhost:4200`) containing a **single-use reset token valid for 15 minutes**. If SMTP is not configured the email is only written to the server log (see [`../integrations/smtp-email.md`](../integrations/smtp-email.md)).
3. `POST …/reset-password` `{ resetToken, newPassword, newPasswordConfirmation }` → `200 { message: "Password reset successfully." }`. Invalid/expired/used token or password policy violation → `400`. A successful reset **ends every active session** (refresh tokens revoked) — the user must sign in again.

### Staff accounts

`POST /api/v1/staff-users` (Admin/SuperAdmin) creates users with role `Maker`, `Admin` or `FieldManager` (and the `staff-members` profile endpoints attach zone/IoT certification).

## Machine credentials

Edge devices/gateways authenticate with the shared `EdgeApi:ApiKey` in `X-Api-Key`. Additionally:

- Readings for devices bound to a store equipment require the device id to be in `EdgeApi:EquipmentReadings:AllowedDeviceIds`; relay history requires `EdgeApi:RelayHistory:AllowedDeviceIds`. Empty list ⇒ `403` (fail-closed; the API logs a warning at startup).
- The key is global: it authenticates the channel, not an individual gateway. Browsers must **never** ship it.
