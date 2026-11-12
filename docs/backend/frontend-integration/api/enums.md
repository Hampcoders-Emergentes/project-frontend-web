# Enums and fixed vocabularies

A global `JsonStringEnumConverter` is registered for MVC (`AddJsonOptions`), for JSON written outside MVC
(`ConfigureHttpJsonOptions`, the error envelope) and for SignalR hub payloads. **No enum is ever serialized as a number.**

**Casing standard — one rule per kind of vocabulary, never mixed inside a domain:**

| Kind | Casing | Where |
|---|---|---|
| C# enums (IAM, Profiles, Assets, Planning, Monitoring, Processing) | **PascalCase** member name, e.g. `InStock`, `Connected`, `PendingAssignment` | Every enum-typed property, including `IoTDeviceResponse.status`/`connectionStatus` (numbers before) and the values mapped with `.ToString()`. `Specialty` keeps its own converter (written as name). |
| String vocabularies of the store / kitchen / alert / compliance / subscription domains | **UPPER_SNAKE_CASE**, e.g. `CRITICAL_RISK`, `NON_CRITICAL`, `GRACE_PERIOD` | Store management, alert management, subscriptions value objects, contact requests. |

**Requests:** enum-typed request members accept the member name (case-insensitive) **and, for backward compatibility,
the numeric value**; send the name. Route/query enums (e.g. `/iot-devices/by-status/{status}`) accept name or number.

Request bodies are parsed case-insensitively for property *names*; string *values* are parsed case-insensitively for the enums that use `Enum.TryParse(..., ignoreCase: true)` (e.g. `role`, `propertyType`), but treat the values below as the canonical spelling.

## IAM

| Enum | Values | Notes |
|---|---|---|
| `AccessRole` (JWT claims `access_role`, `role`; `UserResponse.role`, `StaffUserResponse.accessRole`) | `User`, `Admin`, `SuperAdmin`, `Maker`, `FieldManager` | Public sign-up accepts only `User`. Staff roles are created via `POST /staff-users`. |
| `EUserStatus` (not serialized; enforced by middleware) | `Active`, `Suspended`, `PendingVerification` | Anything other than `Active` → 403 (`detail`: `The account is not active.`). |

## Profiles

| Enum | Values | Wire format |
|---|---|---|
| `EBusinessRole` (`businessRole` claim, `MyProfileResponse.businessRole`) | `Technician`, `HomeOwner`, `Company` | string |
| `EProfileStatus` (`status`) | `Incomplete`, `Active`, `Deactivated`, `Rejected`, `Suspended` | string |
| `ESpecialty` | `SolarInstallation`, `ElectricalMaintenance`, `Repair`, `Inspection`, `Upgrade`, `BatterySystems` | string out; name or ordinal in |
| `ECompanySize` | `Small`, `Medium`, `Large` | string |
| `EContactTime` | `Morning`, `Afternoon`, `Evening` | string |

## Assets

| Enum | Values | Wire format |
|---|---|---|
| `EDeviceStatus` (`IoTDeviceResponse.status`, stock items) | `InStock`, `Assigned`, `Installed`, `Maintenance`, `Decommissioned` | string (was a number); the route `GET /iot-devices/by-status/{status}` accepts the name or the number |
| `EConnectionStatus` (`IoTDeviceResponse.connectionStatus`, `UpdateDeviceConnectionStatusRequest.newConnectionStatus`) | `Connected`, `Disconnected` | string (was a number; requests still accept 0/1) |
| `EPropertyType` (`propertyType`) | `Residential`, `Commercial`, `Building` | string |
| `EPropertyStatus` (`PropertyResponse.status`) | `Created`, `InPortfolio`, `Archived` | string |
| `EOccupancyStatus` (`occupancyStatus`) | `OwnerOccupied`, `Rented`, `Vacant`, `UnderRenovation` | string |
| `EPortfolioStatus` | `Empty`, `Active` | string |
| `EInventoryStatus` | `Empty`, `Active`, `Inactive` | string (not exposed directly) |
| `EComponentStatus` | `Created`, `InInventory`, `Reserved`, `Consumed`, `Archived` | string (domain only) |
| Geolocation `source` | free string | string |

## Planning

