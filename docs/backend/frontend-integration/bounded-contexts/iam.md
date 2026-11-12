# IAM — Identity & Access Management

**Endpoints:** [`../api/iam/endpoints.md`](../api/iam/endpoints.md)

## Responsibilities

Account lifecycle and credentials, JWT issuance, refresh-token rotation, password recovery, role-based access (`AccessRole`), staff account creation, the request-authorization middleware used by *every* context, and the per-store **audit log**.

## Model

| Element | Kind | Notes |
|---|---|---|
| `User` | Aggregate root | `UserId` (`us-…`), `Email` VO (validated), `HashedPassword` VO (BCrypt), `AccessRole`, `EUserStatus`, password-reset secret hash + expiry. |
| `RefreshToken` | Entity (own repository) | Stored **hashed**; single use; has expiry and used/revoked markers (reuse detection). |
| `AuditLogEntry` | Aggregate | Append-only record of authenticated actions (see `security-reference.md`). |
| `PasswordResetToken`, `Email`, `HashedPassword` | Value objects | Reset token valid once, 15 minutes. |

## Rules and invariants

- Public registration creates only `AccessRole.User`; staff roles (`Maker`, `Admin`, `FieldManager`, also `Admin`/`SuperAdmin`) come from `POST /staff-users` (Admin/SuperAdmin only).
- Email unique; password 8–128 chars and confirmation must match.
- Only `Active` users pass the middleware (`Suspended`/`PendingVerification` → 403 even with a valid token). Sign-in of an inactive account → 403 `InactiveAccountException`.
- Refresh rotates the refresh token; reusing a consumed token is rejected (possible theft).
- Password reset: `forgot-password` is non-enumerating (always 200); the reset secret exists only in memory/event and as a hash; a successful reset revokes sessions.
- `GET /users/{id}` returns **only the caller's own user** (any other id → 403, even for Admin). `GET /users` (list) needs Admin/SuperAdmin.
- JWT contains profile-derived claims only after a profile exists; refresh them with `refresh-claims`.

## Events

Published: `UserRegisteredEvent` (→ Profiles), `UserSignedInEvent`, `UserPasswordChangedEvent`, `PasswordResetRequestedEvent` (→ email), `StaffUserCreatedEvent`, `UserAccountActivatedEvent`, `UserAccountSuspendedEvent`. Consumed: none from other contexts (audit logging is middleware-driven).

## Cross-context dependencies

Provides `IIamContextFacade`; its middleware loads users for all contexts; the audit-log query asks StoreManagement (`IStoreAccessFacade`) whether the caller owns the store.
