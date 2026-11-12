# IAM (Identity & Access Management) — endpoints

Authentication, token refresh, password lifecycle, user administration, staff account creation and the per-store audit log.

> **Conventions for every endpoint on this page**
> - Base path `/api/v1`. Route segments are lower-case kebab-case; JSON property names are camelCase.
> - Unless the *Auth* line says *Public* or *Edge API key*, send `Authorization: Bearer <accessToken>`. A missing, invalid or expired token yields **401** and a suspended or unverified account yields **403**, both with the standard error envelope.
> - Every error (4xx/5xx) uses one RFC 7807 envelope, `application/problem+json`: `{ type, title, status, detail, instance, traceId, errors? }` (`errors` only on validation failures). See [`../../errors/error-contract.md`](../../errors/error-contract.md).
> - Enums are JSON strings (member names). Paginated lists take `?page=1&pageSize=20` (max 100) and return `PagedResponse<T>` = `{ items, page, pageSize, totalCount, totalPages, hasMore }`.
> - Payload type names (`*Request` / `*Response`) are defined in [`../../schemas/requests.ts`](../../schemas/requests.ts) and [`../../schemas/responses.ts`](../../schemas/responses.ts). JSON samples below are illustrative values with the exact property names and shapes the server uses.
> - "Owner-scoped" routes (`technicianId`, `ownerId`, `homeownerId`, `storeId`...) are checked against the caller's identity server-side; a mismatch returns **404** (`detail`: `Resource not found.`) (or **403** when the caller has no eligible profile).

> **Route prefix:** authentication and password recovery live under the canonical `/api/v1/auth/*`. The former
> `/api/v1/authentication/*` routes still answer identically (backward-compatible alias, hidden from OpenAPI) — do not use
> them in new code. The separate `/auth/forgot-password` / `/auth/reset-password` controller was merged into this one.

## Index

| Method | URI | Summary | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/sign-in` | Sign in | Public (no credentials) |
| `POST` | `/api/v1/auth/sign-up` | Sign-up | Public (no credentials) |
| `POST` | `/api/v1/auth/refresh` | Refresh session | Public (no credentials) |
| `POST` | `/api/v1/auth/refresh-claims` | Refresh Claims | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset | Public (no credentials) |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token | Public (no credentials) |
| `POST` | `/api/v1/staff-users` | Create a staff user | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `GET` | `/api/v1/stores/{storeId}/audit-logs` | List (stores audit logs) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/users/{id}` | Get a user by its id | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/users` | Get all users | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `PUT` | `/api/v1/users/{id}/password` | Update a user's password | Bearer JWT (authenticated human user) |

## `POST /api/v1/auth/sign-in`

**Sign in**

- **Auth:** Public (no credentials)
- **Source:** `AuthenticationController.SignIn`

**Request body** — `SignInRequest` (`application/json`)

```json
{
  "email": "jane.doe@example.com",
  "password": "S3cure-passw0rd!"
}
```

**Success response** — `200` · `AuthenticatedUserResponse`

```json
{
  "userId": "us-7f3c9e12",
  "email": "jane.doe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>",
  "refreshToken": "rt_Zk3v...opaque-value..."
}
```

**Status codes**

- `200` OK
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/auth/sign-up`

**Sign-up**

- **Auth:** Public (no credentials)
- **Source:** `AuthenticationController.SignUp`

**Request body** — `SignUpRequest` (`application/json`)

```json
{
  "email": "jane.doe@example.com",
  "password": "S3cure-passw0rd!",
  "passwordConfirmation": "S3cure-passw0rd!",
  "role": "User"
}
```

**Success response** — `201` · `AuthenticatedUserResponse`

