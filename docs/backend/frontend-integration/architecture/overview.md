# Architecture overview

## System in one paragraph

Electrolink is a **single ASP.NET Core 11 monolith** (project `Hampcoders.Electrolink.API`) organised as **DDD bounded contexts** with layered folders. It exposes a JSON REST API under `/api/v1`, an (intended) SignalR hub, and talks to PostgreSQL/PostGIS, an MQTT broker, Stripe, Cloudinary, SMTP, an optional SMS gateway, optional outbound webhooks and two LLM providers. Two product lines share the platform:

1. **Kitchen electrical-safety monitoring** (stores → areas → equipment, sensors, alerts, energy analytics, OHS compliance) — used by the landing page, the store-manager web app and the kitchen touch panel/edge devices.
2. **Home/enterprise electrical services marketplace** (homeowners/companies, properties, technician catalogs, service requests with matching, service execution, subscriptions, IoT device stock) — used by homeowner, company, technician and back-office clients.

## Tech stack (from `Hampcoders.Electrolink.API.csproj`, `appsettings.json`, `docker-compose.yml`)

| Concern | Technology |
|---|---|
| Runtime / framework | .NET `net11.0`, ASP.NET Core MVC controllers (`Microsoft.NET.Sdk.Web`) |
| Persistence | PostgreSQL 16 + PostGIS (`Npgsql.EntityFrameworkCore.PostgreSQL` 10.x, NetTopologySuite), EF Core 10, snake_case naming (`EFCore.NamingConventions`) |
| Schema management | `AppDbContext.Database.EnsureCreated()` (empty DB only) + `StoreManagementDbContext.Database.Migrate()`; disable with `Database:MigrateOnStartup=false` |
| Messaging inside the monolith | MediatR 11 + Cortex.Mediator (in-process domain/integration events), transactional **outbox** (`OutboxMessage`, polled every 5 s by `OutboxProcessorBackgroundService`) |
| Auth | JWT HS256 (`Microsoft.AspNetCore.Authentication.JwtBearer`), BCrypt password hashing, custom IAM middleware |
| Real-time | SignalR (`/hubs/alerts`) |
| IoT | MQTTnet 5 (Mosquitto 2 in Docker), HTTP Edge API with API key |
| Payments | Stripe.net 48 |
| Storage | CloudinaryDotNet |
| AI | Gemini / OpenAI-compatible (matching), Groq (device onboarding) |
| API docs | `Microsoft.AspNetCore.OpenApi` (`/openapi/v1.json`) + Scalar UI (`/scalar/v1`) |
| Hosting | Docker (port 8080), Docker Compose (api + `postgis/postgis:16-3.4` + `eclipse-mosquitto:2`) |

## Folder / layer organisation

Each context folder follows the same template:

```
<Context>/
  Domain/            Aggregates, entities, value objects, commands, queries, domain events, repository & service interfaces
  Application/       Internal/{CommandServices,QueryServices,EventHandlers,OutboundServices}, ACL facades
  Infrastructure/    EF Core persistence, ACL adapters, external providers, background jobs, DI extension (WebApplicationBuilderExtensions)
  Interfaces/        REST controllers, Resources (wire contracts), Transform assemblers, ACL (public facade for other contexts)
```

The newer contexts (**StoreManagement**, **AlertManagement**) use a flatter variant (services in `Application/`, records declared next to their controllers) but keep the same dependency rule. `Shared/` is the shared kernel (base aggregate, ids, specifications, outbox, authorization, email, storage/payment/AI provider abstractions, OpenAPI transformers).

> In this documentation the wire contracts are called **Requests** and **Responses**. In the C# code the same types are named `*Resource`; the TypeScript files in `schemas/` apply the Request/Response convention.

## Bounded contexts map

