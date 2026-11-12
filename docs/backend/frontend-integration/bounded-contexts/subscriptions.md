# Subscriptions & Payments

**Endpoints:** [`../api/subscriptions/endpoints.md`](../api/subscriptions/endpoints.md) · Integration: [`stripe`](../integrations/stripe.md)

## Responsibilities

Plan tiers and billing for marketplace users (BASIC/PREMIUM for homeowners and technicians, ENTERPRISE_BASIC/ENTERPRISE_PREMIUM for companies), Stripe checkout/portal/cancellation, payment history, grace period handling, monthly request quotas — and the **public demo/contact request** form of the landing page.

## Model

| Element | Kind | Notes |
|---|---|---|
| `Subscription` | Aggregate root | `EPlanType`, `ESubscriptionStatus`, billing cycle, billing period, Stripe customer/subscription ids, `cancelAtPeriodEnd`, monthly request counters (used/limit), `gracePeriodEndsAt`, active IoT device count (enterprise). |
| `PaymentRecord` | Entity | Stripe invoice id, amount, currency, `SUCCEEDED/FAILED/REFUNDED`, processed at. |
| `ProcessedWebhookEvent` | Inbox | Idempotency of Stripe events. |
| `ContactRequest` | Aggregate | Prospect name, company, email, phone, message, received time; per-email daily quota. |
| Policies | — | `HomeownerBillingPolicy`, `EnterpriseBillingPolicy`, `DeviceBillingPolicy`, `SubscriptionPlanPriceResolver` (maps plan+cycle to Stripe price id). |

## State machine

`BASIC (ACTIVE)` → checkout → webhook `invoice.payment_succeeded` → `PREMIUM (ACTIVE)` → payment fails → `GRACE_PERIOD` (7 days) → recovers on a later successful payment, or expires to `DEGRADED`/`CANCELLED_*`. Cancellation: `CANCELLED_PENDING` until period end. Enterprise: `PENDING_INSTALLATION` until devices are installed (`IoTInstallationRequired`), then fully active; `CANCELLED_REFUNDED` when refunded.

## Rules and invariants

- BASIC homeowners: 2 service requests per month, no priority; counters reset on the 1st of each month 00:00 UTC (`MonthlyCounterResetJob`).
- PREMIUM: unlimited, `canMarkAsPriority`.
- Checkout validates the transition from the current plan; Stripe is the source of truth — the UI must wait for the webhook-driven change.
- Contact requests: public, rate-limited (5 / 10 min / IP) and max 3/email/day (configurable); body rejects unknown fields; response `202 { requestId, status, receivedAtUtc }`; the sales inbox is `Subscriptions:DemoRequests:SalesInbox`.
- `SubscriptionTierHandler` backs the authorization policies `PremiumOnly` and `EnterpriseOnly` registered in `Program.cs`; no route references them yet, so tier limits are enforced inside the services (eligibility checks), not by attributes.

## Events

Published: `SubscriptionInitialized/Activated`, `CheckoutInitiated`, `PaymentProcessed`, `PaymentFailed`, `GracePeriodStarted`, `SubscriptionDegraded/Expired`, `SubscriptionCancellationScheduled`, `SubscriptionBillingCycleChanged`, `MonthlyCountersReset`, `MonthlyRequestLimitReached`, `ActiveDeviceCountUpdated`, `Enterprise…` events, `IoTInstallationRequired`.
Consumed: `ProfileCompletedEvent` (initialise), `ServiceRequestCreatedEvent` (increment counter), `DeviceInstalledEvent` (device count).
