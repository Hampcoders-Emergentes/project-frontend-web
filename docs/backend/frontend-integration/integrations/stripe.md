# Stripe (payments and subscriptions)

**Implemented** through `IPaymentProvider` (`StripePaymentProvider`, Stripe.net 48). Selected with `ExternalProviders:Payment` = `stripe` | `disabled` (any other value aborts startup). With `disabled`, a `NullPaymentProvider` is used and **returns fabricated values** (customer ids `null_cust_…`, portal URL `<returnUrl>?portal=null`, refunds `null_refund_…`) — never ship that to production.

## Configuration keys

`Stripe:SecretKey`, `Stripe:WebhookSecret`, `Stripe:PublishableKey`, `Stripe:BaseUrl`, `Stripe:SuccessUrl`, `Stripe:CancelUrl`, `Stripe:Prices:{HomeownerMonthly|HomeownerAnnual|TechnicianMonthly|TechnicianAnnual|EnterpriseBasicMonthly|EnterpriseBasicAnnual|EnterprisePremiumMonthly|EnterprisePremiumAnnual}` (Stripe price ids; the enterprise ones are empty in the committed `appsettings.json`).

## Checkout flow for the browser

1. `POST /api/v1/subscriptions/checkout` with `InitiateCheckoutRequest { planType, billingCycle, successUrl, cancelUrl }` (`planType` ∈ `BASIC|PREMIUM|ENTERPRISE_BASIC|ENTERPRISE_PREMIUM`; `billingCycle` ∈ `MONTHLY|ANNUAL`; URLs must be absolute).
2. Response `CheckoutUrlResponse { checkoutUrl, sessionId }` → `window.location.assign(checkoutUrl)` (hosted Stripe Checkout; Stripe.js is not required).
3. Stripe redirects to `successUrl`/`cancelUrl`. **Do not treat the success redirect as proof of payment.** The subscription changes only when the webhook arrives; poll `GET /api/v1/subscriptions/me` (e.g. every 2 s up to 30 s) until `planType`/`status` changes.
4. Manage payment method / invoices: `POST /api/v1/subscriptions/me/portal` `{ returnUrl }` → `{ portalUrl }` (redirect).
5. Cancel: `POST /api/v1/subscriptions/me/cancel` `{ reason, feedback? }` → updated `MySubscriptionResponse` (`cancelAtPeriodEnd`, `status`).
6. Show banners from `GET /api/v1/subscriptions/me/status-alert` (`204` when nothing to show; `GRACE_PERIOD` carries `gracePeriodEndsAt` and `customerPortalUrl`).
7. Payment history: `GET /api/v1/subscriptions/me/payment-history?page&pageSize` → `PaymentHistoryResponse { page, pageSize, payments[] }`.

## Webhook (server side only)

`POST /api/v1/webhooks/stripe` — verified with `Stripe-Signature` + `Stripe:WebhookSecret`; idempotent per Stripe event id (processed-event inbox).

| Stripe event | Effect |
|---|---|
| `checkout.session.completed` | Links the Stripe customer/subscription to the user's subscription. |
| `invoice.payment_succeeded` | `subscription_create` → BASIC→PREMIUM activation; `subscription_cycle` → renewal, recovers from grace period; payment recorded (`payment-history`). |
| `invoice.payment_failed` | Starts a **7-day grace period** (`GRACE_PERIOD`). |
| `customer.subscription.deleted` | Subscription ends (degraded/cancelled state). |

Background jobs: `GracePeriodExpirationJob`, `MonthlyCounterResetJob` (1st day 00:00 UTC resets monthly request counters), `EnterpriseActivationPolicyJob`.

## Business limits the UI must reflect

BASIC homeowner: **2 service requests per month**; PREMIUM: unlimited and priority matching. Read `GET /subscriptions/me/eligibility` (`canRequest`, `isPriorityAllowed`, `remainingRequests`, `upgradeRequired`, `upgradePromptMessage`) and `GET /service-requests/eligibility` before offering the request wizard.

## Failure modes

Provider errors on checkout/portal/cancel surface as non-2xx from the subscription routes; webhook errors are `502` (provider) / `500` (unexpected) / `503` (secret missing) and are retried by Stripe.