| Context | Folder | Doc | API prefix(es) |
|---|---|---|---|
| IAM | `IAM/` | [iam](../bounded-contexts/iam.md) | `/authentication`, `/auth`, `/users`, `/staff-users`, `/stores/{id}/audit-logs` |
| Profiles | `Profiles/` | [profiles](../bounded-contexts/profiles.md) | `/profiles`, `/staff-members` |
| Assets | `Assets/` | [assets](../bounded-contexts/assets.md) | `/homeowners\|companies/{ownerId}/properties\|property-portfolios`, `/iot-devices`, `/technicians/{id}/{component-types\|components\|inventory}` |
| Planning | `Planning/` | [planning](../bounded-contexts/planning.md) | `/technicians/{id}/catalog`, `/service-requests`, `/service-assignments`, `/dispatch`, `/suggestions` |
| Monitoring | `Monitoring/` | [monitoring](../bounded-contexts/monitoring.md) | `/service-executions` |
| Processing | `Processing/` | [processing](../bounded-contexts/processing.md) | `/iot/devices`, `/iot/edge` |
| Analytics | `Analytics/` | [analytics](../bounded-contexts/analytics.md) | `/stores/{id}/analytics`, `/stores/{id}/maintenance`, `/technician-metrics` |
| Alert Management | `AlertManagement/` | [alert-management](../bounded-contexts/alert-management.md) | `/stores/{id}/alerts`, `/alerts/{id}`, `/alerts/dispatch`, equipment alerts/anomalies |
| Store Management | `StoreManagement/` | [store-management](../bounded-contexts/store-management.md) | `/stores/**` |
| Subscriptions | `Subscriptions/` | [subscriptions](../bounded-contexts/subscriptions.md) | `/subscriptions`, `/contact-requests`, `/webhooks/stripe` |
| Shared kernel | `Shared/` | — | `/health` is registered in `Program.cs` |

## Serialization and routing conventions (global)

- Routes: lower-case (`LowercaseUrls`), `[controller]` replaced by **kebab-case** by `KebabCaseRouteNamingConvention` — hence `/component-types`, `/property-portfolios`, `/technician-metrics`, and the surprising `/iot-devices` (kebab-casing of `IoTDevices`; `/iot-devices` is also mapped for registration, stock and by-id reads).
- JSON: System.Text.Json defaults → **camelCase** properties, `PropertyNameCaseInsensitive = true`, numbers for enums unless converters apply (see [`../api/enums.md`](../api/enums.md)), ISO-8601 dates, `null` values emitted.
- IDs are opaque prefixed strings (see [`../guides/frontend-conventions.md`](../guides/frontend-conventions.md)).
- Paging: `page` (1-based) + `pageSize`; most store-scope lists return `{ items, page, pageSize, hasMore }` (no total count).

## Runtime processes inside the host

| Process | Purpose |
|---|---|
| `OutboxProcessorBackgroundService` | Publishes persisted integration events every 5 s |
| `CleanupOrphanedFilesJob` | Deletes Cloudinary files whose DB registration failed/was replaced |
| `AuditLogWriter` | Batches audit entries to the DB |
| `MqttDeviceSubscriberService` | MQTT subscriber/publisher |
| `RelayCommandTimeoutWorker` | Times out unanswered relay commands |
| `AlertDispatchWorker` | Delivers queued external alert notifications with retry |
| `GracePeriodExpirationJob`, `MonthlyCounterResetJob`, `EnterpriseActivationPolicyJob` | Subscription lifecycle |
| `TechnicianMetricsPeriodInitializerJob` | Opens technician metric periods |

## Environments and URLs

| Environment | API base | Notes |
|---|---|---|
| Local `dotnet run` | per `launchSettings` (Kestrel; HTTPS redirect only in Development) | Angular dev origin `http://localhost:4200` is the default CORS origin |
| Docker Compose | `http://localhost:8080` (`API_PORT`) | `ASPNETCORE_ENVIRONMENT=Production`; Postgres on host port 5433; MQTT 1883 |
| Docs UI | `/scalar/v1`, spec `/openapi/v1.json`, health `/health` | anonymous |

Staging/production hostnames are not defined anywhere in the repository; obtain them from the deployment owner and add the origin to `Cors:AllowedOrigins`.