| Enum | Values |
|---|---|
| `ERequestStatus` (`ServiceRequestSummaryResponse.status`, `InstallationPropertyAttachedResponse.status`) | `Draft`, `ReadyToConfirm`, `PendingAssignment`, `Assigned`, `Cancelled`, `CategorySelected`, `PropertySelected`, `Expired`, `PendingInstallation` |
| `EServiceCategory` (`serviceCategory`) | `SolarInstallation`, `Installation`, `ElectricalMaintenance`, `Repair`, `Inspection`, `Monitoring`, `Upgrade` |
| `ETimePreference` (`timePreference`) | `Morning`, `Afternoon`, `Anytime` |
| `ECurrency` (`currency`) | `Usd`, `Pen`, `Eur` (serialized as string) |
| `ECancellationReason` (`CancelServiceRequestRequest.reason`) | `ChangedMind`, `FoundAlternative`, `TimingIssue`, `Other` |
| `EDeactivationReason` (`DeactivateServiceRecipeRequest.reason`) | `TemporarilyUnavailable`, `OutOfStock`, `Seasonal`, `Other` |
| `ECatalogStatus` | `Empty`, `Active`, `Inactive` |
| `EAssignmentStatus` | `Assigned`, `Failed` |
| `EAssignmentType` | `Staff`, `Technician` |
| `ESuggestionStatus` (`ServiceSuggestionResponse.status`) | `Pending`, `Viewed`, `Expired`, `ConvertedToRequest` |
| Matching `method` (`MatchingScoreResponse.method`) | free string (AI provider vs deterministic scoring) |

## Monitoring

| Enum | Values |
|---|---|
| `EExecutionStatus` (`ServiceExecutionResponse.status`) | `Notified`, `EnRoute`, `Arrived`, `InProgress`, `PendingReview`, `Completed`, `Cancelled` |
| `EPhotoType` (`photoType`) | `Before`, `During`, `After` |
| `ECancelledBy` (`cancelledBy`) | `Homeowner`, `Technician` |
| `ECancellationReason` (`CancelServiceExecutionRequest.reason`) | `TechnicianUnresponsive`, `ScheduleConflict`, `PersonalReasons`, `TechnicianNoShow`, `Other` |
| `EEvaluationCategory` (keys of `SubmitReviewRequest.categories` for the **client** review; value = rating) | `Professionalism`=1, `WorkQuality`=2, `Punctuality`=3, `Cleanliness`=4, `Communication`=5, `Knowledge`=6, `ValueForMoney`=7 (keys of a `Record<string, number>`, not affected by the enum converter) |
| `ETechnicianEvaluationCategory` (keys of `categories` for the **technician** review) | `Accessibility`=1, `Clarity`=2, `Payment`=3 |
| `ERelayState` | `On`, `Off` |
| `ERelayActionStatus` | `Pending`, `Executed`, `Failed` |
| `EServiceType` | `Standard`, `IotDeviceInstallation` |

## Processing (IoT)

| Enum | Values |
|---|---|
| `EAnomalyType` (`AnomalyResponse.anomalyType`) | `VoltageSpike`, `VoltageSag`, `SustainedOverconsumption`, `ShortCircuitRisk`, `PowerFactorDegradation`, `AbnormalFrequency`, `ConnectionLost`, `UnusualConsumptionPattern`, `Overcurrent`, `CurrentLeakage` |
| `EAnomalySeverity` | `Low`, `Medium`, `High`, `Critical` |
| `EAnomalyStatus` | `Active`, `Acknowledged`, `Resolved`, `Superseded` |
| `EDetectionLayer` | `Edge`, `Cloud` |
| `EReadingSource` (`IngestReadingRequest.source`) | `EdgeDevice`, `EdgeBufferReplay`, `EDGE` |
| `ERelayTarget` / `IssueRelayCommandRequest.targetRelayState` | `Open`, `Closed` |
| `ERelayCommandStatus` (`RelayCommandItemResponse.status`) | `Pending`, `Sent`, `Acknowledged`, `Executed`, `Failed`, `Timeout` |
| `EStreamStatus` (`DeviceStatusResponse.streamStatus`) | `Active`, `Degraded`, `Inactive` |
| `DeviceStatusResponse.connectionStatus` | `CONNECTED`, `DISCONNECTED` (derived: `DISCONNECTED` when the stream is `Inactive`) |

## Alert management

| Vocabulary | Values |
|---|---|
| Alert `status` | `OPEN`, `ACKNOWLEDGED`, `ASSIGNED`, `RESOLVED` |
| Alert `severity` | `CRITICAL`, `NON_CRITICAL` (derived: detection `Critical` → `CRITICAL`; `Low`/`Medium`/`High` → `NON_CRITICAL`) |
| Alert `detectionSeverity` | `Low`, `Medium`, `High`, `Critical` |
| Alert `anomalyType` | `CURRENT_LEAKAGE`, `OVERCURRENT`, `VOLTAGE_SAG`, `SHORT_CIRCUIT_RISK`, `OVERVOLTAGE`, `OVERCONSUMPTION`, `LOW_POWER_FACTOR`, `ABNORMAL_FREQUENCY`, `CONNECTION_LOST`, `UNUSUAL_CONSUMPTION`, `MOISTURE_HAZARD`, `MANUAL_REPORT` |
| Alert `source` | `TELEMETRY`, `MANUAL_REPORT` |
| Manual report `category` | `ABNORMAL_NOISE`, `SPARKS`, `BURNING_SMELL`, `OVERHEATING`, `FLICKERING_LIGHTS`, `SMOKE`, `OTHER` |

