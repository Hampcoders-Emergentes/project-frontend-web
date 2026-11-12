# Store Management

**Endpoints:** [`../api/store-management/endpoints.md`](../api/store-management/endpoints.md)

## Responsibilities

The kitchen-safety core: the **store → area → equipment** hierarchy; binding of Assets IoT devices (sensors) to equipment; telemetry and measurement history with anomaly detection results; equipment **risk level**, store **grid status**, sensor connectivity and a dashboard summary; configurable **thresholds**; safety content (safe-to-clean status, shutdown protocols, electrical-incident guide); **shift** scheduling, on-duty staff and shift handovers; touch-panel **pause**; kitchen **layout**; **compliance** (weekly checklists, maintenance certificates, expirations, score, digital signature, OHS PDF report); **notification preferences**.

## Ownership model

Each `Store` belongs **exclusively to the IAM user who created it** (`ownerUserId`). No organisations, memberships or admin override: another user's store (even an `Admin`) is invisible (404). The actor is always the JWT user — never an id sent in the body (bodies reject unknown fields such as `ownerUserId`). Edge API keys cannot call these routes.

## Model

| Element | Notes |
|---|---|
| `Store` (`store-<32hex>`), `Area` (`area-…`), `Equipment` (`equipment-…`) | Names ≤ 120 chars (address ≤ 300), trimmed; ids server-generated; list ordering by id ascending; `lastEdgeSyncAtUtc` on the store. |
| `EquipmentDeviceBinding` | Immutable 1:1 link equipment ↔ Assets device (+ canonical `edgeDeviceId`). Authority: user → active profile with active HomeOwner/Company → device `Installed` → assigned to that client's active, unarchived property. Duplicates → 409; unknown/unauthorised → 403. |
| Measurements (`EquipmentTelemetry`) | Unique `(binding, readingId)`; identical resend → 204 no-op, different values → 409; `timestampBasis` tells device vs server time; latest chosen by capture time. |
| `ThresholdConfig` | `nominalVoltage`, `maxConsumptionWatts`, `maxCurrentAmps`, `minPowerFactor`, `nominalFrequency`, `disconnectionThresholdMin`, `normalLimitAmps`, `alertLimitAmps` (ranges validated; edge devices fetch them). |
| `EquipmentRiskPolicy` | `SAFE`/`WARNING`/`CRITICAL_RISK`/`DISCONNECTED`/`UNKNOWN`, evaluated from sensor presence, thresholds, last reading freshness and open alerts; store grid status derives from the worst level. |
| `ShutdownProtocol` + safe-to-clean rule | Default protocol per equipment (`isDefault`), editable (1–30 steps each); rule: max de-energized current (0–1 A), max reading age (1–30 min), require no critical alerts. |
| `StaffShift`, `ShiftHandover` | Shift roster (`workerCode`, role, `startsAt`/`endsAt` with offset); handover snapshots equipment risk and alerts at that moment and notifies the manager. |
| `PanelPause` | Sanitation pause 15–300 s (default 60): locks panel input; a critical alert overrides it (`overridingAlertId`). |
| `KitchenLayout` | Canvas size + equipment placements (`x`,`y`,`width`,`height`,`zIndex`, up to 500). |
| Compliance records | `WeeklySafetyChecklist` (13 catalogue items, `DRAFT`/`SUBMITTED`, score), `MaintenanceCertificate` (urgency, days until expiry), `ComplianceSignature` (PNG, SHA-256), `OhsReport`; `ComplianceScorePolicy` combines weekly checklists, certificates and resolved critical alarms. |
| `NotificationPreferences` | Up to 20 routes: channel (`EMAIL`/`SMS`/`DASHBOARD_PUSH`/`WEBHOOK`), destination, recipient role, 1–2 urgency levels, enabled. |

## Key rules

- Paged lists: `page` ≥ 1, `pageSize` 1–100 (default 20), envelope `{ items, page, pageSize, hasMore }`.
- Measurement history: `from`/`to` required with explicit offset; `[from,to)`; ordered by capture time then reading id.
- "Safe to clean" is true only when the equipment is de-energized per the rule *and* the reading is fresh *and* (optionally) there are no active critical alerts — `reasons[]` explains a negative answer.
- Checklists: save as `DRAFT` and re-save passing `checklistId`; a `SUBMITTED` checklist is **locked** (`ChecklistLockedException`). `weekStartDate` is the Monday of the ISO week of `weekOf` (default: current week); each item code may appear once; a `FAIL` item requires `notes` (≤ 500); `observations` ≤ 2000; unknown codes → 400.
- Certificates: dates must be UTC-convertible; `issuedAt` may not be more than a day in the future; `expiresAt` must be after `issuedAt` and within 10 years. `GET compliance/expirations?withinDays=30` also lists equipment **without** any certificate.
- Panel pause/handover/compliance notices are pushed through SignalR (`/hubs/alerts`).

## Events

No MediatR domain-event files; integration is through ports/facades (`IStoreRealtimePort`, `StoreManagerNotifier`, `IStoreMeasurementFacade`, `StaffRosterFacade`, `StoreNotificationRoutesFacade`, `StoreAlertHistoryFacade`). Realtime events emitted: `PanelPauseChanged`, `ShiftHandover`, `ComplianceNotice`.
