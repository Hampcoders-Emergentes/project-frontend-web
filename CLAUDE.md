# ElectroLink Web Application Instructions

## Scope

This repository is the Angular web application for ElectroLink's store-manager persona. It serves authenticated IAM users who own one or more stores and manage kitchen electrical-safety monitoring: the store -> area -> equipment hierarchy, sensor binding, electrical thresholds, shutdown protocols, dashboard and grid status, telemetry, alerts, energy analytics, OHS compliance, shift roster, floor-plan layout, notification preferences, and the store audit log.

Backlog coverage: US08, US12, US16-US41. Backend technical dependencies: TS02, TS04, TS05, TS06. The authoritative API behaviour is documented in `docs/backend/frontend-integration/`; `docs/backend/product-backlog.md` is the source for story intent.

Out of scope - do not add code, routes, components, abstractions, or documentation for:

- The public landing/marketing site (US01-US07) and the demo/contact form.
- The kitchen touch panel (US09-US11, US13-US15, US42): anomaly reporting, audible alarms, safe-to-clean checks, handover logging, emergency guides, panel pause.
- Homeowner, company, and technician marketplace clients; service requests, matching, execution, reviews, technician catalogues and inventory.
- The back-office/admin console, staff-member management, and subscription/billing screens (no store-web story).
- Edge gateways, ESP32 firmware, MQTT, telemetry ingestion, relay control, and local-network tools.
- Backend implementation or changes to backend contracts.

There is no store-manager `AccessRole`. A store manager is any active authenticated IAM user who created a store. Ownership is enforced by the API; the web app must not invent roles or permissions.

## Architecture

DDD and Hexagonal Architecture per bounded context, standalone components, signals, strict TypeScript, lazy feature routes, `en`/`es` i18n.

```text
src/app/<context>/{domain,application,infrastructure,presentation}
```

| Topic | Source of truth |
|---|---|
| Layers, dependencies, naming, API boundaries | `.claude/rules/architecture.md` |
| UI, accessibility, responsive behavior, data-quality states | `.claude/rules/angular-web-ui.md` |
| Shared code | `.claude/rules/shared.md` |
| Cross-context integration | `.claude/rules/bounded-contexts.md` |
| Flows, stores, errors, auth/session, realtime | `docs/frontend/architecture/frontend-architecture.md` |
| API contracts and backend limitations | `docs/backend/frontend-integration/` |

## Web bounded contexts

Web contexts group store-manager capabilities; they are not required to match backend contexts one-to-one. The backend `Monitoring` context (service executions) is marketplace-only and out of scope.

| Folder | Bounded context | Web responsibility |
|---|---|---|
| `iam` | Identity and session | Sign-in, token refresh, session restoration, password recovery/reset, change password, sign-out |
| `stores` | Store management | Store selection/onboarding, areas, equipment, sensor binding, floor-plan layout, electrical thresholds, shutdown protocols, shift roster and on-duty staff |
| `monitoring` | Kitchen monitoring | Dashboard summary, grid status, equipment risk level, latest telemetry, measurement history, sensor connectivity |
| `alerts` | Alert management | Active alerts, alert history and filters, alert detail, acknowledge/assign/resolve workflow, on-duty attribution |
| `analytics` | Energy analytics | Opening hours, consumption, period comparison, off-hours consumption, cost projection, budget, maintenance predictions, energy reports |
| `compliance` | OHS compliance | Weekly checklist, maintenance certificates, expirations, compliance score, digital signature, OHS report generation/download |
| `notifications` | Notifications | Notification-channel preferences (email, SMS, dashboard push, webhook) |
| `audit` | Audit | Store activity audit log |

`shared` contains only reusable, context-agnostic code. Business logic never moves to `shared` because a single screen or context reuses it.

## Before modifying code

1. Identify the owning bounded context and confirm the requirement is in store-web scope and backed by a user story or an explicit request.
2. Inspect the existing routes, views, components, stores, use cases, contracts, ports, adapters, providers, translations, and tests.
3. Reuse the closest existing pattern and change the fewest layers needed.
4. Do not invent API contracts, domain states, permissions, or business rules. Do not infer endpoints, fields, or enums from story text; verify them in `docs/backend/frontend-integration/`.

Ask for clarification when ambiguity changes context ownership, authorization, API contracts, domain state transitions, data ownership, or the web/panel/mobile/Edge/backend split.

## Session and store access

- Public routes are limited to sign-in, forgot-password, and reset-password.
- Every other route requires an authenticated session with an `Active` account; a valid token alone is not enough (inactive accounts receive `403`).
- Enforce the session check in route guards and only after session restoration resolves. No store data may load before that.
- Bootstrap after sign-in with `GET /stores?page=1&pageSize=100`: no stores -> onboarding; one store -> select it; several -> store switcher.
- All store-scoped routes are `/stores/:storeId/...` and take `storeId` from the route. Never take it from a request body, local storage, or another context's store.
- A `404` on a store route means the store does not exist **or is not owned by the caller**; redirect to the store list without revealing which. Never render another user's data.
- The backend is authoritative for authorization and ownership; guards protect UX and routes, not the API.
- Do not decode or parse opaque ids (`store-...`, `equipment-...`, `alert-...`, `us-...`); treat them as strings.

