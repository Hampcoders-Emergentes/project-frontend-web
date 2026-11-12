# Electrolink API — Frontend Integration Documentation

Single source of truth for client engineers (landing site, store-manager web app, kitchen touch panel, homeowner/company/technician apps, back-office console, edge gateways) integrating with the **Electrolink backend** (`Hampcoders.Electrolink.API`, ASP.NET Core 11 modular monolith, PostgreSQL/PostGIS, JWT).

Everything here was derived from the source code of this repository; features that are stubbed, log-only or not wired are called out in [`diagnostics/KNOWN_LIMITATIONS.md`](./diagnostics/KNOWN_LIMITATIONS.md). Payload types follow the **Request / Response** convention (the C# classes are named `*Resource`).

## Base URLs

| Environment | REST base | Realtime hub | Notes |
|---|---|---|---|
| Local (`dotnet run`) | Kestrel URL from `launchSettings` + `/api/v1` | `{origin}/hubs/alerts`  | Default CORS origin `http://localhost:4200` |
| Docker Compose | `http://localhost:8080/api/v1` | same | Postgres `localhost:5433`, MQTT `localhost:1883`, providers disabled |
| Staging / production | *not defined in the repository* — ask the deployment owner | | Add your web origin to `Cors:AllowedOrigins` |

Utility endpoints (anonymous): `GET /health`, `GET /openapi/v1.json`, `GET /scalar/v1`.

## Global headers

| Header | When | Value |
|---|---|---|
| `Authorization` | every call except public routes | `Bearer <accessToken>` (20 min lifetime) |
| `Content-Type` | requests with a body | `application/json` (multipart only for `POST /profiles/me/picture`) |
| `Accept` | recommended | `application/json` |
| `X-Api-Key` | **edge devices only** | Edge key — never in browsers |
| `Stripe-Signature` | Stripe → webhook only | not for clients |

## Quick-start checklist

1. Read [`guides/frontend-conventions.md`](./guides/frontend-conventions.md) (ids, dates with offsets, pagination, enums, polling, token handling).
2. Add your origin to the backend `Cors:AllowedOrigins` and point your app at the API base.
3. Implement auth: sign-up/sign-in → keep tokens → single-flight refresh → `refresh-claims` after profile/subscription changes ([`security/authentication.md`](./security/authentication.md)).
4. Implement a single error normaliser for the four error body shapes ([`errors/error-contract.md`](./errors/error-contract.md)).
5. Copy [`schemas/requests.ts`](./schemas/requests.ts) and [`schemas/responses.ts`](./schemas/responses.ts) (compile with `tsc --strict`) or generate a client ([`schemas/openapi-notes.md`](./schemas/openapi-notes.md)).
6. Open the guide for your persona (below) and follow its screen-by-screen flow.
7. Use SignalR (`/hubs/alerts`) for push; keep polling as a reconnect fallback.
8. If you need e-mails/SMS/uploads/payments to work end-to-end, confirm the environment has SMTP, an SMS gateway, Cloudinary and Stripe configured.

## Navigation

### Start here by role

| You build… | Guide |
|---|---|
| Public landing page / demo form | [`guides/landing-visitor-guide.md`](./guides/landing-visitor-guide.md) |
| Store-manager web app | [`guides/web-store-manager-guide.md`](./guides/web-store-manager-guide.md) |
| Kitchen touch panel | [`guides/kitchen-panel-guide.md`](./guides/kitchen-panel-guide.md) |
| Homeowner / company app | [`guides/marketplace-client-guide.md`](./guides/marketplace-client-guide.md) |
| Technician app | [`guides/technician-guide.md`](./guides/technician-guide.md) |
| Back-office console | [`guides/backoffice-admin-guide.md`](./guides/backoffice-admin-guide.md) |

### API reference

| Document | Content |
|---|---|
| [`api/endpoint-inventory.md`](./api/endpoint-inventory.md) | All 235 route/verb combinations in one table |
| [`api/role-access-matrix.md`](./api/role-access-matrix.md) | Who can call what (public / JWT / role / edge key) |
| [`api/enums.md`](./api/enums.md) | Exact serialized enum values and formats |
| Per context | [IAM](./api/iam/endpoints.md) · [Profiles](./api/profiles/endpoints.md) · [Assets](./api/assets/endpoints.md) · [Planning](./api/planning/endpoints.md) · [Monitoring](./api/monitoring/endpoints.md) · [Processing](./api/processing/endpoints.md) · [Analytics](./api/analytics/endpoints.md) · [Alert management](./api/alert-management/endpoints.md) · [Store management](./api/store-management/endpoints.md) · [Subscriptions](./api/subscriptions/endpoints.md) |

### Architecture and domain

[`architecture/overview.md`](./architecture/overview.md) · [`architecture/inter-context-communication.md`](./architecture/inter-context-communication.md) · bounded contexts: [iam](./bounded-contexts/iam.md), [profiles](./bounded-contexts/profiles.md), [assets](./bounded-contexts/assets.md), [planning](./bounded-contexts/planning.md), [monitoring](./bounded-contexts/monitoring.md), [processing](./bounded-contexts/processing.md), [analytics](./bounded-contexts/analytics.md), [alert-management](./bounded-contexts/alert-management.md), [store-management](./bounded-contexts/store-management.md), [subscriptions](./bounded-contexts/subscriptions.md)

### Behaviour, integrations, diagnostics

| Area | Documents |
|---|---|
| Flows | [`flows/sequence-diagrams.md`](./flows/sequence-diagrams.md) (auth, password recovery, critical alert, offline sync, service request, checkout) |
| Errors | [`errors/error-contract.md`](./errors/error-contract.md), [`errors/examples/`](./errors/examples) |
| Security | [`security/authentication.md`](./security/authentication.md), [`security/security-reference.md`](./security/security-reference.md) |
| Integrations | [SignalR hub](./integrations/signalr-alerts-hub.md) · [Stripe](./integrations/stripe.md) · [SMTP e-mail](./integrations/smtp-email.md) · [SMS/webhook/email alert channels](./integrations/sms-and-webhook-alerts.md) · [Cloudinary uploads](./integrations/cloudinary-file-storage.md) · [MQTT](./integrations/mqtt-broker.md) · [Edge API](./integrations/edge-api.md) · [AI providers](./integrations/ai-providers.md) · [Report generation](./integrations/report-generation.md) |
| Diagnostics | [`diagnostics/BACKLOG_CROSSREFERENCE.md`](./diagnostics/BACKLOG_CROSSREFERENCE.md) (US01–US42, TS01–TS06), [`diagnostics/KNOWN_LIMITATIONS.md`](./diagnostics/KNOWN_LIMITATIONS.md) |
| Schemas | [`schemas/requests.ts`](./schemas/requests.ts), [`schemas/responses.ts`](./schemas/responses.ts), [`schemas/openapi-notes.md`](./schemas/openapi-notes.md) |

## Top five things that will bite you

1. **Realtime** uses SignalR at `/hubs/alerts` (JWT via `?access_token=`; call `JoinStore` after every reconnect).
2. **Store data is owner-only** (even Admins get 404 on others' stores); the actor is always the JWT user.
3. **Dates need explicit offsets** (`…Z` or `±HH:mm`) and ranges are ≤ 31 days.
4. **One error envelope** (`application/problem+json`, RFC 7807) for every 4xx/5xx, 401/403 included — normalise it in one interceptor.
5. **Claims are refreshed server-side** — the API re-reads role/profile claims per request, and profile completion returns a new access token in `X-Refreshed-Token`; store it.
