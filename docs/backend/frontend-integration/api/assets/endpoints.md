# Assets — endpoints

Properties and portfolios (homeowner/company owned), IoT device stock and lifecycle, technician component catalogue and inventory.

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
| `POST` | `/api/v1/technicians/{technicianId}/component-types` | Create Component Type | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/component-types/{typeId}` | Get Component Type by Id | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/component-types` | Get All Component Types | Bearer JWT (global request authorization) |
| `PUT` | `/api/v1/technicians/{technicianId}/component-types/{typeId}` | Update Component Type | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/technicians/{technicianId}/component-types/{typeId}` | Delete Component Type | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/technicians/{technicianId}/component-types/{typeId}/activate` | Activate Component Type | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/technicians/{technicianId}/component-types/{typeId}/deactivate` | Deactivate Component Type | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/technicians/{technicianId}/components` | Create Component | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/components/{componentId}` | Get Component by Id | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/components` | Get All Components | Bearer JWT (global request authorization) |
| `PUT` | `/api/v1/technicians/{technicianId}/components/{componentId}` | Update Component | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/technicians/{technicianId}/components/{componentId}` | Delete Component | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/iot-devices` | Register device (iot devices) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices/{id}` | Get by id (iot devices) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices/stock/{id}` | Get stock device (iot devices) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices/my-stock` | Get my stock (iot devices my stock) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices` | Get all (iot devices) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices/by-property/{propertyId}` | Get by property id (iot devices by property) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices/by-status/{status}` | Get by status (iot devices by status) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/iot-devices/active-count/{ownerId}` | Get active device count (iot devices active count) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/iot-devices/{id}/assign/{propertyId}` | Assign to property (iot devices assign) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/iot-devices/{id}/install/{propertyId}` | Record installation (iot devices install) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/iot-devices/{id}/connection-status` | Update connection status (iot devices connection status) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/iot-devices/{id}/maintenance` | Send to maintenance (iot devices maintenance) | Bearer JWT (authenticated human user) |
| `PUT` | `/api/v1/iot-devices/{id}/reinstall` | Reinstall (iot devices reinstall) | Bearer JWT (authenticated human user) |
| `POST` | `/api/v1/iot-devices/{id}/decommission` | Decommission (iot devices decommission) | Bearer JWT (authenticated human user) |
| `GET` | `/api/v1/homeowners/{ownerId}/properties` | Get all (homeowners properties) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/companies/{ownerId}/properties` | Get all (companies properties) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/homeowners/{ownerId}/properties` | Create property (homeowners properties) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/companies/{ownerId}/properties` | Create property (companies properties) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}` | Get property by id (homeowners properties) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/companies/{ownerId}/properties/{propertyId}` | Get property by id (companies properties) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/location` | Update location (properties location) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/companies/{ownerId}/properties/{propertyId}/location` | Update location (properties location) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/activate` | Activate (properties activate) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/companies/{ownerId}/properties/{propertyId}/activate` | Activate (properties activate) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/deactivate` | Deactivate (properties deactivate) | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/companies/{ownerId}/properties/{propertyId}/deactivate` | Deactivate (properties deactivate) | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}` | Archive property (homeowners properties) | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/companies/{ownerId}/properties/{propertyId}` | Archive property (companies properties) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/photos/upload-url` | Get photo upload url (photos upload url) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/companies/{ownerId}/properties/{propertyId}/photos/upload-url` | Get photo upload url (photos upload url) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/photos` | Register photo (properties photos) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/companies/{ownerId}/properties/{propertyId}/photos` | Register photo (properties photos) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/main-photo` | Set main photo (properties main photo) | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/companies/{ownerId}/properties/{propertyId}/main-photo` | Set main photo (properties main photo) | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/homeowners/{ownerId}/property-portfolios` | Get portfolio by owner ID | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/companies/{ownerId}/property-portfolios` | Get portfolio by owner ID | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/homeowners/{ownerId}/property-portfolios/properties` | Add property to portfolio | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/companies/{ownerId}/property-portfolios/properties` | Add property to portfolio | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/homeowners/{ownerId}/property-portfolios/properties/{propertyId}` | Remove property from portfolio | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/companies/{ownerId}/property-portfolios/properties/{propertyId}` | Remove property from portfolio | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/technicians/{technicianId}/inventory` | Create technician inventory | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/technicians/{technicianId}/inventory/stock-items` | Add stock item to technician inventory | Bearer JWT (global request authorization) |
| `PUT` | `/api/v1/technicians/{technicianId}/inventory/{componentId}` | Update component stock in technician inventory | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/technicians/{technicianId}/inventory/{componentId}` | Remove component from technician inventory | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/inventory` | Get technician inventory by technician ID | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/technicians/{technicianId}/inventory/{componentId}/increase` | Increase stock for a component in inventory | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/technicians/{technicianId}/inventory/{componentId}/decrease` | Decrease stock for a component in inventory | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/technicians/{technicianId}/inventory/stock-items` | Get Technician Inventory Stock Items | Bearer JWT (global request authorization) |

## `POST /api/v1/technicians/{technicianId}/component-types`

**Create Component Type**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.CreateComponentType`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Request body** — `CreateComponentTypeRequest` (`application/json`)

