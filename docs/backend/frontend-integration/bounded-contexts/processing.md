# Processing (IoT telemetry, anomalies, relay)

**Endpoints:** [`../api/processing/endpoints.md`](../api/processing/endpoints.md) · Integrations: [`mqtt-broker`](../integrations/mqtt-broker.md), [`edge-api`](../integrations/edge-api.md)

## Responsibilities

Receives device readings (MQTT and the Edge HTTP API), keeps a **reading stream** per device, runs anomaly detection, exposes device status/recent readings/active anomalies, and issues **relay commands** (open/close circuits) to devices. It also feeds the store-monitoring flow: readings of devices bound to store equipment are forwarded to StoreManagement's telemetry service.

## Model

| Element | Kind | Notes |
|---|---|---|
| `DeviceReadingStream` | Aggregate | Per device/property: `EStreamStatus` (`Active`/`Degraded`/`Inactive`), last reading, thresholds, buffered-replay handling. |
| `Reading` | Entity | `ReadingId`, voltage, current, power factor, frequency, source, optional leakage current, relative humidity, panel moisture flag. Unique by `(deviceId, readingId)`. |
| `AnomalyRecord` | Aggregate | `EAnomalyType`, `EAnomalySeverity`, `EDetectionLayer` (`Edge`/`Cloud`), `EAnomalyStatus`, detection/resolve times, `autoRelayActivated`. |
| `RelayControlCommand` | Aggregate | `ERelayTarget`, requester, authorization source, service request, `ERelayCommandStatus`, issued/executed times, failure reason. |

## Rules and invariants

- Readings are idempotent per `(device, readingId)`; same id with different values → 409 `Reading rejected.`; replayed buffered readings use source `EdgeBufferReplay` and `sync-batch` (≤ 1000 per call).
- Devices not registered/installed → 404; edge devices must also be allow-listed (403 otherwise).
- Anomaly lifecycle `Active → Acknowledged → Resolved` (or `Superseded`); `force-resolve` is only valid for **Critical** anomalies (otherwise 400).
- A stream goes `Inactive` after `disconnectionThresholdMin` without readings (`DeviceDisconnected` → Assets marks the device disconnected) and recovers on the next reading (`DeviceReconnected`).
- Relay commands require an active service for the property and technician (403 otherwise) and are timed out by a worker if the device never acknowledges.
- Read access is restricted to the device owner/authorised technician (`IDeviceAccessService`); not-owned → 404.

## Events

Published: `ReadingIngested`, `ReadingRejected`, `BufferedReadingsReplayed`, `AnomalyDetected` (→ Planning suggestions), `AnomalyAcknowledged`, `AnomalyResolved`, `StreamStatusChanged`, `DeviceDisconnected`/`DeviceReconnected` (→ external events), `RelayCommandIssued/Executed/Failed`.
Consumed: `DeviceInstalledEvent`, `DeviceDecommissionedEvent` (Assets), `ConsumptionThresholdsUpdatedEvent` (Profiles).
