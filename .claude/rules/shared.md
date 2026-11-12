---
paths:
  - "src/app/shared/**"
  - "src/app/**/*.ts"
  - "src/app/**/*.html"
  - "src/app/**/*.scss"
  - "src/app/**/*.css"
---

# ElectroLink Shared Code Rules

## Shared purpose

`src/app/shared/` contains only stable, reusable, cross-cutting building blocks.

Appropriate shared code includes:

- Base entity abstractions.
- Generic API base classes.
- Generic endpoint helpers.
- Generic RFC 7807 error normalization.
- Generic pagination helpers and models.
- Generic date/offset serialization helpers.
- Generic assemblers.
- Generic utility types.
- Generic auth-token storage and `X-Refreshed-Token` handling.
- Generic realtime connection lifecycle (connect, reconnect, invoke, subscribe).
- Common UI primitives.
- Application shell and layout.
- Navigation primitives.
- Icon primitives.
- Generic buttons.
- Generic dialogs.
- Generic empty/loading/error/stale-state components.
- Generic table, pagination, and filter primitives.
- Language switcher.
- Styling tokens and shared visual utilities.

## What does not belong in shared

Do not add the following to `shared`:

- Store, area, or equipment hierarchy rules.
- Equipment threshold validation or defaulting.
- Device/sensor binding behavior.
- Risk-level evaluation or risk ordering.
- Alert lifecycle, acknowledgement, assignment, or resolution logic.
- Energy consumption, cost projection, comparison, or budget rules.
- Compliance checklist, certificate, expiration, score, signature, or OHS report logic.
- Shift roster or on-duty attribution logic.
- Audit-log business behavior.
- Authentication/session flows beyond generic token plumbing.
- Notification-channel preference rules.
- Context-specific stores.
- Context-specific endpoints/adapters.
- Context-specific translations.
- A component used by only one feature.

If it belongs to one bounded context, keep it in that bounded context.

## Before adding shared code

Before creating a shared utility/component:

1. Search existing shared primitives.
2. Confirm it is used by at least two contexts or is an unambiguous cross-cutting concern.
3. Ensure it does not import context-specific domain, application, infrastructure, or presentation code.
4. Ensure its API is generic and stable.
5. Do not generalize a feature-specific component prematurely.

## Shared UI rules

Shared components:

- Must not inject context-specific stores.
- Must not import context infrastructure.
- Must not contain business decisions.
- Must receive data via inputs and emit user intent via outputs.
- Must support translations where they display user-facing text.
- Must meet accessibility requirements.
- Must remain responsive.
- Must not hardcode store, equipment, alert, analytics, compliance, shift, or audit-specific behavior.
- Must not encode risk colors, alert severities, compliance grades, or budget thresholds as business rules; accept them as inputs.

## Shared infrastructure rules

Shared infrastructure may provide generic helpers, but must not own business endpoint semantics.

Rules:

- Reuse base APIs/endpoints/assemblers when appropriate.
- Keep context-specific paths, resources, error mappings, and request mapping within the owning context.
- The shared HTTP layer may add the bearer token, perform single-flight refresh, capture `X-Refreshed-Token`, normalise RFC 7807 errors, and generate idempotency keys.
- The shared realtime layer may own one connection lifecycle, but event names, `JoinStore`/`LeaveStore` semantics, and event payload mapping belong to the owning context.
- Do not add context-specific conditionals to a shared base class.
- Prefer a context-local adapter over complicating shared code for a one-off requirement.