```json
{
  "userId": "us-7f3c9e12",
  "email": "jane.doe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>",
  "refreshToken": "rt_Zk3v...opaque-value..."
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated

## `POST /api/v1/auth/refresh`

**Refresh session**

- **Auth:** Public (no credentials)
- **Source:** `AuthenticationController.Refresh`

**Request body** — `RefreshTokenRequest` (`application/json`)

```json
{
  "refreshToken": "rt_Zk3v...opaque-value..."
}
```

**Success response** — `200` · `AuthenticatedUserResponse`

```json
{
  "userId": "us-7f3c9e12",
  "email": "jane.doe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>",
  "refreshToken": "rt_Zk3v...opaque-value..."
}
```

**Status codes**

- `200` OK
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/auth/refresh-claims`

**Refresh Claims**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `AuthenticationController.RefreshClaims`

**Success response** — `200` · `RefreshedTokenResponse`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/auth/forgot-password`

**Request password reset**

- **Auth:** Public (no credentials)
- **Source:** `AuthenticationController.ForgotPassword`

**Request body** — `RequestPasswordResetRequest` (`application/json`)

```json
{
  "email": "jane.doe@example.com"
}
```

**Success response** — `200` · `MessageResponse`

```json
{
  "message": "Operation completed."
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated

## `POST /api/v1/auth/reset-password`

**Reset password with token**

- **Auth:** Public (no credentials)
- **Source:** `AuthenticationController.ResetPassword`

**Request body** — `ResetPasswordRequest` (`application/json`)

```json
{
  "resetToken": "<token-from-email-link>",
  "newPassword": "N3w-passw0rd!",
  "newPasswordConfirmation": "N3w-passw0rd!"
}
```

**Success response** — `200` · `MessageResponse`

```json
{
  "message": "Operation completed."
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated

## `POST /api/v1/staff-users`

**Create a staff user**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffUsersController.CreateStaffUser`
- **Idempotency:** optional `Idempotency-Key` header (see [`../../guides/frontend-conventions.md`](../../guides/frontend-conventions.md)).
- **Location:** `/api/v1/users/{userId}`

**Request body** — `CreateStaffUserRequest` (`application/json`)

```json
{
  "email": "jane.doe@example.com",
  "password": "S3cure-passw0rd!",
  "passwordConfirmation": "S3cure-passw0rd!",
  "accessRole": "Maker",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321"
}
```

**Success response** — `201` · `StaffUserResponse`

```json
{
  "userId": "us-7f3c9e12",
  "email": "jane.doe@example.com",
  "accessRole": "Maker"
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/stores/{storeId}/audit-logs`

**List (stores audit logs)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreAuditLogsController.List`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `from` | `string?` | `null` |
| `to` | `string?` | `null` |
| `action` | `string?` | `null` |
| `status` | `string?` | `null` |
| `page` | `int` | `1` |
| `pageSize` | `int` | `50` |
| `operatorId` | `string?` | `null` |
| `resource` | `string?` | `null` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `AuditLogPageResponse`

```json
{
  "items": [
    {
      "id": 15,
      "userId": "us-7f3c9e12",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "action": "string",
      "resource": "string",
      "httpMethod": "string",
      "path": "string",
      "statusCode": 15,
      "status": "ACTIVE",
      "ipAddress": "string",
      "timestampUtc": "2026-03-14T15:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/users/{id}`

**Get a user by its id**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `UsersController.GetUserById`
- **Access:** the caller's own account, **or any account when the caller's current access role is `Admin` or `SuperAdmin`** (read from the account, not from the token). Otherwise **403**.

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `200` · `UserResponse`

```json
{
  "id": "id-3a4b5c6d",
  "email": "jane.doe@example.com",
  "role": "User"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/users`

**Get all users**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `UsersController.GetAllUsers`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<UserResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "email": "jane.doe@example.com",
      "role": "User"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "hasMore": false
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/users/{id}/password`

**Update a user's password**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `UsersController.UpdatePassword`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Request body** — `UpdatePasswordRequest` (`application/json`)

```json
{
  "currentPassword": "S3cure-passw0rd!",
  "newPassword": "N3w-passw0rd!"
}
```

**Success response** — `200` · `MessageResponse`

```json
{
  "message": "Operation completed."
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
