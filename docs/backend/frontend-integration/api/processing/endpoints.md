# Processing (IoT telemetry & relay) — endpoints

Device telemetry read side, anomalies, relay commands and the Edge API ingestion endpoints (API-key protected).

> **Conventions for every endpoint on this page**
> - Base path `/api/v1`. Route segments are lower-case kebab-case; JSON property names are camelCase.
> - Unless the *Auth* line says *Public* or *Edge API key*, send `Authorization: Bearer <accessToken>`. A missing, invalid or expired token yields **401** and a suspended or unverified account yields **403**, both with the standard error envelope.
> - Every error (4xx/5xx) uses one RFC 7807 envelope, `application/problem+json`: `{ type, title, status, detail, instance, traceId, errors? }` (`errors` only on validation failures). See [`../../errors/error-contract.md`](../../errors/error-contract.md).
> - Enums are JSON strings (member names). Paginated lists take `?page=1&pageSize=20` (max 100) and return `PagedResponse<T>` = `{ items, page, pageSize, totalCount, totalPages, hasMore }`.
> - Payload type names (`*Request` / `*Response`) are defined in [`../../schemas/requests.ts`](../../schemas/requests.ts) and [`../../schemas/responses.ts`](../../schemas/responses.ts). JSON samples below are illustrative values with the exact property names and shapes the server uses.
> - "Owner-scoped" routes (`technicianId`, `ownerId`, `homeownerId`, `storeId`...) are checked against the caller's identity server-side; a mismatch returns **404** (`detail`: `Resource not found.`) (or **403** when the caller has no eligible profile).

## Index

| Method | URI | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/v1/iot/devices/{deviceId}/status` | Get device status | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/iot/devices/{deviceId}/readings/recent` | Get recent readings in time window | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/iot/devices/properties/{propertyId}/anomalies` | Get active anomalies by property | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/iot/devices/{deviceId}/relay/history` | Get relay command history for device | Bearer JWT, or Edge API key (`X-Api-Key`) where noted |
| `POST` | `/api/v1/iot/devices/anomalies/{anomalyId}/acknowledge` | Acknowledge an anomaly manually | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/iot/devices/anomalies/{anomalyId}/force-resolve` | Force resolve a CRITICAL anomaly | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/iot/edge/readings` | Receive a sensor reading from the Edge API | Edge API key (`X-Api-Key`) |
| `POST` | `/api/v1/iot/edge/sync-batch` | Synchronize readings buffered during a connection loss | Edge API key (`X-Api-Key`) |
| `POST` | `/api/v1/iot/edge/anomalies` | Report an edge-detected anomaly from firmware | Edge API key (`X-Api-Key`) |
| `POST` | `/api/v1/iot/edge/relay/acknowledge` | Acknowledge relay command execution from device | Edge API key (`X-Api-Key`) |
| `GET` | `/api/v1/iot/edge/devices/{deviceId}/thresholds` | Get device thresholds for Edge sync | Edge API key (`X-Api-Key`) |
| `POST` | `/api/v1/iot/devices/{deviceId}/relay` | Issue relay command (technician) | Bearer JWT (global request authorization) |

## `GET /api/v1/iot/devices/{deviceId}/status`

