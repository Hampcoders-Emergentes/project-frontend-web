---
paths:
  - "src/app/**/presentation/**/*.ts"
  - "src/app/**/presentation/**/*.html"
  - "src/app/**/presentation/**/*.scss"
  - "src/app/**/presentation/**/*.css"
  - "src/app/shared/presentation/**/*.ts"
  - "src/app/shared/presentation/**/*.html"
  - "src/app/shared/presentation/**/*.scss"
  - "src/app/shared/presentation/**/*.css"
---

# ElectroLink Angular Web UI Rules

## Angular conventions

- Use the Angular version pinned in `package.json`.
- Use standalone components.
- Do not add `standalone: true` unless the installed Angular version or project conventions require it.
- Use `inject()` instead of constructor injection.
- Use `input()` and `output()` instead of `@Input()` and `@Output()`.
- Use signals for local state.
- Use `computed()` for derived state.
- Use `effect()` only to synchronize with an imperative external concern.
- Do not use `signal.mutate()`; use `set()` or `update()`.
- Use native control flow: `@if`, `@for`, and `@switch`.
- Use a stable `track` expression in `@for` loops.
- Use typed Reactive Forms.
- Do not use template-driven forms.
- Do not use `ngClass`; use class bindings.
- Do not use `ngStyle`; use style bindings.
- Do not use `@HostBinding` or `@HostListener`; define host behavior through the `host` metadata object.
- Use `NgOptimizedImage` for applicable static images.
- Use the `async` pipe when an observable is rendered directly in a template.
- Use `@ngx-translate` for every user-facing string; do not hardcode copy in templates or components.

## Web-only UX

Build for the authenticated ElectroLink store-manager web platform, used on laptops, desktops, and touch-enabled tablets.

Do not create UI for:

- The public landing page, marketing sections, pricing, or demo/contact forms.
- The kitchen touch panel: anomaly reporting, audible alarms, safe-to-clean checks, handover logging, emergency guides, or panel pause.
- Mobile-only workflows, offline mobile queues, or mobile push-notification registration.
- Homeowner, company, or technician marketplace flows.
- The back-office/admin console or staff-member management.
- Edge gateway diagnostics, ESP32 installation/configuration, or local-network-only device tools.
- Subscription checkout, billing, or payment screens.

The floor-plan layout editor (US39) is web scope. The kitchen-panel read-only layout view is not.

Technician field execution belongs to the technician mobile application and is out of scope for web UI unless explicitly requested.

## Component responsibilities

Views:

- Compose a feature screen.
- Read state from application stores.
- Trigger store actions.
- Own route-level layout and view composition.
- Read `storeId` from the route.

Components:

- Render focused UI elements.
- Receive data through `input()`.
- Emit user intent through `output()`.
- Remain independent of infrastructure.
- Avoid business orchestration.
- Avoid direct route-authorization decisions.
- Never create SignalR connections or subscribe to raw hub events.

Do not inject APIs, endpoints, `HttpClient`, storage adapters, or realtime adapters in a component.

## Mandatory UI states

Every data-loading view or section must support relevant states:

- Loading.
- Error.
- Empty.
- Populated/success.
- Submitting or pending mutation.
- Disabled action, where applicable.
- Unauthorized or unavailable state, where applicable.
- Data-quality state: fresh, stale/outdated, partial, or no data.

Data-quality rules:

- Show the last update time when data can become stale.
- Never render stale, disconnected, or unavailable data as zero or as a healthy state.
- Label partial results explicitly (for example partial comparison, partial consumption, incomplete monitoring coverage).
- A "no data" state must offer the relevant recovery action: expand the date range, retry, or configure the missing setting.
- Distinguish "insufficient telemetry" from "healthy" for predictions, projections, and comparisons.
- Treat `409` as a stale view and prompt a reload.
- Treat `429` as a temporary limit and tell the user to try later.

Do not render blank content while an asynchronous result is unresolved.

Use existing shared components and patterns before creating new primitives for:

- Layout.
- Navigation.
- Icons.
- Buttons.
- Tables.
- Cards.
- Forms.
- Loaders.
- Empty states.
- Inline errors.
- Toasts.
- Confirmation dialogs.
- Pagination.
- Filters.
- Status badges.

## Risk, alerts, and data visualization

- Risk levels are `SAFE`, `WARNING`, `CRITICAL_RISK`, `DISCONNECTED`, `UNKNOWN`. Combine color with a text label and icon; never use color alone.
- Alert severity is `CRITICAL` or `NON_CRITICAL`; show the severity label, equipment, timestamp, status, on-duty worker, and assigned technician where available.
- Do not assume alerts are grouped into incidents; the API creates one alert per reading.
- Charts must have an accessible text summary or equivalent table, an accessible name, and units.
- Show the currency, time zone, granularity, and period labels returned by the API.
- Do not interpolate missing data silently; show gaps and partial-data notices.
- When a comparison baseline is zero, show the change as not available rather than a fabricated percentage.

## Responsive design

The web platform must work on:

- Small laptop screens.
- Desktop screens.
- Large desktop screens.
- Narrow browser windows.
- Touch-enabled tablets.

Rules:

- Use responsive layouts; do not assume a fixed desktop width.
- Do not rely on hover-only actions.
- Preserve usable touch targets for touch-enabled laptops/tablets.
- Provide a responsive strategy for wide data tables: priority columns, sticky identifiers, or horizontal scroll inside a labelled region. Never allow page-level horizontal overflow.
- The floor-plan editor must remain usable at laptop widths and must provide zoom/pan or a scrollable canvas.
- Prefer CSS media/container queries over JavaScript viewport checks.
- Keep critical actions visible without hover.

## Accessibility

Target WCAG 2.1 AA or better.

Rules:

- Use semantic HTML first.
- Use one meaningful page-level `h1`.
- Preserve a logical heading hierarchy.
- Every form field needs a visible label or accessible name.
- Associate validation errors with inputs.
- Use buttons for actions and links for navigation.
- Keep keyboard navigation and visible focus intact.
- Preserve logical tab order.
- Do not use color as the only status indicator.
- Maintain sufficient contrast.
- Provide accessible text alternatives for meaningful images/icons.
- Mark decorative graphics appropriately.
- Use `aria-live` carefully for asynchronous errors, alert counts, and status changes; do not announce every telemetry refresh.
- Manage focus for dialogs, store switches, and significant route-level state changes.
- Do not introduce known AXE or WCAG AA violations.
- The signature canvas needs an accessible name, instructions, and a keyboard-focusable clear/reset action.
- Drag-and-drop layout positioning needs a keyboard-accessible alternative, such as numeric coordinates or arrow-key movement.

## Styles

- Follow the existing styling system.
- Reuse established design tokens, spacing, typography, colors, and breakpoints.
- Scope feature styles to components.
- Do not create global feature styles without an explicit need.
- Avoid `!important`.
- Avoid deep selector nesting.
- Avoid brittle selectors based on DOM structure.
