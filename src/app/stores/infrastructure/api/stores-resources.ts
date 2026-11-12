/** Wire resources of the store-management endpoints used by the stores context. */

export interface StoreResponse {
  id: string;
  name: string;
  address: string;
  ownerUserId: string;
  lastEdgeSyncAtUtc: string | null;
}

export interface AreaResponse {
  id: string;
  storeId: string;
  name: string;
}

export interface EquipmentResponse {
  id: string;
  areaId: string;
  name: string;
}

export interface DeviceBindingResponse {
  id: string;
  equipmentId: string;
  deviceId: string;
  serialNumber: string;
  edgeDeviceId: string;
  linkedAtUtc: string;
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

export interface SafeToCleanRuleResponse {
  maxDeEnergizedCurrentAmps: number;
  maxReadingAgeMinutes: number;
  requireNoActiveCriticalAlerts: boolean;
}

export interface ShutdownProtocolResponse {
  equipmentId: string;
  name: string;
  isDefault: boolean;
  shutdownSteps: string[];
  emergencyIsolationSteps: string[];
  isSafeToCleanRule: SafeToCleanRuleResponse;
  updatedAtUtc: string | null;
}

export interface UpdateShutdownProtocolRequest {
  shutdownSteps: string[];
  emergencyIsolationSteps: string[];
  isSafeToCleanRule: SafeToCleanRuleResponse;
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

export interface StoreLayoutResponse {
  storeId: string;
  canvasWidth: number;
  canvasHeight: number;
  placedCount: number;
  unplacedCount: number;
  equipment: EquipmentLayoutResponse[];
}

export interface UpdateStoreLayoutRequest {
  canvasWidth: number;
  canvasHeight: number;
  items: {
    equipmentId: string;
    coordinateX: number;
    coordinateY: number;
    width: number;
    height: number;
    zIndex: number;
  }[];
  removeEquipmentIds: string[];
}

export interface StaffShiftResponse {
  id: string;
  storeId: string;
  workerCode: string;
  workerName: string;
  role: string;
  startsAtUtc: string;
  endsAtUtc: string;
  createdAtUtc: string;
}

export interface OnDutyStaffResponse {
  storeId: string;
  atUtc: string;
  accountable: StaffShiftResponse | null;
  onDuty: StaffShiftResponse[];
}
