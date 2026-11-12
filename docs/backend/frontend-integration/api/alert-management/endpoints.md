# Alert Management — endpoints

Alerts raised from telemetry or reported manually: history, active alerts, acknowledge/assign/resolve and the edge dispatch endpoint.

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
| `POST` | `/api/v1/alerts/dispatch` | Dispatch (alerts dispatch) | Edge API key (`X-Api-Key`) |
| `POST` | `/api/v1/alerts/{alertId}/assign` | Assign (alerts assign) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/alerts/{alertId}/resolve` | Resolve (alerts resolve) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/anomalies` | Report (equipment anomalies) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts` | List (equipment alerts) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts/{alertId}` | Get (equipment alerts) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts/{alertId}/acknowledgement` | Acknowledge (alerts acknowledgement) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/alerts` | List (stores alerts) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/alerts/active` | Active (alerts active) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/alerts/changes` | Changes (alert delta after a sequence) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/notification-channels` | Notification channel readiness | Bearer JWT (authenticated human user) |

## `POST /api/v1/alerts/dispatch`

**Dispatch (alerts dispatch)**

- **Auth:** Edge API key (`X-Api-Key`)
- **Source:** `AlertDispatchController.Dispatch`

**Request body** — `DispatchAlertRequest` (`application/json`)

```json
{
  "alertId": "alert-6b1d2c3e4f5a60718293a4b5c6d7e8f9"
}
```

**Success response** — `202` · `AlertDispatchResultResponse`

```json
{
  "alertId": "alert-6b1d2c3e4f5a60718293a4b5c6d7e8f9",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "severity": "CRITICAL",
  "realtimePublished": true,
  "externalDispatchesQueued": 15
}
```

**Status codes**

- `202` Accepted
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/alerts/{alertId}/assign`

**Assign (alerts assign)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `AlertWorkflowController.Assign`

**Path parameters**

| Name | Type |
|---|---|
| `alertId` | `string` |

**Request body** — `AssignAlertRequest` (`application/json`)

```json
{
  "technicianId": "tech-8a9b0c1d",
  "technicianName": "Luis Perez"
}
```

**Success response** — `200` · `AlertResponse`

```json
{
  "id": "id-3a4b5c6d",
  "bindingId": "binding-0001",
  "readingId": "reading-0001",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "anomalyType": "CURRENT_LEAKAGE",
  "detectionSeverity": "string",
  "severity": "CRITICAL",
  "capturedAtUtc": "2026-03-14T15:30:00Z",
  "createdAtUtc": "2026-03-14T15:30:00Z",
  "status": "OPEN",
  "acknowledgedByUserId": "acknowledgedByUser-0001",
  "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
  "isCriticalLeakage": true,
  "source": "EdgeDevice",
  "reportCategory": "string",
  "description": "Description text",
  "reportedBy": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "onDutyWorker": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "assignedTechnicianId": "assignedTechnician-0001",
  "assignedTechnicianName": "string",
  "assignedByUserId": "assignedByUser-0001",
  "assignedAtUtc": "2026-03-14T15:30:00Z",
  "resolvedByUserId": "resolvedByUser-0001",
  "resolvedAtUtc": "2026-03-14T15:30:00Z",
  "resolutionNotes": "string",
  "sequence": 42
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/alerts/{alertId}/resolve`

**Resolve (alerts resolve)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `AlertWorkflowController.Resolve`

**Path parameters**

| Name | Type |
|---|---|
| `alertId` | `string` |

**Request body** — `ResolveAlertRequest` (`application/json`)

```json
{
  "notes": "Free text notes"
}
```

**Success response** — `200` · `AlertResponse`

```json
{
  "id": "id-3a4b5c6d",
  "bindingId": "binding-0001",
  "readingId": "reading-0001",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "anomalyType": "CURRENT_LEAKAGE",
  "detectionSeverity": "string",
  "severity": "CRITICAL",
  "capturedAtUtc": "2026-03-14T15:30:00Z",
  "createdAtUtc": "2026-03-14T15:30:00Z",
  "status": "OPEN",
  "acknowledgedByUserId": "acknowledgedByUser-0001",
  "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
  "isCriticalLeakage": true,
  "source": "EdgeDevice",
  "reportCategory": "string",
  "description": "Description text",
  "reportedBy": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "onDutyWorker": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "assignedTechnicianId": "assignedTechnician-0001",
  "assignedTechnicianName": "string",
  "assignedByUserId": "assignedByUser-0001",
  "assignedAtUtc": "2026-03-14T15:30:00Z",
  "resolvedByUserId": "resolvedByUser-0001",
  "resolvedAtUtc": "2026-03-14T15:30:00Z",
  "resolutionNotes": "string",
  "sequence": 42
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/anomalies`

