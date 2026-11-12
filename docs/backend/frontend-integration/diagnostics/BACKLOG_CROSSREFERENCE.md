# Backlog cross-reference

Source: [`docs/product-backlog.md`](../../product-backlog.md) — 42 user stories (US01–US42) and 6 technical stories (TS01–TS06), epics EP01–EP06.

**Status legend**

| Status | Meaning |
|---|---|
| `Completed` | Backend contract exists and covers the story's acceptance intent. |
| `Partial` | Backend exists but a stated piece is missing, configuration-dependent, or blocked (reason given). |
| `Frontend-Only` | No backend work is required (static content or pure UI behaviour). |
| `Missing` | No backend support found. |

**Target client applications:** **Landing** = public marketing site · **Store Web** = store-manager web application · **Kitchen Panel** = touch panel used on the kitchen floor · **Edge** = sensor gateway/firmware · **Back-office** = admin console.

## User stories

| ID | Story | Epic | Context | Endpoint(s) / events | Status | Client |
|---|---|---|---|---|---|---|
| US01 | Value proposition and access to the web app | EP01 | — | Static page. For scenario 3 ("service unavailable") probe `GET /health` (anonymous). | Frontend-Only | Landing |
| US02 | Industry operational challenges | EP01 | — | Static content | Frontend-Only | Landing |
| US03 | Safety benefits for operational staff | EP01 | — | Static content | Frontend-Only | Landing |
| US04 | Management benefits | EP01 | — | Static content | Frontend-Only | Landing |
| US05 | Connected ecosystem operations | EP01 | — | Static content | Frontend-Only | Landing |
| US06 | Subscription plans and regulatory evidence | EP01 | — | No public plans/pricing endpoint exists; plan catalogue is static content (authenticated plan state: `GET /subscriptions/me`). | Frontend-Only | Landing |
| US07 | Request demo / commercial contact | EP01 | Subscriptions | `POST /contact-requests` (public, rate-limited, `202`, `429`) | Completed | Landing |
| US08 | Risk level by equipment | EP02 | Store Management | `GET /stores/{id}/areas/{a}/equipment/{e}/risk-level`, `GET /stores/{id}/dashboard-summary`, `GET …/grid-status` | Completed | Kitchen Panel, Store Web |
| US09 | Report an equipment anomaly | EP02 | Alert Management | `POST /stores/{id}/areas/{a}/equipment/{e}/anomalies` (categories: noise, sparks, burning smell, overheating, flickering lights, smoke, other) | Completed | Kitchen Panel |
| US10 | Audible alert on critical current leakage | EP02 | Alert Management | `GET /stores/{id}/alerts/active` → `hasCriticalLeakage` / `AlertResponse.isCriticalLeakage`; push event `ReceiveAlert` | Completed — sound is UI; push via `/hubs/alerts` `ReceiveAlert` | Kitchen Panel |
| US11 | Verify safe conditions before cleaning | EP02 | Store Management | `GET …/equipment/{e}/safety-status` (`isSafeToClean`, `reasons`) | Completed | Kitchen Panel |
| US12 | Safe shutdown protocol | EP02 | Store Management | `GET`/`PUT …/equipment/{e}/shutdown-protocol` | Completed | Kitchen Panel, Store Web |
| US13 | Log equipment status at shift handover | EP02 | Store Management | `POST`/`GET /stores/{id}/shifts/handover`, `GET …/shifts/on-duty`; event `ShiftHandover` | Completed | Kitchen Panel |
| US14 | Electrical-incident emergency guide | EP02 | Store Management | `GET /stores/{id}/safety-guides/electrical-incident` (client-cacheable 24 h) | Completed | Kitchen Panel |
| US15 | Moisture warning near electrical panels | EP02 | Processing / Store Mgmt / Alerts | Ingest fields `relativeHumidityPercent`, `panelSurfaceMoistureDetected`; alert type `MOISTURE_HAZARD`; `GET …/telemetry`, `…/measurements` | Completed | Kitchen Panel, Edge |
| US16 | Store electrical grid status | EP03 | Store Management | `GET /stores/{id}/grid-status` | Completed | Store Web, Kitchen Panel |
| US17 | Automated emergency alerts | EP03 | Alert Management | Alert materialization on ingestion, `POST /alerts/dispatch`, `GET/PUT …/notification-preferences`; channels EMAIL/SMS/WEBHOOK/DASHBOARD_PUSH | Partial — external delivery depends on SMTP/SMS-gateway configuration (log-only otherwise) | Store Web, Kitchen Panel |
| US18 | Temperature and amperage thresholds per equipment | EP03 | Store Management | `GET`/`PUT …/equipment/{e}/thresholds` (voltage, power, **current**, power factor, frequency, disconnection minutes, normal/alert limits) | Partial — **no temperature threshold exists** in the contract | Store Web |
| US19 | Alert history with filters | EP03 | Alert Management | `GET /stores/{id}/alerts`, `GET …/equipment/{e}/alerts` (status, severity, from/to, equipmentId, paging) | Completed | Store Web |
| US20 | Assign alert to maintenance technician | EP03 | Alert Management | `POST /alerts/{alertId}/assign`, `POST /alerts/{alertId}/resolve` (technician id/name are free text in the request) | Completed | Store Web |
| US21 | Sensor connection status | EP03 | Store Management | `GET /stores/{id}/sensors/connectivity`, `GET …/dashboard-summary` | Completed | Store Web, Kitchen Panel |
| US22 | Predictive maintenance recommendations | EP03 | Analytics | `GET /stores/{id}/maintenance/predictions?days=` | Completed | Store Web |
| US23 | Identify on-duty worker during an alert | EP03 | Store Mgmt / Alerts | `AlertResponse.onDutyWorker`, `GET /stores/{id}/shifts/on-duty`, `POST/GET/DELETE …/shifts/assignments` | Completed | Store Web, Kitchen Panel |
| US24 | Power consumption by equipment | EP04 | Analytics | `GET …/analytics/consumption`, `GET …/equipment/{e}/consumption` | Completed | Store Web |
| US25 | Compare consumption across periods | EP04 | Analytics | `GET …/analytics/comparison` | Completed | Store Web |
| US26 | Off-hours electrical consumption | EP04 | Analytics | `GET`/`PUT …/analytics/opening-hours`, `GET …/analytics/off-hours-consumption` | Completed | Store Web |
| US27 | Forecast end-of-month cost | EP04 | Analytics | `GET …/analytics/cost-projection` | Completed | Store Web |
| US28 | Download energy-efficiency report | EP04 | Analytics | `POST …/analytics/reports` (csv/pdf) + `GET …/reports/{id}/download`; `GET …/analytics/consumption/report` (csv) | Completed | Store Web |
| US29 | Monthly consumption target | EP04 | Analytics | `PUT …/analytics/budget`, `GET …/analytics/budget-status` | Completed | Store Web |
| US30 | Safety report for regulatory compliance | EP05 | Store Management | `POST …/compliance/reports/generate`, `GET …/compliance/reports`, `GET …/reports/{id}/download` | Completed | Store Web |
| US31 | Weekly electrical-network checklist | EP05 | Store Management | `GET …/compliance/checklists/template`, `POST`/`GET …/compliance/checklists` | Completed | Store Web, Kitchen Panel |
| US32 | Technician maintenance certificate | EP05 | Store Management | `POST`/`GET /stores/{id}/equipment/{e}/certificates` (`documentFileUrl` is a URL string; no upload endpoint) | Completed | Store Web |
| US33 | Regulatory compliance score | EP05 | Store Management | `GET …/compliance/score` | Completed | Store Web |
| US34 | Maintenance expiration notices | EP05 | Store Management | `GET …/compliance/expirations?withinDays=`; email + `ComplianceNotice` event to the manager | Partial — email needs SMTP (log-only otherwise) | Store Web |
| US35 | Register kitchen worker accounts | EP06 | Store Mgmt / IAM | Shift roster entries `POST …/shifts/assignments` (`workerCode`, `workerName`, `role`); login accounts for staff: `POST /staff-users` (Admin/SuperAdmin, roles Maker/Admin/FieldManager) | Partial — kitchen workers are roster entries, not login accounts | Store Web, Back-office |
| US36 | Preferred alert notification channels | EP06 | Store Management | `GET`/`PUT /stores/{id}/notification-preferences` | Completed | Store Web |
| US37 | Secure access to the web platform | EP06 | IAM | `POST /auth/sign-in\|sign-up\|refresh\|refresh-claims`, JWT | Completed | Store Web |
| US38 | Password recovery by email | EP06 | IAM | `POST /auth/forgot-password`, `POST /auth/reset-password` (also under `/auth/…`) | Completed — delivery requires SMTP (log-only otherwise) | Store Web |
| US39 | Arrange equipment layout like the floor plan | EP06 | Store Management | `GET`/`PUT /stores/{id}/layout` | Completed | Store Web |
| US40 | Digital compliance signature | EP06 | Store Management | `POST`/`GET …/compliance/signature`, `GET …/signature/image` | Completed | Store Web |
| US41 | Store activity audit log | EP06 | IAM | `GET /stores/{id}/audit-logs` | Completed | Store Web |
| US42 | Temporary pause of panel touch interaction | EP02 | Store Management | `POST`/`GET`/`DELETE /stores/{id}/panel/pause`; event `PanelPauseChanged` | Completed (push via `PanelPauseChanged`) | Kitchen Panel |