**Get device status**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceMonitoringController.GetDeviceStatus`

**Path parameters**

| Name | Type |
|---|---|
| `deviceId` | `string` |

**Success response** — `200` · `DeviceStatusResponse`

```json
{
  "deviceId": "dev-0001",
  "propertyId": "prop-4d5e6f70",
  "connectionStatus": "string",
  "streamStatus": "string",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "lastReading": {
    "voltage": 220.4,
    "current": 6.8,
    "powerFactor": 0.93,
    "frequency": 60.0,
    "timestamp": "2026-03-14T15:30:00Z"
  },
  "activeAnomalies": [
    {
      "anomalyId": "anom-8d9e0f1a",
      "anomalyType": "CURRENT_LEAKAGE",
      "severity": "CRITICAL",
      "detectedAt": "2026-03-14T15:30:00Z"
    }
  ],
  "currentRelayState": "Closed"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/iot/devices/{deviceId}/readings/recent`

**Get recent readings in time window**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceMonitoringController.GetRecentReadings`

**Path parameters**

| Name | Type |
|---|---|
| `deviceId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `windowMinutes` | `int` | `60` |

**Success response** — `200` · `RecentReadingsResponse`

```json
{
  "deviceId": "dev-0001",
  "propertyId": "prop-4d5e6f70",
  "windowMinutes": 15,
  "readings": [
    {
      "voltage": 220.4,
      "current": 6.8,
      "powerFactor": 0.93,
      "frequency": 60.0,
      "timestamp": "2026-03-14T15:30:00Z"
    }
  ],
  "averageConsumptionKw": 1.5,
  "peakCurrentLast60Min": 6.8
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/iot/devices/properties/{propertyId}/anomalies`

**Get active anomalies by property**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceMonitoringController.GetActiveAnomalies`

**Path parameters**

| Name | Type |
|---|---|
| `propertyId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<AnomalyResponse>`

```json
{
  "items": [
    {
      "anomalyId": "anom-8d9e0f1a",
      "deviceId": "dev-0001",
      "propertyId": "prop-4d5e6f70",
      "anomalyType": "CURRENT_LEAKAGE",
      "severity": "CRITICAL",
      "detectionLayer": "string",
      "status": "Active",
      "detectedAt": "2026-03-14T15:30:00Z",
      "resolvedAt": "2026-03-14T15:30:00Z",
      "autoRelayActivated": true
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "hasMore": false
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/iot/devices/{deviceId}/relay/history`

**Get relay command history for device**

- **Auth:** Bearer JWT, or Edge API key (`X-Api-Key`) where noted
- **Machine access:** also accepts `X-Api-Key` (Edge key) because the route is marked `AllowEdgeApiKey` and additionally requires device allow-listing (`EdgeApi:RelayHistory:AllowedDeviceIds`).
- **Source:** `DeviceMonitoringController.GetRelayHistory`

**Path parameters**

| Name | Type |
|---|---|
| `deviceId` | `string` |

**Success response** — `200` · `RelayCommandHistoryResponse`

```json
{
  "deviceId": "dev-0001",
  "currentRelayState": "Closed",
  "lastCommandAt": "2026-03-14T15:30:00Z",
  "commands": [
    {
      "commandId": "cmd-1f2a3b4c",
      "targetRelayState": "Open",
      "requestedBy": "string",
      "authorizationSource": "string",
      "serviceRequestId": "serviceRequest-0001",
      "status": "ACTIVE",
      "issuedAt": "2026-03-14T15:30:00Z",
      "executedAt": "2026-03-14T15:30:00Z",
      "failureReason": "string"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot/devices/anomalies/{anomalyId}/acknowledge`

**Acknowledge an anomaly manually**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceMonitoringController.AcknowledgeAnomaly`

**Path parameters**

| Name | Type |
|---|---|
| `anomalyId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot/devices/anomalies/{anomalyId}/force-resolve`

**Force resolve a CRITICAL anomaly**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceMonitoringController.ForceResolveAnomaly`

**Path parameters**

| Name | Type |
|---|---|
| `anomalyId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot/edge/readings`

**Receive a sensor reading from the Edge API**

- **Auth:** Edge API key (`X-Api-Key`)
- **Source:** `EdgeIngestionController.IngestReading`

**Request body** — `IngestReadingRequest` (`application/json`)

```json
{
  "deviceId": "dev-0001",
  "readingId": "reading-0001",
  "timestamp": "2026-03-14T15:30:00Z",
  "voltage": 220.4,
  "current": 6.8,
  "powerFactor": 0.93,
  "frequency": 60.0,
  "source": "EdgeDevice",
  "leakageCurrentAmps": 6.8,
  "relativeHumidityPercent": 1.5,
  "panelSurfaceMoistureDetected": true
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/iot/edge/sync-batch`

**Synchronize readings buffered during a connection loss**

- **Auth:** Edge API key (`X-Api-Key`)
- **Source:** `EdgeIngestionController.SyncOfflineBatch`

**Request body** — `SyncOfflineReadingsBatchRequest` (`application/json`)

```json
{
  "panelId": "panel-0001",
  "readings": [
    {
      "deviceId": "dev-0001",
      "readingId": "reading-0001",
      "timestamp": "2026-03-14T15:30:00Z",
      "voltage": 220.4,
      "current": 6.8,
      "powerFactor": 0.93,
      "frequency": 60.0,
      "source": "EdgeDevice",
      "leakageCurrentAmps": 6.8,
      "relativeHumidityPercent": 1.5,
      "panelSurfaceMoistureDetected": true
    }
  ]
}
```

**Success response** — `200` · `OfflineSyncResponse`

```json
{
  "panelId": "panel-0001",
  "received": 15,
  "accepted": 15,
  "duplicates": 15,
  "conflicts": 15,
  "rejected": 15,
  "synchronizedAtUtc": "2026-03-14T15:30:00Z",
  "results": [
    {
      "readingId": "reading-0001",
      "status": "ACTIVE",
      "reason": "Customer request"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `409` Conflict with current state / duplicate

## `POST /api/v1/iot/edge/anomalies`

**Report an edge-detected anomaly from firmware**

- **Auth:** Edge API key (`X-Api-Key`)
- **Source:** `EdgeIngestionController.ReportEdgeAnomaly`

**Request body** — `ReportEdgeAnomalyRequest` (`application/json`)

```json
{
  "deviceId": "dev-0001",
  "anomalyType": "CURRENT_LEAKAGE",
  "triggerReadingId": "triggerReading-0001",
  "edgeAlertPayloadJson": "string"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot/edge/relay/acknowledge`

**Acknowledge relay command execution from device**

- **Auth:** Edge API key (`X-Api-Key`)
- **Source:** `EdgeIngestionController.AcknowledgeRelay`

**Request body** — `AcknowledgeRelayRequest` (`application/json`)

```json
{
  "commandId": "cmd-1f2a3b4c",
  "deviceId": "dev-0001",
  "executedSuccessfully": true,
  "executedAt": "2026-03-14T15:30:00Z"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/iot/edge/devices/{deviceId}/thresholds`

**Get device thresholds for Edge sync**

- **Auth:** Edge API key (`X-Api-Key`)
- **Source:** `EdgeIngestionController.GetDeviceThresholds`

**Path parameters**

| Name | Type |
|---|---|
| `deviceId` | `string` |

**Success response** — `200` · `DeviceThresholdResponse`

```json
{
  "deviceId": "dev-0001",
  "thresholds": {
    "normalLimit": 1.5,
    "alertLimit": 1.5,
    "nominalVoltage": 220.4,
    "maxConsumptionWatts": 1.5,
    "maxCurrentAmps": 6.8,
    "minPowerFactor": 0.93,
    "nominalFrequency": 60.0,
    "disconnectionThresholdMin": 15
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot/devices/{deviceId}/relay`

**Issue relay command (technician)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `RelayControlController.IssueRelayCommand`

**Path parameters**

| Name | Type |
|---|---|
| `deviceId` | `string` |

**Request body** — `IssueRelayCommandRequest` (`application/json`)

```json
{
  "targetRelayState": "Open",
  "propertyId": "prop-4d5e6f70",
  "serviceRequestId": "serviceRequest-0001"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