```json
{
  "name": "Main kitchen",
  "description": "Description text"
}
```

**Success response** — `201` · `ComponentTypeResponse`

```json
{
  "componentTypeId": "ctype-7a8b9c0d",
  "name": "Main kitchen",
  "description": "Description text"
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `409` Conflict with current state / duplicate

## `GET /api/v1/technicians/{technicianId}/component-types/{typeId}`

**Get Component Type by Id**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.GetComponentTypeById`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `typeId` | `string` |

**Success response** — `200` · `ComponentTypeResponse`

```json
{
  "componentTypeId": "ctype-7a8b9c0d",
  "name": "Main kitchen",
  "description": "Description text"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/technicians/{technicianId}/component-types`

**Get All Component Types**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.GetAllComponentTypes`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ComponentTypeResponse>`

```json
{
  "items": [
    {
      "componentTypeId": "ctype-7a8b9c0d",
      "name": "Main kitchen",
      "description": "Description text"
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

## `PUT /api/v1/technicians/{technicianId}/component-types/{typeId}`

**Update Component Type**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.UpdateComponentType`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `typeId` | `string` |

**Request body** — `UpdateComponentTypeRequest` (`application/json`)

```json
{
  "name": "Main kitchen",
  "description": "Description text",
  "isActive": true
}
```

**Success response** — `200` · `ComponentTypeResponse`

```json
{
  "componentTypeId": "ctype-7a8b9c0d",
  "name": "Main kitchen",
  "description": "Description text"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/technicians/{technicianId}/component-types/{typeId}`

**Delete Component Type**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.DeleteComponentType`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `typeId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `PATCH /api/v1/technicians/{technicianId}/component-types/{typeId}/activate`

