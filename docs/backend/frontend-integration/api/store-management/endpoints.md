# Store Management — endpoints

Store hierarchy (store > area > equipment), device binding, thresholds, safety, shifts, panel pause, layout, compliance and notification preferences.

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
| `GET` | `/api/v1/stores/{storeId}/compliance/checklists/template` | Template (checklists template) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/compliance/checklists` | Save checklist (compliance checklists) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/checklists` | List checklists (compliance checklists) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/equipment/{equipmentId}/certificates` | Register certificate (equipment certificates) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/equipment/{equipmentId}/certificates` | List certificates (equipment certificates) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/expirations` | Expirations (compliance expirations) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/score` | Score (compliance score) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/compliance/signature` | Register signature (compliance signature) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/signature` | Get signature (compliance signature) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/signature/image` | Get signature image (signature image) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/compliance/reports/generate` | Generate (reports generate) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/reports` | List reports (compliance reports) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/compliance/reports/{reportId}/download` | Download (reports download) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/device-binding` | Link (equipment device binding) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/device-binding` | Get binding (equipment device binding) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/telemetry` | Get state (equipment telemetry) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/measurements` | Get history (equipment measurements) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/thresholds` | Get (equipment thresholds) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/thresholds` | Put (equipment thresholds) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/safety-status` | Get safety status (equipment safety status) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/shutdown-protocol` | Get shutdown protocol (equipment shutdown protocol) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/shutdown-protocol` | Put shutdown protocol (equipment shutdown protocol) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/safety-guides/electrical-incident` | Get electrical incident guide (safety guides electrical incident) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/shifts/assignments` | Schedule (shifts assignments) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/shifts/assignments` | List (shifts assignments) | Bearer JWT (authenticated human user) |
| `DELETE` | `/api/v1/stores/{storeId}/shifts/assignments/{shiftId}` | Remove (shifts assignments) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/shifts/on-duty` | On duty (shifts on duty) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/shifts/handover` | Handover (shifts handover) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/shifts/handover` | List handovers (shifts handover) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/panel/pause` | Start (panel pause) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/panel/pause` | Get (panel pause) | Bearer JWT (authenticated human user) |
| `DELETE` | `/api/v1/stores/{storeId}/panel/pause` | End (panel pause) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/layout` | Get (stores layout) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/stores/{storeId}/layout` | Put (stores layout) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/dashboard-summary` | Get (stores dashboard summary) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/notification-preferences` | Get (stores notification preferences) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/stores/{storeId}/notification-preferences` | Put (stores notification preferences) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/risk-level` | Get risk level (equipment risk level) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/grid-status` | Get grid status (stores grid status) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/sensors/connectivity` | Get sensors connectivity (sensors connectivity) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores` | Create store (stores) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores` | List stores (stores) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}` | Get store (stores) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/areas` | Create area (stores areas) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas` | List areas (stores areas) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}` | Get area (stores areas) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment` | Create equipment (areas equipment) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment` | List equipment (areas equipment) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}` | Get equipment (areas equipment) | Bearer JWT (authenticated human user) |

## `GET /api/v1/stores/{storeId}/compliance/checklists/template`

