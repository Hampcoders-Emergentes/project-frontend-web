# Store-manager web application — integration guide

Persona: the restaurant/store manager (IAM user with a signed-in session; owns one or more stores). Stories: US08, US12, US16–US41. All routes below are under `/api/v1` and require the Bearer JWT; all store data is visible **only to the user who created the store**.

## 0. Bootstrap

1. Sign in → keep `token` (memory) and `refreshToken` (see `security/authentication.md`).
2. `GET /stores?page=1&pageSize=100` → `PagedResponse<StoreResponse>`. No stores → onboarding screen (below). One store → select it automatically; otherwise show a store switcher. Keep `storeId` in the route (`/stores/:storeId/...`).
3. For each opened store load `GET /stores/{storeId}/dashboard-summary` (counts + equipment states) and `GET /stores/{storeId}/alerts/active`.

## 1. Onboarding / setup screens

| Screen | Calls |
|---|---|
| Create store | `POST /stores` `{ name, address }` → `201 StoreResponse` |
| Areas & equipment tree | `POST /stores/{id}/areas` `{ name }`; `GET /stores/{id}/areas`; `POST /stores/{id}/areas/{areaId}/equipment` `{ name }`; `GET …/areas/{areaId}/equipment` (page through with `hasMore`) |
| Link a sensor to equipment | `POST …/equipment/{equipmentId}/device-binding` `{ deviceId, edgeDeviceId }` (device must be `Installed` on one of the user's active properties, see Assets); `GET …/device-binding` to show it. Errors: 403 not authorised/unknown device, 409 already linked. Bindings are permanent in this version. |
| Floor-plan layout (US39) | `GET /stores/{id}/layout` (all equipment, placed or not) → drag/drop → `PUT /stores/{id}/layout` `{ canvasWidth, canvasHeight, items:[{equipmentId,coordinateX,coordinateY,width,height,zIndex}], removeEquipmentIds }` |
| Opening hours (US26) | `GET`/`PUT /stores/{id}/analytics/opening-hours` (`days:[{dayOfWeek,openTime,closeTime}]`, `HH:mm`) |
| Notification channels (US36) | `GET`/`PUT /stores/{id}/notification-preferences` — send the full `routes` array (max 20) |
| Shift roster / workers (US23, US35) | `POST /stores/{id}/shifts/assignments` `{workerCode,workerName,role,startsAt,endsAt}`; `GET …/shifts/assignments?from&to`; `DELETE …/assignments/{shiftId}`; `GET …/shifts/on-duty` |

## 2. Monitoring dashboard (US08, US16, US21)

| Widget | Call | Refresh |
|---|---|---|
| Store status / counts | `GET …/dashboard-summary` | 15–30 s |
| Grid KPIs (power, voltage, PF, leakage, risk counts) | `GET …/grid-status` | 15–30 s |
| Per-equipment risk card | `GET …/areas/{a}/equipment/{e}/risk-level` | on open + 30 s |
| Latest measurement | `GET …/equipment/{e}/telemetry` (`state`, `lastMeasurement`) | 10–30 s |
| Sensor connectivity | `GET …/sensors/connectivity` | 30 s |
| History chart | `GET …/equipment/{e}/measurements?from&to&page&pageSize` | on demand |

Color mapping: `SAFE` green, `WARNING` amber, `CRITICAL_RISK` red, `DISCONNECTED` grey-striped, `UNKNOWN` grey. Show "no fresh data" for `STALE`/`DISCONNECTED`, never zero.

## 3. Thresholds and safety content (US12, US18)

- `GET`/`PUT …/equipment/{e}/thresholds` — all eight numeric fields are required on `PUT` (validated ranges are in `requests.ts` comments of the C# attributes; a violation returns `400` with `errors`). No temperature threshold exists (see backlog cross-reference).
- `GET`/`PUT …/equipment/{e}/shutdown-protocol` — `shutdownSteps` and `emergencyIsolationSteps` 1–30 strings each + `isSafeToCleanRule {maxDeEnergizedCurrentAmps 0–1, maxReadingAgeMinutes 1–30, requireNoActiveCriticalAlerts}`.

## 4. Alerts (US17, US19, US20, US23)

- List: `GET /stores/{id}/alerts?status&severity&equipmentId&from&to&page&pageSize` (history) and `GET …/alerts/active` (open items + counters).
- Per-equipment: `GET …/equipment/{e}/alerts` and `GET …/alerts/{alertId}`.
- Workflow buttons: Acknowledge `POST …/equipment/{e}/alerts/{alertId}/acknowledgement`; Assign `POST /alerts/{alertId}/assign {technicianId, technicianName?}`; Resolve `POST /alerts/{alertId}/resolve {notes?}`. Each returns the updated `AlertResponse`; 409 means the alert already moved on — reload.
- Show `onDutyWorker` (who was accountable) and `assignedTechnicianName`.
- Push: connect SignalR when available; else poll `alerts/active`.

## 5. Energy analytics (US24–US29)

| Screen | Call |
|---|---|
| Consumption by period/equipment | `GET …/analytics/consumption?from&to&granularity` ; per equipment `GET …/areas/{a}/equipment/{e}/consumption?from&to&granularity=daily` |
| Compare two periods | `GET …/analytics/comparison?period1From&period1To&period2From&period2To` |
| Off-hours / standby | `GET …/analytics/off-hours-consumption?from&to&standbyThresholdKw=0.1` |
| Month-end forecast | `GET …/analytics/cost-projection` |
| Budget | `PUT …/analytics/budget {year,month,targetKWh,alertThresholdPercentage}`; `GET …/analytics/budget-status?year&month` (use `isWarning`) |
| Maintenance predictions | `GET /stores/{id}/maintenance/predictions?days=14` |
| Reports | `POST …/analytics/reports {from,to,format}` then download; CSV quick export `GET …/analytics/consumption/report` |

All ranges: ISO with offset, ≤ 31 days. Cost currency/time zone come back in the payload (`currency`, `timeZone`).

## 6. Compliance (US30–US34, US40)

1. Weekly checklist: `GET …/compliance/checklists/template` → render 13 items with PASS/FAIL/NOT_APPLICABLE → `POST …/compliance/checklists` (`status:"DRAFT"` to save, `"SUBMITTED"` to lock; re-send `checklistId` to update a draft; FAIL needs notes). History `GET …/compliance/checklists?status&fromWeek&toWeek`.
2. Certificates: `POST /stores/{id}/equipment/{e}/certificates`, `GET` list; expiry view `GET …/compliance/expirations?withinDays=30` (also lists equipment without certificates).
3. Score: `GET …/compliance/score` (`score`, `grade`, `components`).
4. Signature: draw on canvas → `POST …/compliance/signature {signerName,signerTitle,imageBase64}`; preview `GET …/signature/image`.
5. OHS report: `POST …/compliance/reports/generate` → `GET …/reports` → download PDF (`isSigned` shows if the signature was embedded).

## 7. Audit and account

- `GET /stores/{id}/audit-logs?from&to&action&status&operatorId&resource&page&pageSize` (US41).
- Change password: `PUT /users/{userId}/password`. Forgot password flow: `guides` link in `security/authentication.md`.

## 8. Error cases worth designing for

404 on any store route = store not owned/does not exist (redirect to store list). 400 with a date message = fix the range/offset. 401 after refresh failure = sign out. 409 on binding/checklist submit = stale view, reload.
