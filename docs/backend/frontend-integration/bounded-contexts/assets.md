# Assets

**Endpoints:** [`../api/assets/endpoints.md`](../api/assets/endpoints.md)

## Responsibilities

Physical and catalogue assets: **properties** and **property portfolios** of homeowners/companies, the **IoT device** fleet and its lifecycle, and the technician-side **component catalogue** (component types, components) and **inventory/stock**.

## Model

| Element | Kind | Notes |
|---|---|---|
| `Property` | Aggregate | `PropertyId` (`prop-…`), owner (`ClientIdentity`: homeowner or company), `Address`, `Geolocation` (lat/lon, accuracy, source — PostGIS point), `EPropertyType`, `EPropertyStatus` (`Created` → `InPortfolio` → `Archived`), active flag, photos (`PropertyPhoto`: providerId, publicUrl, thumbnail) and main photo, maintenance records. |
| `PropertyPortfolio` / `PortfolioEntry` | Aggregate / entity | One portfolio per owner; entries carry nickname (unique within portfolio), primary flag, `EOccupancyStatus`. |
| `IoTDevice` | Aggregate | Serial number (unique), firmware version, **API key hash** (the plain key is only accepted at registration), `EDeviceStatus`, `EConnectionStatus`, assigned property, installation timestamps. |
| `ComponentType` | Aggregate | Global catalogue (name, description, active). Writes restricted by `ComponentCatalogAccess` (see per-endpoint docs). |
| `Component` | Aggregate | Catalogue item with active flag. |
| `TechnicianInventory` / `ComponentStock` / `ComponentReservation` / `ReservationItem` | Aggregate / entities | Per-technician stock: quantity, alert threshold; reservations for services; consumption. |

## State machines

**Device:** `InStock → Assigned` (assign to property for an installation request) `→ Installed` (technician records installation) `→ Maintenance → Installed` (reinstall) … `→ Decommissioned` (terminal). Conflict errors: assign when not free stock → 409 `Device is not free stock.`; install when not awaiting installation → 409 `Device is not awaiting installation.`.

**Property:** `Created → InPortfolio → Archived` (archive requires `reason`); activate/deactivate toggle `isActive` independently.

## Rules and invariants

- Ownership: owner-scoped routes (`/homeowners|companies/{ownerId}/…`, `/technicians/{technicianId}/…`) verify the caller's profile; mismatches → 404/403.
- A property cannot be added twice to a portfolio and nicknames must be unique (409).
- Stock cannot go negative (`InsufficientStockException` → 400); `Low stock` events are raised when a quantity crosses `alertThreshold`.
- Photo registration only accepts provider ids located in the owner's storage folder.
- Device serial numbers are unique (409).

## Events

Published (selection): `PropertyCreated/AddressUpdated/GeolocationUpdated/MainPhotoUpdated/Archived/Activated/Deactivated`, `PropertyAddedToPortfolio`, `IoTDeviceRegistered`, `DeviceAssignedToProperty`, `DeviceInstalled`, `DeviceReinstalled`, `DeviceSentToMaintenance`, `DeviceDecommissioned`, `DeviceConnectionStatusUpdated`, `ComponentStockLow/Increased/Decreased`, `ComponentsReservedForService`, `ComponentsConsumed`.
Consumed: `ProfileCompletedEvent` (creates technician inventory or client portfolio), `ServiceCompletedIoTInstallation…`, `DeviceDisconnected/ReconnectedExternalEvent`.