**Template (checklists template)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.Template`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `ChecklistTemplateResponse`

```json
{
  "items": [
    {
      "code": "PANEL_ACCESS_CLEAR",
      "label": "string"
    }
  ],
  "results": [
    "string"
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/compliance/checklists`

**Save checklist (compliance checklists)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.SaveChecklist`
- **Idempotency:** optional `Idempotency-Key` header (retries replay the first successful response).

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `SaveChecklistRequest` (`application/json`)

```json
{
  "checklistId": "checklist-0001",
  "inspectorStaffId": "W-014",
  "inspectorName": "Carlos Ruiz",
  "weekOf": "2026-03-09",
  "items": [
    {
      "code": "PANEL_ACCESS_CLEAR",
      "result": "PASS",
      "notes": "Free text notes"
    }
  ],
  "observations": "string",
  "status": "ACTIVE"
}
```

**Success response** — `200` · `WeeklySafetyChecklistResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "inspectorStaffId": "W-014",
  "inspectorName": "Carlos Ruiz",
  "weekStartDate": "2026-03-09",
  "week": "2026-W11",
  "status": "SUBMITTED",
  "score": 87.5,
  "observations": "string",
  "items": [
    {
      "code": "PANEL_ACCESS_CLEAR",
      "label": "string",
      "result": "PASS",
      "notes": "Free text notes"
    }
  ],
  "createdAtUtc": "2026-03-14T15:30:00Z",
  "updatedAtUtc": "2026-03-14T15:30:00Z",
  "submittedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/compliance/checklists`

**List checklists (compliance checklists)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.ListChecklists`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `status` | `string?` | `null` |
| `fromWeek` | `DateOnly?` | `null` |
| `toWeek` | `DateOnly?` | `null` |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `ChecklistPageResponse`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "inspectorStaffId": "W-014",
      "inspectorName": "Carlos Ruiz",
      "weekStartDate": "2026-03-09",
      "week": "2026-W11",
      "status": "SUBMITTED",
      "score": 87.5,
      "observations": "string",
      "items": [
        {
          "code": "PANEL_ACCESS_CLEAR",
          "label": "string",
          "result": "PASS",
          "notes": "Free text notes"
        }
      ],
      "createdAtUtc": "2026-03-14T15:30:00Z",
      "updatedAtUtc": "2026-03-14T15:30:00Z",
      "submittedAtUtc": "2026-03-14T15:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/equipment/{equipmentId}/certificates`

**Register certificate (equipment certificates)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.RegisterCertificate`
- **Idempotency:** optional `Idempotency-Key` header (retries replay the first successful response).

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `equipmentId` | `string` |

**Request body** — `RegisterCertificateRequest` (`application/json`)

```json
{
  "technicianName": "Luis Perez",
  "certificationNumber": "CERT-2026-0042",
  "workDescription": "string",
  "issuedAt": "2026-03-14T15:30:00-05:00",
  "expiresAt": "2026-03-14T15:30:00-05:00",
  "documentFileUrl": "https://example.com/documentFileUrl"
}
```

**Success response** — `201` · `MaintenanceCertificateResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "equipmentName": "string",
  "areaName": "string",
  "technicianName": "Luis Perez",
  "certificationNumber": "CERT-2026-0042",
  "workDescription": "string",
  "issuedAtUtc": "2026-03-14T15:30:00Z",
  "expiresAtUtc": "2026-03-14T15:30:00Z",
  "documentFileUrl": "https://example.com/documentFileUrl",
  "urgency": "string",
  "daysUntilExpiry": 15,
  "registeredAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/equipment/{equipmentId}/certificates`

**List certificates (equipment certificates)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.ListCertificates`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `equipmentId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<MaintenanceCertificateResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "areaName": "string",
      "technicianName": "Luis Perez",
      "certificationNumber": "CERT-2026-0042",
      "workDescription": "string",
      "issuedAtUtc": "2026-03-14T15:30:00Z",
      "expiresAtUtc": "2026-03-14T15:30:00Z",
      "documentFileUrl": "https://example.com/documentFileUrl",
      "urgency": "string",
      "daysUntilExpiry": 15,
      "registeredAtUtc": "2026-03-14T15:30:00Z"
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

## `GET /api/v1/stores/{storeId}/compliance/expirations`

**Expirations (compliance expirations)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.Expirations`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `withinDays` | `int` | `30` |

**Success response** — `200` · `CertificateExpirationsResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "withinDays": 15,
  "items": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "areaName": "string",
      "technicianName": "Luis Perez",
      "certificationNumber": "CERT-2026-0042",
      "workDescription": "string",
      "issuedAtUtc": "2026-03-14T15:30:00Z",
      "expiresAtUtc": "2026-03-14T15:30:00Z",
      "documentFileUrl": "https://example.com/documentFileUrl",
      "urgency": "string",
      "daysUntilExpiry": 15,
      "registeredAtUtc": "2026-03-14T15:30:00Z"
    }
  ],
  "equipmentWithoutCertificate": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "name": "Main kitchen",
      "areaName": "string"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/compliance/score`

**Score (compliance score)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.Score`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `ComplianceScoreResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "score": 87.5,
  "grade": "B",
  "components": [
    {
      "name": "Main kitchen",
      "weight": 1.5,
      "score": 87.5,
      "explanation": "string"
    }
  ],
  "checklistWeeks": [
    {
      "weekStartDate": "2026-03-09",
      "bestSubmittedScore": 1.5
    }
  ],
  "alarmWindowFromUtc": "2026-03-14T15:30:00Z",
  "evaluatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/compliance/signature`

