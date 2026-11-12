# ElectroLink Web Frontend Architecture

Layering and dependency rules are normative in `.claude/rules/architecture.md`. This document covers runtime flows and client state conventions for the store-manager web app. API behaviour is documented in `docs/backend/frontend-integration/` (start with `guides/web-store-manager-guide.md` and `guides/frontend-conventions.md`).

## Layer summary

| Layer | Owns | Examples |
|---|---|---|
| `domain/` | Entities, value objects, enums, domain errors, pure validation and transition rules | `Store`, `Area`, `Equipment`, `ElectricalThreshold`, `RiskLevel`, `Alert`, `AlertStatus`, `ShiftAssignment`, `ChecklistItem`, `MaintenanceCertificate`, `ComplianceGrade`, `NotificationRoute` |
| `application/` | Contracts, ports, use cases, stores | `CreateStoreUseCase`, `UpdateEquipmentThresholdUseCase`, `BindEquipmentDeviceUseCase`, `GetStoreDashboardSummaryUseCase`, `AcknowledgeAlertUseCase`, `CompareEnergyPeriodsUseCase`, `SubmitComplianceChecklistUseCase`, `GenerateOhsReportUseCase`, `GetStoreAuditLogUseCase` |
| `infrastructure/` | HTTP and SignalR adapters, resource DTOs, assemblers, storage, interceptors, provider wiring | maps transport data into domain/application models and backend errors into safe application errors |
| `presentation/` | Routes, views, components, forms, view models, interaction logic | reads stores and application contracts only |

## Contexts

`iam`, `stores`, `monitoring`, `alerts`, `analytics`, `compliance`, `notifications`, `audit` (see `CLAUDE.md`). `shared` holds only context-agnostic code (HTTP base, error normalisation, paging, date serialisation, realtime connection manager, UI primitives, shell).

Cross-context needs go through narrow ports and facades (`.claude/rules/bounded-contexts.md`). Typical cases:

| Consumer | Needs | Provided by |
|---|---|---|
| `monitoring`, `alerts`, `analytics`, `compliance`, `notifications`, `audit` | Active store id, equipment names for display | `stores` facade behind a consumer-owned port; `storeId` still comes from the route |
| `alerts` | On-duty worker display | `stores` facade (shift roster) |
| every context | Is the session authenticated and active | IAM `SessionAccessPort` |

## Session bootstrap

```text
App start -> restore session (refresh token) -> resolves?
  no  -> sign-in (public)
  yes -> GET /stores?page=1&pageSize=100
         0 stores  -> onboarding (create store)
         1 store   -> navigate to /stores/:storeId/dashboard
         n stores  -> store switcher
```

- Route guards wait for session restoration before deciding; no store data loads before that.
- Access token lives in memory only. The refresh token is persisted through the IAM storage adapter (the API provides no HTTP-only cookie). Refresh about 60 s before expiry with a single-flight lock (`ClockSkew = 0`); each refresh replaces **both** tokens. A second parallel refresh with the same token looks like reuse and ends the session.
- A `401` from refresh clears local state and goes to sign-in. A `403` means the account is not `Active`: show access denied, do not retry.
- A successful password reset ends every session; the user signs in again.
- Switching stores clears every store-keyed cache and signal, calls `LeaveStore` for the old store, and `JoinStore` for the new one.

## Standard read flow

```text
Lazy route -> View (reads :storeId) -> Store -> Use case -> Application port
  -> Infrastructure adapter -> HTTP -> Assembler
  -> Domain/application model -> Store signal update -> Template render
```

## Standard mutation flow

```text
User interaction -> Typed reactive form or component event -> Store action
  -> Use case -> Application port -> Infrastructure adapter -> Backend API
  -> Result/error mapping -> Store state update -> Translated UI feedback
```

- Disable submit controls while `submitting`. Mutations are not retried automatically.
- Checklist save/submit and certificate create send an `Idempotency-Key` generated once per user action and reused only when that same action is retried. `409` with the same key means the first call is still running; `422` means the key was reused with a different body.
- `PUT` endpoints (thresholds, shutdown protocol, layout, notification preferences, opening hours, budget) are last-write-wins with no ETag: send the full body, reload after save.
- Equipment-sensor binding is permanent: confirm in a dialog before submitting; no unbind action.

## Store state

Stores expose UI-ready readonly signals and delegate asynchronous work to use cases.

Recommended shape: `data`, `selectedItem`, `loading`, `submitting`, `error`, `lastUpdatedAt`, plus `stale` where data can age. Derived values use `computed()`; writes use `set()`/`update()`. Store-scoped state is keyed by `storeId`.

## Error handling

