# Kitchen touch-panel — integration guide

Persona: kitchen staff using the panel next to the equipment. The panel app signs in with the store owner's/operator's IAM user (there is no separate panel account or device-token auth for human routes) and needs fast, glanceable reads. Stories: US08–US15, US23, US42; TS03 for the offline gateway behind it.

> The Edge gateway that feeds sensors uses the **Edge API key** and is a different client (see `integrations/edge-api.md`). The panel UI itself must never hold that key.

## 1. Start-up

1. Sign in (or restore session), pick the store (`GET /stores`), remember `storeId`.
2. Load `GET /stores/{id}/layout` for the floor plan (equipment positions + `riskLevel` per item) and `GET /stores/{id}/panel/pause` for the lock state.
3. Connect to SignalR (`signalr-alerts-hub.md`) and use polling as fallback: `GET …/alerts/active` every 5–10 s; `GET …/panel/pause` every 5 s while locked else 30 s; `GET …/dashboard-summary` every 15 s.

## 2. Screens

| Screen | Calls | Notes |
|---|---|---|
| Floor plan with risk colors (US08) | `GET …/layout` → per item `riskLevel`; tap → `GET …/areas/{a}/equipment/{e}/risk-level` (reasons) | `UNKNOWN` = no sensor |
| Critical siren (US10) | `GET …/alerts/active` → while `hasCriticalLeakage` play the alarm, show items; stop when false | Acknowledge with `POST …/alerts/{id}/acknowledgement` |
| Safe to clean? (US11) | `GET …/equipment/{e}/safety-status` → big YES/NO from `isSafeToClean`, list `reasons` | Re-poll every 5 s while the screen is open |
| Shutdown protocol (US12) | `GET …/equipment/{e}/shutdown-protocol` | Cacheable per session |
| Report anomaly (US09) | `POST …/equipment/{e}/anomalies {category, description, reportedByWorkerCode?, reportedByWorkerName?}` | Category picker: noise, sparks, burning smell, overheating, flickering lights, smoke, other |
| Shift handover (US13) | `GET …/shifts/on-duty` → `POST …/shifts/handover {workerId, workerName?, shiftDate?, notes?}` → show the returned equipment snapshot | `GET …/shifts/handover` shows history |
| Emergency guide (US14) | `GET /stores/{id}/safety-guides/electrical-incident` | Response is client-cacheable for 24 h; keep an offline copy |
| Moisture warning (US15) | Appears as an alert (`MOISTURE_HAZARD`) and in `telemetry.lastMeasurement.panelSurfaceMoistureDetected` / `relativeHumidityPercent` | Treat like any non-critical alert |
| Weekly checklist (US31) | `GET …/compliance/checklists/template`, `POST …/compliance/checklists` | Save drafts often |

## 3. Cleaning pause (US42)

- Start: `POST /stores/{id}/panel/pause {durationSeconds: 15–300 (default 60), panelId?}` → `PanelPauseResponse` (`isInputLocked`, `remainingSeconds`, `endsAtUtc`).
- While `isInputLocked` is true render a lock overlay and ignore touches; countdown from `endsAtUtc` (don't trust the local timer drift beyond a few seconds — re-sync with `GET …/panel/pause`).
- End early: `DELETE …/panel/pause`. A critical alert **overrides** the pause (`endReason`, `overridingAlertId`) — unlock immediately and show the alarm.
- Multiple panels in one store share the same pause state.

## 4. Offline behaviour

The panel UI should keep working on stale data when the API is unreachable: cache the last `layout`, `shutdown-protocol` and `electrical-incident` guide; mark data older than ~2 poll intervals as stale; queue nothing that mutates safety state (anomaly reports and handovers are online-only — retry with a visible "pending" badge and avoid double submits). Sensor readings buffered by the gateway are replayed by the Edge client (`sync-batch`), not by the UI.

## 5. Errors

401 → refresh once, else back to sign-in screen with a clear message; 404 on a store route → store removed/unlinked; network errors → offline banner and exponential back-off.