## Store management

| Vocabulary | Values |
|---|---|
| Checklist `status` | `DRAFT`, `SUBMITTED` |
| Checklist item `result` | `PASS`, `FAIL`, `NOT_APPLICABLE` |
| Checklist item `code` | `PANEL_ACCESS_CLEAR`, `PANEL_LABELS`, `RCD_TEST`, `NO_EXPOSED_WIRING`, `CABLES_AWAY_FROM_WATER_HEAT`, `PLUGS_SOCKETS_OK`, `NO_DAISY_CHAINS`, `EQUIPMENT_GROUNDING`, `PANEL_DRY`, `EMERGENCY_LIGHTING`, `EXTINGUISHER_CLASS_C`, `LOCKOUT_KIT`, `STAFF_BRIEFED` (authoritative list: `GET .../compliance/checklists/template`) |
| Certificate `urgency` | `VALID`, `EXPIRES_WITHIN_30_DAYS`, `EXPIRES_WITHIN_15_DAYS`, `EXPIRED` |
| Compliance score components | `WEEKLY_CHECKLISTS`, `MAINTENANCE_CERTIFICATES`, `CRITICAL_ALARMS_RESOLVED` |
| Notification `channel` | `EMAIL`, `SMS`, `DASHBOARD_PUSH`, `WEBHOOK` (webhook destination must be a public `https` URL) |
| Notification `recipientRole` | `STORE_MANAGER`, `OPERATIONAL_STAFF` |
| Notification `urgencyLevels` | `CRITICAL`, `NON_CRITICAL` |
| Telemetry `state` (`EquipmentTelemetryResponse.state`) | `UNKNOWN`, `NORMAL`, `ANOMALY`, `STALE`, `DEVICE_UNVERIFIED` |
| Equipment `riskLevel` (`EquipmentRiskResponse`, `GridEquipmentResponse`, layout) | `SAFE`, `WARNING`, `CRITICAL_RISK`, `DISCONNECTED`, `UNKNOWN` (worse = higher; `UNKNOWN` when no sensor is linked) |
| Equipment `operationalState` | `UNMONITORED`, `UNKNOWN`, `STALE`, `NORMAL`, `ANOMALY` |
| Grid `status` (`StoreElectricalGridStatusResponse.status`) | `NO_DATA`, `NORMAL`, `WARNING`, `CRITICAL` |
| Sensor connectivity `status` | `CONNECTED`, `DISCONNECTED` |
| Panel pause `status` | produced by `PanelPauseService` (`isInputLocked` is the authoritative boolean) |

## Analytics

| Parameter | Values |
|---|---|
| `granularity` | `hourly`, `daily` (case-insensitive) |
| `format` on `GET …/analytics/consumption/report` | `csv` only (anything else → 400 `Unsupported format. Supported: csv.`) |
| `format` on `POST …/analytics/reports` (`GenerateEnergyReportRequest.format`) | `csv` or `pdf` (else 400 `format must be csv or pdf.`) |
| `dayOfWeek` (opening hours) | English day names (`Monday` … `Sunday`) |
| Budget `status` (`BudgetStatusResponse.status`) | `NO_BUDGET` when no target is configured, otherwise a server-computed state with an `isWarning` boolean (read `isWarning` rather than matching the string) |

## Subscriptions

| Enum | Wire values |
|---|---|
| `planType` | `BASIC`, `PREMIUM`, `ENTERPRISE_BASIC`, `ENTERPRISE_PREMIUM` |
| `billingCycle` | `MONTHLY`, `ANNUAL` (input is case-insensitive) |
| Subscription `status` | `ACTIVE`, `GRACE_PERIOD`, `CANCELLED_PENDING`, `DEGRADED`, `PENDING_INSTALLATION`, `CANCELLED_REFUNDED` |
| Payment `status` | `SUCCEEDED`, `FAILED`, `REFUNDED` |
| Contact request `status` (`ContactRequestReceiptResponse`, `ContactRequestStatusResponse`, `ContactRequestResponse`) | `RECEIVED` (stored), `NOTIFIED` (sales inbox emailed) |
