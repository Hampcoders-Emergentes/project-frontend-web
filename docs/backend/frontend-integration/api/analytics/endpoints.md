# Analytics — endpoints

Per-store energy consumption, cost projection, reports, comparisons, off-hours consumption, budgets, wear prediction and technician metrics.

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
| `GET` | `/api/v1/stores/{storeId}/analytics/consumption` | Get (analytics consumption) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/consumption/report` | Report (consumption report) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/consumption` | Get equipment consumption (equipment consumption) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/cost-projection` | Get cost projection (analytics cost projection) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/analytics/reports` | Generate (analytics reports) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/reports/{reportId}/download` | Download (reports download) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/comparison` | Compare (analytics comparison) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/off-hours-consumption` | Off hours (analytics off hours consumption) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/opening-hours` | Get opening hours (analytics opening hours) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/stores/{storeId}/analytics/opening-hours` | Put opening hours (analytics opening hours) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/stores/{storeId}/analytics/budget` | Put budget (analytics budget) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/analytics/budget-status` | Budget status (analytics budget status) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/maintenance/predictions` | Predictions (maintenance predictions) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/technician-metrics/{technicianId}` | Get performance dashboard for a technician | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/technician-metrics/{technicianId}/initialize-period` | Initialize a new metrics period | Bearer JWT (global request authorization) |

## `GET /api/v1/stores/{storeId}/analytics/consumption`

**Get (analytics consumption)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreConsumptionController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `from` | `string?` | optional |
| `to` | `string?` | optional |
| `granularity` | `string` | `"hourly"` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `StoreConsumptionResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "fromUtc": "2026-03-14T15:30:00Z",
  "toUtc": "2026-03-14T15:30:00Z",
  "granularity": "hourly",
  "totalKwh": 12.5,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "kwh": 12.5,
      "peakKw": 1.5,
      "sampleCount": 3,
      "series": [
        {
          "startUtc": "2026-03-14T15:30:00Z",
          "kwh": 12.5
        }
      ]
    }
  ],
  "series": [
    {
      "startUtc": "2026-03-14T15:30:00Z",
      "kwh": 12.5
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/analytics/consumption/report`

**Report (consumption report)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreConsumptionController.Report`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `from` | `string?` | optional |
| `to` | `string?` | optional |
| `granularity` | `string` | `"hourly"` |
| `format` | `string` | `"csv"` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Response** — `200` binary file (`text/csv`) with `Content-Disposition`; read it as a `Blob`, not JSON.

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/consumption`

