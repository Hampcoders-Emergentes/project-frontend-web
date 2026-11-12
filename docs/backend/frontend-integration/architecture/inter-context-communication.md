# Inter-context communication

Contexts live in one process and one deployment unit. They talk in **four ways**; none of them is visible on the REST surface, but they explain *why a UI action has side effects in another screen* and *why some data appears with a delay*.

## 1. Synchronous ACL facades (request/response)

A context exposes a narrow interface under `Interfaces/ACL` (or `Application/ACL`) and consumers depend only on that interface, never on foreign aggregates.

| Facade | Provided by | Used by (examples) |
|---|---|---|
| `IIamContextFacade` | IAM | Profiles (user lookup), Subscriptions (`ExternalIamService`) |
| `IProfilesContextFacade` | Profiles | Assets, Planning, Monitoring, Processing, Subscriptions — resolve the caller's technician/homeowner/company subject from the JWT user (`ActorSubjectResolver`) and enforce ownership (`ResourceAccess`, `TechnicianRoute`, `PropertyOwnerRoute`) |
| `IAssetsContextFacade` | Assets | Planning (installation property), Processing (device ↔ property), StoreManagement (`IDeviceLinkAuthority`) |
| `ISubscriptionContextFacade`, `ISubscriptionTierQuery` | Subscriptions | Planning (monthly limit, priority), authorization policies `PremiumOnly` / `EnterpriseOnly` (`SubscriptionTierHandler`) |
| `IStoreMeasurementFacade`, `IStoreAccessFacade`, `StaffRosterFacade`, `StoreNotificationRoutesFacade` | StoreManagement | Analytics (power/electrical samples), AlertManagement (routing, on-duty worker), IAM audit (store ownership) |
| `StoreAlertHistoryFacade` | AlertManagement | StoreManagement (compliance report, safety status) |
| `IServiceOperationContextFacade` | Monitoring | Processing (is there an active service for this property/technician? — authorises relay commands) |

Frontend consequence: the **actor is always the JWT user**. Path ids such as `technicianId`/`ownerId` are checked against it; do not expect to act on behalf of another user, not even as `Admin` on store data.

## 2. In-process domain & integration events (MediatR / Cortex)

Aggregates raise domain events; handlers in other contexts react in the same request or via the outbox. Notable chains (event → effect):

| Trigger | Event(s) | Reaction |
|---|---|---|
| Sign-up | `UserRegisteredEvent` | Profiles creates an `Incomplete` profile; Subscriptions initialises a BASIC subscription after `ProfileCompletedEvent`. |
| Profile completed | `ProfileCompletedEvent` | Assets creates the owner's portfolio (homeowner/company) or technician inventory; Subscriptions initialises the subscription. |
| Password reset requested | `PasswordResetRequestedEvent` | `PasswordResetRequestedEventHandler` sends the email through `IEmailSender` (the secret travels only in the in-memory event). |
| Service request confirmed | `ServiceRequestCreatedEvent` / `RequestCreatedEvent` | Planning runs matching automatically (`ServiceAutomaticallyAssignedEvent` or `ServiceAssignmentFailedEvent`); Subscriptions increments the monthly counter (`ServiceRequestCreatedEventHandler`). |
| Technician assigned | `TechnicianAssignedEvent` | Planning only logs it. The `ServiceExecution` is **not** created by an event: back-office staff (Admin/SuperAdmin/FieldManager) create it with `POST /service-executions`. |
| Service completed | `ServiceCompletedEvent` → `ServiceCompletedExternalEvent` | Profiles updates the technician profile (`ServiceCompletedEventHandler`); Analytics updates technician metrics; for IoT-installation services Assets records the device installation and a maintenance record on the property (`ServiceCompletedIoTInstallationEventHandler`). |
| Review submitted | `ClientReviewSubmittedEvent`, `TechnicianReviewSubmittedEvent` | Profiles + Analytics update ratings (`TechnicianEvaluationSubmittedEventHandler`). |
| IoT device installed/decommissioned | `DeviceInstalledEvent`, `DeviceDecommissionedEvent` | Processing opens/closes the device reading stream; Subscriptions updates active-device count. |
| Anomaly detected | `AnomalyDetectedEvent` | Planning creates a **service suggestion** for the property (`AnomalyDetectedEventHandler`); Monitoring raises `ActiveServiceAnomalyAlertedEvent` (log-only handler); for store equipment, telemetry ingestion materializes alerts in Alert Management in the same transaction. |
| Device disconnected/reconnected | `DeviceDisconnectedExternalEvent` / `DeviceReconnectedExternalEvent` | Assets updates `connectionStatus`. |
| Payment events (Stripe webhook) | `SubscriptionActivatedEvent`, `PaymentFailedEvent`, `GracePeriodStartedEvent`, `SubscriptionDegradedEvent`… | Profiles updates the `subscriptionTier` snapshot (`ProfileSubscriptionTierChangedEvent`); Planning reacts to enterprise pending installation. |
| Thresholds saved | `ConsumptionThresholdsUpdatedEvent` | Processing refreshes device thresholds. |

Integration events are enqueued in the **outbox table** and delivered by `OutboxProcessorBackgroundService` every ~5 s, so cross-context effects are **eventually consistent** (typically seconds). UI rule: after an action whose consequence lives in another context (confirming a request → assignment; completing a profile → portfolio/inventory/subscription; completing a service → metrics), poll the destination resource instead of assuming immediate presence, and use `POST /auth/refresh-claims` after profile completion.

## 3. Shared-kernel identifiers

Contexts reference each other **only by id** (value objects in `Shared/Domain/Model/ValueObjects`): `UserId` (`us-…`), `ProfileId` (`prof-…`), `TechnicianId` (`tech-…`), `HomeownerId`, `CompanyId`, `PropertyId` (`prop-…`), `DeviceId`, `ServiceRequestId` (`req-…`), `ComponentId`, `AssignmentId`, `StaffMemberId`… The store hierarchy uses its own string ids (`store-`, `area-`, `equipment-` + 32 hex) and links to Assets devices through an explicit **device binding** (`POST …/equipment/{equipmentId}/device-binding`) validated by `IDeviceLinkAuthority`: user → active profile with an active HomeOwner/Company subject → device `Installed` → assigned to an active, unarchived property of the same client.

## 4. Shared database bridge

`AlertManagement` maps `alert_management.alerts` into the **same `StoreManagementDbContext`** so that a measurement and its alert are written in one `SaveChanges` (single transaction). Splitting the contexts later requires another transactional strategy (documented in `AlertManagement/README.md`).

## Outbound/real-time side channels

| Channel | Producer | Consumer |
|---|---|---|
| MQTT | Processing ↔ devices | devices, gateways |
| SignalR `/hubs/alerts` | AlertManagement, StoreManagement (`IStoreRealtimePort`) | web app/kitchen panel (hub mapped at `/hubs/alerts`) |
| Email / SMS / Webhook | AlertManagement dispatcher, IAM reset notifier, StoreManagerNotifier | humans / third-party systems |
| Stripe | Subscriptions | Stripe |
