/**
 * Response payloads of the Electrolink API (derived from the C# resource records in each context's Interfaces/REST layer).
 * Property names are camelCase (ASP.NET Core default System.Text.Json policy).
 * DateTime values are ISO 8601 strings; DateOnly values are "yyyy-MM-dd".
 * Naming: every payload is a `*Response`; the C# "*Resource" suffix is replaced by "Response".
 * Enums: always JSON strings (global JsonStringEnumConverter) — PascalCase member names for C# enums, UPPER_SNAKE_CASE for
 * the string vocabularies of the store / alert / compliance / subscription domains.
 * Errors: every 4xx/5xx body is a ProblemDetailsResponse (application/problem+json).
 */
/* eslint-disable */


/** IoT device lifecycle (string; requests still accept the former ordinal). */
export type DeviceStatus = 'InStock' | 'Assigned' | 'Installed' | 'Maintenance' | 'Decommissioned';
/** IoT device connection (string; requests still accept 0/1). */
export type ConnectionStatus = 'Connected' | 'Disconnected';
export type CompanySize = 'Small' | 'Medium' | 'Large';
export type ContactTime = 'Morning' | 'Afternoon' | 'Evening';
/** Responses are strings; requests accept the name (case-insensitive) or the numeric ordinal 0-5. */
export type Specialty = 'SolarInstallation' | 'ElectricalMaintenance' | 'Repair' | 'Inspection' | 'Upgrade' | 'BatterySystems';

/**
 * Envelope of every paginated list (`?page=1&pageSize=20`, pageSize clamped to 1..100).
 * totalPages is 0 when there are no items; hasMore === page < totalPages.
 */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Envelope of the store / alert / handover / measurement / audit / checklist lists: same member names as PagedResponse
 * but without totals (the data source pages by "has more").
 */
export interface HasMorePageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * The single error envelope (RFC 7807, `application/problem+json`) of every 4xx/5xx response.
 * `errors` is present on validation failures only; other members of a structured domain error (e.g. `requestId`,
 * `assigned` on a failed matching) are kept as extensions.
 */
export interface ProblemDetailsResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId: string;
  errors?: Record<string, string[]>;
  [extension: string]: unknown;
}

/** Response headers the SPA can read (exposed through CORS). */
export const RESPONSE_HEADERS = {
  /** New access token after a profile completion, profile (de)activation or subscription cancellation. */
  refreshedToken: 'X-Refreshed-Token',
  /** "true" when an idempotent POST returned the stored first response. */
  idempotentReplayed: 'Idempotent-Replayed',
  location: 'Location',
} as const;

/** Real-time event names pushed on the SignalR hub /hubs/alerts (see integrations/signalr-alerts-hub.md). */
export type StoreHubEventName = 'ReceiveAlert' | 'PanelPauseChanged' | 'ShiftHandover' | 'ComplianceNotice';

export interface ActiveAlertsResponse {
  storeId: string;
  generatedAtUtc: string /* ISO 8601 UTC */;
  openCritical: number;
  openNonCritical: number;
  hasCriticalLeakage: boolean;
  items: AlertResponse[];
}

export interface ActiveAnomalySummaryResponse {
  anomalyId: string;
  anomalyType: string;
  severity: string;
  detectedAt: string /* ISO 8601 UTC */;
}

export interface ActiveDeviceCountResponse {
  count: number;
}

export interface AlertDispatchResultResponse {
  alertId: string;
  storeId: string;
  severity: string;
  realtimePublished: boolean;
  externalDispatchesQueued: number;
}

export interface AlertResponse {
  id: string;
  bindingId: string | null;
  readingId: string | null;
  equipmentId: string;
  anomalyType: string;
  detectionSeverity: string;
  severity: string;
  capturedAtUtc: string /* ISO 8601 UTC */;
  createdAtUtc: string /* ISO 8601 UTC */;
  status: string;
  acknowledgedByUserId: string | null;
  acknowledgedAtUtc: string /* ISO 8601 UTC */ | null;
  isCriticalLeakage: boolean;
  source: string;
  reportCategory: string | null;
  description: string | null;
  reportedBy: WorkerResponse | null;
  onDutyWorker: WorkerResponse | null;
  assignedTechnicianId: string | null;
  assignedTechnicianName: string | null;
  assignedByUserId: string | null;
  assignedAtUtc: string /* ISO 8601 UTC */ | null;
  resolvedByUserId: string | null;
  resolvedAtUtc: string /* ISO 8601 UTC */ | null;
  resolutionNotes: string | null;
}

