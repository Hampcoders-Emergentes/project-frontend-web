# Monitoring (service execution) — endpoints

Execution of an assigned service: start, photos, components, report, completion, cancellation, reviews and relay toggling.

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
| `POST` | `/api/v1/service-executions/{executionId}/actions/start` | Start (actions start) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/photos/upload-url` | Get work photo upload url (photos upload url) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/photos` | Register work photo (actions photos) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/components` | Record components (actions components) | Bearer JWT (global request authorization) |
| `PUT` | `/api/v1/service-executions/{executionId}/actions/report` | Update report (actions report) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/complete` | Complete (actions complete) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/cancel` | Cancel (actions cancel) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/extend-wait` | Extend wait (actions extend wait) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/reviews/client` | Submit client review (reviews client) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/actions/reviews/technician` | Submit technician review (reviews technician) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions/{executionId}/iot/toggle-relay` | Toggle relay (iot toggle relay) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-executions` | Create service execution (service executions) | Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager` |
| `GET` | `/api/v1/service-executions/{executionId}` | Get service execution by id (service executions) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-executions/{executionId}/work-log` | Get work log (service executions work log) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-executions/technicians/{technicianId}/assigned` | Get assigned by technician (technicians assigned) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-executions/homeowners/{homeownerId}/history` | Get history by homeowner (homeowners history) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-executions/technicians/{technicianId}/history` | Get history by technician (technicians history) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-executions/homeowners/{homeownerId}/active` | Get active by homeowner (homeowners active) | Bearer JWT (global request authorization) |

## `POST /api/v1/service-executions/{executionId}/actions/start`