**Get equipment consumption (equipment consumption)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyCostController.GetEquipmentConsumption`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `from` | `string?` | optional |
| `to` | `string?` | optional |
| `granularity` | `string` | `"daily"` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `EquipmentPowerConsumptionResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "equipmentName": "string",
  "fromUtc": "2026-03-14T15:30:00Z",
  "toUtc": "2026-03-14T15:30:00Z",
  "granularity": "hourly",
  "timeZone": "America/Lima",
  "kwh": 12.5,
  "peakKw": 1.5,
  "averageKw": 1.5,
  "sampleCount": 3,
  "cost": {
    "currency": "PEN",
    "baseRatePerKwh": 12.5,
    "totalCost": 120.5,
    "peakKwh": 12.5,
    "offPeakKwh": 12.5,
    "peakCost": 120.5,
    "offPeakCost": 120.5
  },
  "series": [
    {
      "startUtc": "2026-03-14T15:30:00Z",
      "kwh": 12.5,
      "cost": 120.5
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/analytics/cost-projection`

**Get cost projection (analytics cost projection)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyCostController.GetCostProjection`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreCostForecastResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "currency": "PEN",
  "timeZone": "America/Lima",
  "monthStartUtc": "2026-03-14T15:30:00Z",
  "monthEndUtc": "2026-03-14T15:30:00Z",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "monthToDateKwh": 12.5,
  "monthToDateCost": 120.5,
  "elapsedDays": 1.5,
  "daysInMonth": 1.5,
  "method": "moving-average",
  "projectedKwh": 12.5,
  "projectedCost": 120.5,
  "linearProjectedCost": 120.5,
  "movingAverageProjectedCost": 120.5,
  "daily": [
    {
      "date": "2026-03-09",
      "kwh": 12.5,
      "cost": 120.5
    }
  ],
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "monthToDateKwh": 12.5,
      "monthToDateCost": 120.5,
      "projectedCost": 120.5
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/stores/{storeId}/analytics/reports`

**Generate (analytics reports)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyCostController.Generate`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `GenerateEnergyReportRequest` (`application/json`)

```json
{
  "from": "2026-03-01T00:00:00-05:00",
  "to": "2026-03-01T00:00:00-05:00",
  "format": "csv"
}
```

**Success response** — `201` · `EnergyReportResponse`

```json
{
  "reportId": "report-0f1e2d3c",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "format": "csv",
  "fileName": "string",
  "contentType": "string",
  "sizeBytes": 15,
  "fromUtc": "2026-03-14T15:30:00Z",
  "toUtc": "2026-03-14T15:30:00Z",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "expiresAtUtc": "2026-03-14T15:30:00Z",
  "downloadUrl": "https://example.com/downloadUrl"
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/analytics/reports/{reportId}/download`

**Download (reports download)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyCostController.Download`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `reportId` | `string` |

**Response** — `200` binary file (`application/pdf` or `text/csv` (the report's `contentType`)) with `Content-Disposition`; read it as a `Blob`, not JSON.

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/analytics/comparison`

**Compare (analytics comparison)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.Compare`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `period1From` | `string?` | optional |
| `period1To` | `string?` | optional |
| `period2From` | `string?` | optional |
| `period2To` | `string?` | optional |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `ConsumptionComparisonResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "currency": "PEN",
  "period1": {
    "fromUtc": "2026-03-14T15:30:00Z",
    "toUtc": "2026-03-14T15:30:00Z",
    "days": 1.5,
    "kwh": 12.5,
    "cost": 120.5,
    "averageDailyKwh": 12.5
  },
  "period2": {
    "fromUtc": "2026-03-14T15:30:00Z",
    "toUtc": "2026-03-14T15:30:00Z",
    "days": 1.5,
    "kwh": 12.5,
    "cost": 120.5,
    "averageDailyKwh": 12.5
  },
  "kwhDifference": 12.5,
  "costDifference": 120.5,
  "kwhChangePercent": 12.5,
  "costChangePercent": 120.5,
  "averageDailyKwhChangePercent": 12.5,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "period1Kwh": 12.5,
      "period2Kwh": 12.5,
      "period1Cost": 120.5,
      "period2Cost": 120.5,
      "kwhChangePercent": 12.5,
      "costChangePercent": 120.5
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/analytics/off-hours-consumption`

**Off hours (analytics off hours consumption)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.OffHours`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `from` | `string?` | `null` |
| `to` | `string?` | `null` |
| `standbyThresholdKw` | `double` | `0.1` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `OffHoursConsumptionResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "fromUtc": "2026-03-14T15:30:00Z",
  "toUtc": "2026-03-14T15:30:00Z",
  "timeZone": "America/Lima",
  "currency": "PEN",
  "standbyThresholdKw": 1.5,
  "totalKwh": 12.5,
  "totalCost": 120.5,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "episodes": 15,
      "kwh": 12.5,
      "cost": 120.5,
      "peakKw": 1.5
    }
  ],
  "episodes": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "startUtc": "2026-03-14T15:30:00Z",
      "endUtc": "2026-03-14T15:30:00Z",
      "kwh": 12.5,
      "cost": 120.5,
      "peakKw": 1.5,
      "averageKw": 1.5,
      "sampleCount": 3
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/analytics/opening-hours`

**Get opening hours (analytics opening hours)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.GetOpeningHours`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreOpeningHoursResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "timeZone": "America/Lima",
  "isConfigured": true,
  "days": [
    {
      "dayOfWeek": "Monday",
      "openTime": "08:00",
      "closeTime": "22:00"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/stores/{storeId}/analytics/opening-hours`

**Put opening hours (analytics opening hours)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.PutOpeningHours`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `SetOpeningHoursRequest` (`application/json`)

```json
{
  "days": [
    {
      "dayOfWeek": "Monday",
      "openTime": "08:00",
      "closeTime": "22:00"
    }
  ]
}
```

**Success response** — `200` · `StoreOpeningHoursResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "timeZone": "America/Lima",
  "isConfigured": true,
  "days": [
    {
      "dayOfWeek": "Monday",
      "openTime": "08:00",
      "closeTime": "22:00"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/stores/{storeId}/analytics/budget`

**Put budget (analytics budget)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.PutBudget`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `SetEnergyBudgetRequest` (`application/json`)

```json
{
  "year": 2026,
  "month": 3,
  "targetKWh": 12.5,
  "alertThresholdPercentage": 1.5
}
```

**Success response** — `200` · `StoreEnergyBudgetResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "year": 2026,
  "month": 3,
  "targetKWh": 12.5,
  "alertThresholdPercentage": 1.5,
  "updatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/analytics/budget-status`

**Budget status (analytics budget status)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.BudgetStatus`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `year` | `int?` | `null` |
| `month` | `int?` | `null` |

**Success response** — `200` · `BudgetStatusResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "year": 2026,
  "month": 3,
  "timeZone": "America/Lima",
  "status": "ON_TRACK",
  "isWarning": true,
  "targetKWh": 12.5,
  "alertThresholdPercentage": 1.5,
  "consumedKwh": 12.5,
  "consumedPercentage": 1.5,
  "remainingKwh": 12.5,
  "projectedKwh": 12.5,
  "projectedPercentage": 1.5,
  "monthStartUtc": "2026-03-14T15:30:00Z",
  "monthEndUtc": "2026-03-14T15:30:00Z",
  "generatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/maintenance/predictions`

**Predictions (maintenance predictions)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreEnergyPlanningController.Predictions`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `days` | `int` | `14` |

**Success response** — `200` · `MaintenancePredictionsResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "fromUtc": "2026-03-14T15:30:00Z",
  "toUtc": "2026-03-14T15:30:00Z",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "analysedEquipment": 15,
  "insufficientDataEquipmentIds": [
    "string"
  ],
  "predictions": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "severity": "CRITICAL",
      "runningSamples": 15,
      "baselinePowerFactor": 0.93,
      "recentPowerFactor": 0.93,
      "powerFactorSlopePerDay": 0.93,
      "daysToPowerFactorLimit": 0.93,
      "baselineFluctuationIndex": 1.5,
      "recentFluctuationIndex": 1.5,
      "findings": [
        {
          "code": "PANEL_ACCESS_CLEAR",
          "severity": "CRITICAL",
          "description": "Description text",
          "recommendedAction": "string"
        }
      ],
      "recommendedWindow": {
        "startUtc": "2026-03-14T15:30:00Z",
        "endUtc": "2026-03-14T15:30:00Z",
        "reason": "Customer request"
      }
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/technician-metrics/{technicianId}`

**Get performance dashboard for a technician**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianMetricsController.GetPerformanceDashboard`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Success response** — `200` · `TechnicianMetricsResponse`

```json
{
  "metricsId": "metrics-1b2c3d4e",
  "technicianId": "tech-8a9b0c1d",
  "periodStart": "2026-03-14T15:30:00Z",
  "periodEnd": "2026-03-14T15:30:00Z",
  "completedServicesCount": 3,
  "ioTServicesCount": 3,
  "averageRating": 1.5,
  "totalRevenueAmount": 120.5,
  "totalRevenueCurrency": "string",
  "averageResponseTime": "00:12:30",
  "clientRetentionRate": 1.5,
  "lastCalculatedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/technician-metrics/{technicianId}/initialize-period`

**Initialize a new metrics period**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianMetricsController.InitializePeriod`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Success response** — `200` · `MessageResponse`

```json
{
  "message": "Operation completed."
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