**Activate Component Type**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.ActivateComponentType`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `typeId` | `string` |

**Success response** — `200` · `ComponentTypeResponse`

```json
{
  "componentTypeId": "ctype-7a8b9c0d",
  "name": "Main kitchen",
  "description": "Description text"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `PATCH /api/v1/technicians/{technicianId}/component-types/{typeId}/deactivate`

**Deactivate Component Type**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentTypesController.DeactivateComponentType`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `typeId` | `string` |

**Success response** — `200` · `ComponentTypeResponse`

```json
{
  "componentTypeId": "ctype-7a8b9c0d",
  "name": "Main kitchen",
  "description": "Description text"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/technicians/{technicianId}/components`

**Create Component**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentsController.CreateComponent`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Request body** — `CreateComponentRequest` (`application/json`)

```json
{
  "name": "Main kitchen",
  "description": "Description text",
  "isActive": true
}
```

**Success response** — `201` · `ComponentResponse`

```json
{
  "componentId": "comp-3d4e5f60",
  "name": "Main kitchen",
  "description": "Description text",
  "isActive": true
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `409` Conflict with current state / duplicate

## `GET /api/v1/technicians/{technicianId}/components/{componentId}`

**Get Component by Id**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentsController.GetComponentById`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Success response** — `200` · `ComponentResponse`

```json
{
  "componentId": "comp-3d4e5f60",
  "name": "Main kitchen",
  "description": "Description text",
  "isActive": true
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/technicians/{technicianId}/components`

**Get All Components**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentsController.GetAllComponents`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ComponentResponse>`

```json
{
  "items": [
    {
      "componentId": "comp-3d4e5f60",
      "name": "Main kitchen",
      "description": "Description text",
      "isActive": true
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

## `PUT /api/v1/technicians/{technicianId}/components/{componentId}`

**Update Component**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentsController.UpdateComponent`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Request body** — `UpdateComponentRequest` (`application/json`)

```json
{
  "name": "Main kitchen",
  "description": "Description text",
  "isActive": true
}
```

**Success response** — `200` · `ComponentResponse`

```json
{
  "componentId": "comp-3d4e5f60",
  "name": "Main kitchen",
  "description": "Description text",
  "isActive": true
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/technicians/{technicianId}/components/{componentId}`

**Delete Component**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ComponentsController.DeleteComponent`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot-devices`

**Register device (iot devices)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.RegisterDevice`
- **Idempotency:** optional `Idempotency-Key` header (retries replay the first successful response).
- **Location:** `/api/v1/iot-devices/stock/{id}`

**Request body** — `RegisterIoTDeviceRequest` (`application/json`)

```json
{
  "serialNumber": "SN-2026-00045",
  "plainTextApiKey": "<device-api-key>",
  "firmwareVersion": "1.4.2"
}
```

**Success response** — `201` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `409` Conflict with current state / duplicate

## `GET /api/v1/iot-devices/{id}`

**Get an owned device (iot devices)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetById`
- **Scope:** a device assigned to / installed on a property of the caller (HomeOwner/Company). Missing or foreign → 404. Technician stock lookups use `GET /iot-devices/stock/{id}`.

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/iot-devices/stock/{id}`

**Get a stock device (iot devices stock)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetStockDevice`
- **Scope:** a device in the calling technician's stock (formerly `GET /iot-devices/{id}`). Non-technician → 403; missing or another technician's → 404.

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/iot-devices/my-stock`

**Get my stock (iot devices my stock)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetMyStock`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` |

**Success response** — `200` · `StockPageResponse`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "serialNumber": "SN-2026-00045",
      "firmwareVersion": "1.4.2",
      "status": "Assigned"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1,
  "hasMore": false,
  "availableCount": 3
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)

## `GET /api/v1/iot-devices`

**Get all (iot devices)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetAll`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<IoTDeviceResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "serialNumber": "SN-2026-00045",
      "firmwareVersion": "1.4.2",
      "status": "Assigned",
      "assignedPropertyId": "assignedProperty-0001",
      "connectionStatus": "Connected",
      "lastReadingAt": "2026-03-14T15:30:00Z",
      "installedAt": "2026-03-14T15:30:00Z"
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

## `GET /api/v1/iot-devices/by-property/{propertyId}`

**Get by property id (iot devices by property)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetByPropertyId`

**Path parameters**

| Name | Type |
|---|---|
| `propertyId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<IoTDeviceResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "serialNumber": "SN-2026-00045",
      "firmwareVersion": "1.4.2",
      "status": "Assigned",
      "assignedPropertyId": "assignedProperty-0001",
      "connectionStatus": "Connected",
      "lastReadingAt": "2026-03-14T15:30:00Z",
      "installedAt": "2026-03-14T15:30:00Z"
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

## `GET /api/v1/iot-devices/by-status/{status}`

**Get by status (iot devices by status)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetByStatus`

**Path parameters**

| Name | Type |
|---|---|
| `status` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<IoTDeviceResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "serialNumber": "SN-2026-00045",
      "firmwareVersion": "1.4.2",
      "status": "Assigned",
      "assignedPropertyId": "assignedProperty-0001",
      "connectionStatus": "Connected",
      "lastReadingAt": "2026-03-14T15:30:00Z",
      "installedAt": "2026-03-14T15:30:00Z"
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

## `GET /api/v1/iot-devices/active-count/{ownerId}`

**Get active device count (iot devices active count)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.GetActiveDeviceCount`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Success response** — `200` · `ActiveDeviceCountResponse`

```json
{
  "count": 3
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `403` Authenticated but not allowed (inactive account, wrong role, or not the owner profile)
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot-devices/{id}/assign/{propertyId}`

**Assign to property (iot devices assign)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.AssignToProperty`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |
| `propertyId` | `string` |

**Request body** — `AssignDeviceToPropertyRequest` (`application/json`)

```json
{
  "installationRequestId": "installationRequest-0001"
}
```

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `PUT /api/v1/iot-devices/{id}/install/{propertyId}`

**Record installation (iot devices install)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.RecordInstallation`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |
| `propertyId` | `string` |

**Request body** — `RecordDeviceInstallationRequest` (`application/json`)

```json
{
  "technicianId": "tech-8a9b0c1d",
  "firmwareVersion": "1.4.2",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `PUT /api/v1/iot-devices/{id}/connection-status`

**Update connection status (iot devices connection status)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.UpdateConnectionStatus`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Request body** — `UpdateDeviceConnectionStatusRequest` (`application/json`)

```json
{
  "newConnectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z"
}
```

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/iot-devices/{id}/maintenance`

**Send to maintenance (iot devices maintenance)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.SendToMaintenance`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Request body** — `SendDeviceToMaintenanceRequest` (`application/json`)

```json
{
  "reason": "Customer request",
  "expectedReturnDate": "2026-03-14T15:30:00Z"
}
```

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/iot-devices/{id}/reinstall`

**Reinstall (iot devices reinstall)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.Reinstall`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Request body** — `ReinstallDeviceRequest` (`application/json`)

```json
{
  "technicianId": "tech-8a9b0c1d",
  "firmwareVersion": "1.4.2",
  "reinstalledAt": "2026-03-14T15:30:00Z"
}
```

**Success response** — `200` · `IoTDeviceResponse`

```json
{
  "id": "id-3a4b5c6d",
  "serialNumber": "SN-2026-00045",
  "firmwareVersion": "1.4.2",
  "status": "Assigned",
  "assignedPropertyId": "assignedProperty-0001",
  "connectionStatus": "Connected",
  "lastReadingAt": "2026-03-14T15:30:00Z",
  "installedAt": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/iot-devices/{id}/decommission`

**Decommission (iot devices decommission)**

- **Auth:** Bearer JWT (authenticated human user)
- **Source:** `IoTDevicesController.Decommission`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Request body** — `DecommissionDeviceRequest` (`application/json`)

```json
{
  "reason": "Customer request"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/homeowners/{ownerId}/properties`

**Get all (homeowners properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.GetAll`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `city` | `string?` | optional |
| `district` | `string?` | optional |
| `region` | `string?` | optional |
| `street` | `string?` | optional |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<PropertyResponse>`

```json
{
  "items": [
    {
      "propertyId": "prop-4d5e6f70",
      "ownerId": "home-2b3c4d5e",
      "address": {
        "street": "Av. Arequipa",
        "number": "1234",
        "district": "Miraflores",
        "city": "Lima",
        "country": "PE",
        "postalCode": "15074"
      },
      "geolocation": {
        "latitude": -12.1211,
        "longitude": -77.0297,
        "accuracy": 15,
        "source": "EdgeDevice"
      },
      "status": "InPortfolio",
      "isActive": true,
      "propertyType": "Commercial",
      "mainPhotoProviderId": "mainPhotoProvider-0001",
      "photos": [
        {
          "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
          "providerId": "electrolink/sample",
          "thumbnailUrl": "https://example.com/thumbnailUrl",
          "uploadedAt": "2026-03-14T15:30:00Z"
        }
      ]
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

## `GET /api/v1/companies/{ownerId}/properties`

**Get all (companies properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.GetAll`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `city` | `string?` | optional |
| `district` | `string?` | optional |
| `region` | `string?` | optional |
| `street` | `string?` | optional |
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<PropertyResponse>`

```json
{
  "items": [
    {
      "propertyId": "prop-4d5e6f70",
      "ownerId": "home-2b3c4d5e",
      "address": {
        "street": "Av. Arequipa",
        "number": "1234",
        "district": "Miraflores",
        "city": "Lima",
        "country": "PE",
        "postalCode": "15074"
      },
      "geolocation": {
        "latitude": -12.1211,
        "longitude": -77.0297,
        "accuracy": 15,
        "source": "EdgeDevice"
      },
      "status": "InPortfolio",
      "isActive": true,
      "propertyType": "Commercial",
      "mainPhotoProviderId": "mainPhotoProvider-0001",
      "photos": [
        {
          "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
          "providerId": "electrolink/sample",
          "thumbnailUrl": "https://example.com/thumbnailUrl",
          "uploadedAt": "2026-03-14T15:30:00Z"
        }
      ]
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

## `POST /api/v1/homeowners/{ownerId}/properties`

**Create property (homeowners properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.CreateProperty`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Request body** — `CreatePropertyRequest` (`application/json`)

```json
{
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "propertyType": "Commercial"
}
```

**Success response** — `201` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/companies/{ownerId}/properties`

**Create property (companies properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.CreateProperty`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Request body** — `CreatePropertyRequest` (`application/json`)

```json
{
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "propertyType": "Commercial"
}
```

**Success response** — `201` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/homeowners/{ownerId}/properties/{propertyId}`

**Get property by id (homeowners properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.GetPropertyById`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/companies/{ownerId}/properties/{propertyId}`

**Get property by id (companies properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.GetPropertyById`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/homeowners/{ownerId}/properties/{propertyId}/location`

**Update location (properties location)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.UpdateLocation`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Request body** — `UpdateLocationRequest` (`application/json`)

```json
{
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  }
}
```

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/companies/{ownerId}/properties/{propertyId}/location`

**Update location (properties location)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.UpdateLocation`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Request body** — `UpdateLocationRequest` (`application/json`)

```json
{
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  }
}
```

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/homeowners/{ownerId}/properties/{propertyId}/activate`

**Activate (properties activate)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.Activate`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/companies/{ownerId}/properties/{propertyId}/activate`

**Activate (properties activate)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.Activate`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/homeowners/{ownerId}/properties/{propertyId}/deactivate`

**Deactivate (properties deactivate)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.Deactivate`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/companies/{ownerId}/properties/{propertyId}/deactivate`

**Deactivate (properties deactivate)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.Deactivate`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/homeowners/{ownerId}/properties/{propertyId}`

**Archive property (homeowners properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.ArchiveProperty`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `reason` | `string` | required |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/companies/{ownerId}/properties/{propertyId}`

**Archive property (companies properties)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.ArchiveProperty`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `reason` | `string` | required |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/homeowners/{ownerId}/properties/{propertyId}/photos/upload-url`

**Get photo upload url (photos upload url)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.GetPhotoUploadUrl`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyPhotoUploadUrlResponse`

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
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/companies/{ownerId}/properties/{propertyId}/photos/upload-url`

**Get photo upload url (photos upload url)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.GetPhotoUploadUrl`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Success response** — `200` · `PropertyPhotoUploadUrlResponse`

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
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/homeowners/{ownerId}/properties/{propertyId}/photos`

**Register photo (properties photos)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.RegisterPhoto`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Request body** — `RegisterPropertyPhotoRequest` (`application/json`)

```json
{
  "providerId": "electrolink/sample",
  "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg"
}
```

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/companies/{ownerId}/properties/{propertyId}/photos`

**Register photo (properties photos)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.RegisterPhoto`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Request body** — `RegisterPropertyPhotoRequest` (`application/json`)

```json
{
  "providerId": "electrolink/sample",
  "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg"
}
```

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/homeowners/{ownerId}/properties/{propertyId}/main-photo`

**Set main photo (properties main photo)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.SetMainPhoto`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Request body** — `SetPropertyMainPhotoRequest` (`application/json`)

```json
{
  "providerId": "electrolink/sample"
}
```

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/companies/{ownerId}/properties/{propertyId}/main-photo`

**Set main photo (properties main photo)**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertiesController.SetMainPhoto`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Request body** — `SetPropertyMainPhotoRequest` (`application/json`)

```json
{
  "providerId": "electrolink/sample"
}
```

**Success response** — `200` · `PropertyResponse`

```json
{
  "propertyId": "prop-4d5e6f70",
  "ownerId": "home-2b3c4d5e",
  "address": {
    "street": "Av. Arequipa",
    "number": "1234",
    "district": "Miraflores",
    "city": "Lima",
    "country": "PE",
    "postalCode": "15074"
  },
  "geolocation": {
    "latitude": -12.1211,
    "longitude": -77.0297,
    "accuracy": 15,
    "source": "EdgeDevice"
  },
  "status": "InPortfolio",
  "isActive": true,
  "propertyType": "Commercial",
  "mainPhotoProviderId": "mainPhotoProvider-0001",
  "photos": [
    {
      "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "providerId": "electrolink/sample",
      "thumbnailUrl": "https://example.com/thumbnailUrl",
      "uploadedAt": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/homeowners/{ownerId}/property-portfolios`

**Get portfolio by owner ID**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertyPortfoliosController.GetPortfolio`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Success response** — `200` · `PropertyPortfolioResponse`

```json
{
  "id": "id-3a4b5c6d",
  "ownerId": "home-2b3c4d5e",
  "status": "Active",
  "entries": [
    {
      "propertyId": "prop-4d5e6f70",
      "nickname": "Main store",
      "isPrimary": true,
      "occupancyStatus": "OwnerOccupied"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/companies/{ownerId}/property-portfolios`

**Get portfolio by owner ID**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertyPortfoliosController.GetPortfolio`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Success response** — `200` · `PropertyPortfolioResponse`

```json
{
  "id": "id-3a4b5c6d",
  "ownerId": "home-2b3c4d5e",
  "status": "Active",
  "entries": [
    {
      "propertyId": "prop-4d5e6f70",
      "nickname": "Main store",
      "isPrimary": true,
      "occupancyStatus": "OwnerOccupied"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/homeowners/{ownerId}/property-portfolios/properties`

**Add property to portfolio**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertyPortfoliosController.AddPropertyToPortfolio`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Request body** — `AddPropertyToPortfolioRequest` (`application/json`)

```json
{
  "propertyId": "prop-4d5e6f70",
  "nickname": "Main store",
  "isPrimary": true,
  "occupancyStatus": "OwnerOccupied"
}
```

**Success response** — `200` · `PropertyPortfolioResponse`

```json
{
  "id": "id-3a4b5c6d",
  "ownerId": "home-2b3c4d5e",
  "status": "Active",
  "entries": [
    {
      "propertyId": "prop-4d5e6f70",
      "nickname": "Main store",
      "isPrimary": true,
      "occupancyStatus": "OwnerOccupied"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/companies/{ownerId}/property-portfolios/properties`

**Add property to portfolio**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertyPortfoliosController.AddPropertyToPortfolio`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |

**Request body** — `AddPropertyToPortfolioRequest` (`application/json`)

```json
{
  "propertyId": "prop-4d5e6f70",
  "nickname": "Main store",
  "isPrimary": true,
  "occupancyStatus": "OwnerOccupied"
}
```

**Success response** — `200` · `PropertyPortfolioResponse`

```json
{
  "id": "id-3a4b5c6d",
  "ownerId": "home-2b3c4d5e",
  "status": "Active",
  "entries": [
    {
      "propertyId": "prop-4d5e6f70",
      "nickname": "Main store",
      "isPrimary": true,
      "occupancyStatus": "OwnerOccupied"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `DELETE /api/v1/homeowners/{ownerId}/property-portfolios/properties/{propertyId}`

**Remove property from portfolio**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertyPortfoliosController.RemovePropertyFromPortfolio`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `reason` | `string` | required |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/companies/{ownerId}/property-portfolios/properties/{propertyId}`

**Remove property from portfolio**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `PropertyPortfoliosController.RemovePropertyFromPortfolio`

**Path parameters**

| Name | Type |
|---|---|
| `ownerId` | `string` |
| `propertyId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `reason` | `string` | required |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/technicians/{technicianId}/inventory`

**Create technician inventory**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.CreateTechnicianInventory`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Success response** — `201` · `TechnicianInventoryResponse`

```json
{
  "technicianId": "tech-8a9b0c1d",
  "stockItems": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `POST /api/v1/technicians/{technicianId}/inventory/stock-items`

**Add stock item to technician inventory**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.AddStockItemToInventory`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Request body** — `AddStockToInventoryRequest` (`application/json`)

```json
{
  "componentId": "comp-3d4e5f60",
  "componentTypeId": "ctype-7a8b9c0d",
  "quantity": 15,
  "alertThreshold": 15
}
```

**Success response** — `200` · `TechnicianInventoryResponse`

```json
{
  "technicianId": "tech-8a9b0c1d",
  "stockItems": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `PUT /api/v1/technicians/{technicianId}/inventory/{componentId}`

**Update component stock in technician inventory**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.UpdateComponentStock`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Request body** — `UpdateComponentStockRequest` (`application/json`)

```json
{
  "newQuantity": 15,
  "newAlertThreshold": 15
}
```

**Success response** — `200` · `TechnicianInventoryResponse`

```json
{
  "technicianId": "tech-8a9b0c1d",
  "stockItems": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/technicians/{technicianId}/inventory/{componentId}`

**Remove component from technician inventory**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.RemoveComponentStock`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)
- `409` Conflict with current state / duplicate

## `GET /api/v1/technicians/{technicianId}/inventory`

**Get technician inventory by technician ID**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.GetInventoryByTechnicianId`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Success response** — `200` · `TechnicianInventoryResponse`

```json
{
  "technicianId": "tech-8a9b0c1d",
  "stockItems": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/technicians/{technicianId}/inventory/{componentId}/increase`

**Increase stock for a component in inventory**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.IncreaseComponentStock`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Request body** — `AdjustStockAmountRequest` (`application/json`)

```json
{
  "amount": 15
}
```

**Success response** — `200` · `TechnicianInventoryResponse`

```json
{
  "technicianId": "tech-8a9b0c1d",
  "stockItems": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/technicians/{technicianId}/inventory/{componentId}/decrease`

**Decrease stock for a component in inventory**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.DecreaseComponentStock`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |
| `componentId` | `string` |

**Request body** — `AdjustStockAmountRequest` (`application/json`)

```json
{
  "amount": 15
}
```

**Success response** — `200` · `TechnicianInventoryResponse`

```json
{
  "technicianId": "tech-8a9b0c1d",
  "stockItems": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
    }
  ]
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/technicians/{technicianId}/inventory/stock-items`

**Get Technician Inventory Stock Items**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `TechnicianInventoriesController.GetInventoryItems`

**Path parameters**

| Name | Type |
|---|---|
| `technicianId` | `string` |

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<ComponentStockResponse>`

```json
{
  "items": [
    {
      "componentStockId": "componentStock-0001",
      "componentId": "comp-3d4e5f60",
      "componentTypeId": "ctype-7a8b9c0d",
      "componentName": "string",
      "quantityAvailable": 15,
      "alertThreshold": 15,
      "lastUpdated": "2026-03-14T15:30:00Z"
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
