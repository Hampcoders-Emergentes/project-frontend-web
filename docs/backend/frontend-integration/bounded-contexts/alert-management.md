# Alert Management

**Endpoints:** [`../api/alert-management/endpoints.md`](../api/alert-management/endpoints.md) · Integrations: [`signalr-alerts-hub`](../integrations/signalr-alerts-hub.md), [`sms-and-webhook-alerts`](../integrations/sms-and-webhook-alerts.md)

## Responsibilities

Persist and manage **alerts for store equipment**: materialize one alert per fresh detected anomaly, accept manual anomaly reports from kitchen staff, track the response workflow (acknowledge → assign technician → resolve), expose history/active views, and dispatch notifications (realtime + external channels with retry).

## Model

| Element | Kind | Notes |
|---|---|---|
| `Alert` | Aggregate | Id `alert-<SHA256 of (bindingId, readingId)>` for telemetry alerts; manual reports get their own id. `AnomalyType`, `DetectionSeverity` (`Low…Critical`) and presentation `Severity` (`CRITICAL`/`NON_CRITICAL`), `Source` (`TELEMETRY`/`MANUAL_REPORT`), report category/description/reporter, on-duty worker snapshot, `Status`, ack/assign/resolve audit fields. |
| `AlertDispatch` | Aggregate | Queue item per (alert, route) for external channels with attempts/state. |
| Services | — | `AlertMaterializer`, `AlertService`, `AlertDispatcher`, `AlertDispatchWorker`. |

## State machine and rules

`OPEN → ACKNOWLEDGED` (`POST …/alerts/{alertId}/acknowledgement`, idempotent: repeating returns the **original** actor/time) `→ ASSIGNED` (`POST /alerts/{alertId}/assign`) `→ RESOLVED` (`POST /alerts/{alertId}/resolve`, optional notes ≤ 1000). Invalid transitions → 409.

- One alert per `(binding, reading)`; unique index prevents duplicates; fresh detections only (late/normal readings never create alerts; no backfill).
- `severity=CRITICAL` iff the detection severity is `Critical`; `isCriticalLeakage` flags current-leakage criticals (siren trigger).
- Manual report: `category` ∈ `ABNORMAL_NOISE|SPARKS|BURNING_SMELL|OVERHEATING|FLICKERING_LIGHTS|SMOKE|OTHER`, description ≤ 1000, severity is always `NON_CRITICAL`; the on-duty worker is attached automatically (from shifts).
- History filters: `status`, `severity`, `from`/`to` on **createdAtUtc** (`[from,to)`, ≤ 31 days, both or neither), `equipmentId` (store list), `page` (default 1) / `pageSize` (default 20, max 100), ordered by `createdAtUtc` desc then id. Empty → `200` with `items: []`.
- Access: store owner only; others/unknown equipment → 404 `{ message: "Resource not found." }`; no human (edge key only) → 401.
- External dispatch honours the store's notification preferences (channel/urgency/enabled) and optional critical escalation; failures are retried by the worker.

## Dependencies

Uses StoreManagement for hierarchy, on-duty staff (`StaffRosterFacade`) and routes (`StoreNotificationRoutesFacade`); shares `StoreManagementDbContext` with it (single transaction with the measurement).