**Report (equipment anomalies)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentAnomalyReportsController.Report`
- **Idempotency:** optional `Idempotency-Key` header (retries replay the first successful response).

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Request body** — `ReportEquipmentAnomalyRequest` (`application/json`)

```json
{
  "category": "SPARKS",
  "description": "Description text",
  "reportedByWorkerCode": "string",
  "reportedByWorkerName": "string"
}
```

**Success response** — `201` · `AlertResponse`

```json
{
  "id": "id-3a4b5c6d",
  "bindingId": "binding-0001",
  "readingId": "reading-0001",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "anomalyType": "CURRENT_LEAKAGE",
  "detectionSeverity": "string",
  "severity": "CRITICAL",
  "capturedAtUtc": "2026-03-14T15:30:00Z",
  "createdAtUtc": "2026-03-14T15:30:00Z",
  "status": "OPEN",
  "acknowledgedByUserId": "acknowledgedByUser-0001",
  "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
  "isCriticalLeakage": true,
  "source": "EdgeDevice",
  "reportCategory": "string",
  "description": "Description text",
  "reportedBy": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "onDutyWorker": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "assignedTechnicianId": "assignedTechnician-0001",
  "assignedTechnicianName": "string",
  "assignedByUserId": "assignedByUser-0001",
  "assignedAtUtc": "2026-03-14T15:30:00Z",
  "resolvedByUserId": "resolvedByUser-0001",
  "resolvedAtUtc": "2026-03-14T15:30:00Z",
  "resolutionNotes": "string",
  "sequence": 42
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts`

**List (equipment alerts)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentAlertsController.List`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `status` | `string?` | `null` |
| `severity` | `string?` | `null` |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |
| `from` | `string?` | `null` |
| `to` | `string?` | `null` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `HasMorePageResponse<AlertResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "bindingId": "binding-0001",
      "readingId": "reading-0001",
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "anomalyType": "CURRENT_LEAKAGE",
      "detectionSeverity": "string",
      "severity": "CRITICAL",
      "capturedAtUtc": "2026-03-14T15:30:00Z",
      "createdAtUtc": "2026-03-14T15:30:00Z",
      "status": "OPEN",
      "acknowledgedByUserId": "acknowledgedByUser-0001",
      "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
      "isCriticalLeakage": true,
      "source": "EdgeDevice",
      "reportCategory": "string",
      "description": "Description text",
      "reportedBy": {
        "workerCode": "W-014",
        "workerName": "Carlos Ruiz"
      },
      "onDutyWorker": {
        "workerCode": "W-014",
        "workerName": "Carlos Ruiz"
      },
      "assignedTechnicianId": "assignedTechnician-0001",
      "assignedTechnicianName": "string",
      "assignedByUserId": "assignedByUser-0001",
      "assignedAtUtc": "2026-03-14T15:30:00Z",
      "resolvedByUserId": "resolvedByUser-0001",
      "resolvedAtUtc": "2026-03-14T15:30:00Z",
      "resolutionNotes": "string",
      "sequence": 42
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts/{alertId}`

**Get (equipment alerts)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentAlertsController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |
| `alertId` | `string` |

**Success response** — `200` · `AlertResponse`

```json
{
  "id": "id-3a4b5c6d",
  "bindingId": "binding-0001",
  "readingId": "reading-0001",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "anomalyType": "CURRENT_LEAKAGE",
  "detectionSeverity": "string",
  "severity": "CRITICAL",
  "capturedAtUtc": "2026-03-14T15:30:00Z",
  "createdAtUtc": "2026-03-14T15:30:00Z",
  "status": "OPEN",
  "acknowledgedByUserId": "acknowledgedByUser-0001",
  "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
  "isCriticalLeakage": true,
  "source": "EdgeDevice",
  "reportCategory": "string",
  "description": "Description text",
  "reportedBy": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "onDutyWorker": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "assignedTechnicianId": "assignedTechnician-0001",
  "assignedTechnicianName": "string",
  "assignedByUserId": "assignedByUser-0001",
  "assignedAtUtc": "2026-03-14T15:30:00Z",
  "resolvedByUserId": "resolvedByUser-0001",
  "resolvedAtUtc": "2026-03-14T15:30:00Z",
  "resolutionNotes": "string",
  "sequence": 42
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts/{alertId}/acknowledgement`

**Acknowledge (alerts acknowledgement)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentAlertsController.Acknowledge`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |
| `alertId` | `string` |

**Success response** — `200` · `AlertResponse`

```json
{
  "id": "id-3a4b5c6d",
  "bindingId": "binding-0001",
  "readingId": "reading-0001",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "anomalyType": "CURRENT_LEAKAGE",
  "detectionSeverity": "string",
  "severity": "CRITICAL",
  "capturedAtUtc": "2026-03-14T15:30:00Z",
  "createdAtUtc": "2026-03-14T15:30:00Z",
  "status": "OPEN",
  "acknowledgedByUserId": "acknowledgedByUser-0001",
  "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
  "isCriticalLeakage": true,
  "source": "EdgeDevice",
  "reportCategory": "string",
  "description": "Description text",
  "reportedBy": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "onDutyWorker": {
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz"
  },
  "assignedTechnicianId": "assignedTechnician-0001",
  "assignedTechnicianName": "string",
  "assignedByUserId": "assignedByUser-0001",
  "assignedAtUtc": "2026-03-14T15:30:00Z",
  "resolvedByUserId": "resolvedByUser-0001",
  "resolvedAtUtc": "2026-03-14T15:30:00Z",
  "resolutionNotes": "string",
  "sequence": 42
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/alerts`

**List (stores alerts)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreAlertsController.List`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `equipmentId` | `string?` | `null` |
| `status` | `string?` | `null` |
| `severity` | `string?` | `null` |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |
| `from` | `string?` | `null` |
| `to` | `string?` | `null` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `HasMorePageResponse<AlertResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "bindingId": "binding-0001",
      "readingId": "reading-0001",
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "anomalyType": "CURRENT_LEAKAGE",
      "detectionSeverity": "string",
      "severity": "CRITICAL",
      "capturedAtUtc": "2026-03-14T15:30:00Z",
      "createdAtUtc": "2026-03-14T15:30:00Z",
      "status": "OPEN",
      "acknowledgedByUserId": "acknowledgedByUser-0001",
      "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
      "isCriticalLeakage": true,
      "source": "EdgeDevice",
      "reportCategory": "string",
      "description": "Description text",
      "reportedBy": {
        "workerCode": "W-014",
        "workerName": "Carlos Ruiz"
      },
      "onDutyWorker": {
        "workerCode": "W-014",
        "workerName": "Carlos Ruiz"
      },
      "assignedTechnicianId": "assignedTechnician-0001",
      "assignedTechnicianName": "string",
      "assignedByUserId": "assignedByUser-0001",
      "assignedAtUtc": "2026-03-14T15:30:00Z",
      "resolvedByUserId": "resolvedByUser-0001",
      "resolvedAtUtc": "2026-03-14T15:30:00Z",
      "resolutionNotes": "string",
      "sequence": 42
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/alerts/active`

**Active (alerts active)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreAlertsController.Active`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `equipmentId` | `string?` | `null` |

**Success response** — `200` · `ActiveAlertsResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "openCritical": 15,
  "openNonCritical": 15,
  "hasCriticalLeakage": true,
  "latestSequence": 42,
  "items": [
    {
      "id": "id-3a4b5c6d",
      "bindingId": "binding-0001",
      "readingId": "reading-0001",
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "anomalyType": "CURRENT_LEAKAGE",
      "detectionSeverity": "string",
      "severity": "CRITICAL",
      "capturedAtUtc": "2026-03-14T15:30:00Z",
      "createdAtUtc": "2026-03-14T15:30:00Z",
      "status": "OPEN",
      "acknowledgedByUserId": "acknowledgedByUser-0001",
      "acknowledgedAtUtc": "2026-03-14T15:30:00Z",
      "isCriticalLeakage": true,
      "source": "EdgeDevice",
      "reportCategory": "string",
      "description": "Description text",
      "reportedBy": {
        "workerCode": "W-014",
        "workerName": "Carlos Ruiz"
      },
      "onDutyWorker": {
        "workerCode": "W-014",
        "workerName": "Carlos Ruiz"
      },
      "assignedTechnicianId": "assignedTechnician-0001",
      "assignedTechnicianName": "string",
      "assignedByUserId": "assignedByUser-0001",
      "assignedAtUtc": "2026-03-14T15:30:00Z",
      "resolvedByUserId": "resolvedByUser-0001",
      "resolvedAtUtc": "2026-03-14T15:30:00Z",
      "resolutionNotes": "string",
      "sequence": 42
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

`latestSequence` is the store's alert change sequence the snapshot is consistent with: keep it and pass it as
`afterSequence` to [`GET .../alerts/changes`](#get-apiv1storesstoreidalertschanges) after a hub reconnect.

## `GET /api/v1/stores/{storeId}/alerts/changes`

**Changes (alert delta after a sequence)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreAlertsController.Changes`

Every alert creation and state change (raise, manual report, acknowledge, assign, resolve) takes the store's next
**change sequence** in the same transaction, so sequences become visible in commit order. This endpoint returns the
current state of every alert whose latest change is after `afterSequence` (one entry per alert, ordered by `sequence`)
and the cursor for the next call. Use it when the SignalR connection to `/hubs/alerts` is re-established instead of
reloading full lists.

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default | Notes |
|---|---|---|---|
| `afterSequence` | `long` | `0` | Highest `sequence` the client has applied (from `alerts/active.latestSequence`, a previous call, or a `ReceiveAlert` payload). Must be ≥ 0. |
| `limit` | `int` | `100` | 1–200. |
| `equipmentId` | `string?` | `null` | Optional equipment filter (same rules as `alerts/active`). |

**Success response** — `200` · `AlertChangesResponse`

```json
{
  "items": [
    { "id": "alert-9f2c", "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9", "status": "ACKNOWLEDGED", "severity": "CRITICAL", "sequence": 43 },
    { "id": "alert-a11d", "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9", "status": "OPEN", "severity": "NON_CRITICAL", "sequence": 44 }
  ],
  "latestSequence": 44,
  "hasMore": false
}
```

(Items are full `AlertResponse` objects; shortened here.)

- `hasMore: true` → the page was cut at `limit`; call again at once with `afterSequence = latestSequence`.
- `latestSequence < afterSequence` → the server does not know your cursor (e.g. data reset): reload `alerts/active`.
- Alerts last changed before sequencing was deployed have `sequence: 0` and are only in the full lists.

**Status codes**

- `200` OK
- `400` `VALIDATION_FAILED` — negative `afterSequence` or `limit` outside 1–200
- `401` Missing, invalid or expired credentials
- `404` `STORE_NOT_FOUND` — store unknown or not owned by the caller

## `GET /api/v1/notification-channels`

**Notification channel readiness**

- **Auth:** Bearer JWT (any authenticated, active user)
- **Source:** `NotificationChannelsController.List`

Tells the UI which alert channels actually reach people in this deployment, so it can warn before a manager routes
alerts to a channel that is only logged. The answer is derived from the providers registered at startup (the same
decision the delivery code makes) and never contains hostnames, URLs, keys or credentials. Cached privately for 60 s.

| `channel` | `DELIVERED` when | otherwise |
|---|---|---|
| `EMAIL` | `Email:Smtp:Host` is set (SMTP sender) | `LOG_ONLY` (logging sender) |
| `SMS` | `Notifications:Sms:GatewayUrl` is set (HTTP SMS gateway) | `LOG_ONLY` (masked log line) |
| `DASHBOARD_PUSH` | SignalR `AlertsHub` is mapped (always in this API) | — |
| `WEBHOOK` | the webhook dispatcher is registered (always; each route supplies its own https URL) | — |

**Success response** — `200` · `NotificationChannelsResponse` (always the four channels, in this order)

```json
{
  "items": [
    { "channel": "EMAIL", "deliveryMode": "LOG_ONLY", "configured": false },
    { "channel": "SMS", "deliveryMode": "LOG_ONLY", "configured": false },
    { "channel": "DASHBOARD_PUSH", "deliveryMode": "DELIVERED", "configured": true },
    { "channel": "WEBHOOK", "deliveryMode": "DELIVERED", "configured": true }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