## API integration

- Read the API base URL from environment configuration; it is `{API_ORIGIN}/api/v1`. Never hardcode origins in components, stores, use cases, or templates.
- Normalise every error through one infrastructure helper into the RFC 7807 shape `{ status, title, detail, traceId, fields?, raw }`. Do not render raw payloads and do not parse `detail` for logic.
- Handle statuses explicitly: `400` field errors, `401` one single-flight refresh then retry once, `403` access denied (no retry), `404` not found/not owned, `409` stale state -> reload, `422` business rule, `429` back off, `5xx`/network exponential back-off for GETs only.
- Requests and responses are camelCase; enums are strings; absent values are `null`; strict bodies reject unknown fields.
- Dates: responses are ISO 8601; requests need an explicit offset; ranges are half-open `[from, to)` and at most 31 days. Display in the store/user time zone, compare in UTC.
- Lists use `PagedResponse` (`items, page, pageSize, totalCount, totalPages, hasMore`) or `HasMorePageResponse` (`items, page, pageSize, hasMore`); never assume a bare array.
- Store a new access token from the `X-Refreshed-Token` response header when present.
- Send an `Idempotency-Key` on the supported web mutations (compliance checklist save/submit and maintenance certificate create; `POST /stores` does not support it, so just disable the submit control while in flight); reuse the same key when retrying that user action.
- Do not retry non-idempotent mutations automatically; disable submit controls while a request is in flight.

## Realtime

- SignalR is an infrastructure concern. A generic connection manager may live in `shared/infrastructure`; event names and payload mapping stay in the owning context. Presentation never builds a connection.
- Connect to `/hubs/alerts` with the access token through `accessTokenFactory`; call `JoinStore` after the initial connection and after every reconnect, and `LeaveStore` when the active store changes.
- Web consumes `ReceiveAlert` (alerts), `ShiftHandover` (stores), and `ComplianceNotice` (compliance). `PanelPauseChanged` belongs to the kitchen panel and is out of web scope.
- Events are best-effort and are not replayed: after reconnect, re-fetch `alerts/active` and the affected resource.
- Keep polling as a reconnect/fallback path: active alerts ~30 s, dashboard/grid ~15-30 s, risk/connectivity ~30 s. Stop polling when the tab is hidden or on `401`/`403`.
- Adding `@microsoft/signalr` requires approval.

## Backend constraints that affect UI

| Constraint | UI consequence |
|---|---|
| US18 mentions temperature, but the API has **no temperature threshold** | Model only the eight electrical fields: `nominalVoltage`, `maxConsumptionWatts`, `maxCurrentAmps`, `minPowerFactor`, `nominalFrequency`, `disconnectionThresholdMin`, `normalLimitAmps`, `alertLimitAmps` |
| US35 "worker accounts" are shift-roster entries (`workerCode`, `workerName`, `role`), not IAM login accounts | Label them as roster/worker entries; do not build account provisioning |
| US17/US34/US38 delivery depends on SMTP/SMS configuration; otherwise log-only | Never promise delivery; show configuration/pending states where relevant |
| TS04 reports are generated synchronously inside the monolith | No progress API; allow several seconds and show a submitting state |
| US32 certificates accept a `documentFileUrl` string; there is no certificate upload endpoint | Do not build an upload flow; collect/validate the URL |
| Equipment <-> sensor binding is permanent in this version | Warn before binding; do not offer unbind |
| Risk states are `SAFE`, `WARNING`, `CRITICAL_RISK`, `DISCONNECTED`, `UNKNOWN` | Never render `STALE`/`DISCONNECTED` as zero or healthy |

## Global rules

- Use only the Angular, TypeScript, and package versions pinned in `package.json`.
- Add, remove, or update dependencies, Angular Material, UI libraries, CSS frameworks, or Tailwind plugins only with approval.
- Do not modify environment configuration, global providers, authentication behavior, or shared primitives unless the task requires it.
- Do not modify generated files.
- Do not use `any`; prefer `unknown` and narrow it safely.
- Do not make unrelated refactors or create abstractions before a concrete reuse need exists.

## Internationalization

- English (`en`, fallback) and Spanish (`es`), in `public/assets/i18n/en.json` and `public/assets/i18n/es.json`, loaded through `@ngx-translate`.
- Every user-facing string is translated and added to both files in the same change: copy, labels, validation errors, buttons, placeholders, empty/loading/error/stale/partial states, toasts, dialogs, tooltips, titles, chart labels, and ARIA labels.
- Keys are organized by bounded context and feature.
- Keep the existing Spanish locale naming; do not introduce `es-419` unless the i18n configuration supports it.

## Completion report

Report: files created or modified; bounded context and layers affected; behavior implemented; architectural decisions; validation commands actually executed with results; tests added, updated, skipped, or not run; known limitations, assumptions, or pending backend dependencies. Never claim validation or tests passed unless they were run successfully.
