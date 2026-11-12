# Planning — endpoints

Service catalog (recipes) of technicians, the multi-step service request wizard, matching/assignment, dispatch and proactive suggestions.

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
| `POST` | `/api/v1/dispatch/assign-staff` | Assign a staff member (Maker) to a service request | Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager` |
| `GET` | `/api/v1/service-assignments/queue` | Get matching queue (service assignments queue) | Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager` |
| `POST` | `/api/v1/service-assignments/execute` | Execute matching algorithm (service assignments execute) | Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager` |
| `GET` | `/api/v1/service-assignments/{assignmentId}/matching-details` | Get matching details (service assignments matching details) | Bearer JWT · access role `Admin` |
| `POST` | `/api/v1/technicians/{technicianId}/catalog` | Create catalog (technicians catalog) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/catalog` | Get catalog (technicians catalog) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/technicians/{technicianId}/catalog/recipes` | Create recipe (catalog recipes) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}` | Get recipe details (catalog recipes) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}` | Update recipe (catalog recipes) | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}` | Deactivate recipe (catalog recipes) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}/reactivate` | Reactivate recipe (recipes reactivate) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-requests/eligibility` | Get eligibility (service requests eligibility) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-requests` | Initiate (service requests) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-requests/{requestId}/property` | Select property (service requests property) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/service-requests/{requestId}/available-services` | Get available services (service requests available services) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-requests/{requestId}/recipe` | Select recipe (service requests recipe) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-requests/{requestId}/details` | Add details (service requests details) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-requests/{requestId}/confirm` | Confirm (service requests confirm) | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/service-requests/{requestId}` | Cancel (service requests) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/service-requests/{requestId}/installation-property` | Attach installation property (service requests installation property) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/service-requests/{requestId}` | Get summary (service requests) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/suggestions` | Get active suggestions (suggestions) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/suggestions/{suggestionId}/viewed` | Mark as viewed (suggestions viewed) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/suggestions/{suggestionId}/accept` | Accept suggestion (suggestions accept) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/suggestions/{suggestionId}/dismiss` | Dismiss suggestion (suggestions dismiss) | Bearer JWT (global request authorization) |

## `POST /api/v1/dispatch/assign-staff`

**Assign a staff member (Maker) to a service request**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager`
- **Source:** `DispatchController.AssignStaff`

**Request body** — `AssignStaffRequest` (`application/json`)

```json
{
  "requestId": "req-5e6f7a8b",
  "staffMemberId": "stf-5a6b7c8d"
}
```

**Success response** — `200` · `MessageResponse`

```json
{
  "message": "Operation completed."
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials

## `GET /api/v1/service-assignments/queue`

**Get matching queue (service assignments queue)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager`
- **Source:** `ServiceAssignmentController.GetMatchingQueue`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `MatchingQueueResponse`

```json
{
  "priorityQueue": [
    {
      "requestId": "req-5e6f7a8b",
      "homeownerId": "home-2b3c4d5e",
      "isPriority": true,
      "createdAt": "2026-03-14T15:30:00Z"
    }
  ],
  "normalQueue": [
    {
      "requestId": "req-5e6f7a8b",
      "homeownerId": "home-2b3c4d5e",
      "isPriority": true,
      "createdAt": "2026-03-14T15:30:00Z"
    }
  ],
  "totalPending": 15
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `POST /api/v1/service-assignments/execute`

**Execute matching algorithm (service assignments execute)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager`
- **Source:** `ServiceAssignmentController.ExecuteMatchingAlgorithm`

**Request body** — `ExecuteMatchingAlgorithmRequest` (`application/json`)

```json
{
  "requestId": "req-5e6f7a8b"
}
```

**Success response** — `200` · `MatchingResultResponse`