**Register signature (compliance signature)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.RegisterSignature`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `RegisterSignatureRequest` (`application/json`)

```json
{
  "signerName": "Maria Torres",
  "signerTitle": "Store manager",
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...(base64 PNG)"
}
```

**Success response** — `201` · `ComplianceSignatureResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "signerName": "Maria Torres",
  "signerTitle": "Store manager",
  "sha256": "string",
  "widthPx": 15,
  "heightPx": 15,
  "signedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/compliance/signature`

**Get signature (compliance signature)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.GetSignature`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `ComplianceSignatureResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "signerName": "Maria Torres",
  "signerTitle": "Store manager",
  "sha256": "string",
  "widthPx": 15,
  "heightPx": 15,
  "signedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/compliance/signature/image`

**Get signature image (signature image)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.GetSignatureImage`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Response** — `200` binary file (`image/png`) with `Content-Disposition`; read it as a `Blob`, not JSON.

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/stores/{storeId}/compliance/reports/generate`

**Generate (reports generate)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.Generate`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `GenerateOhsReportRequest` (`application/json`)

```json
{
  "from": "2026-03-01T00:00:00-05:00",
  "to": "2026-03-01T00:00:00-05:00"
}
```

**Success response** — `201` · `OhsReportResponse`

```json
{
  "reportId": "report-0f1e2d3c",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "fileName": "string",
  "contentType": "string",
  "sizeBytes": 15,
  "fromUtc": "2026-03-14T15:30:00Z",
  "toUtc": "2026-03-14T15:30:00Z",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "complianceScore": 1.5,
  "isSigned": true,
  "downloadUrl": "https://example.com/downloadUrl"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/compliance/reports`

**List reports (compliance reports)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.ListReports`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<OhsReportResponse>`

```json
{
  "items": [
    {
      "reportId": "report-0f1e2d3c",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "fileName": "string",
      "contentType": "string",
      "sizeBytes": 15,
      "fromUtc": "2026-03-14T15:30:00Z",
      "toUtc": "2026-03-14T15:30:00Z",
      "generatedAtUtc": "2026-03-14T15:30:00Z",
      "complianceScore": 1.5,
      "isSigned": true,
      "downloadUrl": "https://example.com/downloadUrl"
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

## `GET /api/v1/stores/{storeId}/compliance/reports/{reportId}/download`

**Download (reports download)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ComplianceController.Download`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `reportId` | `string` |

**Response** — `200` binary file (`application/pdf`) with `Content-Disposition`; read it as a `Blob`, not JSON.

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/device-binding`

**Link (equipment device binding)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentDeviceController.Link`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Request body** — `LinkEquipmentDeviceRequest` (`application/json`)

```json
{
  "deviceId": "dev-0001",
  "edgeDeviceId": "edgeDevice-0001"
}
```

**Success response** — `201` · `DeviceBindingResponse`

```json
{
  "id": "id-3a4b5c6d",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "deviceId": "dev-0001",
  "serialNumber": "SN-2026-00045",
  "edgeDeviceId": "edgeDevice-0001",
  "linkedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/device-binding`

**Get binding (equipment device binding)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentDeviceController.GetBinding`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `DeviceBindingResponse`

```json
{
  "id": "id-3a4b5c6d",
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "deviceId": "dev-0001",
  "serialNumber": "SN-2026-00045",
  "edgeDeviceId": "edgeDevice-0001",
  "linkedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/telemetry`

**Get state (equipment telemetry)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentDeviceController.GetState`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `EquipmentTelemetryResponse`

```json
{
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "state": "MONITORED",
  "binding": {
    "id": "id-3a4b5c6d",
    "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
    "deviceId": "dev-0001",
    "serialNumber": "SN-2026-00045",
    "edgeDeviceId": "edgeDevice-0001",
    "linkedAtUtc": "2026-03-14T15:30:00Z"
  },
  "lastMeasurement": {
    "readingId": "reading-0001",
    "capturedAtUtc": "2026-03-14T15:30:00Z",
    "receivedAtUtc": "2026-03-14T15:30:00Z",
    "timestampBasis": "string",
    "voltage": 220.4,
    "current": 6.8,
    "powerFactor": 0.93,
    "frequency": 60.0,
    "source": "EdgeDevice",
    "activePowerKw": 1.5,
    "detectedAnomalyType": "string",
    "detectedSeverity": "string",
    "leakageCurrentAmps": 6.8,
    "relativeHumidityPercent": 1.5,
    "panelSurfaceMoistureDetected": true
  }
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/measurements`

**Get history (equipment measurements)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentDeviceController.GetHistory`

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
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `HasMorePageResponse<MeasurementHistoryResponse>`

```json
{
  "items": [
    {
      "readingId": "reading-0001",
      "capturedAtUtc": "2026-03-14T15:30:00Z",
      "receivedAtUtc": "2026-03-14T15:30:00Z",
      "timestampBasis": "string",
      "voltage": 220.4,
      "current": 6.8,
      "powerFactor": 0.93,
      "frequency": 60.0,
      "source": "EdgeDevice",
      "detectedAnomalyType": "string",
      "detectedSeverity": "string"
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
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/thresholds`

**Get (equipment thresholds)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentThresholdsController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `EquipmentThresholdsResponse`

```json
{
  "nominalVoltage": 220.4,
  "maxConsumptionWatts": 1.5,
  "maxCurrentAmps": 6.8,
  "minPowerFactor": 0.93,
  "nominalFrequency": 60.0,
  "disconnectionThresholdMin": 15,
  "normalLimitAmps": 6.8,
  "alertLimitAmps": 6.8
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/thresholds`

**Put (equipment thresholds)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `EquipmentThresholdsController.Put`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Request body** — `UpdateEquipmentThresholdsRequest` (`application/json`)

```json
{
  "nominalVoltage": 220.4,
  "maxConsumptionWatts": 1.5,
  "maxCurrentAmps": 6.8,
  "minPowerFactor": 0.93,
  "nominalFrequency": 60.0,
  "disconnectionThresholdMin": 15,
  "normalLimitAmps": 6.8,
  "alertLimitAmps": 6.8
}
```

**Success response** — `200` · `EquipmentThresholdsResponse`

```json
{
  "nominalVoltage": 220.4,
  "maxConsumptionWatts": 1.5,
  "maxCurrentAmps": 6.8,
  "minPowerFactor": 0.93,
  "nominalFrequency": 60.0,
  "disconnectionThresholdMin": 15,
  "normalLimitAmps": 6.8,
  "alertLimitAmps": 6.8
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/safety-status`

**Get safety status (equipment safety status)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `KitchenSafetyController.GetSafetyStatus`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `EquipmentSafetyStatusResponse`

```json
{
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "name": "Main kitchen",
  "status": "ACTIVE",
  "isDeEnergized": true,
  "isSafeToClean": false,
  "reasons": [
    "Active critical alert"
  ],
  "activeCriticalAlerts": 15,
  "lastReading": {
    "capturedAtUtc": "2026-03-14T15:30:00Z",
    "voltage": 220.4,
    "current": 6.8,
    "powerFactor": 0.93,
    "frequency": 60.0,
    "activePowerKw": 1.5,
    "leakageCurrentAmps": 6.8,
    "detectedAnomalyType": "string",
    "detectedSeverity": "string",
    "relativeHumidityPercent": 1.5,
    "panelSurfaceMoistureDetected": true
  },
  "rule": {
    "maxDeEnergizedCurrentAmps": 6.8,
    "maxReadingAgeMinutes": 15,
    "requireNoActiveCriticalAlerts": true
  },
  "evaluatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/shutdown-protocol`

**Get shutdown protocol (equipment shutdown protocol)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `KitchenSafetyController.GetShutdownProtocol`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `ShutdownProtocolResponse`

```json
{
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "name": "Main kitchen",
  "isDefault": true,
  "shutdownSteps": [
    "Switch off the equipment",
    "Open the dedicated breaker"
  ],
  "emergencyIsolationSteps": [
    "Open the main breaker"
  ],
  "isSafeToCleanRule": {
    "maxDeEnergizedCurrentAmps": 6.8,
    "maxReadingAgeMinutes": 15,
    "requireNoActiveCriticalAlerts": true
  },
  "updatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/shutdown-protocol`

**Put shutdown protocol (equipment shutdown protocol)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `KitchenSafetyController.PutShutdownProtocol`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Request body** — `UpdateShutdownProtocolRequest` (`application/json`)

```json
{
  "shutdownSteps": [
    "Switch off the equipment",
    "Open the dedicated breaker"
  ],
  "emergencyIsolationSteps": [
    "Open the main breaker"
  ],
  "isSafeToCleanRule": {
    "maxDeEnergizedCurrentAmps": 6.8,
    "maxReadingAgeMinutes": 15,
    "requireNoActiveCriticalAlerts": true
  }
}
```

**Success response** — `200` · `ShutdownProtocolResponse`

```json
{
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "name": "Main kitchen",
  "isDefault": true,
  "shutdownSteps": [
    "Switch off the equipment",
    "Open the dedicated breaker"
  ],
  "emergencyIsolationSteps": [
    "Open the main breaker"
  ],
  "isSafeToCleanRule": {
    "maxDeEnergizedCurrentAmps": 6.8,
    "maxReadingAgeMinutes": 15,
    "requireNoActiveCriticalAlerts": true
  },
  "updatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/safety-guides/electrical-incident`

**Get electrical incident guide (safety guides electrical incident)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `KitchenSafetyController.GetElectricalIncidentGuide`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `ElectricalIncidentGuideResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "storeName": "string",
  "storeAddress": "string",
  "version": "string",
  "sections": [
    {
      "title": "string",
      "steps": [
        "string"
      ]
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/shifts/assignments`

**Schedule (shifts assignments)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ShiftOperationsController.Schedule`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `ScheduleStaffShiftRequest` (`application/json`)

```json
{
  "workerCode": "W-014",
  "workerName": "Carlos Ruiz",
  "role": "User",
  "startsAt": "2026-03-14T15:30:00-05:00",
  "endsAt": "2026-03-14T15:30:00-05:00"
}
```

**Success response** — `201` · `StaffShiftResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "workerCode": "W-014",
  "workerName": "Carlos Ruiz",
  "role": "User",
  "startsAtUtc": "2026-03-14T15:30:00Z",
  "endsAtUtc": "2026-03-14T15:30:00Z",
  "createdAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/shifts/assignments`

**List (shifts assignments)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ShiftOperationsController.List`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `from` | `string?` | `null` |
| `to` | `string?` | `null` |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

Date/time query values are ISO 8601 timestamps **with explicit offset** (`Z` or `±HH:mm`; encode `+` as `%2B`). Ranges are half-open `[from, to)`, `from < to`, maximum 31 days; invalid or half-specified ranges return 400.

**Success response** — `200` · `PagedResponse<StaffShiftResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "workerCode": "W-014",
      "workerName": "Carlos Ruiz",
      "role": "User",
      "startsAtUtc": "2026-03-14T15:30:00Z",
      "endsAtUtc": "2026-03-14T15:30:00Z",
      "createdAtUtc": "2026-03-14T15:30:00Z"
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

## `DELETE /api/v1/stores/{storeId}/shifts/assignments/{shiftId}`

**Remove (shifts assignments)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ShiftOperationsController.Remove`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `shiftId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/shifts/on-duty`

**On duty (shifts on duty)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ShiftOperationsController.OnDuty`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `OnDutyStaffResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "atUtc": "2026-03-14T15:30:00Z",
  "accountable": {
    "id": "id-3a4b5c6d",
    "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
    "workerCode": "W-014",
    "workerName": "Carlos Ruiz",
    "role": "User",
    "startsAtUtc": "2026-03-14T15:30:00Z",
    "endsAtUtc": "2026-03-14T15:30:00Z",
    "createdAtUtc": "2026-03-14T15:30:00Z"
  },
  "onDuty": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "workerCode": "W-014",
      "workerName": "Carlos Ruiz",
      "role": "User",
      "startsAtUtc": "2026-03-14T15:30:00Z",
      "endsAtUtc": "2026-03-14T15:30:00Z",
      "createdAtUtc": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/shifts/handover`

**Handover (shifts handover)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ShiftOperationsController.Handover`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `RecordShiftHandoverRequest` (`application/json`)

```json
{
  "workerId": "worker-0001",
  "workerName": "Carlos Ruiz",
  "shiftDate": "2026-03-09",
  "notes": "Free text notes"
}
```

**Success response** — `201` · `ShiftHandoverResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "workerId": "worker-0001",
  "workerName": "Carlos Ruiz",
  "shiftDate": "2026-03-09",
  "recordedAtUtc": "2026-03-14T15:30:00Z",
  "gridStatus": "string",
  "activeCriticalAlerts": 15,
  "activeNonCriticalAlerts": 15,
  "notes": "Free text notes",
  "managerNotified": true,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "name": "Main kitchen",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "areaName": "string",
      "riskLevel": "LOW",
      "operationalState": "RUNNING",
      "lastReading": {
        "capturedAtUtc": "2026-03-14T15:30:00Z",
        "voltage": 220.4,
        "current": 6.8,
        "powerFactor": 0.93,
        "frequency": 60.0,
        "activePowerKw": 1.5,
        "leakageCurrentAmps": 6.8,
        "detectedAnomalyType": "string",
        "detectedSeverity": "string",
        "relativeHumidityPercent": 1.5,
        "panelSurfaceMoistureDetected": true
      }
    }
  ]
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/shifts/handover`

**List handovers (shifts handover)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ShiftOperationsController.ListHandovers`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `HasMorePageResponse<ShiftHandoverResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "workerId": "worker-0001",
      "workerName": "Carlos Ruiz",
      "shiftDate": "2026-03-09",
      "recordedAtUtc": "2026-03-14T15:30:00Z",
      "gridStatus": "string",
      "activeCriticalAlerts": 15,
      "activeNonCriticalAlerts": 15,
      "notes": "Free text notes",
      "managerNotified": true,
      "equipment": [
        {
          "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
          "name": "Main kitchen",
          "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
          "areaName": "string",
          "riskLevel": "LOW",
          "operationalState": "RUNNING",
          "lastReading": {
            "capturedAtUtc": "2026-03-14T15:30:00Z",
            "voltage": 220.4,
            "current": 6.8,
            "powerFactor": 0.93,
            "frequency": 60.0,
            "activePowerKw": 1.5,
            "leakageCurrentAmps": 6.8,
            "detectedAnomalyType": "string",
            "detectedSeverity": "string",
            "relativeHumidityPercent": 1.5,
            "panelSurfaceMoistureDetected": true
          }
        }
      ]
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

## `POST /api/v1/stores/{storeId}/panel/pause`

**Start (panel pause)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `PanelPauseController.Start`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `StartPanelPauseRequest` (`application/json`)

```json
{
  "durationSeconds": 15,
  "panelId": "panel-0001"
}
```

**Success response** — `200` · `PanelPauseResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "status": "ACTIVE",
  "isInputLocked": true,
  "remainingSeconds": 15,
  "pauseId": "pause-0001",
  "panelId": "panel-0001",
  "startedAtUtc": "2026-03-14T15:30:00Z",
  "endsAtUtc": "2026-03-14T15:30:00Z",
  "endedAtUtc": "2026-03-14T15:30:00Z",
  "endReason": "string",
  "overridingAlertId": "overridingAlert-0001"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/panel/pause`

**Get (panel pause)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `PanelPauseController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `PanelPauseResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "status": "ACTIVE",
  "isInputLocked": true,
  "remainingSeconds": 15,
  "pauseId": "pause-0001",
  "panelId": "panel-0001",
  "startedAtUtc": "2026-03-14T15:30:00Z",
  "endsAtUtc": "2026-03-14T15:30:00Z",
  "endedAtUtc": "2026-03-14T15:30:00Z",
  "endReason": "string",
  "overridingAlertId": "overridingAlert-0001"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `DELETE /api/v1/stores/{storeId}/panel/pause`

**End (panel pause)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `PanelPauseController.End`
- **Note:** deliberate exception to "DELETE → 204": returns **200** with the resulting `PanelPauseResponse` so the panel can render the unlocked state without a second request.

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `PanelPauseResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "status": "ACTIVE",
  "isInputLocked": true,
  "remainingSeconds": 15,
  "pauseId": "pause-0001",
  "panelId": "panel-0001",
  "startedAtUtc": "2026-03-14T15:30:00Z",
  "endsAtUtc": "2026-03-14T15:30:00Z",
  "endedAtUtc": "2026-03-14T15:30:00Z",
  "endReason": "string",
  "overridingAlertId": "overridingAlert-0001"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/layout`

**Get (stores layout)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `KitchenLayoutController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreLayoutResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "canvasWidth": 1.5,
  "canvasHeight": 1.5,
  "placedCount": 3,
  "unplacedCount": 3,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "name": "Main kitchen",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "areaName": "string",
      "isPlaced": true,
      "coordinateX": 1.5,
      "coordinateY": 1.5,
      "width": 1.5,
      "height": 1.5,
      "zIndex": 15,
      "riskLevel": "LOW"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/stores/{storeId}/layout`

**Put (stores layout)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `KitchenLayoutController.Put`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `UpdateStoreLayoutRequest` (`application/json`)

```json
{
  "canvasWidth": 1.5,
  "canvasHeight": 1.5,
  "items": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "coordinateX": 1.5,
      "coordinateY": 1.5,
      "width": 1.5,
      "height": 1.5,
      "zIndex": 15
    }
  ],
  "removeEquipmentIds": [
    "string"
  ]
}
```

**Success response** — `200` · `StoreLayoutResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "canvasWidth": 1.5,
  "canvasHeight": 1.5,
  "placedCount": 3,
  "unplacedCount": 3,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "name": "Main kitchen",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "areaName": "string",
      "isPlaced": true,
      "coordinateX": 1.5,
      "coordinateY": 1.5,
      "width": 1.5,
      "height": 1.5,
      "zIndex": 15,
      "riskLevel": "LOW"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/dashboard-summary`

**Get (stores dashboard summary)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreDashboardController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreDashboardSummaryResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "totalEquipment": 15,
  "monitoredEquipment": 15,
  "offlineEquipment": 15,
  "unmonitoredEquipment": 15,
  "activeCriticalAlerts": 15,
  "activeNonCriticalAlerts": 15,
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "name": "Main kitchen",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "areaName": "string",
      "state": "MONITORED",
      "lastMeasurementAtUtc": "2026-03-14T15:30:00Z",
      "openCriticalAlerts": 15,
      "openNonCriticalAlerts": 15
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/notification-preferences`

**Get (stores notification preferences)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreNotificationPreferencesController.Get`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreNotificationPreferencesResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "isDefault": true,
  "updatedAtUtc": "2026-03-14T15:30:00Z",
  "routes": [
    {
      "channel": "EMAIL",
      "destination": "manager@example.com",
      "recipientRole": "MANAGER",
      "recipientName": "string",
      "urgencyLevels": [
        "CRITICAL"
      ],
      "enabled": true
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/stores/{storeId}/notification-preferences`

**Put (stores notification preferences)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreNotificationPreferencesController.Put`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `UpdateNotificationPreferencesRequest` (`application/json`)

```json
{
  "routes": [
    {
      "channel": "EMAIL",
      "destination": "manager@example.com",
      "recipientRole": "MANAGER",
      "recipientName": "string",
      "urgencyLevels": [
        "CRITICAL"
      ],
      "enabled": true
    }
  ]
}
```

**Success response** — `200` · `StoreNotificationPreferencesResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "isDefault": true,
  "updatedAtUtc": "2026-03-14T15:30:00Z",
  "routes": [
    {
      "channel": "EMAIL",
      "destination": "manager@example.com",
      "recipientRole": "MANAGER",
      "recipientName": "string",
      "urgencyLevels": [
        "CRITICAL"
      ],
      "enabled": true
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/risk-level`

**Get risk level (equipment risk level)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreOperationsController.GetRiskLevel`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `EquipmentRiskResponse`

```json
{
  "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
  "name": "Main kitchen",
  "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
  "areaName": "string",
  "riskLevel": "LOW",
  "operationalState": "RUNNING",
  "reasons": [
    "Active critical alert"
  ],
  "openCriticalAlerts": 15,
  "openNonCriticalAlerts": 15,
  "lastReading": {
    "capturedAtUtc": "2026-03-14T15:30:00Z",
    "voltage": 220.4,
    "current": 6.8,
    "powerFactor": 0.93,
    "frequency": 60.0,
    "activePowerKw": 1.5,
    "leakageCurrentAmps": 6.8,
    "detectedAnomalyType": "string",
    "detectedSeverity": "string",
    "relativeHumidityPercent": 1.5,
    "panelSurfaceMoistureDetected": true
  },
  "evaluatedAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/grid-status`

**Get grid status (stores grid status)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreOperationsController.GetGridStatus`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreElectricalGridStatusResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "status": "NORMAL",
  "totalEquipment": 15,
  "reportingEquipment": 15,
  "totalActivePowerKw": 1.5,
  "totalCurrentAmps": 6.8,
  "averageVoltage": 220.4,
  "minVoltage": 220.4,
  "maxVoltage": 220.4,
  "averagePowerFactor": 0.93,
  "averageFrequency": 60.0,
  "maxLeakageCurrentAmps": 6.8,
  "riskLevelCounts": {
    "LOW": 3,
    "MEDIUM": 1
  },
  "equipment": [
    {
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "name": "Main kitchen",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "areaName": "string",
      "riskLevel": "LOW",
      "operationalState": "RUNNING",
      "lastReading": {
        "capturedAtUtc": "2026-03-14T15:30:00Z",
        "voltage": 220.4,
        "current": 6.8,
        "powerFactor": 0.93,
        "frequency": 60.0,
        "activePowerKw": 1.5,
        "leakageCurrentAmps": 6.8,
        "detectedAnomalyType": "string",
        "detectedSeverity": "string",
        "relativeHumidityPercent": 1.5,
        "panelSurfaceMoistureDetected": true
      }
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/stores/{storeId}/sensors/connectivity`

**Get sensors connectivity (sensors connectivity)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoreOperationsController.GetSensorsConnectivity`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreSensorsConnectivityResponse`

```json
{
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "generatedAtUtc": "2026-03-14T15:30:00Z",
  "totalSensors": 15,
  "connected": 15,
  "disconnected": 15,
  "lastEdgeSyncAtUtc": "2026-03-14T15:30:00Z",
  "sensors": [
    {
      "sensorId": "sensor-0001",
      "serialNumber": "SN-2026-00045",
      "edgeDeviceId": "edgeDevice-0001",
      "equipmentId": "equipment-9a8b7c6d5e4f30211203f4e5d6c7b8a9",
      "equipmentName": "string",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "areaName": "string",
      "status": "CONNECTED",
      "lastTelemetryReceivedAtUtc": "2026-03-14T15:30:00Z",
      "lastReadingCapturedAtUtc": "2026-03-14T15:30:00Z",
      "secondsSinceLastTelemetry": 15,
      "disconnectionThresholdMin": 15,
      "linkedAtUtc": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/stores`

**Create store (stores)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.CreateStore`

**Request body** — `CreateStoreRequest` (`application/json`)

```json
{
  "name": "Main kitchen",
  "address": "Av. Larco 345, Miraflores, Lima"
}
```

**Success response** — `201` · `StoreResponse`

```json
{
  "id": "id-3a4b5c6d",
  "name": "Main kitchen",
  "address": "Av. Larco 345, Miraflores, Lima",
  "ownerUserId": "ownerUser-0001",
  "lastEdgeSyncAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores`

**List stores (stores)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.ListStores`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `HasMorePageResponse<StoreResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "name": "Main kitchen",
      "address": "Av. Larco 345, Miraflores, Lima",
      "ownerUserId": "ownerUser-0001",
      "lastEdgeSyncAtUtc": "2026-03-14T15:30:00Z"
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

## `GET /api/v1/stores/{storeId}`

**Get store (stores)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.GetStore`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Success response** — `200` · `StoreResponse`

```json
{
  "id": "id-3a4b5c6d",
  "name": "Main kitchen",
  "address": "Av. Larco 345, Miraflores, Lima",
  "ownerUserId": "ownerUser-0001",
  "lastEdgeSyncAtUtc": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/areas`

**Create area (stores areas)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.CreateArea`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Request body** — `CreateNamedHierarchyRequest` (`application/json`)

```json
{
  "name": "Main kitchen"
}
```

**Success response** — `201` · `AreaResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "name": "Main kitchen"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/areas`

**List areas (stores areas)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.ListAreas`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `HasMorePageResponse<AreaResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
      "name": "Main kitchen"
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

## `GET /api/v1/stores/{storeId}/areas/{areaId}`

**Get area (stores areas)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.GetArea`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |

**Success response** — `200` · `AreaResponse`

```json
{
  "id": "id-3a4b5c6d",
  "storeId": "store-3e1f0c9a8b7d4c5e9a1b2c3d4e5f6a7b",
  "name": "Main kitchen"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/stores/{storeId}/areas/{areaId}/equipment`

**Create equipment (areas equipment)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.CreateEquipment`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |

**Request body** — `CreateNamedHierarchyRequest` (`application/json`)

```json
{
  "name": "Main kitchen"
}
```

**Success response** — `201` · `EquipmentResponse`

```json
{
  "id": "id-3a4b5c6d",
  "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
  "name": "Main kitchen"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment`

**List equipment (areas equipment)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.ListEquipment`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `HasMorePageResponse<EquipmentResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
      "name": "Main kitchen"
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

## `GET /api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}`

**Get equipment (areas equipment)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `StoresController.GetEquipment`

**Path parameters**

| Name | Type |
|---|---|
| `storeId` | `string` |
| `areaId` | `string` |
| `equipmentId` | `string` |

**Success response** — `200` · `EquipmentResponse`

```json
{
  "id": "id-3a4b5c6d",
  "areaId": "area-5c4b3a291807f6e5d4c3b2a1908f7e6d",
  "name": "Main kitchen"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