export interface AnomalyResponse {
  anomalyId: string;
  deviceId: string;
  propertyId: string;
  anomalyType: string;
  severity: string;
  detectionLayer: string;
  status: string;
  detectedAt: string /* ISO 8601 UTC */;
  resolvedAt: string /* ISO 8601 UTC */ | null;
  autoRelayActivated: boolean;
}

export interface AreaResponse {
  id: string;
  storeId: string;
  name: string;
}

export interface AssetsAddressResponse {
  street: string;
  number: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface AuditLogEntryResponse {
  id: number;
  userId: string | null;
  storeId: string | null;
  action: string;
  resource: string;
  httpMethod: string;
  path: string;
  statusCode: number;
  status: string;
  ipAddress: string | null;
  timestampUtc: string /* ISO 8601 UTC */;
}

export type AuditLogPageResponse = HasMorePageResponse<AuditLogEntryResponse>;

export interface AuthenticatedUserResponse {
  userId: string;
  email: string;
  token: string;
  refreshToken: string;
}

export interface AvailableServiceResponse {
  serviceCategory: string;
  categoryDisplayName: string;
  minPrice: number;
  maxPrice: number;
  estimatedDurationMinutes: number;
  techniciansAvailable: number;
}

export interface BudgetStatusResponse {
  storeId: string;
  year: number;
  month: number;
  timeZone: string;
  status: string;
  isWarning: boolean;
  targetKWh: number | null;
  alertThresholdPercentage: number | null;
  consumedKwh: number;
  consumedPercentage: number | null;
  remainingKwh: number | null;
  projectedKwh: number;
  projectedPercentage: number | null;
  monthStartUtc: string /* ISO 8601 UTC */;
  monthEndUtc: string /* ISO 8601 UTC */;
  generatedAtUtc: string /* ISO 8601 UTC */;
}

export interface CertificateExpirationsResponse {
  storeId: string;
  generatedAtUtc: string /* ISO 8601 UTC */;
  withinDays: number;
  items: MaintenanceCertificateResponse[];
  equipmentWithoutCertificate: UncertifiedEquipmentResponse[];
}

export interface ChecklistItemDefinitionResponse {
  code: string;
  label: string;
}

export interface ChecklistItemResponse {
  code: string;
  label: string;
  result: string;
  notes: string | null;
}

export type ChecklistPageResponse = HasMorePageResponse<WeeklySafetyChecklistResponse>;

export interface ChecklistTemplateResponse {
  items: ChecklistItemDefinitionResponse[];
  results: string[];
}

export interface ChecklistWeekResponse {
  weekStartDate: string /* yyyy-MM-dd */;
  bestSubmittedScore: number | null;
}

export interface CheckoutUrlResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface CompanyProfileResponse {
  companyId: string;
  companyName: string;
  taxId: string;
  industry: string | null;
  companySize: string;
  website: string | null;
  billingStreet: string;
  billingNumber: string;
  billingDistrict: string;
  billingCity: string;
  billingCountry: string;
  billingPostalCode: string;
}

export interface ComplianceComponentResponse {
  name: string;
  weight: number;
  score: number;
  explanation: string;
}

export interface ComplianceScoreResponse {
  storeId: string;
  score: number;
  grade: string;
  components: ComplianceComponentResponse[];
  checklistWeeks: ChecklistWeekResponse[];
  alarmWindowFromUtc: string /* ISO 8601 UTC */;
  evaluatedAtUtc: string /* ISO 8601 UTC */;
}

export interface ComplianceSignatureResponse {
  id: string;
  storeId: string;
  signerName: string;
  signerTitle: string;
  sha256: string;
  widthPx: number;
  heightPx: number;
  signedAtUtc: string /* ISO 8601 UTC */;
}

export interface ComponentRequirementResponse {
  componentTypeId: string;
  quantity: number;
  isRequired: boolean;
}

export interface ComponentResponse {
  componentId: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ComponentStockResponse {
  componentStockId: string;
  componentId: string;
  componentTypeId: string;
  componentName: string;
  quantityAvailable: number;
  alertThreshold: number;
  lastUpdated: string /* ISO 8601 UTC */;
}

export interface ComponentTypeResponse {
  componentTypeId: string;
  name: string;
  description: string;
}

export interface ComponentUsageResponse {
  componentTypeId: string;
  quantityUsed: number;
  quantityReserved: number;
  delta: number;
}

export interface ConsumptionBucketResponse {
  startUtc: string /* ISO 8601 UTC */;
  kwh: number;
}

export interface ConsumptionComparisonResponse {
  storeId: string;
  currency: string;
  period1: PeriodConsumptionResponse;
  period2: PeriodConsumptionResponse;
  kwhDifference: number;
  costDifference: number;
  kwhChangePercent: number | null;
  costChangePercent: number | null;
  averageDailyKwhChangePercent: number | null;
  equipment: EquipmentComparisonResponse[];
}

export type ContactRequestStatus = 'RECEIVED' | 'NOTIFIED';

/** 202 body of POST /contact-requests (Location: /contact-requests/{requestId}). */
export interface ContactRequestReceiptResponse {
  requestId: string;
  status: ContactRequestStatus;
  receivedAtUtc: string /* ISO 8601 UTC */;
}

/** Public receipt check, GET /contact-requests/{id}: no personal data. */
export interface ContactRequestStatusResponse {
  id: string;
  status: ContactRequestStatus;
  submittedAtUtc: string /* ISO 8601 UTC */;
}

/** Demo lead for the back office, GET /contact-requests (Admin / SuperAdmin). */
export interface ContactRequestResponse {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactRequestStatus;
  submittedAtUtc: string /* ISO 8601 UTC */;
  notifiedAtUtc: string /* ISO 8601 UTC */ | null;
}

export interface CostBucketResponse {
  startUtc: string /* ISO 8601 UTC */;
  kwh: number;
  cost: number;
}

export interface CostResponse {
  currency: string;
  baseRatePerKwh: number;
  totalCost: number;
  peakKwh: number;
  offPeakKwh: number;
  peakCost: number;
  offPeakCost: number;
}

export interface CustomerPortalUrlResponse {
  portalUrl: string;
}

export interface DailyCostResponse {
  date: string /* yyyy-MM-dd */;
  kwh: number;
  cost: number;
}

export interface DeviceBindingResponse {
  id: string;
  equipmentId: string;
  deviceId: string;
  serialNumber: string;
  edgeDeviceId: string;
  linkedAtUtc: string /* ISO 8601 UTC */;
}

export interface DeviceOnboardingAnalysisResponse {
  reasoning: string;
  narrative: string;
  suggestedThresholds: SuggestedThresholdsResponse;
  analysisId: string | null;
}

export interface DeviceStatusResponse {
  deviceId: string;
  propertyId: string;
  connectionStatus: string;
  streamStatus: string;
  lastReadingAt: string /* ISO 8601 UTC */;
  lastReading: ReadingValueResponse | null;
  activeAnomalies: ActiveAnomalySummaryResponse[];
  currentRelayState: string;
}

export interface DeviceThresholdResponse {
  deviceId: string;
  thresholds: DeviceThresholdValuesResponse;
}

export interface DeviceThresholdValuesResponse {
  normalLimit: number;
  alertLimit: number;
  nominalVoltage: number;
  maxConsumptionWatts: number;
  maxCurrentAmps: number;
  minPowerFactor: number;
  nominalFrequency: number;
  disconnectionThresholdMin: number;
}

export interface ElectricalIncidentGuideResponse {
  storeId: string;
  storeName: string;
  storeAddress: string;
  version: string;
  sections: SafetyGuideSectionResponse[];
}

export interface ElectricalReadingResponse {
  capturedAtUtc: string /* ISO 8601 UTC */;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  activePowerKw: number;
  leakageCurrentAmps: number | null;
  detectedAnomalyType: string | null;
  detectedSeverity: string | null;
  relativeHumidityPercent: number | null;
  panelSurfaceMoistureDetected: boolean | null;
}

export interface EnergyReportResponse {
  reportId: string;
  storeId: string;
  format: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  generatedAtUtc: string /* ISO 8601 UTC */;
  expiresAtUtc: string /* ISO 8601 UTC */;
  downloadUrl: string;
}

export interface EquipmentComparisonResponse {
  equipmentId: string;
  equipmentName: string;
  period1Kwh: number;
  period2Kwh: number;
  period1Cost: number;
  period2Cost: number;
  kwhChangePercent: number | null;
  costChangePercent: number | null;
}

export interface EquipmentConsumptionResponse {
  equipmentId: string;
  equipmentName: string;
  kwh: number;
  peakKw: number;
  sampleCount: number;
  series: ConsumptionBucketResponse[];
}

export interface EquipmentCostShareResponse {
  equipmentId: string;
  equipmentName: string;
  monthToDateKwh: number;
  monthToDateCost: number;
  projectedCost: number;
}

export interface EquipmentLayoutResponse {
  equipmentId: string;
  name: string;
  areaId: string;
  areaName: string;
  isPlaced: boolean;
  coordinateX: number | null;
  coordinateY: number | null;
  width: number | null;
  height: number | null;
  zIndex: number | null;
  riskLevel: string;
}

export interface EquipmentMeasurementResponse {
  readingId: string;
  capturedAtUtc: string /* ISO 8601 UTC */;
  receivedAtUtc: string /* ISO 8601 UTC */;
  timestampBasis: string;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  source: string;
  activePowerKw: number;
  detectedAnomalyType: string | null;
  detectedSeverity: string | null;
  leakageCurrentAmps: number | null;
  relativeHumidityPercent: number | null;
  panelSurfaceMoistureDetected: boolean | null;
}

export interface EquipmentPowerConsumptionResponse {
  storeId: string;
  equipmentId: string;
  equipmentName: string;
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  granularity: string;
  timeZone: string;
  kwh: number;
  peakKw: number;
  averageKw: number;
  sampleCount: number;
  cost: CostResponse;
  series: CostBucketResponse[];
}

export interface EquipmentResponse {
  id: string;
  areaId: string;
  name: string;
}

export interface EquipmentRiskResponse {
  equipmentId: string;
  name: string;
  areaId: string;
  areaName: string;
  riskLevel: string;
  operationalState: string;
  reasons: string[];
  openCriticalAlerts: number;
  openNonCriticalAlerts: number;
  lastReading: ElectricalReadingResponse | null;
  evaluatedAtUtc: string /* ISO 8601 UTC */;
}

export interface EquipmentSafetyStatusResponse {
  equipmentId: string;
  name: string;
  status: string;
  isDeEnergized: boolean;
  isSafeToClean: boolean;
  reasons: string[];
  activeCriticalAlerts: number;
  lastReading: ElectricalReadingResponse | null;
  rule: SafeToCleanRuleResponse;
  evaluatedAtUtc: string /* ISO 8601 UTC */;
}

export interface EquipmentStatusResponse {
  equipmentId: string;
  name: string;
  areaId: string;
  areaName: string;
  state: string;
  lastMeasurementAtUtc: string /* ISO 8601 UTC */ | null;
  openCriticalAlerts: number;
  openNonCriticalAlerts: number;
}

export interface EquipmentTelemetryResponse {
  equipmentId: string;
  state: string;
  binding: DeviceBindingResponse | null;
  lastMeasurement: EquipmentMeasurementResponse | null;
}

export interface EquipmentThresholdsResponse {
  nominalVoltage: number;
  maxConsumptionWatts: number;
  maxCurrentAmps: number;
  minPowerFactor: number;
  nominalFrequency: number;
  disconnectionThresholdMin: number;
  normalLimitAmps: number;
  alertLimitAmps: number;
}

export interface GeolocationResponse {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: string;
}

export interface GridEquipmentResponse {
  equipmentId: string;
  name: string;
  areaId: string;
  areaName: string;
  riskLevel: string;
  operationalState: string;
  lastReading: ElectricalReadingResponse | null;
}

export interface HandoverEquipmentSnapshotResponse {
  equipmentId: string;
  name: string;
  areaId: string;
  areaName: string;
  riskLevel: string;
  operationalState: string;
  lastReading: ElectricalReadingResponse | null;
}

export interface HomeownerProfileResponse {
  homeownerId: string;
  preferredContactTime: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
}

export interface InstallationPropertyAttachedResponse {
  requestId: string;
  propertyId: string;
  status: string;
  matching: string;
}

export interface IoTDeviceResponse {
  id: string;
  serialNumber: string;
  firmwareVersion: string;
  status: DeviceStatus;
  assignedPropertyId: string | null;
  connectionStatus: ConnectionStatus;
  lastReadingAt: string /* ISO 8601 UTC */ | null;
  installedAt: string /* ISO 8601 UTC */ | null;
}

export interface MaintenanceCertificateResponse {
  id: string;
  storeId: string;
  equipmentId: string;
  equipmentName: string;
  areaName: string;
  technicianName: string;
  certificationNumber: string;
  workDescription: string | null;
  issuedAtUtc: string /* ISO 8601 UTC */;
  expiresAtUtc: string /* ISO 8601 UTC */;
  documentFileUrl: string | null;
  urgency: string;
  daysUntilExpiry: number;
  registeredAtUtc: string /* ISO 8601 UTC */;
}

export interface MaintenancePredictionResponse {
  equipmentId: string;
  equipmentName: string;
  severity: string;
  runningSamples: number;
  baselinePowerFactor: number | null;
  recentPowerFactor: number | null;
  powerFactorSlopePerDay: number | null;
  daysToPowerFactorLimit: number | null;
  baselineFluctuationIndex: number | null;
  recentFluctuationIndex: number | null;
  findings: WearFindingResponse[];
  recommendedWindow: RepairWindowResponse | null;
}

export interface MaintenancePredictionsResponse {
  storeId: string;
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  generatedAtUtc: string /* ISO 8601 UTC */;
  analysedEquipment: number;
  insufficientDataEquipmentIds: string[];
  predictions: MaintenancePredictionResponse[];
}

export interface MatchingQueueResponse {
  priorityQueue: QueuedRequestResponse[];
  normalQueue: QueuedRequestResponse[];
  totalPending: number;
}

export interface MatchingResultResponse {
  requestId: string;
  assigned: boolean;
  failureReason: string | null;
}

export interface MatchingScoreResponse {
  score: number;
  method: string;
  reasoning: string | null;
}

export interface MeasurementHistoryResponse {
  readingId: string;
  capturedAtUtc: string /* ISO 8601 UTC */;
  receivedAtUtc: string /* ISO 8601 UTC */;
  timestampBasis: string;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  source: string;
  detectedAnomalyType: string | null;
  detectedSeverity: string | null;
}

export interface MessageResponse {
  message: string;
}

export interface MyProfileResponse {
  profileId: string;
  userId: string;
  status: string;
  businessRole: string | null;
  profilePictureUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  dni: string | null;
  dateOfBirth: string | null;
  street: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  technician: TechnicianProfileResponse | null;
  homeowner: HomeownerProfileResponse | null;
  company: CompanyProfileResponse | null;
}

export interface MySubscriptionResponse {
  subscriptionId: string;
  planType: string;
  status: string;
  billingCycle: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  monthlyRequestsUsed: number | null;
  monthlyRequestsLimit: number | null;
  gracePeriodEndsAt: string | null;
}

export interface NotificationRouteResponse {
  channel: string;
  destination: string | null;
  recipientRole: string;
  recipientName: string | null;
  urgencyLevels: string[];
  enabled: boolean;
}

export interface OffHoursConsumptionResponse {
  storeId: string;
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  timeZone: string;
  currency: string;
  standbyThresholdKw: number;
  totalKwh: number;
  totalCost: number;
  equipment: OffHoursEquipmentResponse[];
  episodes: OffHoursEpisodeResponse[];
}

export interface OffHoursEpisodeResponse {
  equipmentId: string;
  equipmentName: string;
  startUtc: string /* ISO 8601 UTC */;
  endUtc: string /* ISO 8601 UTC */;
  kwh: number;
  cost: number;
  peakKw: number;
  averageKw: number;
  sampleCount: number;
}

export interface OffHoursEquipmentResponse {
  equipmentId: string;
  equipmentName: string;
  episodes: number;
  kwh: number;
  cost: number;
  peakKw: number;
}

export interface OfflineReadingResultResponse {
  readingId: string;
  status: string;
  reason: string | null;
}

export interface OfflineSyncResponse {
  panelId: string | null;
  received: number;
  accepted: number;
  duplicates: number;
  conflicts: number;
  rejected: number;
  synchronizedAtUtc: string /* ISO 8601 UTC */;
  results: OfflineReadingResultResponse[];
}

export interface OhsReportResponse {
  reportId: string;
  storeId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  generatedAtUtc: string /* ISO 8601 UTC */;
  complianceScore: number;
  isSigned: boolean;
  downloadUrl: string;
}

export interface OnDutyStaffResponse {
  storeId: string;
  atUtc: string /* ISO 8601 UTC */;
  accountable: StaffShiftResponse | null;
  onDuty: StaffShiftResponse[];
}

export interface OpeningDayResponse {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
}

export interface PanelPauseResponse {
  storeId: string;
  status: string;
  isInputLocked: boolean;
  remainingSeconds: number;
  pauseId: string | null;
  panelId: string | null;
  startedAtUtc: string /* ISO 8601 UTC */ | null;
  endsAtUtc: string /* ISO 8601 UTC */ | null;
  endedAtUtc: string /* ISO 8601 UTC */ | null;
  endReason: string | null;
  overridingAlertId: string | null;
}

export interface PaymentHistoryResponse {
  page: number;
  pageSize: number;
  payments: PaymentRecordResponse[];
}

export interface PaymentRecordResponse {
  paymentRecordId: string;
  stripeInvoiceId: string;
  amountDecimal: number;
  currency: string;
  status: string;
  processedAt: string;
}

export interface PeriodConsumptionResponse {
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  days: number;
  kwh: number;
  cost: number;
  averageDailyKwh: number;
}

export interface PhotoResponse {
  photoId: string;
  photoType: string;
  photoUrl: string;
  thumbnailUrl: string | null;
  format: string;
  sizeBytes: number;
  takenAt: string /* ISO 8601 UTC */;
  notes: string | null;
}

export interface PlanningRequestEligibilityResponse {
  canCreate: boolean;
  planType: string | null;
  remainingRequests: number | null;
  canMarkAsPriority: boolean;
  reason: string | null;
}

export interface PortfolioEntryResponse {
  propertyId: string;
  nickname: string;
  isPrimary: boolean;
  occupancyStatus: string;
}

export interface ProfileStatusResponse {
  profileId: string;
  userId: string;
  status: string;
  completionPercentage: number;
}

export interface PropertyPhotoResponse {
  publicUrl: string;
  providerId: string;
  thumbnailUrl: string | null;
  uploadedAt: string /* ISO 8601 UTC */;
}

export interface PropertyPhotoUploadUrlResponse {
  url: string;
  signature: string;
  timestamp: number;
  apiKey: string;
}

export interface PropertyPortfolioResponse {
  id: string;
  ownerId: string;
  status: string;
  entries: PortfolioEntryResponse[];
}

export interface PropertyResponse {
  propertyId: string;
  ownerId: string;
  address: AssetsAddressResponse;
  geolocation: GeolocationResponse;
  status: string;
  isActive: boolean;
  propertyType: string;
  mainPhotoProviderId: string | null;
  photos: PropertyPhotoResponse[];
}

export interface QueuedRequestResponse {
  requestId: string;
  homeownerId: string;
  isPriority: boolean;
  createdAt: string;
}

export interface ReadingValueResponse {
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  timestamp: string /* ISO 8601 UTC */;
}

export interface RecentReadingsResponse {
  deviceId: string;
  propertyId: string;
  windowMinutes: number;
  readings: ReadingValueResponse[];
  averageConsumptionKw: number;
  peakCurrentLast60Min: number;
}

export interface RefreshedTokenResponse {
  token: string;
}

export interface RelayCommandHistoryResponse {
  deviceId: string;
  currentRelayState: string;
  lastCommandAt: string /* ISO 8601 UTC */ | null;
  commands: RelayCommandItemResponse[];
}

export interface RelayCommandItemResponse {
  commandId: string;
  targetRelayState: string;
  requestedBy: string;
  authorizationSource: string;
  serviceRequestId: string | null;
  status: string;
  issuedAt: string /* ISO 8601 UTC */;
  executedAt: string /* ISO 8601 UTC */ | null;
  failureReason: string | null;
}

export interface RepairWindowResponse {
  startUtc: string /* ISO 8601 UTC */;
  endUtc: string /* ISO 8601 UTC */;
  reason: string;
}

/** Body of POST /suggestions/{suggestionId}/accept. (POST /service-requests now returns ServiceRequestSummaryResponse.) */
export interface RequestIdCreatedResponse {
  requestId: string;
}

export interface SafeToCleanRuleResponse {
  maxDeEnergizedCurrentAmps: number;
  maxReadingAgeMinutes: number;
  requireNoActiveCriticalAlerts: boolean;
}

export interface SafetyGuideSectionResponse {
  title: string;
  steps: string[];
}

export interface SensorConnectivityResponse {
  sensorId: string;
  serialNumber: string;
  edgeDeviceId: string;
  equipmentId: string;
  equipmentName: string;
  areaId: string;
  areaName: string;
  status: string;
  lastTelemetryReceivedAtUtc: string /* ISO 8601 UTC */ | null;
  lastReadingCapturedAtUtc: string /* ISO 8601 UTC */ | null;
  secondsSinceLastTelemetry: number | null;
  disconnectionThresholdMin: number;
  linkedAtUtc: string /* ISO 8601 UTC */;
}

export interface ServiceCatalogResponse {
  catalogId: string;
  technicianId: string;
  status: string;
  totalRecipes: number;
  recipes: ServiceRecipeSummaryResponse[];
}

export interface ServiceExecutionResponse {
  executionId: string;
  assignmentId: string;
  technicianId: string;
  ownerId: string;
  propertyId: string;
  status: string;
  scheduledAt: string /* ISO 8601 UTC */;
  startedAt: string /* ISO 8601 UTC */ | null;
  completedAt: string /* ISO 8601 UTC */ | null;
  serviceName: string;
  serviceCategory: string;
  totalPrice: number;
  estimatedDuration: number;
  isPriority: boolean;
  workLog: WorkLogSummaryResponse;
}

export interface ServiceRecipeDetailResponse {
  recipeId: string;
  serviceName: string;
  serviceDescription: string;
  serviceCategory: string;
  componentRequirements: ComponentRequirementResponse[];
  estimatedDurationMinutes: number;
  materialsEstimate: number;
  laborCost: number;
  totalPrice: number;
  currency: string;
  prerequisites: string[];
  deliverables: string[];
  warrantyMonths: number;
  isActive: boolean;
  timesRequested: number;
}

export interface ServiceRecipeSummaryResponse {
  recipeId: string;
  serviceName: string;
  serviceCategory: string;
  totalPrice: number;
  currency: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
  timesRequested: number;
}

export interface ServiceRequestSummaryResponse {
  requestId: string;
  ownerId: string;
  propertyId: string | null;
  selectedRecipeId: string | null;
  selectedTechnicianId: string | null;
  status: string;
  isPriority: boolean;
  createdAt: string;
}

export interface ServiceSuggestionResponse {
  suggestionId: string;
  propertyId: string;
  anomalyType: string;
  severity: string;
  status: string;
  expiresAt: string /* ISO 8601 UTC */;
  viewedAt: string /* ISO 8601 UTC */ | null;
}

export interface ShiftHandoverResponse {
  id: string;
  storeId: string;
  workerId: string;
  workerName: string;
  shiftDate: string /* yyyy-MM-dd */;
  recordedAtUtc: string /* ISO 8601 UTC */;
  gridStatus: string;
  activeCriticalAlerts: number;
  activeNonCriticalAlerts: number;
  notes: string | null;
  managerNotified: boolean;
  equipment: HandoverEquipmentSnapshotResponse[];
}

export interface ShutdownProtocolResponse {
  equipmentId: string;
  name: string;
  isDefault: boolean;
  shutdownSteps: string[];
  emergencyIsolationSteps: string[];
  isSafeToCleanRule: SafeToCleanRuleResponse;
  updatedAtUtc: string /* ISO 8601 UTC */ | null;
}

export interface SignedUploadUrlResponse {
  url: string;
  signature: string;
  timestamp: number;
}

export interface StaffMemberResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isIoTCertified: boolean;
  assignedZone: string | null;
  isActive: boolean;
  hireDate: string /* ISO 8601 UTC */;
}

export interface StaffShiftResponse {
  id: string;
  storeId: string;
  workerCode: string;
  workerName: string;
  role: string;
  startsAtUtc: string /* ISO 8601 UTC */;
  endsAtUtc: string /* ISO 8601 UTC */;
  createdAtUtc: string /* ISO 8601 UTC */;
}

export interface StaffUserResponse {
  userId: string;
  email: string;
  accessRole: string;
}

export interface StockDeviceItemResponse {
  id: string;
  serialNumber: string;
  firmwareVersion: string;
  status: DeviceStatus;
}

/** GET /iot-devices/my-stock: PagedResponse plus availableCount (free InStock devices). */
export interface StockPageResponse extends PagedResponse<StockDeviceItemResponse> {
  availableCount: number;
}

export interface StoreConsumptionResponse {
  storeId: string;
  fromUtc: string /* ISO 8601 UTC */;
  toUtc: string /* ISO 8601 UTC */;
  granularity: string;
  totalKwh: number;
  equipment: EquipmentConsumptionResponse[];
  series: ConsumptionBucketResponse[];
}

export interface StoreCostForecastResponse {
  storeId: string;
  currency: string;
  timeZone: string;
  monthStartUtc: string /* ISO 8601 UTC */;
  monthEndUtc: string /* ISO 8601 UTC */;
  generatedAtUtc: string /* ISO 8601 UTC */;
  monthToDateKwh: number;
  monthToDateCost: number;
  elapsedDays: number;
  daysInMonth: number;
  method: string;
  projectedKwh: number;
  projectedCost: number;
  linearProjectedCost: number;
  movingAverageProjectedCost: number | null;
  daily: DailyCostResponse[];
  equipment: EquipmentCostShareResponse[];
}

export interface StoreDashboardSummaryResponse {
  storeId: string;
  generatedAtUtc: string /* ISO 8601 UTC */;
  totalEquipment: number;
  monitoredEquipment: number;
  offlineEquipment: number;
  unmonitoredEquipment: number;
  activeCriticalAlerts: number;
  activeNonCriticalAlerts: number;
  equipment: EquipmentStatusResponse[];
}

export interface StoreElectricalGridStatusResponse {
  storeId: string;
  generatedAtUtc: string /* ISO 8601 UTC */;
  status: string;
  totalEquipment: number;
  reportingEquipment: number;
  totalActivePowerKw: number;
  totalCurrentAmps: number;
  averageVoltage: number | null;
  minVoltage: number | null;
  maxVoltage: number | null;
  averagePowerFactor: number | null;
  averageFrequency: number | null;
  maxLeakageCurrentAmps: number | null;
  riskLevelCounts: Record<string, number>;
  equipment: GridEquipmentResponse[];
}

export interface StoreEnergyBudgetResponse {
  storeId: string;
  year: number;
  month: number;
  targetKWh: number;
  alertThresholdPercentage: number;
  updatedAtUtc: string /* ISO 8601 UTC */;
}

export interface StoreLayoutResponse {
  storeId: string;
  canvasWidth: number;
  canvasHeight: number;
  placedCount: number;
  unplacedCount: number;
  equipment: EquipmentLayoutResponse[];
}

export interface StoreNotificationPreferencesResponse {
  storeId: string;
  isDefault: boolean;
  updatedAtUtc: string /* ISO 8601 UTC */ | null;
  routes: NotificationRouteResponse[];
}

export interface StoreOpeningHoursResponse {
  storeId: string;
  timeZone: string;
  isConfigured: boolean;
  days: OpeningDayResponse[];
}

export interface StoreResponse {
  id: string;
  name: string;
  address: string;
  ownerUserId: string;
  lastEdgeSyncAtUtc: string /* ISO 8601 UTC */ | null;
}

export interface StoreSensorsConnectivityResponse {
  storeId: string;
  generatedAtUtc: string /* ISO 8601 UTC */;
  totalSensors: number;
  connected: number;
  disconnected: number;
  lastEdgeSyncAtUtc: string /* ISO 8601 UTC */ | null;
  sensors: SensorConnectivityResponse[];
}

export interface SubscriptionStatusAlertResponse {
  status: string;
  planType: string;
  gracePeriodEndsAt: string;
  message: string;
  customerPortalUrl: string | null;
}

export interface SubscriptionsRequestEligibilityResponse {
  canRequest: boolean;
  isPriorityAllowed: boolean;
  remainingRequests: number | null;
  planType: string;
  upgradeRequired: boolean;
  upgradePromptMessage: string | null;
}

export interface SuggestedThresholdsResponse {
  nominalVoltage: number;
  maxConsumptionWatts: number;
  maxCurrentAmps: number;
  minPowerFactor: number;
  nominalFrequency: number;
  disconnectionThresholdMin: number;
  normalLimitAmps: number;
  alertLimitAmps: number;
}

export interface TechnicianInventoryResponse {
  technicianId: string;
  stockItems: ComponentStockResponse[];
}

export interface TechnicianMetricsResponse {
  metricsId: string;
  technicianId: string;
  periodStart: string /* ISO 8601 UTC */;
  periodEnd: string /* ISO 8601 UTC */;
  completedServicesCount: number;
  ioTServicesCount: number;
  averageRating: number;
  totalRevenueAmount: number;
  totalRevenueCurrency: string;
  averageResponseTime: string /* [d.]hh:mm:ss */;
  clientRetentionRate: number;
  lastCalculatedAt: string /* ISO 8601 UTC */;
}

export interface TechnicianProfileResponse {
  technicianId: string;
  specialties: string[];
  experienceYears: number;
  aboutMe: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
}

export interface UncertifiedEquipmentResponse {
  equipmentId: string;
  name: string;
  areaName: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
}

export interface WearFindingResponse {
  code: string;
  severity: string;
  description: string;
  recommendedAction: string;
}

export interface WeeklySafetyChecklistResponse {
  id: string;
  storeId: string;
  inspectorStaffId: string;
  inspectorName: string;
  weekStartDate: string /* yyyy-MM-dd */;
  week: string;
  status: string;
  score: number;
  observations: string | null;
  items: ChecklistItemResponse[];
  createdAtUtc: string /* ISO 8601 UTC */;
  updatedAtUtc: string /* ISO 8601 UTC */;
  submittedAtUtc: string /* ISO 8601 UTC */ | null;
}

export interface WorkLogResponse {
  executionId: string;
  photos: PhotoResponse[];
  reportContent: string | null;
  findings: string | null;
  recommendations: string | null;
  reportVersion: number;
  components: ComponentUsageResponse[];
}

export interface WorkLogSummaryResponse {
  photosCount: number;
  hasReport: boolean;
  hasComponents: boolean;
}

export interface WorkPhotoUploadUrlResponse {
  url: string;
  signature: string;
  timestamp: number;
  apiKey: string;
}

export interface WorkerResponse {
  workerCode: string;
  workerName: string;
}
