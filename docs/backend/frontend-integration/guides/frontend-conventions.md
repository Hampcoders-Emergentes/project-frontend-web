# Frontend conventions

Rules shared by every client (web, kitchen panel, mobile). They describe what the server actually does.

## 1. Base URL, headers, content

| Item | Rule |
|---|---|
| Base | `{API_ORIGIN}/api/v1` (Docker: `http://localhost:8080`; Angular dev origin `http://localhost:4200` is whitelisted by default) |
| Auth header | `Authorization: Bearer <accessToken>` on everything except public routes |
| Content | `Content-Type: application/json` for bodies; `multipart/form-data` only for `POST /profiles/me/picture`; send `Accept: application/json` |
| Machine header | `X-Api-Key` — edge devices only, never in a browser |
| Correlation | No request-id header is read or echoed; every error envelope carries `traceId` — log it and show it in support dialogs |
| Casing | Request and response properties are **camelCase**; unknown properties are ignored on most bodies but **rejected (400)** on store, alert, analytics, compliance and contact-request bodies |
| Route casing | lowercase kebab-case; one canonical prefix per feature (`/auth/*`, `/iot-devices/*`) — copy routes from `api/endpoint-inventory.md` |
| Readable response headers | `Location` (creations), `X-Refreshed-Token` (see §10), `Idempotent-Replayed` (see §12) — exposed through CORS |

## 2. Identifiers

IDs are **opaque strings**. Never parse them, never assume numeric. Known prefixes (useful for debugging and client-side sanity checks):

| Id | Format |
|---|---|
| user | `us-…` (the JWT user id; **not** a profile id) |
| profile | `prof-…` |
| technician / homeowner / company subject (`roleSubjectId`) | `tech-…` / `ho-…` / `comp-…` |
| property | `prop-…` (the installation-property endpoint validates `^prop-[A-Za-z0-9-]+$`) |
| device (Assets) | `dev-…` style ids and unique serial numbers |
| store / area / equipment | `store-<32 hex>` / `area-<32 hex>` / `equipment-<32 hex>` |
| alert | `alert-<64 hex>` for telemetry alerts (stable per reading), other prefixes for manual reports |
| service request / execution / assignment / suggestion / recipe / component / component type | `req-…`, `exec-…`, `asg-…`, `sug-…`, `recipe-…`, `comp-…`, `ctype-…` |
| shift, handover, checklist, certificate, report, signature, pause | `shift-…`, `handover-…`, `checklist-…`, `cert-…`, `ohsreport-…`/report ids, `signature-…`, `pause-…` (prefix + 32 hex) |
| Stripe ids | `cs_…`, `sub_…`, `in_…`, `price_…` (opaque, from Stripe) |
| Subscription id / plan id | GUID |

Some routes accept the literal **`me`** instead of the technician id: `/technicians/me/catalog…` and `/service-executions/technicians/me/assigned|history`. Prefer it — you do not need to decode the JWT.

## 3. Dates and time zones

- **Responses**: ISO 8601; fields ending in `Utc` or typed `DateTime` are UTC (`2026-03-14T15:30:00Z`). `DateOnly` values (e.g. `weekStartDate`, `shiftDate`, daily buckets) are `yyyy-MM-dd` in the **store's tariff time zone** where relevant (`timeZone` is returned by analytics endpoints — default `America/Lima`).
- **Requests** (query & body): send ISO 8601 **with explicit offset** (`2026-03-01T00:00:00-05:00` or `…Z`). A timestamp without offset is rejected on analytics, alerts, measurements and shifts. Encode `+` as `%2B` in query strings (`encodeURIComponent` does this).
- Ranges are half-open `[from, to)`, `from < to`, max **31 days**.
- Display in the user's/store's local zone; store and compare in UTC.
- Some older payloads (Planning `createdAt`, Subscriptions `periodEnd`) are *strings* produced by `.ToString()`/`"O"`; parse with `Date.parse` defensively.

## 4. Numbers and money

JSON numbers; prices/costs are `decimal` (`totalPrice`, `amountPaid`, analytics `cost`) — use a decimal-safe library when summing. Currency is a separate field (`PEN` for store analytics, `Usd|Pen|Eur` for planning recipes). Energy is kWh, power kW, current A, voltage V, frequency Hz. Percentages are 0–100 numbers (`consumedPercentage`) except `minPowerFactor` (0–1).

## 5. Pagination

No list endpoint returns a bare array anymore.

| Style | Where | Shape |
|---|---|---|
| **`PagedResponse<T>`** `{ items, page, pageSize, totalCount, totalPages, hasMore }` | users, staff members, properties, components and component types, iot-devices lists, technician stock items, available services, suggestions, service-execution lists, property anomalies, maintenance certificates, OHS reports, shift assignments, contact requests; my-stock (+`availableCount`) | `?page=1&pageSize=20`; `page` ≥ 1, `pageSize` clamped to 1..100 |
| **`HasMorePageResponse<T>`** `{ items, page, pageSize, hasMore }` | store hierarchy lists, alerts, audit logs (default `pageSize` 50), measurements, shift handovers, checklists | same query; no totals: loop while `hasMore` |
| `PaymentHistoryResponse` | `{ page, pageSize, payments[] }` | no `hasMore` |
| Planning queue | `MatchingQueueResponse { priorityQueue, normalQueue, totalPending }` | |

