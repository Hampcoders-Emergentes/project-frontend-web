# Technician app — integration guide

Persona: an electrical technician (`businessRole: Technician`, `roleSubjectId: tech-…`). All routes may use `me` for the technician id where noted.

## 1. Onboarding

`POST /profiles/me/complete/technician` with names, phone, DNI, birth date, address, `specialties[]` (`SolarInstallation|ElectricalMaintenance|Repair|Inspection|Upgrade|BatterySystems`, at least one), `experienceYears`, `aboutMe`, service area `centerLatitude` (−90…90), `centerLongitude` (−180…180), `radiusKm` (0 < r ≤ 100) → then store the access token from the `X-Refreshed-Token` response header (Monitoring routes read `roleSubjectId`, which the server now refreshes per request, so an older token also works). Update later with `PATCH /profiles/me/technician`.

Auto-created on completion: inventory (`/technicians/{id}/inventory`). Create the service catalog yourself: `POST /technicians/me/catalog` (201, or 409 if it exists).

## 2. Catalog (what the technician sells)

| Screen | Call |
|---|---|
| Catalog overview | `GET /technicians/{id}/catalog` → `ServiceCatalogResponse` (recipes summary) |
| New recipe | `POST …/catalog/recipes` `{serviceName, serviceDescription, serviceCategory, requiresIoTCertification, componentRequirements[{componentTypeId,quantity,isRequired}], estimatedDurationHours, estimatedDurationMinutes, pricing{materialsEstimate,laborCost,totalPrice,currency}, prerequisites[], deliverables[], warrantyMonths}` → `201 {recipeId}`; 409 duplicate name |
| Recipe detail / edit | `GET …/recipes/{recipeId}`, `PATCH …/recipes/{recipeId}` (partial body; `204`) |
| Deactivate / reactivate | `DELETE …/recipes/{recipeId} {reason: TemporarilyUnavailable|OutOfStock|Seasonal|Other, notes?}`; `POST …/recipes/{recipeId}/reactivate` |

Component types and components: `GET/POST/PUT/DELETE /technicians/{id}/component-types` and `/components` (plus `PATCH …/activate|deactivate` for types). The catalogue is global; write permissions are enforced by `ComponentCatalogAccess` (expect 403/404 when not allowed).

## 3. Inventory

`GET /technicians/{id}/inventory` (404 until created), `POST …/inventory/stock-items {componentId, componentTypeId, quantity, alertThreshold}`, `PUT …/inventory/{componentId} {newQuantity, newAlertThreshold}`, `PATCH …/increase|decrease {amount}` (decrease below zero → 400), `DELETE …/inventory/{componentId}`, list with component names `GET …/inventory/stock-items`.

IoT device stock: `GET /iot-devices/my-stock?page&pageSize` → `{items,page,pageSize,totalCount,availableCount,hasMore}`; register `POST /iot-devices {serialNumber, plainTextApiKey, firmwareVersion}` (409 duplicate serial); lifecycle `POST /iot-devices/{id}/assign/{propertyId}`, `PUT …/install/{propertyId}`, `PUT …/maintenance`, `PUT …/reinstall`, `POST …/decommission`.

## 4. Jobs

| Screen | Call |
|---|---|
| Assigned jobs | `GET /service-executions/technicians/me/assigned` |
| History | `GET /service-executions/technicians/me/history` |
| Job detail | `GET /service-executions/{id}`, `…/work-log` |
| Start | `POST …/actions/start {startedAt}` |
| Photos | `POST …/actions/photos/upload-url?type=Before|During|After` → direct upload (**see limitation in `cloudinary-file-storage.md`**) → `POST …/actions/photos {providerId,publicUrl,thumbnailUrl?,photoType,format,sizeBytes,takenAt,notes?}` |
| Components used | `POST …/actions/components {componentsUsed[{componentTypeId,componentTypeName,quantityUsed,quantityReserved}], recordedAt}` |
| Technical report | `PUT …/actions/report {reportContent, findings, recommendations, updatedAt, iotFindings?}` |
| Complete | `POST …/actions/complete` → `200` or `422 {message}` when evidence is missing |
| Cancel | `POST …/actions/cancel {cancelledBy:"Technician", reason, notes?, requestReassignment}` |
| Review the client | `POST …/actions/reviews/technician {rating, comment?, categories{Accessibility,Clarity,Payment}}` |
| Toggle circuit during the job | `POST /service-executions/{id}/iot/toggle-relay` `{ targetState }` or `POST /iot/devices/{deviceId}/relay {targetRelayState,propertyId,serviceRequestId}` then poll `…/relay/history` |

Photo limits per execution/type apply (400 when exceeded). Execution status flow: `Notified → EnRoute → Arrived → InProgress → PendingReview → Completed`.

## 5. Performance and subscription

`GET /technician-metrics/{technicianId}` (own id only; 404 if no period) and `POST …/initialize-period`; subscription pages as in `integrations/stripe.md` (technician Basic/Premium).
