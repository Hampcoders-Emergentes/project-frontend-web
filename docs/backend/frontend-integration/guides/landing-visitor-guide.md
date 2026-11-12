# Landing page (visitor) — integration guide

Persona: anonymous visitor. Stories US01–US07. The page is almost entirely static; only three API touch points exist, and none needs credentials.

| Need | API | Notes |
|---|---|---|
| "Request demo" form (US07) | `POST /api/v1/contact-requests` | Public, **rate-limited**; body is strict. |
| Application availability check (US01 scenario 3) | `GET /health` | Anonymous; use it (or a plain HTTP check of the app URL) to decide between the "Access web app" link and the "service unavailable / retry" message. |
| API docs for integrators | `GET /scalar/v1`, `GET /openapi/v1.json` | Not for end users. |

There is **no public pricing/plan endpoint** (US06): keep plan names/prices and the regulatory-compliance evidence as static content.

## Demo request form (US07)

```http
POST /api/v1/contact-requests
Content-Type: application/json

{
  "name": "Jane Doe",
  "company": "Acme Foods SAC",
  "email": "jane.doe@example.com",
  "phone": "+51987654321",
  "message": "We run 3 kitchens and would like a demo."
}
```

| Field | Rule |
|---|---|
| `name` | required, ≤ 120 |
| `company` | required, ≤ 160 |
| `email` | required, valid email, ≤ 254 |
| `phone` | optional, ≤ 30 |
| `message` | required, ≤ 2000 |
| any other property | **rejected with 400** (unmapped members are disallowed) |

Responses: `202 { "requestId", "status", "receivedAtUtc" }` with `Location: /api/v1/contact-requests/{requestId}`; `400` validation (`errors` per field); `429` rate limit (IP: 5 requests / 10 min, or the per-email daily quota) — all errors use the standard envelope. Keep the `requestId`: `GET /api/v1/contact-requests/{requestId}` (public, no personal data) returns `{ id, status: RECEIVED|NOTIFIED, submittedAtUtc }` so the visitor can confirm the receipt later. Send an `Idempotency-Key` header so a double click or a retry does not create two leads. The request is forwarded to the sales inbox configured server-side (`Subscriptions:DemoRequests:SalesInbox`). Add a client-side honeypot/captcha if abuse is a concern — the server has none.

CORS: the landing origin must be listed in `Cors:AllowedOrigins`, or the browser blocks the call before it reaches the API.
