# Planning

**Endpoints:** [`../api/planning/endpoints.md`](../api/planning/endpoints.md)

## Responsibilities

The commercial workflow of an electrical service: technicians publish a **service catalog** of *recipes*; homeowners/companies build a **service request** step by step; the system **matches** a technician (AI + deterministic hybrid); back-office staff can dispatch; the platform proposes proactive **suggestions** after IoT anomalies.

## Model

| Element | Kind | Notes |
|---|---|---|
| `ServiceCatalog` / `ServiceRecipe` | Aggregate / entity | One catalog per technician (`ECatalogStatus`); recipes have name, description, category (`EServiceCategory`), component requirements, duration (h+min), pricing (materials + labor = total, `ECurrency`), prerequisites, deliverables, warranty months, IoT-certification flag, `isActive`, `timesRequested`. |
| `ServiceRequest` | Aggregate | `RequestId` (`req-…`), owner client, `ERequestStatus`, property, selected category/recipe/technician, details (problem description, consumption kWh, amount paid, billing period, receipt number, preferred dates, time preference), priority. |
| `ServiceAssignment` | Aggregate | Result of matching: technician, recipe snapshot, `EAssignmentStatus`, retry count, `MatchingScore` (score, method, reasoning). |
| `ServiceSuggestion` | Aggregate | Created from anomalies: property, anomaly type, severity, `ESuggestionStatus`, expiry. |
| `MaintenanceSchedule` | Aggregate | Preventive maintenance scheduling (no REST surface in this version). |

## Request state machine (wizard)

`POST /service-requests` (**Draft**) → `POST …/property` (**PropertySelected**) → `POST …/recipe` with a *service category* (**CategorySelected**) → `POST …/details` (**ReadyToConfirm**) → `POST …/confirm` → **PendingAssignment** (202) → matching → **Assigned** or stays pending/failed; `DELETE /service-requests/{id}` cancels (409 once assigned: `CannotCancelAssignedRequest`); stale drafts **Expired**; installation flow uses **PendingInstallation** (`POST …/installation-property`).

## Rules and invariants

- Only homeowners/companies can create requests (others → 403); plan limits come from Subscriptions: BASIC homeowner 2 requests/month; priority requires Premium (`PriorityRequiresPremium`). Check `GET /service-requests/eligibility` first.
- A request needs a property and a category before details/confirm (`PropertyNotSelected`, `RecipeNotSelected` → 400).
- Recipes: unique name per catalog (409), price increase limited (`PriceIncreaseTooLarge`), cannot change components or deactivate with in-progress services (409), cannot update an inactive recipe, at least one component, positive quantities/durations, valid warranty.
- Matching: runs automatically after confirm; candidates ranked with AI (Gemini/OpenAI) blended with deterministic scoring (distance ≤ 100 km, rating, stock…) and falls back to deterministic scoring if AI is off/slow. Queue is FIFO within **priority** and **normal** tiers.
- Suggestions can be viewed (`PATCH …/viewed`), accepted (creates a request → `{ requestId }`) or dismissed; accepting twice → 409.

## Events

Published: `ServiceRequestInitiated/Created/StatusChanged/Cancelled/Expired/Reactivated`, `PropertySelectedForRequest`, `ServiceDetailsAdded`, `ServiceAutomaticallyAssigned`, `ServiceAssignmentFailed`, `TechnicianAssigned`, `StaffAssignedToService`, `ServiceCatalog*`, `ServiceRecipe*`, `ServiceSuggestion*`, `ServiceRequestLimitReached`.
Consumed: `AnomalyDetectedEvent` (Processing → suggestions), `SubscriptionActivated`, `EnterpriseSubscriptionPendingInstallation`, `IoTCertificationGranted`, own request/assignment events.