Write one paginator for `{ items, page, pageSize, hasMore }` (both envelopes) and show totals only when `totalCount` is present. Offset paging is not snapshot-consistent — concurrent inserts can shift pages; de-duplicate by `id` when infinite-scrolling.

## 6. Nullability and optional fields

Responses always include every property (`null` for absent values; there is no `omitempty`). In `schemas/responses.ts` `T | null` marks nullable members. Requests: members marked `?` in `requests.ts` are optional (nullable or defaulted). Do not send `null` for non-nullable strings — it triggers a 400 validation error.

## 7. Enums

See [`../api/enums.md`](../api/enums.md). Every enum is a **string**. Casing is fixed per domain: C# enums (IAM, Profiles, Assets, Planning, Monitoring, Processing) use PascalCase member names; store / alert / compliance / subscription vocabularies use UPPER_SNAKE_CASE. Type them as string unions (`schemas/responses.ts`) and build a label lookup per enum.

## 8. Errors

Every error is one `application/problem+json` envelope `{ type, title, status, detail, instance, traceId, errors? }` — 401/403 included. Use the `toApiError` helper in [`../errors/error-contract.md`](../errors/error-contract.md). Standard handling:

| Status | UI behaviour |
|---|---|
| 400 | Show `errors` per field if present, else `detail` |
| 401 | Try one token refresh (single-flight), retry once; on failure sign out |
| 403 | Account inactive / wrong role / no profile → route to profile completion or an "access denied" page; do **not** retry |
| 404 | "Not found" (also "not yours") — never leak whether it exists |
| 409 | Show `detail`; refresh the resource (state changed) |
| 422 | Business rule — show `detail` |
| 429 | Back off; for the contact form tell the user to try later |
| 5xx / network | Retry GETs with exponential back-off (max 3). Retry creation `POST`s only on the endpoints that support `Idempotency-Key`, re-sending the same key (§12) |

## 9. Polling vs push

| Data | Strategy |
|---|---|
| Alerts, panel pause, handovers | **Push via SignalR (`/hubs/alerts`)**, with polling only as a reconnect/fallback (see `integrations/signalr-alerts-hub.md`). |
| Dashboard/grid/risk | Poll 15–30 s (kitchen panel 5–10 s for `alerts/active`) |
| Subscription change after checkout | Poll `/subscriptions/me` every 2 s ≤ 30 s |
| Service request assignment | Poll `/service-requests/{id}` every 3–5 s ≤ 60 s after `confirm`, then fall back to manual refresh |
| Relay command result | Poll `/iot/devices/{id}/relay/history` (2 s, ≤ 30 s) |
| Report generation | Synchronous: the `POST` returns when the file is ready |

Pause polling when the tab is hidden; stop on 401/403.

## 10. Token handling

Keep the access token in memory (not `localStorage`); persist the refresh token in the safest store your platform offers (HTTP-only cookie is not provided by this API). Refresh ~60 s before expiry with a single-flight lock; after `refresh` replace **both** tokens.

**Refreshed access token.** Profile completion (`POST /profiles/me/complete/*`), `POST /profiles/me/deactivate`, `POST /profiles/me/reactivate` and `POST /subscriptions/me/cancel` return a new access token in the **`X-Refreshed-Token`** response header: replace the stored access token with it (the refresh token does not change). An HTTP interceptor can do this for every response that carries the header.

**Stale claims no longer break requests.** The server re-reads the caller's access role and profile claims (`profileId`, `businessRole`, `roleSubjectId`, `subscriptionTier`) from current state on each request (cached for up to 30 s, evicted immediately by the endpoints above). A token issued before a profile completion, a role change by an admin or a Stripe-driven tier change keeps working; `POST /auth/refresh-claims` remains available but is no longer required before calling technician/Monitoring routes.

## 11. File upload/download

See [`../integrations/cloudinary-file-storage.md`](../integrations/cloudinary-file-storage.md) and [`../integrations/report-generation.md`](../integrations/report-generation.md): use `fetch` + `Blob` for authenticated downloads; signature images are base64 PNG strings ≤ 360 000 chars.

## 12. Idempotency and concurrency

- Edge readings are idempotent (by `readingId`).
- **`Idempotency-Key`** (optional header, at most 128 chars) on `POST /iot-devices`, `/staff-users`, `/staff-members`, `/service-requests`, `/contact-requests`, `/stores/{storeId}/compliance/checklists`, `/stores/{storeId}/equipment/{equipmentId}/certificates` and `/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/anomalies`. Generate one UUID per user action and send it on every retry of that action. The first **successful** response is stored for 24 h per (user, route, key) and replayed — same status, body and `Location`, plus `Idempotent-Replayed: true` — without executing the command again. Same key while the first call is still running → 409; same key with a different body → 422; failed attempts are not stored (retry with the same key). Keys live in the API process memory (scale-out needs sticky sessions or a shared cache).
- Other mutations are not idempotent: disable submit buttons while they are in flight.
- Acknowledging an alert twice returns the first acknowledgement (safe).
- No ETags/`If-Match`; last write wins on `PUT` endpoints (thresholds, layout, notification preferences, shutdown protocol, opening hours).
