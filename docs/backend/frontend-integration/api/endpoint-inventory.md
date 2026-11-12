# Endpoint inventory

All routes discovered in the controllers (`236` method/URI combinations). Owner routes exist once per client type (`/homeowners/{ownerId}/...` for HomeOwner profiles, `/companies/{ownerId}/...` for Company profiles) and are listed separately: they are the same handler, pick the prefix that matches the caller's business role. Detailed contracts live in `api/<context>/endpoints.md`.

| # | Method | URI | Context | Auth | Request | Success | Detail |
|---|---|---|---|---|---|---|---|
| 1 | POST | `/api/v1/alerts/dispatch` | alert-management | Edge key | `DispatchAlertRequest` | 202 `AlertDispatchResultResponse` | [alert-management](./alert-management/endpoints.md) |
| 2 | POST | `/api/v1/alerts/{alertId}/assign` | alert-management | JWT | `AssignAlertRequest` | 200 `AlertResponse` | [alert-management](./alert-management/endpoints.md) |
| 3 | POST | `/api/v1/alerts/{alertId}/resolve` | alert-management | JWT | `ResolveAlertRequest` | 200 `AlertResponse` | [alert-management](./alert-management/endpoints.md) |
| 4 | POST | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/anomalies` | alert-management | JWT | `ReportEquipmentAnomalyRequest` | 201 `AlertResponse` | [alert-management](./alert-management/endpoints.md) |
| 5 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts` | alert-management | JWT | `—` | 200 `HasMorePageResponse<AlertResponse>` | [alert-management](./alert-management/endpoints.md) |
| 6 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts/{alertId}` | alert-management | JWT | `—` | 200 `AlertResponse` | [alert-management](./alert-management/endpoints.md) |
| 7 | POST | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/alerts/{alertId}/acknowledgement` | alert-management | JWT | `—` | 200 `AlertResponse` | [alert-management](./alert-management/endpoints.md) |
| 8 | GET | `/api/v1/stores/{storeId}/alerts` | alert-management | JWT | `—` | 200 `HasMorePageResponse<AlertResponse>` | [alert-management](./alert-management/endpoints.md) |
| 9 | GET | `/api/v1/stores/{storeId}/alerts/active` | alert-management | JWT | `—` | 200 `ActiveAlertsResponse` | [alert-management](./alert-management/endpoints.md) |
| 10 | GET | `/api/v1/stores/{storeId}/alerts/changes` | alert-management | JWT | `—` | 200 `AlertChangesResponse` | [alert-management](./alert-management/endpoints.md) |
| 11 | GET | `/api/v1/notification-channels` | alert-management | JWT | `—` | 200 `NotificationChannelsResponse` | [alert-management](./alert-management/endpoints.md) |
| 12 | GET | `/api/v1/stores/{storeId}/analytics/consumption` | analytics | JWT | `—` | 200 `StoreConsumptionResponse` | [analytics](./analytics/endpoints.md) |
| 13 | GET | `/api/v1/stores/{storeId}/analytics/consumption/report` | analytics | JWT | `—` | 200 `file` | [analytics](./analytics/endpoints.md) |
| 14 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/consumption` | analytics | JWT | `—` | 200 `EquipmentPowerConsumptionResponse` | [analytics](./analytics/endpoints.md) |
| 15 | GET | `/api/v1/stores/{storeId}/analytics/cost-projection` | analytics | JWT | `—` | 200 `StoreCostForecastResponse` | [analytics](./analytics/endpoints.md) |
| 16 | POST | `/api/v1/stores/{storeId}/analytics/reports` | analytics | JWT | `GenerateEnergyReportRequest` | 201 `EnergyReportResponse` | [analytics](./analytics/endpoints.md) |
| 17 | GET | `/api/v1/stores/{storeId}/analytics/reports/{reportId}/download` | analytics | JWT | `—` | 200 `file` | [analytics](./analytics/endpoints.md) |
| 18 | GET | `/api/v1/stores/{storeId}/analytics/comparison` | analytics | JWT | `—` | 200 `ConsumptionComparisonResponse` | [analytics](./analytics/endpoints.md) |
| 19 | GET | `/api/v1/stores/{storeId}/analytics/off-hours-consumption` | analytics | JWT | `—` | 200 `OffHoursConsumptionResponse` | [analytics](./analytics/endpoints.md) |
| 20 | GET | `/api/v1/stores/{storeId}/analytics/opening-hours` | analytics | JWT | `—` | 200 `StoreOpeningHoursResponse` | [analytics](./analytics/endpoints.md) |
| 21 | PUT | `/api/v1/stores/{storeId}/analytics/opening-hours` | analytics | JWT | `SetOpeningHoursRequest` | 200 `StoreOpeningHoursResponse` | [analytics](./analytics/endpoints.md) |
| 22 | PUT | `/api/v1/stores/{storeId}/analytics/budget` | analytics | JWT | `SetEnergyBudgetRequest` | 200 `StoreEnergyBudgetResponse` | [analytics](./analytics/endpoints.md) |
| 23 | GET | `/api/v1/stores/{storeId}/analytics/budget-status` | analytics | JWT | `—` | 200 `BudgetStatusResponse` | [analytics](./analytics/endpoints.md) |
| 24 | GET | `/api/v1/stores/{storeId}/maintenance/predictions` | analytics | JWT | `—` | 200 `MaintenancePredictionsResponse` | [analytics](./analytics/endpoints.md) |
| 25 | GET | `/api/v1/technician-metrics/{technicianId}` | analytics | JWT | `—` | 200 `TechnicianMetricsResponse` | [analytics](./analytics/endpoints.md) |
| 26 | POST | `/api/v1/technician-metrics/{technicianId}/initialize-period` | analytics | JWT | `—` | 200 `MessageResponse` | [analytics](./analytics/endpoints.md) |
| 27 | POST | `/api/v1/technicians/{technicianId}/component-types` | assets | JWT | `CreateComponentTypeRequest` | 201 `ComponentTypeResponse` | [assets](./assets/endpoints.md) |
| 28 | GET | `/api/v1/technicians/{technicianId}/component-types/{typeId}` | assets | JWT | `—` | 200 `ComponentTypeResponse` | [assets](./assets/endpoints.md) |
| 29 | GET | `/api/v1/technicians/{technicianId}/component-types` | assets | JWT | `—` | 200 `PagedResponse<ComponentTypeResponse>` | [assets](./assets/endpoints.md) |
| 30 | PUT | `/api/v1/technicians/{technicianId}/component-types/{typeId}` | assets | JWT | `UpdateComponentTypeRequest` | 200 `ComponentTypeResponse` | [assets](./assets/endpoints.md) |
| 31 | DELETE | `/api/v1/technicians/{technicianId}/component-types/{typeId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 32 | PATCH | `/api/v1/technicians/{technicianId}/component-types/{typeId}/activate` | assets | JWT | `—` | 200 `ComponentTypeResponse` | [assets](./assets/endpoints.md) |
| 33 | PATCH | `/api/v1/technicians/{technicianId}/component-types/{typeId}/deactivate` | assets | JWT | `—` | 200 `ComponentTypeResponse` | [assets](./assets/endpoints.md) |
| 34 | POST | `/api/v1/technicians/{technicianId}/components` | assets | JWT | `CreateComponentRequest` | 201 `ComponentResponse` | [assets](./assets/endpoints.md) |
| 35 | GET | `/api/v1/technicians/{technicianId}/components/{componentId}` | assets | JWT | `—` | 200 `ComponentResponse` | [assets](./assets/endpoints.md) |
| 36 | GET | `/api/v1/technicians/{technicianId}/components` | assets | JWT | `—` | 200 `PagedResponse<ComponentResponse>` | [assets](./assets/endpoints.md) |
| 37 | PUT | `/api/v1/technicians/{technicianId}/components/{componentId}` | assets | JWT | `UpdateComponentRequest` | 200 `ComponentResponse` | [assets](./assets/endpoints.md) |
| 38 | DELETE | `/api/v1/technicians/{technicianId}/components/{componentId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 39 | POST | `/api/v1/iot-devices` | assets | JWT | `RegisterIoTDeviceRequest` | 201 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 40 | GET | `/api/v1/iot-devices/{id}` | assets | JWT | `—` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 41 | GET | `/api/v1/iot-devices/stock/{id}` | assets | JWT | `—` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 42 | GET | `/api/v1/iot-devices/my-stock` | assets | JWT | `—` | 200 `StockPageResponse` | [assets](./assets/endpoints.md) |
| 43 | GET | `/api/v1/iot-devices` | assets | JWT | `—` | 200 `PagedResponse<IoTDeviceResponse>` | [assets](./assets/endpoints.md) |
| 44 | GET | `/api/v1/iot-devices/by-property/{propertyId}` | assets | JWT | `—` | 200 `PagedResponse<IoTDeviceResponse>` | [assets](./assets/endpoints.md) |
| 45 | GET | `/api/v1/iot-devices/by-status/{status}` | assets | JWT | `—` | 200 `PagedResponse<IoTDeviceResponse>` | [assets](./assets/endpoints.md) |
| 46 | GET | `/api/v1/iot-devices/active-count/{ownerId}` | assets | JWT | `—` | 200 `ActiveDeviceCountResponse` | [assets](./assets/endpoints.md) |
| 47 | POST | `/api/v1/iot-devices/{id}/assign/{propertyId}` | assets | JWT | `AssignDeviceToPropertyRequest` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 48 | PUT | `/api/v1/iot-devices/{id}/install/{propertyId}` | assets | JWT | `RecordDeviceInstallationRequest` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 49 | PUT | `/api/v1/iot-devices/{id}/connection-status` | assets | JWT | `UpdateDeviceConnectionStatusRequest` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 50 | PUT | `/api/v1/iot-devices/{id}/maintenance` | assets | JWT | `SendDeviceToMaintenanceRequest` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 51 | PUT | `/api/v1/iot-devices/{id}/reinstall` | assets | JWT | `ReinstallDeviceRequest` | 200 `IoTDeviceResponse` | [assets](./assets/endpoints.md) |
| 52 | POST | `/api/v1/iot-devices/{id}/decommission` | assets | JWT | `DecommissionDeviceRequest` | 204 `empty` | [assets](./assets/endpoints.md) |
| 53 | GET | `/api/v1/homeowners/{ownerId}/properties` | assets | JWT | `—` | 200 `PagedResponse<PropertyResponse>` | [assets](./assets/endpoints.md) |
| 54 | GET | `/api/v1/companies/{ownerId}/properties` | assets | JWT | `—` | 200 `PagedResponse<PropertyResponse>` | [assets](./assets/endpoints.md) |
| 55 | POST | `/api/v1/homeowners/{ownerId}/properties` | assets | JWT | `CreatePropertyRequest` | 201 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 56 | POST | `/api/v1/companies/{ownerId}/properties` | assets | JWT | `CreatePropertyRequest` | 201 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 57 | GET | `/api/v1/homeowners/{ownerId}/properties/{propertyId}` | assets | JWT | `—` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 58 | GET | `/api/v1/companies/{ownerId}/properties/{propertyId}` | assets | JWT | `—` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 59 | PATCH | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/location` | assets | JWT | `UpdateLocationRequest` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 60 | PATCH | `/api/v1/companies/{ownerId}/properties/{propertyId}/location` | assets | JWT | `UpdateLocationRequest` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 61 | PATCH | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/activate` | assets | JWT | `—` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 62 | PATCH | `/api/v1/companies/{ownerId}/properties/{propertyId}/activate` | assets | JWT | `—` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 63 | PATCH | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/deactivate` | assets | JWT | `—` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 64 | PATCH | `/api/v1/companies/{ownerId}/properties/{propertyId}/deactivate` | assets | JWT | `—` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 65 | DELETE | `/api/v1/homeowners/{ownerId}/properties/{propertyId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 66 | DELETE | `/api/v1/companies/{ownerId}/properties/{propertyId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 67 | GET | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/photos/upload-url` | assets | JWT | `—` | 200 `PropertyPhotoUploadUrlResponse` | [assets](./assets/endpoints.md) |
| 68 | GET | `/api/v1/companies/{ownerId}/properties/{propertyId}/photos/upload-url` | assets | JWT | `—` | 200 `PropertyPhotoUploadUrlResponse` | [assets](./assets/endpoints.md) |
| 69 | POST | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/photos` | assets | JWT | `RegisterPropertyPhotoRequest` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 70 | POST | `/api/v1/companies/{ownerId}/properties/{propertyId}/photos` | assets | JWT | `RegisterPropertyPhotoRequest` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 71 | POST | `/api/v1/homeowners/{ownerId}/properties/{propertyId}/main-photo` | assets | JWT | `SetPropertyMainPhotoRequest` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 72 | POST | `/api/v1/companies/{ownerId}/properties/{propertyId}/main-photo` | assets | JWT | `SetPropertyMainPhotoRequest` | 200 `PropertyResponse` | [assets](./assets/endpoints.md) |
| 73 | GET | `/api/v1/homeowners/{ownerId}/property-portfolios` | assets | JWT | `—` | 200 `PropertyPortfolioResponse` | [assets](./assets/endpoints.md) |
| 74 | GET | `/api/v1/companies/{ownerId}/property-portfolios` | assets | JWT | `—` | 200 `PropertyPortfolioResponse` | [assets](./assets/endpoints.md) |
| 75 | POST | `/api/v1/homeowners/{ownerId}/property-portfolios/properties` | assets | JWT | `AddPropertyToPortfolioRequest` | 200 `PropertyPortfolioResponse` | [assets](./assets/endpoints.md) |
| 76 | POST | `/api/v1/companies/{ownerId}/property-portfolios/properties` | assets | JWT | `AddPropertyToPortfolioRequest` | 200 `PropertyPortfolioResponse` | [assets](./assets/endpoints.md) |
| 77 | DELETE | `/api/v1/homeowners/{ownerId}/property-portfolios/properties/{propertyId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 78 | DELETE | `/api/v1/companies/{ownerId}/property-portfolios/properties/{propertyId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 79 | POST | `/api/v1/technicians/{technicianId}/inventory` | assets | JWT | `—` | 201 `TechnicianInventoryResponse` | [assets](./assets/endpoints.md) |
| 80 | POST | `/api/v1/technicians/{technicianId}/inventory/stock-items` | assets | JWT | `AddStockToInventoryRequest` | 200 `TechnicianInventoryResponse` | [assets](./assets/endpoints.md) |
| 81 | PUT | `/api/v1/technicians/{technicianId}/inventory/{componentId}` | assets | JWT | `UpdateComponentStockRequest` | 200 `TechnicianInventoryResponse` | [assets](./assets/endpoints.md) |
| 82 | DELETE | `/api/v1/technicians/{technicianId}/inventory/{componentId}` | assets | JWT | `—` | 204 `empty` | [assets](./assets/endpoints.md) |
| 83 | GET | `/api/v1/technicians/{technicianId}/inventory` | assets | JWT | `—` | 200 `TechnicianInventoryResponse` | [assets](./assets/endpoints.md) |
| 84 | PATCH | `/api/v1/technicians/{technicianId}/inventory/{componentId}/increase` | assets | JWT | `AdjustStockAmountRequest` | 200 `TechnicianInventoryResponse` | [assets](./assets/endpoints.md) |
| 85 | PATCH | `/api/v1/technicians/{technicianId}/inventory/{componentId}/decrease` | assets | JWT | `AdjustStockAmountRequest` | 200 `TechnicianInventoryResponse` | [assets](./assets/endpoints.md) |
| 86 | GET | `/api/v1/technicians/{technicianId}/inventory/stock-items` | assets | JWT | `—` | 200 `PagedResponse<ComponentStockResponse>` | [assets](./assets/endpoints.md) |
| 87 | POST | `/api/v1/auth/sign-in` | iam | Public | `SignInRequest` | 200 `AuthenticatedUserResponse` | [iam](./iam/endpoints.md) |
| 88 | POST | `/api/v1/auth/sign-up` | iam | Public | `SignUpRequest` | 201 `AuthenticatedUserResponse` | [iam](./iam/endpoints.md) |
| 89 | POST | `/api/v1/auth/refresh` | iam | Public | `RefreshTokenRequest` | 200 `AuthenticatedUserResponse` | [iam](./iam/endpoints.md) |
| 90 | POST | `/api/v1/auth/refresh-claims` | iam | JWT | `—` | 200 `RefreshedTokenResponse` | [iam](./iam/endpoints.md) |
| 91 | POST | `/api/v1/auth/forgot-password` | iam | Public | `RequestPasswordResetRequest` | 200 `MessageResponse` | [iam](./iam/endpoints.md) |
| 92 | POST | `/api/v1/auth/reset-password` | iam | Public | `ResetPasswordRequest` | 200 `MessageResponse` | [iam](./iam/endpoints.md) |
| 93 | POST | `/api/v1/staff-users` | iam | JWT + Admin/SuperAdmin | `CreateStaffUserRequest` | 201 `StaffUserResponse` | [iam](./iam/endpoints.md) |
| 94 | GET | `/api/v1/stores/{storeId}/audit-logs` | iam | JWT | `—` | 200 `AuditLogPageResponse` | [iam](./iam/endpoints.md) |
| 95 | GET | `/api/v1/users/{id}` | iam | JWT | `—` | 200 `UserResponse` | [iam](./iam/endpoints.md) |
| 96 | GET | `/api/v1/users` | iam | JWT + Admin/SuperAdmin | `—` | 200 `PagedResponse<UserResponse>` | [iam](./iam/endpoints.md) |
| 97 | PUT | `/api/v1/users/{id}/password` | iam | JWT | `UpdatePasswordRequest` | 200 `MessageResponse` | [iam](./iam/endpoints.md) |
| 98 | POST | `/api/v1/service-executions/{executionId}/actions/start` | monitoring | JWT | `StartServiceExecutionRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 99 | POST | `/api/v1/service-executions/{executionId}/actions/photos/upload-url` | monitoring | JWT | `—` | 200 `WorkPhotoUploadUrlResponse` | [monitoring](./monitoring/endpoints.md) |
| 100 | POST | `/api/v1/service-executions/{executionId}/actions/photos` | monitoring | JWT | `RegisterWorkPhotoRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 101 | POST | `/api/v1/service-executions/{executionId}/actions/components` | monitoring | JWT | `RecordComponentsUsedRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 102 | PUT | `/api/v1/service-executions/{executionId}/actions/report` | monitoring | JWT | `UpdateTechnicalReportRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 103 | POST | `/api/v1/service-executions/{executionId}/actions/complete` | monitoring | JWT | `—` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 104 | POST | `/api/v1/service-executions/{executionId}/actions/cancel` | monitoring | JWT | `CancelServiceExecutionRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 105 | POST | `/api/v1/service-executions/{executionId}/actions/extend-wait` | monitoring | JWT | `ExtendWaitTimeRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 106 | POST | `/api/v1/service-executions/{executionId}/actions/reviews/client` | monitoring | JWT | `SubmitReviewRequest` | 204 `empty` | [monitoring](./monitoring/endpoints.md) |
| 107 | POST | `/api/v1/service-executions/{executionId}/actions/reviews/technician` | monitoring | JWT | `SubmitReviewRequest` | 204 `empty` | [monitoring](./monitoring/endpoints.md) |
| 108 | POST | `/api/v1/service-executions/{executionId}/iot/toggle-relay` | monitoring | JWT | `ToggleRelayRequest` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 109 | POST | `/api/v1/service-executions` | monitoring | JWT + Admin/SuperAdmin/FieldManager | `CreateServiceExecutionRequest` | 201 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 110 | GET | `/api/v1/service-executions/{executionId}` | monitoring | JWT | `—` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 111 | GET | `/api/v1/service-executions/{executionId}/work-log` | monitoring | JWT | `—` | 200 `WorkLogResponse` | [monitoring](./monitoring/endpoints.md) |
| 112 | GET | `/api/v1/service-executions/technicians/{technicianId}/assigned` | monitoring | JWT | `—` | 200 `PagedResponse<ServiceExecutionResponse>` | [monitoring](./monitoring/endpoints.md) |
| 113 | GET | `/api/v1/service-executions/homeowners/{homeownerId}/history` | monitoring | JWT | `—` | 200 `PagedResponse<ServiceExecutionResponse>` | [monitoring](./monitoring/endpoints.md) |
| 114 | GET | `/api/v1/service-executions/technicians/{technicianId}/history` | monitoring | JWT | `—` | 200 `PagedResponse<ServiceExecutionResponse>` | [monitoring](./monitoring/endpoints.md) |
| 115 | GET | `/api/v1/service-executions/homeowners/{homeownerId}/active` | monitoring | JWT | `—` | 200 `ServiceExecutionResponse` | [monitoring](./monitoring/endpoints.md) |
| 116 | POST | `/api/v1/dispatch/assign-staff` | planning | JWT + Admin/SuperAdmin/FieldManager | `AssignStaffRequest` | 200 `MessageResponse` | [planning](./planning/endpoints.md) |
| 117 | GET | `/api/v1/service-assignments/queue` | planning | JWT + Admin/SuperAdmin/FieldManager | `—` | 200 `MatchingQueueResponse` | [planning](./planning/endpoints.md) |
| 118 | POST | `/api/v1/service-assignments/execute` | planning | JWT + Admin/SuperAdmin/FieldManager | `ExecuteMatchingAlgorithmRequest` | 200 `MatchingResultResponse` | [planning](./planning/endpoints.md) |
| 119 | GET | `/api/v1/service-assignments/{assignmentId}/matching-details` | planning | JWT + Admin | `—` | 200 `MatchingScoreResponse` | [planning](./planning/endpoints.md) |
| 120 | POST | `/api/v1/technicians/{technicianId}/catalog` | planning | JWT | `—` | 201 `ServiceCatalogResponse` | [planning](./planning/endpoints.md) |
| 121 | GET | `/api/v1/technicians/{technicianId}/catalog` | planning | JWT | `—` | 200 `ServiceCatalogResponse` | [planning](./planning/endpoints.md) |
| 122 | POST | `/api/v1/technicians/{technicianId}/catalog/recipes` | planning | JWT | `CreateServiceRecipeRequest` | 201 `ServiceRecipeDetailResponse` | [planning](./planning/endpoints.md) |
| 123 | GET | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}` | planning | JWT | `—` | 200 `ServiceRecipeDetailResponse` | [planning](./planning/endpoints.md) |
| 124 | PATCH | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}` | planning | JWT | `UpdateServiceRecipeRequest` | 204 `empty` | [planning](./planning/endpoints.md) |
| 125 | DELETE | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}` | planning | JWT | `DeactivateServiceRecipeRequest` | 204 `empty` | [planning](./planning/endpoints.md) |
| 126 | POST | `/api/v1/technicians/{technicianId}/catalog/recipes/{recipeId}/reactivate` | planning | JWT | `—` | 204 `empty` | [planning](./planning/endpoints.md) |
| 127 | GET | `/api/v1/service-requests/eligibility` | planning | JWT | `—` | 200 `PlanningRequestEligibilityResponse` | [planning](./planning/endpoints.md) |
| 128 | POST | `/api/v1/service-requests` | planning | JWT | `—` | 201 `ServiceRequestSummaryResponse` | [planning](./planning/endpoints.md) |
| 129 | POST | `/api/v1/service-requests/{requestId}/property` | planning | JWT | `SelectPropertyRequest` | 204 `empty` | [planning](./planning/endpoints.md) |
| 130 | GET | `/api/v1/service-requests/{requestId}/available-services` | planning | JWT | `—` | 200 `PagedResponse<AvailableServiceResponse>` | [planning](./planning/endpoints.md) |
| 131 | POST | `/api/v1/service-requests/{requestId}/recipe` | planning | JWT | `SelectServiceRecipeRequest` | 204 `empty` | [planning](./planning/endpoints.md) |
| 132 | POST | `/api/v1/service-requests/{requestId}/details` | planning | JWT | `AddServiceDetailsRequest` | 204 `empty` | [planning](./planning/endpoints.md) |
| 133 | POST | `/api/v1/service-requests/{requestId}/confirm` | planning | JWT | `—` | 202 `ServiceRequestSummaryResponse` | [planning](./planning/endpoints.md) |
| 134 | DELETE | `/api/v1/service-requests/{requestId}` | planning | JWT | `CancelServiceRequestRequest` | 204 `empty` | [planning](./planning/endpoints.md) |
| 135 | POST | `/api/v1/service-requests/{requestId}/installation-property` | planning | JWT | `AttachInstallationPropertyRequest` | 200 `InstallationPropertyAttachedResponse` | [planning](./planning/endpoints.md) |
| 136 | GET | `/api/v1/service-requests/{requestId}` | planning | JWT | `—` | 200 `ServiceRequestSummaryResponse` | [planning](./planning/endpoints.md) |
| 137 | GET | `/api/v1/suggestions` | planning | JWT | `—` | 200 `PagedResponse<ServiceSuggestionResponse>` | [planning](./planning/endpoints.md) |
| 138 | PATCH | `/api/v1/suggestions/{suggestionId}/viewed` | planning | JWT | `—` | 204 `empty` | [planning](./planning/endpoints.md) |
| 139 | POST | `/api/v1/suggestions/{suggestionId}/accept` | planning | JWT | `—` | 200 `RequestIdCreatedResponse` | [planning](./planning/endpoints.md) |
| 140 | POST | `/api/v1/suggestions/{suggestionId}/dismiss` | planning | JWT | `—` | 204 `empty` | [planning](./planning/endpoints.md) |
| 141 | GET | `/api/v1/iot/devices/{deviceId}/status` | processing | JWT | `—` | 200 `DeviceStatusResponse` | [processing](./processing/endpoints.md) |
| 142 | GET | `/api/v1/iot/devices/{deviceId}/readings/recent` | processing | JWT | `—` | 200 `RecentReadingsResponse` | [processing](./processing/endpoints.md) |
| 143 | GET | `/api/v1/iot/devices/properties/{propertyId}/anomalies` | processing | JWT | `—` | 200 `PagedResponse<AnomalyResponse>` | [processing](./processing/endpoints.md) |
| 144 | GET | `/api/v1/iot/devices/{deviceId}/relay/history` | processing | JWT | `—` | 200 `RelayCommandHistoryResponse` | [processing](./processing/endpoints.md) |
| 145 | POST | `/api/v1/iot/devices/anomalies/{anomalyId}/acknowledge` | processing | JWT | `—` | 204 `empty` | [processing](./processing/endpoints.md) |
| 146 | POST | `/api/v1/iot/devices/anomalies/{anomalyId}/force-resolve` | processing | JWT | `—` | 204 `empty` | [processing](./processing/endpoints.md) |
| 147 | POST | `/api/v1/iot/edge/readings` | processing | Edge key | `IngestReadingRequest` | 204 `empty` | [processing](./processing/endpoints.md) |
| 148 | POST | `/api/v1/iot/edge/sync-batch` | processing | Edge key | `SyncOfflineReadingsBatchRequest` | 200 `OfflineSyncResponse` | [processing](./processing/endpoints.md) |
| 149 | POST | `/api/v1/iot/edge/anomalies` | processing | Edge key | `ReportEdgeAnomalyRequest` | 204 `empty` | [processing](./processing/endpoints.md) |
| 150 | POST | `/api/v1/iot/edge/relay/acknowledge` | processing | Edge key | `AcknowledgeRelayRequest` | 204 `empty` | [processing](./processing/endpoints.md) |
| 151 | GET | `/api/v1/iot/edge/devices/{deviceId}/thresholds` | processing | Edge key | `—` | 200 `DeviceThresholdResponse` | [processing](./processing/endpoints.md) |
| 152 | POST | `/api/v1/iot/devices/{deviceId}/relay` | processing | JWT | `IssueRelayCommandRequest` | 204 `empty` | [processing](./processing/endpoints.md) |
| 153 | POST | `/api/v1/profiles/me/device-onboarding/analyze` | profiles | JWT | `AnalyzeDeviceOnboardingRequest` | 200 `DeviceOnboardingAnalysisResponse` | [profiles](./profiles/endpoints.md) |
| 154 | POST | `/api/v1/profiles/me/device-onboarding/adjust` | profiles | JWT | `AdjustThresholdsRequest` | 200 `DeviceOnboardingAnalysisResponse` | [profiles](./profiles/endpoints.md) |
| 155 | GET | `/api/v1/profiles/me` | profiles | JWT | `—` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 156 | POST | `/api/v1/profiles/me/complete/technician` | profiles | JWT | `CompleteProfileAsTechnicianRequest` | 201 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 157 | POST | `/api/v1/profiles/me/complete/homeowner` | profiles | JWT | `CompleteProfileAsHomeownerRequest` | 201 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 158 | POST | `/api/v1/profiles/me/complete/company` | profiles | JWT | `CompleteProfileAsCompanyRequest` | 201 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 159 | GET | `/api/v1/profiles/me/status` | profiles | JWT | `—` | 200 `ProfileStatusResponse` | [profiles](./profiles/endpoints.md) |
| 160 | PATCH | `/api/v1/profiles/me/personal-data` | profiles | JWT | `UpdatePersonalDataRequest` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 161 | POST | `/api/v1/profiles/me/picture` | profiles | JWT | `—` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 162 | PATCH | `/api/v1/profiles/me/technician` | profiles | JWT | `UpdateTechnicianDataRequest` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 163 | PATCH | `/api/v1/profiles/me/homeowner` | profiles | JWT | `UpdateHomeownerPreferencesRequest` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 164 | POST | `/api/v1/profiles/me/deactivate` | profiles | JWT | `DeactivateProfileRequest` | 204 `empty` | [profiles](./profiles/endpoints.md) |
| 165 | POST | `/api/v1/profiles/me/reactivate` | profiles | JWT | `—` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 166 | POST | `/api/v1/profiles/me/photo/upload-url` | profiles | JWT | `—` | 200 `SignedUploadUrlResponse` | [profiles](./profiles/endpoints.md) |
| 167 | PUT | `/api/v1/profiles/me/photo` | profiles | JWT | `UpdateProfilePhotoRequest` | 200 `MyProfileResponse` | [profiles](./profiles/endpoints.md) |
| 168 | PUT | `/api/v1/profiles/{profileId}/thresholds` | profiles | JWT | `SetThresholdsRequest` | 204 `empty` | [profiles](./profiles/endpoints.md) |
| 169 | DELETE | `/api/v1/profiles/me/photo` | profiles | JWT | `—` | 204 `empty` | [profiles](./profiles/endpoints.md) |
| 170 | POST | `/api/v1/staff-members` | profiles | JWT + Admin/SuperAdmin | `CreateStaffMemberRequest` | 201 `StaffMemberResponse` | [profiles](./profiles/endpoints.md) |
| 171 | GET | `/api/v1/staff-members/{id}` | profiles | JWT + Admin/SuperAdmin/FieldManager | `—` | 200 `StaffMemberResponse` | [profiles](./profiles/endpoints.md) |
| 172 | GET | `/api/v1/staff-members` | profiles | JWT + Admin/SuperAdmin | `—` | 200 `PagedResponse<StaffMemberResponse>` | [profiles](./profiles/endpoints.md) |
| 173 | PUT | `/api/v1/staff-members/{id}/zone` | profiles | JWT + Admin/SuperAdmin | `AssignStaffZoneRequest` | 200 `StaffMemberResponse` | [profiles](./profiles/endpoints.md) |
| 174 | PUT | `/api/v1/staff-members/{id}/iot-certification` | profiles | JWT + Admin/SuperAdmin | `—` | 200 `StaffMemberResponse` | [profiles](./profiles/endpoints.md) |
| 175 | DELETE | `/api/v1/staff-members/{id}/iot-certification` | profiles | JWT + Admin/SuperAdmin | `—` | 204 `empty` | [profiles](./profiles/endpoints.md) |
| 176 | PUT | `/api/v1/staff-members/{id}/deactivate` | profiles | JWT + Admin/SuperAdmin | `—` | 200 `StaffMemberResponse` | [profiles](./profiles/endpoints.md) |
| 177 | GET | `/api/v1/stores/{storeId}/compliance/checklists/template` | store-management | JWT | `—` | 200 `ChecklistTemplateResponse` | [store-management](./store-management/endpoints.md) |
| 178 | POST | `/api/v1/stores/{storeId}/compliance/checklists` | store-management | JWT | `SaveChecklistRequest` | 200 `WeeklySafetyChecklistResponse` | [store-management](./store-management/endpoints.md) |
| 179 | GET | `/api/v1/stores/{storeId}/compliance/checklists` | store-management | JWT | `—` | 200 `ChecklistPageResponse` | [store-management](./store-management/endpoints.md) |
| 180 | POST | `/api/v1/stores/{storeId}/equipment/{equipmentId}/certificates` | store-management | JWT | `RegisterCertificateRequest` | 201 `MaintenanceCertificateResponse` | [store-management](./store-management/endpoints.md) |
| 181 | GET | `/api/v1/stores/{storeId}/equipment/{equipmentId}/certificates` | store-management | JWT | `—` | 200 `PagedResponse<MaintenanceCertificateResponse>` | [store-management](./store-management/endpoints.md) |
| 182 | GET | `/api/v1/stores/{storeId}/compliance/expirations` | store-management | JWT | `—` | 200 `CertificateExpirationsResponse` | [store-management](./store-management/endpoints.md) |
| 183 | GET | `/api/v1/stores/{storeId}/compliance/score` | store-management | JWT | `—` | 200 `ComplianceScoreResponse` | [store-management](./store-management/endpoints.md) |
| 184 | POST | `/api/v1/stores/{storeId}/compliance/signature` | store-management | JWT | `RegisterSignatureRequest` | 201 `ComplianceSignatureResponse` | [store-management](./store-management/endpoints.md) |
| 185 | GET | `/api/v1/stores/{storeId}/compliance/signature` | store-management | JWT | `—` | 200 `ComplianceSignatureResponse` | [store-management](./store-management/endpoints.md) |
| 186 | GET | `/api/v1/stores/{storeId}/compliance/signature/image` | store-management | JWT | `—` | 200 `file` | [store-management](./store-management/endpoints.md) |
| 187 | POST | `/api/v1/stores/{storeId}/compliance/reports/generate` | store-management | JWT | `GenerateOhsReportRequest` | 201 `OhsReportResponse` | [store-management](./store-management/endpoints.md) |
| 188 | GET | `/api/v1/stores/{storeId}/compliance/reports` | store-management | JWT | `—` | 200 `PagedResponse<OhsReportResponse>` | [store-management](./store-management/endpoints.md) |
| 189 | GET | `/api/v1/stores/{storeId}/compliance/reports/{reportId}/download` | store-management | JWT | `—` | 200 `file` | [store-management](./store-management/endpoints.md) |
| 190 | POST | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/device-binding` | store-management | JWT | `LinkEquipmentDeviceRequest` | 201 `DeviceBindingResponse` | [store-management](./store-management/endpoints.md) |
| 191 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/device-binding` | store-management | JWT | `—` | 200 `DeviceBindingResponse` | [store-management](./store-management/endpoints.md) |
| 192 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/telemetry` | store-management | JWT | `—` | 200 `EquipmentTelemetryResponse` | [store-management](./store-management/endpoints.md) |
| 193 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/measurements` | store-management | JWT | `—` | 200 `HasMorePageResponse<MeasurementHistoryResponse>` | [store-management](./store-management/endpoints.md) |
| 194 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/thresholds` | store-management | JWT | `—` | 200 `EquipmentThresholdsResponse` | [store-management](./store-management/endpoints.md) |
| 195 | PUT | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/thresholds` | store-management | JWT | `UpdateEquipmentThresholdsRequest` | 200 `EquipmentThresholdsResponse` | [store-management](./store-management/endpoints.md) |
| 196 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/safety-status` | store-management | JWT | `—` | 200 `EquipmentSafetyStatusResponse` | [store-management](./store-management/endpoints.md) |
| 197 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/shutdown-protocol` | store-management | JWT | `—` | 200 `ShutdownProtocolResponse` | [store-management](./store-management/endpoints.md) |
| 198 | PUT | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/shutdown-protocol` | store-management | JWT | `UpdateShutdownProtocolRequest` | 200 `ShutdownProtocolResponse` | [store-management](./store-management/endpoints.md) |
| 199 | GET | `/api/v1/stores/{storeId}/safety-guides/electrical-incident` | store-management | JWT | `—` | 200 `ElectricalIncidentGuideResponse` | [store-management](./store-management/endpoints.md) |
| 200 | POST | `/api/v1/stores/{storeId}/shifts/assignments` | store-management | JWT | `ScheduleStaffShiftRequest` | 201 `StaffShiftResponse` | [store-management](./store-management/endpoints.md) |
| 201 | GET | `/api/v1/stores/{storeId}/shifts/assignments` | store-management | JWT | `—` | 200 `PagedResponse<StaffShiftResponse>` | [store-management](./store-management/endpoints.md) |
| 202 | DELETE | `/api/v1/stores/{storeId}/shifts/assignments/{shiftId}` | store-management | JWT | `—` | 204 `empty` | [store-management](./store-management/endpoints.md) |
| 203 | GET | `/api/v1/stores/{storeId}/shifts/on-duty` | store-management | JWT | `—` | 200 `OnDutyStaffResponse` | [store-management](./store-management/endpoints.md) |
| 204 | POST | `/api/v1/stores/{storeId}/shifts/handover` | store-management | JWT | `RecordShiftHandoverRequest` | 201 `ShiftHandoverResponse` | [store-management](./store-management/endpoints.md) |
| 205 | GET | `/api/v1/stores/{storeId}/shifts/handover` | store-management | JWT | `—` | 200 `HasMorePageResponse<ShiftHandoverResponse>` | [store-management](./store-management/endpoints.md) |
| 206 | POST | `/api/v1/stores/{storeId}/panel/pause` | store-management | JWT | `StartPanelPauseRequest` | 200 `PanelPauseResponse` | [store-management](./store-management/endpoints.md) |
| 207 | GET | `/api/v1/stores/{storeId}/panel/pause` | store-management | JWT | `—` | 200 `PanelPauseResponse` | [store-management](./store-management/endpoints.md) |
| 208 | DELETE | `/api/v1/stores/{storeId}/panel/pause` | store-management | JWT | `—` | 200 `PanelPauseResponse` (documented exception: state snapshot) | [store-management](./store-management/endpoints.md) |
| 209 | GET | `/api/v1/stores/{storeId}/layout` | store-management | JWT | `—` | 200 `StoreLayoutResponse` | [store-management](./store-management/endpoints.md) |
| 210 | PUT | `/api/v1/stores/{storeId}/layout` | store-management | JWT | `UpdateStoreLayoutRequest` | 200 `StoreLayoutResponse` | [store-management](./store-management/endpoints.md) |
| 211 | GET | `/api/v1/stores/{storeId}/dashboard-summary` | store-management | JWT | `—` | 200 `StoreDashboardSummaryResponse` | [store-management](./store-management/endpoints.md) |
| 212 | GET | `/api/v1/stores/{storeId}/notification-preferences` | store-management | JWT | `—` | 200 `StoreNotificationPreferencesResponse` | [store-management](./store-management/endpoints.md) |
| 213 | PUT | `/api/v1/stores/{storeId}/notification-preferences` | store-management | JWT | `UpdateNotificationPreferencesRequest` | 200 `StoreNotificationPreferencesResponse` | [store-management](./store-management/endpoints.md) |
| 214 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/risk-level` | store-management | JWT | `—` | 200 `EquipmentRiskResponse` | [store-management](./store-management/endpoints.md) |
| 215 | GET | `/api/v1/stores/{storeId}/grid-status` | store-management | JWT | `—` | 200 `StoreElectricalGridStatusResponse` | [store-management](./store-management/endpoints.md) |
| 216 | GET | `/api/v1/stores/{storeId}/sensors/connectivity` | store-management | JWT | `—` | 200 `StoreSensorsConnectivityResponse` | [store-management](./store-management/endpoints.md) |
| 217 | POST | `/api/v1/stores` | store-management | JWT | `CreateStoreRequest` | 201 `StoreResponse` | [store-management](./store-management/endpoints.md) |
| 218 | GET | `/api/v1/stores` | store-management | JWT | `—` | 200 `HasMorePageResponse<StoreResponse>` | [store-management](./store-management/endpoints.md) |
| 219 | GET | `/api/v1/stores/{storeId}` | store-management | JWT | `—` | 200 `StoreResponse` | [store-management](./store-management/endpoints.md) |
| 220 | POST | `/api/v1/stores/{storeId}/areas` | store-management | JWT | `CreateNamedHierarchyRequest` | 201 `AreaResponse` | [store-management](./store-management/endpoints.md) |
| 221 | GET | `/api/v1/stores/{storeId}/areas` | store-management | JWT | `—` | 200 `HasMorePageResponse<AreaResponse>` | [store-management](./store-management/endpoints.md) |
| 222 | GET | `/api/v1/stores/{storeId}/areas/{areaId}` | store-management | JWT | `—` | 200 `AreaResponse` | [store-management](./store-management/endpoints.md) |
| 223 | POST | `/api/v1/stores/{storeId}/areas/{areaId}/equipment` | store-management | JWT | `CreateNamedHierarchyRequest` | 201 `EquipmentResponse` | [store-management](./store-management/endpoints.md) |
| 224 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment` | store-management | JWT | `—` | 200 `HasMorePageResponse<EquipmentResponse>` | [store-management](./store-management/endpoints.md) |
| 225 | GET | `/api/v1/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}` | store-management | JWT | `—` | 200 `EquipmentResponse` | [store-management](./store-management/endpoints.md) |
| 226 | POST | `/api/v1/contact-requests` | subscriptions | Public | `SubmitContactRequestRequest` | 202 `ContactRequestReceiptResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 227 | GET | `/api/v1/contact-requests/{requestId}` | subscriptions | Public | `—` | 200 `ContactRequestStatusResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 228 | GET | `/api/v1/contact-requests` | subscriptions | JWT + Admin/SuperAdmin | `—` | 200 `PagedResponse<ContactRequestResponse>` | [subscriptions](./subscriptions/endpoints.md) |
| 229 | GET | `/api/v1/subscriptions/me` | subscriptions | JWT | `—` | 200 `MySubscriptionResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 230 | GET | `/api/v1/subscriptions/me/eligibility` | subscriptions | JWT | `—` | 200 `SubscriptionsRequestEligibilityResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 231 | GET | `/api/v1/subscriptions/me/payment-history` | subscriptions | JWT | `—` | 200 `PaymentHistoryResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 232 | GET | `/api/v1/subscriptions/me/status-alert` | subscriptions | JWT | `—` | 200 `SubscriptionStatusAlertResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 233 | POST | `/api/v1/subscriptions/checkout` | subscriptions | JWT | `InitiateCheckoutRequest` | 200 `CheckoutUrlResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 234 | POST | `/api/v1/subscriptions/me/cancel` | subscriptions | JWT | `CancelSubscriptionRequest` | 200 `MySubscriptionResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 235 | POST | `/api/v1/subscriptions/me/portal` | subscriptions | JWT | `OpenCustomerPortalRequest` | 200 `CustomerPortalUrlResponse` | [subscriptions](./subscriptions/endpoints.md) |
| 236 | POST | `/api/v1/webhooks/stripe` | subscriptions | Public | `—` | 200 `—` | [subscriptions](./subscriptions/endpoints.md) |


## Canonical routes and contract rules

| Feature | Canonical route | Notes |
|---|---|---|
| Authentication, refresh, password recovery | `/api/v1/auth/*` | `/api/v1/authentication/*` still answers (backward-compatible alias, hidden from OpenAPI). Do not use it in new code. |
| IoT devices | `/api/v1/iot-devices/*` | The kebab-cased `/io-t-devices/*` prefix no longer exists. |
| Device owned by the caller (property owner) | `GET /api/v1/iot-devices/{id}` | 404 when missing or foreign. |
| Device in the technician's stock | `GET /api/v1/iot-devices/stock/{id}` | Formerly `GET /iot-devices/{id}`; 403 for non-technicians. |

- **Errors:** every 4xx/5xx is an `application/problem+json` envelope with a stable `errorCode` ([`../errors/error-contract.md`](../errors/error-contract.md)).
- **Rate limits:** every `/api/*` route is throttled per user (per IP when anonymous); edge (`/iot/edge`, `/alerts/dispatch`) and webhook routes are exempt. A throttled call gets `429`, `Retry-After` (seconds) and `errorCode: "RATE_LIMITED"`.
- **Creation:** `POST` that creates a resource answers `201` with the created resource and a `Location` header (exceptions: `POST /contact-requests` → `202` receipt; `POST .../panel/pause` → `200` state; `POST .../compliance/checklists` → `200` because it saves or revises a draft). Action-style POSTs (`.../assign`, `.../confirm`, `.../start`…) keep `200`/`202`/`204` as listed.
- **Deletion:** `DELETE` answers `204`, except `DELETE /stores/{storeId}/panel/pause` (`200` with the resulting pause state).
- **Lists:** `PagedResponse<T>` = `{ items, page, pageSize, totalCount, totalPages, hasMore }` with `?page=1&pageSize=20` (max 100). The store/alert/handover/measurement lists keep `HasMorePageResponse<T>` = `{ items, page, pageSize, hasMore }` (same member names, no totals).
- **Idempotency:** `POST /iot-devices`, `/staff-users`, `/staff-members`, `/service-requests`, `/contact-requests`, `/stores/{storeId}/compliance/checklists`, `/stores/{storeId}/equipment/{equipmentId}/certificates` and `/stores/{storeId}/areas/{areaId}/equipment/{equipmentId}/anomalies` accept an optional `Idempotency-Key` header (see [`../guides/frontend-conventions.md`](../guides/frontend-conventions.md)).
- **Refreshed tokens:** profile completion (`POST /profiles/me/complete/*`), `POST /profiles/me/deactivate`, `POST /profiles/me/reactivate` and `POST /subscriptions/me/cancel` return a new access token in the `X-Refreshed-Token` response header.

## Platform routes (not controllers)

| Method | URI | Auth | Notes |
|---|---|---|---|
| GET | `/health` | Public | ASP.NET health checks (includes an MQTT health check). |
| GET | `/openapi/v1.json` | Public | Built-in OpenAPI 3 document (Microsoft.AspNetCore.OpenApi). |
| GET | `/scalar/v1` | Public | Scalar API reference UI (Bearer scheme preselected). |
| WS | `/hubs/alerts` | JWT (`?access_token=`) | SignalR `AlertsHub`, mapped in `Program.cs`. |