## Technical stories

| ID | Story | Epic | Context | Endpoint(s) / events | Status | Client |
|---|---|---|---|---|---|---|
| TS01 | Sensor telemetry ingestion via API | EP03 | Processing / Store Mgmt | `POST /iot/edge/readings`, MQTT `…/telemetry`, `POST …/device-binding` | Completed | Edge |
| TS02 | Alert routing and dispatch via API | EP03 | Alert Management | `POST /alerts/dispatch` (Edge key), dispatch worker, `…/notification-preferences` | Completed (external channels config-dependent) | Edge, Store Web |
| TS03 | Local panel sync after connection loss | EP02 | Processing | `POST /iot/edge/sync-batch` (≤ 1000 readings, idempotent), `GET /iot/edge/devices/{id}/thresholds` | Completed | Edge, Kitchen Panel |
| TS04 | OHS report generation via a dedicated microservice | EP05 | Store Management | `POST …/compliance/reports/generate` | Partial — implemented **inside the monolith**, not as a separate microservice | Store Web |
| TS05 | Authentication/authorization with audit logging | EP06 | IAM | JWT + role/ownership checks, audit middleware, `GET …/audit-logs` | Completed | All |
| TS06 | Third-party notification providers | EP03 | Alert Management | SMTP, HTTP SMS gateway, signed webhooks | Completed (needs configuration; log-only fallbacks) | Store Web |

