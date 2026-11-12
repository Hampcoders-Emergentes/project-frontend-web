# Subscriptions & Payments — endpoints

Subscription state, checkout, cancellation, billing portal, payment history, public demo/contact requests and the Stripe webhook.

> **Conventions for every endpoint on this page**
> - Base path `/api/v1`. Route segments are lower-case kebab-case; JSON property names are camelCase.
> - Unless the *Auth* line says *Public* or *Edge API key*, send `Authorization: Bearer <accessToken>`. A missing, invalid or expired token yields **401** and a suspended or unverified account yields **403**, both with the standard error envelope.
> - Every error (4xx/5xx) uses one RFC 7807 envelope, `application/problem+json`: `{ type, title, status, detail, instance, traceId, errors? }` (`errors` only on validation failures). See [`../../errors/error-contract.md`](../../errors/error-contract.md).
> - Enums are JSON strings (member names). Paginated lists take `?page=1&pageSize=20` (max 100) and return `PagedResponse<T>` = `{ items, page, pageSize, totalCount, totalPages, hasMore }`.
> - Payload type names (`*Request` / `*Response`) are defined in [`../../schemas/requests.ts`](../../schemas/requests.ts) and [`../../schemas/responses.ts`](../../schemas/responses.ts). JSON samples below are illustrative values with the exact property names and shapes the server uses.
> - "Owner-scoped" routes (`technicianId`, `ownerId`, `homeownerId`, `storeId`...) are checked against the caller's identity server-side; a mismatch returns **404** (`detail`: `Resource not found.`) (or **403** when the caller has no eligible profile).

## Index

