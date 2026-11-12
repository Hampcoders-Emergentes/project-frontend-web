# MQTT broker (device telemetry and relay commands)

Backend-to-device channel — **not** consumed by web/mobile clients (the SPA never connects to MQTT). Documented because devices/gateways and the relay screens depend on its behaviour.

| Item | Value |
|---|---|
| Client | `MqttDeviceSubscriberService` (MQTTnet 5), client id `Mqtt:ClientId` (`electrolink-backend`), reconnects every `Mqtt:ReconnectDelaySeconds` (5 s), `MaxReconnectAttempts=0` ⇒ forever |
| Broker config | `Mqtt:Host/Port/UseTls/Username/Password/QoS/SessionExpirySeconds`; Docker Compose uses Eclipse Mosquitto 2 (anonymous, no TLS — **dev only**) |
| Health | included in `GET /health` (`MqttHealthCheck`) |

## Topics (prefix `Mqtt:TopicPrefix` = `electrolink/device`)

| Direction | Topic | Payload |
|---|---|---|
| device → backend | `electrolink/device/{deviceId}/telemetry` | reading JSON (same fields as `IngestReadingRequest`) |
| device → backend | `electrolink/device/{deviceId}/anomaly` | edge-detected anomaly (`ReportEdgeAnomalyRequest` fields) |
| device → backend | `electrolink/device/{deviceId}/status` | `{ "<key>": "<string>" }` status map |
| device → backend | `electrolink/device/{deviceId}/command/response` | relay acknowledgement (`AcknowledgeRelayRequest` fields) |
| backend → device | `electrolink/device/{deviceId}/command` | relay command JSON, QoS `Mqtt:QoS`, not retained |

If the broker is down the backend logs `[MQTT] Cannot publish…` and the command **is not delivered** (the REST call that issued it still answers `204`; check `GET /iot/devices/{deviceId}/relay/history` for `Pending`/`Timeout`).

## Relay command lifecycle (what the UI should show)

`POST /api/v1/iot/devices/{deviceId}/relay` `{ targetRelayState: "Open"|"Closed", propertyId, serviceRequestId }` → `204`. The caller must be authorised for an **active service** on that property (`403` otherwise). Status then moves `Pending → Sent → Acknowledged → Executed` or `Failed`/`Timeout` (`RelayCommandTimeoutWorker` times out unanswered commands). There is no push event for relay results: poll relay history.
