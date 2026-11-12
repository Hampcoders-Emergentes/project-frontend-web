# External alert channels (SMS gateway, webhook, email) and dispatch

Alert delivery has two stages:

1. **In-app real-time** — SignalR `ReceiveAlert` (see [`signalr-alerts-hub.md`](./signalr-alerts-hub.md)).
2. **External fallback** — a persisted queue (`AlertDispatch`) processed by `AlertDispatchWorker`, with retries, to the routes configured per store.

An alert is raised when telemetry is materialized, a user reports an anomaly manually (`POST …/anomalies`), or the Edge calls `POST /api/v1/alerts/dispatch { alertId }` (Edge key; answers `202 AlertDispatchResultResponse { alertId, storeId, severity, realtimePublished, externalDispatchesQueued }`). Routing comes from `GET/PUT /api/v1/stores/{storeId}/notification-preferences` (channel, destination, recipient role, urgency levels `CRITICAL`/`NON_CRITICAL`, enabled). Critical alerts can additionally escalate to `Notifications:CriticalEscalation:{WebhookUrl,SmsNumber}`.

## Channels

| Channel | Implementation | Real delivery? |
|---|---|---|
| `EMAIL` | `EmailAlertChannel` → `IEmailSender` | Only if SMTP is configured (otherwise logged). |
| `SMS` | `HttpSmsGatewayAlertChannel` when `Notifications:Sms:GatewayUrl` is set: `POST {to, message, sender}` with `Authorization: Bearer <Notifications:Sms:ApiKey>`, message truncated to 320 chars, timeout `Notifications:Sms:TimeoutSeconds` (10). **Otherwise `LoggingSmsAlertChannel`: the SMS is only written to the server log** (phone masked). | Only with a gateway URL. |
| `WEBHOOK` | `WebhookAlertChannel`: JSON `POST` to a public `https` URL; HMAC signature header `X-Electrolink-Signature` when `Notifications:Webhook:SigningSecret` is set. | Yes (destination validated at save and at delivery). |
| `DASHBOARD_PUSH` | Realtime push through the hub. | Yes (hub mapped). |

Webhook body (camelCase):

```json
{
  "event": "alert.raised",
  "alert": {
    "alertId": "alert-6b1d2c3e4f5a60718293a4b5c6d7e8f9", "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
    "storeName": "Downtown store", "areaName": "Hot line",
    "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9", "equipmentName": "Walk-in fridge",
    "anomalyType": "CURRENT_LEAKAGE", "severity": "CRITICAL", "isCriticalLeakage": true,
    "occurredAtUtc": "2026-03-14T15:30:00Z"
  },
  "subject": "string",
  "text": "string"
}
```

Receiver verification: `expected = "sha256=" + lowercaseHex(HMAC_SHA256(secret, rawBody))`; compare in constant time against `X-Electrolink-Signature`.

## Frontend implications

- Notification settings screen: validate webhook URLs client-side as public `https` (server rejects loopback/private/`.local`/`.internal`, credentials in the URL, > 254 chars).
- Do not promise SMS delivery in the UI unless the deployment has an SMS gateway configured — no endpoint reports provider configuration; ask the deployment owner.