## Capabilities beyond the backlog (marketplace line)

The backlog covers only the kitchen-safety line. The API also implements the marketplace capabilities below; they have no US/TS id and are grouped by epic-like capability:

| Capability | Endpoints | Doc |
|---|---|---|
| Accounts & profiles (technician/homeowner/company), staff | `/profiles/**`, `/staff-members/**`, `/staff-users` | [profiles](../api/profiles/endpoints.md) |
| Properties and portfolios | `/homeowners\|companies/{ownerId}/properties\|property-portfolios` | [assets](../api/assets/endpoints.md) |
| IoT device stock and lifecycle | `/iot-devices/**`, `/iot-devices/**` | [assets](../api/assets/endpoints.md) |
| Technician catalogue, inventory | `/technicians/{id}/{catalog\|component-types\|components\|inventory}` | [planning](../api/planning/endpoints.md), [assets](../api/assets/endpoints.md) |
| Service requests, matching, suggestions, dispatch | `/service-requests`, `/service-assignments`, `/suggestions`, `/dispatch` | [planning](../api/planning/endpoints.md) |
| Service execution and reviews | `/service-executions/**` | [monitoring](../api/monitoring/endpoints.md) |
| Device monitoring and relay | `/iot/devices/**` | [processing](../api/processing/endpoints.md) |
| Subscriptions and payments | `/subscriptions/**`, `/webhooks/stripe` | [subscriptions](../api/subscriptions/endpoints.md) |
| Technician metrics | `/technician-metrics/**` | [analytics](../api/analytics/endpoints.md) |