| Layer | Responsibility |
|---|---|
| Infrastructure | Map `HttpErrorResponse`, SignalR and SDK errors into `{ status, title, detail, traceId, fields?, raw }` (RFC 7807; `fields` comes from `errors`) |
| Application | Coordinate operation results and state transitions |
| Store | Expose structured failure/loading/success state |
| Presentation | Render translated, safe, accessible feedback; show `traceId` in support-oriented error states |

Branch on `status` only; never parse `detail` (English free text). Do not render raw backend payloads. A status-`0` error is a network/CORS failure with no body.

| Status | Behaviour |
|---|---|
| 400 | Map `fields` onto form controls, otherwise show a translated generic message. Date-range errors: ask the user to fix the range |
| 401 | One single-flight refresh, retry once; on failure sign out |
| 403 | Access denied, no retry |
| 404 on a store route | Redirect to the store list without saying whether it exists or belongs to someone else |
| 409 | State changed (alert already moved on, binding exists, checklist locked): reload the resource and tell the user |
| 422 | Business rule: translated message |
| 429 | Back off; ask the user to try later |
| 5xx / network | Exponential back-off, GETs only (max 3) |

## Data freshness and polling

| Data | Strategy |
|---|---|
| Alerts | SignalR `ReceiveAlert`; poll `alerts/active` about every 30 s as fallback |
| Dashboard summary, grid status | Poll 15-30 s |
| Equipment risk level, sensor connectivity | Poll about 30 s |
| Latest telemetry | Poll 10-30 s on the equipment detail view |
| Measurement history, analytics, compliance, audit | On demand, no polling |
| Reports (energy, OHS) | Synchronous POST; allow several seconds, show a submitting state, then download |

Polling pauses while the tab is hidden and stops on `401`/`403`. Every polled view shows `lastUpdatedAt`; telemetry in `STALE`/`DISCONNECTED`/`UNKNOWN` states is labelled as such and never shown as zero or healthy.

## Realtime

SignalR is infrastructure. A generic connection manager in `shared/infrastructure` owns the lifecycle; each context maps its own events.

```text
connect (/hubs/alerts, accessTokenFactory) -> JoinStore(storeId)
onreconnected -> JoinStore(storeId) -> re-fetch alerts/active + affected resources
store change  -> LeaveStore(old) -> JoinStore(new)
```

| Event | Owner | Handling |
|---|---|---|
| `ReceiveAlert` | `alerts` | Map to an application alert, prepend to active alerts, update counters |
| `ShiftHandover` | `stores` | Payload shape is informational: notify and reload the on-duty/handover data |
| `ComplianceNotice` | `compliance` | Notify and reload `compliance/expirations` |

Events are best-effort and not replayed. The access token is not re-checked after connect, so reconnect with a fresh token after a refresh. `JoinStore` fails with a hub exception when the store is not owned; treat it like a `404`. `PanelPauseChanged` is ignored (kitchen panel only). Adding `@microsoft/signalr` requires approval.

## Dates, paging, and units

- Send ISO 8601 with an explicit offset; ranges are half-open `[from, to)`, at most 31 days. Validate at the adapter boundary.
- Display in the store/user time zone (analytics returns `timeZone`); compare in UTC. `DateOnly` fields are `yyyy-MM-dd` in the store time zone.
- Both paging envelopes map to one application paging model; show totals only when `totalCount` exists. De-duplicate by `id` when accumulating pages.
- Units: kWh, kW, A, V, Hz; percentages 0-100 except `minPowerFactor` (0-1). Currency comes from the payload. Use decimal-safe arithmetic when summing costs.

## Route conventions

- Routes belong to the owning context's `presentation/` layer and feature routes are lazy-loaded.
- Public routes: sign-in, forgot-password, reset-password. Everything else needs a restored, `Active` session.
- Store-scoped routes are `/stores/:storeId/...`; `storeId` is read from the route and passed down explicitly.

## Sensitive data

Treat passwords, access and refresh tokens, reset tokens, signature images, and personal contact details (notification email, SMS number, webhook URLs) as sensitive.

- Never log sensitive values, render tokens, put tokens in route parameters (except the reset token the emailed link carries, which is removed from the URL after reading), or send them to analytics.
- The only place a token appears in a URL is the SignalR `access_token` query string, handled by the connection manager's `accessTokenFactory`.
- Edge `X-Api-Key` is never used in the browser.
- Signature images are base64 PNG (at most 360 000 characters); keep them in memory only for the current submit/preview.

Screen states, responsiveness, keyboard support, WCAG 2.1 AA, and copy rules are normative in `.claude/rules/angular-web-ui.md` and `CLAUDE.md`.
