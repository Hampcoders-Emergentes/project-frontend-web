# SignalR hub — real-time alerts and store events

> **Status: mapped.** `Program.cs` calls `app.MapHub<AlertsHub>("/hubs/alerts")`; `JwtBearerEvents.OnMessageReceived` and the IAM middleware accept `?access_token=` for hub paths, and CORS (`http://localhost:4200`, credentials) applies. Keep the polling fallback below for reconnect gaps.

## Connection

| Item | Value |
|---|---|
| Hub path (documented in code) | `/hubs/alerts` |
| Transport | WebSockets with SSE/long-polling fallback (ASP.NET Core SignalR defaults) |
| Auth | Same JWT as REST. Browsers pass it as `?access_token=<jwt>` — the IAM middleware only reads the query string for paths beginning with `/hubs`. Non-browser clients can use the `Authorization` header. |
| CORS | Must be listed in `Cors:AllowedOrigins` (credentials enabled). |
| Re-validation | The user is re-loaded and must be `Active` on the connection request; the token is **not** re-checked later, so reconnect with a fresh token after refresh. |

```ts
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import type { AlertResponse, PanelPauseResponse, ShiftHandoverResponse } from '../schemas/responses';

const connection = new HubConnectionBuilder()
  .withUrl(`${API_ORIGIN}/hubs/alerts`, { accessTokenFactory: () => auth.getAccessToken() })
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Warning)
  .build();

connection.on('ReceiveAlert', (alert: AlertResponse) => { /* beep if alert.isCriticalLeakage */ });
connection.on('PanelPauseChanged', (pause: PanelPauseResponse) => { /* lock/unlock touch input */ });
connection.on('ShiftHandover', (handover: ShiftHandoverResponse) => { /* toast */ });
connection.on('ComplianceNotice', (notice: unknown) => { /* certificate expiry notice */ });
connection.onreconnected(() => connection.invoke('JoinStore', storeId)); // groups are lost on disconnect

await connection.start();
await connection.invoke('JoinStore', storeId);
```

## Hub methods (client → server)

| Method | Args | Behaviour |
|---|---|---|
| `JoinStore` | `storeId: string` | Verifies the caller owns the store (`StoreHierarchyService.GetStore`). Not owner / unknown → `HubException("Store not found.")`; no user → `HubException("Unauthorized.")`. Adds the connection to group `store:{storeId}`. |
| `LeaveStore` | `storeId: string` | Removes the connection from the group. |

## Events (server → client)

All events are delivered to the group `store:{storeId}` — a single connection serves alerts and panel/shift events.

| Event | Payload | Emitted when |
|---|---|---|
| `ReceiveAlert` | `AlertResponse` (see `schemas/responses.ts`) | A new alert is raised from telemetry, a manual anomaly report, or an edge `POST /alerts/dispatch`. `isCriticalLeakage` drives the audible alarm (US10). |
| `PanelPauseChanged` | `PanelPauseResponse` | The touchscreen sanitation pause starts, ends or is overridden by a critical alert. `isInputLocked` and `remainingSeconds` are authoritative. |
| `ShiftHandover` | `ShiftHandoverResponse` (the code publishes a `StoreManagerNotice` payload; treat the exact shape as informational and reload `GET /shifts/handover`) | A shift handover is recorded (also emailed to the store manager). |
| `ComplianceNotice` | notice object (certificates expiring) | The compliance job notifies the store manager about expiring maintenance certificates. Reload `GET /compliance/expirations` for data. |

Delivery is best-effort: publication failures are logged and **do not fail the originating REST call**. Events are not replayed after reconnect — after `onreconnected`, re-fetch `alerts/active`.

## Polling fallback (required)

| Need | Poll | Interval |
|---|---|---|
| Alert badge / siren | `GET /api/v1/stores/{storeId}/alerts/active` (`hasCriticalLeakage`, `openCritical`) | 5–10 s on the kitchen panel, 30 s on the web dashboard |
| Panel lock state | `GET /api/v1/stores/{storeId}/panel/pause` | 5 s while a pause is active, else 30 s |
| Dashboard | `GET /api/v1/stores/{storeId}/dashboard-summary` | 15–30 s |

Use exponential back-off on 5xx/network errors and stop polling hidden tabs.
