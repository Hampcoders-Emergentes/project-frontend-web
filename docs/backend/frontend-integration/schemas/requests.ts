/**
 * Request payloads of the Electrolink API (generated from the C# *Resource records used as [FromBody] inputs).
 * Property names are camelCase; binding is case-insensitive (PropertyNameCaseInsensitive = true).
 * Store-management, alert, analytics and contact-request bodies reject unknown properties
 * ([JsonUnmappedMemberHandling(Disallow)]) -> HTTP 400 if you send extra fields.
 * Naming: every payload is a `*Request`; the C# "*Resource" suffix is replaced by "Request".
 * Optional (`?`) means the C# member is nullable or has a default value.
 */
/* eslint-disable */
import type { CompanySize, ConnectionStatus, ContactTime, Specialty } from './responses';

/** Query of every list that returns PagedResponse<T>: ?page=1&pageSize=20. Out-of-range values are clamped (page >= 1, 1 <= pageSize <= 100). */
export interface PageRequest {
  page?: number;
  pageSize?: number;
}

/** Request headers with a contract meaning. */
export const REQUEST_HEADERS = {
  /**
   * Optional on idempotent creation POSTs (iot-devices, staff-users, staff-members, service-requests, contact-requests,
   * compliance checklists, maintenance certificates, anomaly reports). A UUID per user action, at most 128 characters,
   * reused on every retry of that action; stored for 24 hours.
   */
  idempotencyKey: 'Idempotency-Key',
} as const;



export interface AcknowledgeRelayRequest {
  commandId: string;
  deviceId: string;
  executedSuccessfully: boolean;
  executedAt: string /* ISO 8601 UTC */;
}

export interface AddPropertyToPortfolioRequest {
  propertyId: string;
  nickname: string;
  isPrimary: boolean;
  occupancyStatus: string;
}

export interface AddServiceDetailsRequest {
  problemDescription: string;
  consumptionKwh: number;
  amountPaid: number;
  amountCurrency: string;
  billingPeriod: string;
  receiptNumber: string;
  isPriority: boolean;
  preferredDates: string[];
  timePreference: string;
}

export interface AddStockToInventoryRequest {
  componentId: string;
  componentTypeId: string;
  quantity: number;
  alertThreshold: number;
}

export interface AdjustStockAmountRequest {
  amount: number;
}

export interface AdjustThresholdsRequest {
  analysisId: string;
  userMessage: string;
}

export interface AnalyzeDeviceOnboardingRequest {
  deviceType: string;
  nominalVoltage: number;
  dailyUsageHours: number;
  occupants: number;
  locationType: string;
  primaryUse: string;
}

export interface AssetsAddressRequest {
  street: string;
  number: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface AssignAlertRequest {
  technicianId: string;
  technicianName?: string;
}

export interface AssignDeviceToPropertyRequest {
  installationRequestId: string;
}

export interface AssignStaffRequest {
  requestId: string;
  staffMemberId: string;
}

export interface AssignStaffZoneRequest {
  region: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
}

export interface AttachInstallationPropertyRequest {
  propertyId: string;
}

export interface CancelServiceExecutionRequest {
  cancelledBy: string;
  reason: string;
  notes?: string;
  requestReassignment: boolean;
}

export interface CancelServiceRequestRequest {
  reason: string;
  notes?: string;
}

export interface CancelSubscriptionRequest {
  reason: string;
  feedback?: string;
}

export interface ChecklistItemInputRequest {
  code: string;
  result: string;
  notes?: string;
}

export interface CompleteProfileAsCompanyRequest {
  companyName: string;
  taxId: string;
  billingStreet: string;
  billingNumber: string;
  billingDistrict: string;
  billingCity: string;
  billingCountry: string;
  billingPostalCode: string;
  industry?: string;
  companySize: CompanySize;
  website?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dni?: string;
  dateOfBirth?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface CompleteProfileAsHomeownerRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dni: string;
  dateOfBirth: string;
  street: string;
  number: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
  preferredContactTime: ContactTime;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  emergencyContact?: EmergencyContactRequest;
}

export interface CompleteProfileAsTechnicianRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dni: string;
  dateOfBirth: string;
  street: string;
  number: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
  specialties: Specialty[];
  experienceYears: number;
  aboutMe: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusKm?: number;
}

export interface ComponentRequirementRequest {
  componentTypeId: string;
  quantity: number;
  isRequired: boolean;
}

export interface ComponentUsageItemRequest {
  componentTypeId: string;
  componentTypeName: string;
  quantityUsed: number;
  quantityReserved: number;
}

export interface CreateComponentRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateComponentTypeRequest {
  name: string;
  description: string;
}

export interface CreateNamedHierarchyRequest {
  name: string;
}

export interface CreatePropertyRequest {
  address: AssetsAddressRequest;
  geolocation: GeolocationRequest;
  propertyType: string;
}