| Method | URI | Summary | Auth |
|---|---|---|---|
| `POST` | `/api/v1/contact-requests` | Submit (contact requests) | Public (no credentials) |
| `GET` | `/api/v1/contact-requests/{requestId}` | Check a demo request receipt | Public (no credentials) |
| `GET` | `/api/v1/contact-requests` | List demo leads | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `GET` | `/api/v1/subscriptions/me` | Get my subscription (subscriptions me) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/subscriptions/me/eligibility` | Get request eligibility (me eligibility) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/subscriptions/me/payment-history` | Get payment history (me payment history) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/subscriptions/me/status-alert` | Get status alert (me status alert) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/subscriptions/checkout` | Initiate checkout (subscriptions checkout) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/subscriptions/me/cancel` | Cancel subscription (me cancel) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/subscriptions/me/portal` | Open customer portal (me portal) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/webhooks/stripe` | Handle (webhooks stripe) | Public (no credentials) |

## `POST /api/v1/contact-requests`

**Submit (contact requests)**

- **Auth:** Public (no credentials) · rate limited to 5 requests per IP per 10 minutes (this action only)
- **Source:** `ContactRequestsController.Submit`
- **Idempotency:** optional `Idempotency-Key` header (scoped by client IP for anonymous callers).
- **Location:** `/api/v1/contact-requests/{requestId}`

**Request body** — `SubmitContactRequestRequest` (`application/json`)

```json
{
  "name": "Main kitchen",
  "company": "string",
  "email": "jane.doe@example.com",
  "phone": "+51987654321",
  "message": "Operation completed."
}
```

**Success response** — `202` · `ContactRequestReceiptResponse`

```json
{
  "requestId": "contact-5e6f7a8b9c0d4e1f2a3b4c5d6e7f8a9b",
  "status": "RECEIVED",
  "receivedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `202` Accepted
- `400` Bad request: validation/model-binding or domain rule violated
- `429` Rate limit exceeded (per IP, or `MaxRequestsPerEmailPerDay` for the email)

## `GET /api/v1/contact-requests/{requestId}`

**Check a demo request receipt**

- **Auth:** Public (no credentials). The id is the unguessable `requestId` returned on submission.
- **Source:** `ContactRequestsController.GetStatus`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Success response** — `200` · `ContactRequestStatusResponse` (no personal data)

```json
{
  "id": "contact-5e6f7a8b9c0d4e1f2a3b4c5d6e7f8a9b",
  "status": "NOTIFIED",
  "submittedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `404` Resource not found

## `GET /api/v1/contact-requests`

**List demo leads (newest first)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin` (there is no dedicated sales role)
- **Source:** `ContactRequestsController.List`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `status` | `string?` | optional — `RECEIVED` or `NOTIFIED` |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ContactRequestResponse>`

```json
{
  "items": [
    {
      "id": "contact-5e6f7a8b9c0d4e1f2a3b4c5d6e7f8a9b",
      "name": "Jane Doe",
      "company": "Acme Foods",
      "email": "jane.doe@example.com",
      "phone": "+51987654321",
      "message": "We would like a demo for 12 stores.",
      "status": "NOTIFIED",
      "submittedAtUtc": "2026-03-14T15:30:00Z",
      "notifiedAtUtc": "2026-03-14T15:30:02Z"
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
- `400` Invalid `status` filter
- `401` Missing, invalid or expired credentials
- `403` Access role is not Admin/SuperAdmin

## `GET /api/v1/subscriptions/me`

**Get my subscription (subscriptions me)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.GetMySubscription`

**Success response** — `200` · `MySubscriptionResponse`

```json
{
  "subscriptionId": "subscription-0001",
  "planType": "Premium",
  "status": "ACTIVE",
  "billingCycle": "Monthly",
  "periodEnd": "string",
  "cancelAtPeriodEnd": true,
  "monthlyRequestsUsed": 3,
  "monthlyRequestsLimit": 3,
  "gracePeriodEndsAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/subscriptions/me/eligibility`

**Get request eligibility (me eligibility)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.GetRequestEligibility`

**Success response** — `200` · `SubscriptionsRequestEligibilityResponse`

```json
{
  "canRequest": true,
  "isPriorityAllowed": true,
  "remainingRequests": 3,
  "planType": "Premium",
  "upgradeRequired": true,
  "upgradePromptMessage": "string"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/subscriptions/me/payment-history`

**Get payment history (me payment history)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.GetPaymentHistory`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `PaymentHistoryResponse`

```json
{
  "page": 1,
  "pageSize": 20,
  "payments": [
    {
      "paymentRecordId": "paymentRecord-0001",
      "stripeInvoiceId": "stripeInvoice-0001",
      "amountDecimal": 120.5,
      "currency": "PEN",
      "status": "SUCCEEDED",
      "processedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/subscriptions/me/status-alert`

**Get status alert (me status alert)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.GetStatusAlert`

**Success response** — `200` · `SubscriptionStatusAlertResponse`

```json
{
  "status": "GRACE_PERIOD",
  "planType": "Premium",
  "gracePeriodEndsAt": "2026-03-14T15:30:00Z",
  "message": "Operation completed.",
  "customerPortalUrl": "https://example.com/customerPortalUrl"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/subscriptions/checkout`

**Initiate checkout (subscriptions checkout)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.InitiateCheckout`

**Request body** — `InitiateCheckoutRequest` (`application/json`)

```json
{
  "planType": "Premium",
  "billingCycle": "Monthly",
  "successUrl": "https://app.example.com/subscription/success",
  "cancelUrl": "https://app.example.com/plans"
}
```

**Success response** — `200` · `CheckoutUrlResponse`

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "session-0001"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/subscriptions/me/cancel`

**Cancel subscription (me cancel)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.CancelSubscription`

**Request body** — `CancelSubscriptionRequest` (`application/json`)

```json
{
  "reason": "Customer request",
  "feedback": "string"
}
```

**Success response** — `200` · `MySubscriptionResponse`

```json
{
  "subscriptionId": "subscription-0001",
  "planType": "Premium",
  "status": "ACTIVE",
  "billingCycle": "Monthly",
  "periodEnd": "string",
  "cancelAtPeriodEnd": true,
  "monthlyRequestsUsed": 3,
  "monthlyRequestsLimit": 3,
  "gracePeriodEndsAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/subscriptions/me/portal`

**Open customer portal (me portal)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `SubscriptionsController.OpenCustomerPortal`

**Request body** — `OpenCustomerPortalRequest` (`application/json`)

```json
{
  "returnUrl": "https://app.example.com/account"
}
```

**Success response** — `200` · `CustomerPortalUrlResponse`

```json
{
  "portalUrl": "https://billing.stripe.com/p/session/..."
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `POST /api/v1/webhooks/stripe`

**Handle (webhooks stripe)**

- **Auth:** Public (no credentials)
- **Source:** `StripeWebhookController.Handle`

**Success response** — `200` OK

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `500` Unexpected server error / missing server configuration
- `502` Upstream payment provider error
- `503` Dependency unavailable or not configured