**Start (actions start)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.Start`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `StartServiceExecutionRequest` (`application/json`)

```json
{
  "startedAt": "2026-03-14T15:30:00Z"
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/photos/upload-url`

**Get work photo upload url (photos upload url)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.GetWorkPhotoUploadUrl`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `type` | `string` | required |

**Success response** — `200` · `WorkPhotoUploadUrlResponse`

```json
{
  "url": "https://api.cloudinary.com/v1_1/demo/image/upload",
  "signature": "a1b2c3...",
  "timestamp": 15,
  "apiKey": "123456789012345"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/photos`

**Register work photo (actions photos)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.RegisterWorkPhoto`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `RegisterWorkPhotoRequest` (`application/json`)

```json
{
  "providerId": "electrolink/sample",
  "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
  "thumbnailUrl": "https://example.com/thumbnailUrl",
  "photoType": "string",
  "format": "csv",
  "sizeBytes": 15,
  "takenAt": "2026-03-14T15:30:00Z",
  "notes": "Free text notes"
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/components`

**Record components (actions components)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.RecordComponents`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `RecordComponentsUsedRequest` (`application/json`)

```json
{
  "componentsUsed": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "componentTypeName": "string",
      "quantityUsed": 3,
      "quantityReserved": 15
    }
  ],
  "recordedAt": "2026-03-14T15:30:00Z"
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/service-executions/{executionId}/actions/report`

**Update report (actions report)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.UpdateReport`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `UpdateTechnicalReportRequest` (`application/json`)

```json
{
  "reportContent": "string",
  "findings": "string",
  "recommendations": "string",
  "updatedAt": "2026-03-14T15:30:00Z",
  "iotFindings": "string"
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/complete`

**Complete (actions complete)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.Complete`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `422` Unprocessable: business precondition failed

## `POST /api/v1/service-executions/{executionId}/actions/cancel`

**Cancel (actions cancel)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.Cancel`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `CancelServiceExecutionRequest` (`application/json`)

```json
{
  "cancelledBy": "string",
  "reason": "Customer request",
  "notes": "Free text notes",
  "requestReassignment": true
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/extend-wait`

**Extend wait (actions extend wait)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.ExtendWait`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `ExtendWaitTimeRequest` (`application/json`)

```json
{
  "extendMinutes": 15
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/reviews/client`

**Submit client review (reviews client)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.SubmitClientReview`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `SubmitReviewRequest` (`application/json`)

```json
{
  "rating": 5,
  "comment": "string",
  "categories": {
    "Professionalism": 5,
    "Punctuality": 4
  }
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/actions/reviews/technician`

**Submit technician review (reviews technician)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionActionsController.SubmitTechnicianReview`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `SubmitReviewRequest` (`application/json`)

```json
{
  "rating": 5,
  "comment": "string",
  "categories": {
    "Professionalism": 5,
    "Punctuality": 4
  }
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions/{executionId}/iot/toggle-relay`

**Toggle relay (iot toggle relay)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionIoTController.ToggleRelay`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Request body** — `ToggleRelayRequest` (`application/json`)

```json
{
  "targetState": "string"
}
```

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-executions`

**Create service execution (service executions)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager`
- **Source:** `ServiceExecutionsController.CreateServiceExecution`

**Request body** — `CreateServiceExecutionRequest` (`application/json`)

```json
{
  "assignmentId": "asg-9b8a7c6d",
  "requestId": "req-5e6f7a8b",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "recipeSnapshot": {
    "recipeId": "recipe-2e3f4a5b",
    "serviceName": "Panel inspection",
    "serviceCategory": "Inspection",
    "componentRequirements": [
      {
        "componentTypeId": "ctype-7a8b9c0d",
        "quantity": 15,
        "isRequired": true
      }
    ],
    "totalPrice": 120.5,
    "currency": "PEN",
    "estimatedDurationMinutes": 15,
    "warrantyMonths": 15,
    "snapshotAt": "2026-03-14T15:30:00Z"
  },
  "scheduledDateTime": "2026-03-14T15:30:00Z",
  "isPriority": true
}
```

**Success response** — `201` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `409` Conflict with current state / duplicate

## `GET /api/v1/service-executions/{executionId}`

**Get service execution by id (service executions)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionsController.GetServiceExecutionById`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/service-executions/{executionId}/work-log`

**Get work log (service executions work log)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionsController.GetWorkLog`

**Path parameters**

| Name | Type |
|---|---|
| `executionId` | `string` |

**Success response** — `200` · `WorkLogResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "photos": [
    {
      "photoId": "photo-6c7d8e9f",
      "photoType": "string",
      "photoUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "format": "csv",
      "sizeBytes": 15,
      "takenAt": "2026-03-14T15:30:00Z",
      "notes": "Free text notes"
    }
  ],
  "reportContent": "string",
  "findings": "string",
  "recommendations": "string",
  "reportVersion": 15,
  "components": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "quantityUsed": 3,
      "quantityReserved": 15,
      "delta": 15
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/service-executions/technicians/{technicianId}/assigned`

**Get assigned by technician (technicians assigned)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionsController.GetAssignedByTechnician`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ServiceExecutionResponse>`

```json
{
  "items": [
    {
      "executionId": "exec-1c2d3e4f",
      "assignmentId": "asg-9b8a7c6d",
      "technicianId": "tech-8a9b0c1d",
      "ownerId": "home-2b3c4d5e",
      "propertyId": "prop-4d5e6f70",
      "status": "InProgress",
      "scheduledAt": "2026-03-14T15:30:00Z",
      "startedAt": "2026-03-14T15:30:00Z",
      "completedAt": "2026-03-14T15:30:00Z",
      "serviceName": "Panel inspection",
      "serviceCategory": "Inspection",
      "totalPrice": 120.5,
      "estimatedDuration": 15,
      "isPriority": true,
      "workLog": {
        "photosCount": 3,
        "hasReport": true,
        "hasComponents": true
      }
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
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/service-executions/homeowners/{homeownerId}/history`

**Get history by homeowner (homeowners history)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionsController.GetHistoryByHomeowner`

**Path parameters**

| Name | Type |
|---|---|
| `homeownerId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ServiceExecutionResponse>`

```json
{
  "items": [
    {
      "executionId": "exec-1c2d3e4f",
      "assignmentId": "asg-9b8a7c6d",
      "technicianId": "tech-8a9b0c1d",
      "ownerId": "home-2b3c4d5e",
      "propertyId": "prop-4d5e6f70",
      "status": "InProgress",
      "scheduledAt": "2026-03-14T15:30:00Z",
      "startedAt": "2026-03-14T15:30:00Z",
      "completedAt": "2026-03-14T15:30:00Z",
      "serviceName": "Panel inspection",
      "serviceCategory": "Inspection",
      "totalPrice": 120.5,
      "estimatedDuration": 15,
      "isPriority": true,
      "workLog": {
        "photosCount": 3,
        "hasReport": true,
        "hasComponents": true
      }
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
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/service-executions/technicians/{technicianId}/history`

**Get history by technician (technicians history)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionsController.GetHistoryByTechnician`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ServiceExecutionResponse>`

```json
{
  "items": [
    {
      "executionId": "exec-1c2d3e4f",
      "assignmentId": "asg-9b8a7c6d",
      "technicianId": "tech-8a9b0c1d",
      "ownerId": "home-2b3c4d5e",
      "propertyId": "prop-4d5e6f70",
      "status": "InProgress",
      "scheduledAt": "2026-03-14T15:30:00Z",
      "startedAt": "2026-03-14T15:30:00Z",
      "completedAt": "2026-03-14T15:30:00Z",
      "serviceName": "Panel inspection",
      "serviceCategory": "Inspection",
      "totalPrice": 120.5,
      "estimatedDuration": 15,
      "isPriority": true,
      "workLog": {
        "photosCount": 3,
        "hasReport": true,
        "hasComponents": true
      }
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
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/service-executions/homeowners/{homeownerId}/active`

**Get active by homeowner (homeowners active)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceExecutionsController.GetActiveByHomeowner`

**Path parameters**

| Name | Type |
|---|---|
| `homeownerId` | `string` |

**Success response** — `200` · `ServiceExecutionResponse`

```json
{
  "executionId": "exec-1c2d3e4f",
  "assignmentId": "asg-9b8a7c6d",
  "technicianId": "tech-8a9b0c1d",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "status": "InProgress",
  "scheduledAt": "2026-03-14T15:30:00Z",
  "startedAt": "2026-03-14T15:30:00Z",
  "completedAt": "2026-03-14T15:30:00Z",
  "serviceName": "Panel inspection",
  "serviceCategory": "Inspection",
  "totalPrice": 120.5,
  "estimatedDuration": 15,
  "isPriority": true,
  "workLog": {
    "photosCount": 3,
    "hasReport": true,
    "hasComponents": true
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