```json
{
  "requestId": "req-5e6f7a8b",
  "assigned": true,
  "failureReason": "string"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `422` Unprocessable: business precondition failed

## `GET /api/v1/service-assignments/{assignmentId}/matching-details`

**Get matching details (service assignments matching details)**

- **Auth:** Bearer JWT · access role `Admin`
- **Note:** guarded by ASP.NET `[Authorize(Roles = "Admin")]` on the JWT role claim, so `SuperAdmin` is *not* accepted here.
- **Source:** `ServiceAssignmentController.GetMatchingDetails`

**Path parameters**

| Name | Type |
|---|---|
| `assignmentId` | `string` |

**Success response** — `200` · `MatchingScoreResponse`

```json
{
  "score": 87.5,
  "method": "moving-average",
  "reasoning": "string"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/technicians/{technicianId}/catalog`

**Create catalog (technicians catalog)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.CreateCatalog`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Success response** — `201` · `ServiceCatalogResponse` (Location: `/api/v1/technicians/{technicianId}/catalog`)

```json
{
  "catalogId": "catalog-0001",
  "technicianId": "tech-8a9b0c1d",
  "status": "Active",
  "totalRecipes": 15,
  "recipes": [
    {
      "recipeId": "recipe-2e3f4a5b",
      "serviceName": "Panel inspection",
      "serviceCategory": "Inspection",
      "totalPrice": 120.5,
      "currency": "PEN",
      "estimatedDurationMinutes": 15,
      "isActive": true,
      "timesRequested": 15
    }
  ]
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/technicians/{technicianId}/catalog`

**Get catalog (technicians catalog)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.GetCatalog`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Success response** — `200` · `ServiceCatalogResponse`

```json
{
  "catalogId": "catalog-0001",
  "technicianId": "tech-8a9b0c1d",
  "status": "Active",
  "totalRecipes": 15,
  "recipes": [
    {
      "recipeId": "recipe-2e3f4a5b",
      "serviceName": "Panel inspection",
      "serviceCategory": "Inspection",
      "totalPrice": 120.5,
      "currency": "PEN",
      "estimatedDurationMinutes": 15,
      "isActive": true,
      "timesRequested": 15
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/technicians/{technicianId}/catalog/recipes`

**Create recipe (catalog recipes)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.CreateRecipe`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Request body** — `CreateServiceRecipeRequest` (`application/json`)

```json
{
  "serviceName": "Panel inspection",
  "serviceDescription": "string",
  "serviceCategory": "Inspection",
  "requiresIoTCertification": true,
  "componentRequirements": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "quantity": 15,
      "isRequired": true
    }
  ],
  "estimatedDurationHours": 15,
  "estimatedDurationMinutes": 15,
  "pricing": {
    "materialsEstimate": 1.5,
    "laborCost": 120.5,
    "totalPrice": 120.5,
    "currency": "PEN"
  },
  "prerequisites": [
    "Main breaker accessible"
  ],
  "deliverables": [
    "Inspection report"
  ],
  "warrantyMonths": 15
}
```

**Success response** — `201` · `ServiceRecipeDetailResponse` (still contains `recipeId`; Location: `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}`)

```json
{
  "recipeId": "recipe-2e3f4a5b",
  "serviceName": "Panel inspection",
  "serviceDescription": "string",
  "serviceCategory": "Inspection",
  "componentRequirements": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "quantity": 15,
      "isRequired": true
    }
  ],
  "estimatedDurationMinutes": 15,
  "materialsEstimate": 1.5,
  "laborCost": 120.5,
  "totalPrice": 120.5,
  "currency": "PEN",
  "prerequisites": [
    "Main breaker accessible"
  ],
  "deliverables": [
    "Inspection report"
  ],
  "warrantyMonths": 15,
  "isActive": true,
  "timesRequested": 15
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}`

**Get recipe details (catalog recipes)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.GetRecipeDetails`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `recipeId` | `string` |

**Success response** — `200` · `ServiceRecipeDetailResponse`

```json
{
  "recipeId": "recipe-2e3f4a5b",
  "serviceName": "Panel inspection",
  "serviceDescription": "string",
  "serviceCategory": "Inspection",
  "componentRequirements": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "quantity": 15,
      "isRequired": true
    }
  ],
  "estimatedDurationMinutes": 15,
  "materialsEstimate": 1.5,
  "laborCost": 120.5,
  "totalPrice": 120.5,
  "currency": "PEN",
  "prerequisites": [
    "Main breaker accessible"
  ],
  "deliverables": [
    "Inspection report"
  ],
  "warrantyMonths": 15,
  "isActive": true,
  "timesRequested": 15
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}`

**Update recipe (catalog recipes)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.UpdateRecipe`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `recipeId` | `string` |

**Request body** — `UpdateServiceRecipeRequest` (`application/json`)

```json
{
  "serviceName": "Panel inspection",
  "serviceDescription": "string",
  "componentRequirements": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "quantity": 15,
      "isRequired": true
    }
  ],
  "estimatedDurationHours": 15,
  "estimatedDurationMinutes": 15,
  "pricing": {
    "materialsEstimate": 1.5,
    "laborCost": 120.5,
    "totalPrice": 120.5,
    "currency": "PEN"
  },
  "prerequisites": [
    "Main breaker accessible"
  ],
  "deliverables": [
    "Inspection report"
  ],
  "warrantyMonths": 15
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}`

**Deactivate recipe (catalog recipes)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.DeactivateRecipe`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `recipeId` | `string` |

**Request body** — `DeactivateServiceRecipeRequest` (`application/json`)

```json
{
  "reason": "Customer request",
  "notes": "Free text notes"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}/reactivate`

**Reactivate recipe (recipes reactivate)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceCatalogController.ReactivateRecipe`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `recipeId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/service-requests/eligibility`

**Get eligibility (service requests eligibility)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.GetEligibility`

**Success response** — `200` · `PlanningRequestEligibilityResponse`

```json
{
  "canCreate": true,
  "planType": "Premium",
  "remainingRequests": 3,
  "canMarkAsPriority": true,
  "reason": "Customer request"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-requests`

**Initiate (service requests)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.Initiate`
- **Idempotency:** optional `Idempotency-Key` header — a retried creation returns the same draft instead of a second one.

**Success response** — `201` · `ServiceRequestSummaryResponse` (the full draft; it still contains `requestId`. Location: `/api/v1/service-requests/{requestId}`)

```json
{
  "requestId": "req-5e6f7a8b",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "selectedRecipeId": "selectedRecipe-0001",
  "selectedTechnicianId": "selectedTechnician-0001",
  "status": "PendingAssignment",
  "isPriority": true,
  "createdAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-requests/{requestId}/property`

**Select property (service requests property)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.SelectProperty`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Request body** — `SelectPropertyRequest` (`application/json`)

```json
{
  "propertyId": "prop-4d5e6f70"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/service-requests/{requestId}/available-services`

**Get available services (service requests available services)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.GetAvailableServices`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<AvailableServiceResponse>`

```json
{
  "items": [
    {
      "serviceCategory": "Inspection",
      "categoryDisplayName": "string",
      "minPrice": 120.5,
      "maxPrice": 120.5,
      "estimatedDurationMinutes": 15,
      "techniciansAvailable": 15
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
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-requests/{requestId}/recipe`

**Select recipe (service requests recipe)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.SelectRecipe`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Request body** — `SelectServiceRecipeRequest` (`application/json`)

```json
{
  "serviceCategory": "Inspection"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-requests/{requestId}/details`

**Add details (service requests details)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.AddDetails`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Request body** — `AddServiceDetailsRequest` (`application/json`)

```json
{
  "problemDescription": "Frequent breaker trips in the kitchen",
  "consumptionKwh": 12.5,
  "amountPaid": 120.5,
  "amountCurrency": "string",
  "billingPeriod": "string",
  "receiptNumber": "string",
  "isPriority": true,
  "preferredDates": [
    "2026-03-14T15:30:00Z"
  ],
  "timePreference": "Morning"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/service-requests/{requestId}/confirm`

**Confirm (service requests confirm)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.Confirm`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Success response** — `202` · `ServiceRequestSummaryResponse`

```json
{
  "requestId": "req-5e6f7a8b",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "selectedRecipeId": "selectedRecipe-0001",
  "selectedTechnicianId": "selectedTechnician-0001",
  "status": "PendingAssignment",
  "isPriority": true,
  "createdAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `202` Accepted
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/service-requests/{requestId}`

**Cancel (service requests)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.Cancel`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Request body** — `CancelServiceRequestRequest` (`application/json`)

```json
{
  "reason": "Customer request",
  "notes": "Free text notes"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/service-requests/{requestId}/installation-property`

**Attach installation property (service requests installation property)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `ServiceRequestController.AttachInstallationProperty`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Request body** — `AttachInstallationPropertyRequest` (`application/json`)

```json
{
  "propertyId": "prop-4d5e6f70"
}
```

**Success response** — `200` · `InstallationPropertyAttachedResponse`

```json
{
  "requestId": "req-5e6f7a8b",
  "propertyId": "prop-4d5e6f70",
  "status": "PendingInstallation",
  "matching": "string"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/service-requests/{requestId}`

**Get summary (service requests)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceRequestController.GetSummary`

**Path parameters**

| Name | Type |
|---|---|
| `requestId` | `string` |

**Success response** — `200` · `ServiceRequestSummaryResponse`

```json
{
  "requestId": "req-5e6f7a8b",
  "ownerId": "home-2b3c4d5e",
  "propertyId": "prop-4d5e6f70",
  "selectedRecipeId": "selectedRecipe-0001",
  "selectedTechnicianId": "selectedTechnician-0001",
  "status": "PendingAssignment",
  "isPriority": true,
  "createdAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/suggestions`

**Get active suggestions (suggestions)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceSuggestionController.GetActiveSuggestions`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ServiceSuggestionResponse>`

```json
{
  "items": [
    {
      "suggestionId": "sug-4c5d6e7f",
      "propertyId": "prop-4d5e6f70",
      "anomalyType": "CURRENT_LEAKAGE",
      "severity": "CRITICAL",
      "status": "Pending",
      "expiresAt": "2026-03-14T15:30:00Z",
      "viewedAt": "2026-03-14T15:30:00Z"
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
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/suggestions/{suggestionId}/viewed`

**Mark as viewed (suggestions viewed)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceSuggestionController.MarkAsViewed`

**Path parameters**

| Name | Type |
|---|---|
| `suggestionId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/suggestions/{suggestionId}/accept`

**Accept suggestion (suggestions accept)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceSuggestionController.AcceptSuggestion`

**Path parameters**

| Name | Type |
|---|---|
| `suggestionId` | `string` |

**Success response** — `200` · `RequestIdCreatedResponse`

```json
{
  "requestId": "req-5e6f7a8b"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/suggestions/{suggestionId}/dismiss`

**Dismiss suggestion (suggestions dismiss)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ServiceSuggestionController.DismissSuggestion`

**Path parameters**

| Name | Type |
|---|---|
| `suggestionId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)