export interface CreateServiceExecutionRequest {
  assignmentId: string;
  requestId: string;
  technicianId: string;
  ownerId: string;
  propertyId: string;
  recipeSnapshot: MonitoringRecipeSnapshotRequest;
  scheduledDateTime: string /* ISO 8601 UTC */;
  isPriority: boolean;
}

export interface CreateServiceRecipeRequest {
  serviceName: string;
  serviceDescription: string;
  serviceCategory: string;
  requiresIoTCertification: boolean;
  componentRequirements: ComponentRequirementRequest[];
  estimatedDurationHours: number;
  estimatedDurationMinutes: number;
  pricing: PricingRequest;
  prerequisites: string[];
  deliverables: string[];
  warrantyMonths: number;
}

export interface CreateStaffMemberRequest {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface CreateStaffUserRequest {
  email: string;
  password: string;
  passwordConfirmation: string;
  accessRole: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface CreateStoreRequest {
  name: string;
  address: string;
}

export interface DeactivateProfileRequest {
  reason: string;
  notes?: string;
}

export interface DeactivateServiceRecipeRequest {
  reason: string;
  notes?: string;
}

export interface DecommissionDeviceRequest {
  reason: string;
}

export interface DispatchAlertRequest {
  alertId: string;
}

export interface EmergencyContactRequest {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface EquipmentPlacementRequest {
  equipmentId: string;
  coordinateX: number;
  coordinateY: number;
  width: number;
  height: number;
  zIndex?: number;
}

export interface ExecuteMatchingAlgorithmRequest {
  requestId: string;
}

export interface ExtendWaitTimeRequest {
  extendMinutes: number;
}

export interface GenerateEnergyReportRequest {
  from: string;
  to: string;
  format: string;
}

export interface GenerateOhsReportRequest {
  from?: string;
  to?: string;
}

export interface GeolocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
}

export interface IngestReadingRequest {
  deviceId: string;
  readingId: string;
  timestamp: string /* ISO 8601 UTC */;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  source: string;
  leakageCurrentAmps?: number;
  relativeHumidityPercent?: number;
  panelSurfaceMoistureDetected?: boolean;
}

export interface InitiateCheckoutRequest {
  planType: string;
  billingCycle: string;
  successUrl: string;
  cancelUrl: string;
}

export interface IssueRelayCommandRequest {
  targetRelayState: string;
  propertyId: string;
  serviceRequestId: string;
}

export interface LinkEquipmentDeviceRequest {
  deviceId: string;
  edgeDeviceId: string;
}

export interface MonitoringRecipeSnapshotRequest {
  recipeId: string;
  serviceName: string;
  serviceCategory: string;
  componentRequirements: ComponentRequirementRequest[];
  totalPrice: number;
  currency: string;
  estimatedDurationMinutes: number;
  warrantyMonths: number;
  snapshotAt: string /* ISO 8601 UTC */;
}

export interface NotificationRouteInputRequest {
  channel: string;
  destination?: string;
  recipientRole: string;
  recipientName?: string;
  urgencyLevels: string[];
  enabled?: boolean;
}

export interface OpenCustomerPortalRequest {
  returnUrl: string;
}

export interface OpeningDayInputRequest {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
}

export interface PricingRequest {
  materialsEstimate: number;
  laborCost: number;
  totalPrice: number;
  currency: string;
}

export interface RecordComponentsUsedRequest {
  componentsUsed: ComponentUsageItemRequest[];
  recordedAt: string /* ISO 8601 UTC */;
}

export interface RecordDeviceInstallationRequest {
  technicianId: string;
  firmwareVersion: string;
  installedAt: string /* ISO 8601 UTC */;
}

export interface RecordShiftHandoverRequest {
  workerId: string;
  workerName?: string;
  shiftDate?: string /* yyyy-MM-dd */;
  notes?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterCertificateRequest {
  technicianName: string;
  certificationNumber: string;
  workDescription?: string;
  issuedAt: string /* ISO 8601 with offset */;
  expiresAt: string /* ISO 8601 with offset */;
  documentFileUrl?: string;
}

export interface RegisterIoTDeviceRequest {
  serialNumber: string;
  plainTextApiKey: string;
  firmwareVersion: string;
}

export interface RegisterPropertyPhotoRequest {
  providerId: string;
  publicUrl: string;
}

export interface RegisterSignatureRequest {
  signerName: string;
  signerTitle: string;
  imageBase64: string;
}

export interface RegisterWorkPhotoRequest {
  providerId: string;
  publicUrl: string;
  thumbnailUrl?: string;
  photoType: string;
  format: string;
  sizeBytes: number;
  takenAt: string /* ISO 8601 UTC */;
  notes?: string;
}

export interface ReinstallDeviceRequest {
  technicianId: string;
  firmwareVersion: string;
  reinstalledAt: string /* ISO 8601 UTC */;
}

export interface ReportEdgeAnomalyRequest {
  deviceId: string;
  anomalyType: string;
  triggerReadingId: string;
  edgeAlertPayloadJson: string;
}

export interface ReportEquipmentAnomalyRequest {
  category: string;
  description: string;
  reportedByWorkerCode?: string;
  reportedByWorkerName?: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface ResolveAlertRequest {
  notes?: string;
}

export interface SafeToCleanRuleInputRequest {
  maxDeEnergizedCurrentAmps: number;
  maxReadingAgeMinutes: number;
  requireNoActiveCriticalAlerts?: boolean;
}

export interface SaveChecklistRequest {
  checklistId?: string;
  inspectorStaffId: string;
  inspectorName: string;
  weekOf?: string /* yyyy-MM-dd */;
  items: ChecklistItemInputRequest[];
  observations?: string;
  status?: string;
}

export interface ScheduleStaffShiftRequest {
  workerCode: string;
  workerName: string;
  role: string;
  startsAt: string /* ISO 8601 with offset */;
  endsAt: string /* ISO 8601 with offset */;
}

export interface SelectPropertyRequest {
  propertyId: string;
}

export interface SelectServiceRecipeRequest {
  serviceCategory: string;
}

export interface SendDeviceToMaintenanceRequest {
  reason: string;
  expectedReturnDate?: string /* ISO 8601 UTC */;
}

export interface SetEnergyBudgetRequest {
  year: number;
  month: number;
  targetKWh: number;
  alertThresholdPercentage?: number;
}

export interface SetOpeningHoursRequest {
  days: OpeningDayInputRequest[];
}

export interface SetPropertyMainPhotoRequest {
  providerId: string;
}

export interface SetThresholdsRequest {
  thresholds: Record<string, number>;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  passwordConfirmation: string;
  role?: string;
}

export interface StartPanelPauseRequest {
  durationSeconds?: number;
  panelId?: string;
}

export interface StartServiceExecutionRequest {
  startedAt: string /* ISO 8601 UTC */;
}

export interface SubmitContactRequestRequest {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message: string;
}

export interface SubmitReviewRequest {
  rating: number;
  comment?: string;
  categories: Record<string, number>;
}

export interface SyncOfflineReadingsBatchRequest {
  panelId?: string;
  readings: IngestReadingRequest[];
}

export interface ToggleRelayRequest {
  targetState: string;
}

export interface UpdateComponentRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateComponentStockRequest {
  newQuantity: number;
  newAlertThreshold: number;
}

export interface UpdateComponentTypeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDeviceConnectionStatusRequest {
  newConnectionStatus: ConnectionStatus;
  lastReadingAt?: string /* ISO 8601 UTC */;
}

export interface UpdateEquipmentThresholdsRequest {
  nominalVoltage: number;
  maxConsumptionWatts: number;
  maxCurrentAmps: number;
  minPowerFactor: number;
  nominalFrequency: number;
  disconnectionThresholdMin: number;
  normalLimitAmps: number;
  alertLimitAmps: number;
}

export interface UpdateHomeownerPreferencesRequest {
  smsNotifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  preferredContactTime?: ContactTime;
  emergencyContact?: EmergencyContactRequest;
}

export interface UpdateLocationRequest {
  address?: AssetsAddressRequest;
  geolocation?: GeolocationRequest;
}

export interface UpdateNotificationPreferencesRequest {
  routes: NotificationRouteInputRequest[];
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePersonalDataRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface UpdateProfilePhotoRequest {
  providerId: string;
  publicUrl: string;
  format: string;
  sizeBytes: number;
}

export interface UpdateServiceRecipeRequest {
  serviceName?: string;
  serviceDescription?: string;
  componentRequirements?: ComponentRequirementRequest[];
  estimatedDurationHours?: number;
  estimatedDurationMinutes?: number;
  pricing?: PricingRequest;
  prerequisites?: string[];
  deliverables?: string[];
  warrantyMonths?: number;
}

export interface UpdateShutdownProtocolRequest {
  shutdownSteps: string[];
  emergencyIsolationSteps: string[];
  isSafeToCleanRule: SafeToCleanRuleInputRequest;
}

export interface UpdateStoreLayoutRequest {
  canvasWidth?: number;
  canvasHeight?: number;
  items?: EquipmentPlacementRequest[];
  removeEquipmentIds?: string[];
}

export interface UpdateTechnicalReportRequest {
  reportContent: string;
  findings: string;
  recommendations: string;
  updatedAt: string /* ISO 8601 UTC */;
  iotFindings?: string;
}

export interface UpdateTechnicianDataRequest {
  specialties?: Specialty[];
  experienceYears?: number;
  aboutMe?: string;
}
