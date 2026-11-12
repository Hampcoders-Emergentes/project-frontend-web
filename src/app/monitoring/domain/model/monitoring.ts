/** Equipment risk level, ordered from best to worst. `UNKNOWN` means no linked sensor. */
export type RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL_RISK' | 'DISCONNECTED' | 'UNKNOWN';
/** Operational state of an equipment. */
export type OperationalState = 'UNMONITORED' | 'UNKNOWN' | 'STALE' | 'NORMAL' | 'ANOMALY';
/** Telemetry state of an equipment. */
export type TelemetryState = 'UNKNOWN' | 'NORMAL' | 'ANOMALY' | 'STALE' | 'DEVICE_UNVERIFIED';
/** Electrical grid status of a store. */
export type GridStatus = 'NO_DATA' | 'NORMAL' | 'WARNING' | 'CRITICAL';
/** Sensor connectivity. */
export type ConnectivityStatus = 'CONNECTED' | 'DISCONNECTED';

const RISK_ORDER: readonly RiskLevel[] = ['SAFE', 'UNKNOWN', 'WARNING', 'DISCONNECTED', 'CRITICAL_RISK'];

function narrow<T extends string>(values: readonly T[], value: string, fallback: T): T {
  return values.find((candidate) => candidate === value) ?? fallback;
}

/** Unknown vocabulary always narrows to a non-healthy value. */
export const toRiskLevel = (value: string): RiskLevel =>
  narrow<RiskLevel>(['SAFE', 'WARNING', 'CRITICAL_RISK', 'DISCONNECTED', 'UNKNOWN'], value, 'UNKNOWN');
export const toOperationalState = (value: string): OperationalState =>
  narrow<OperationalState>(['UNMONITORED', 'UNKNOWN', 'STALE', 'NORMAL', 'ANOMALY'], value, 'UNKNOWN');
export const toTelemetryState = (value: string): TelemetryState =>
  narrow<TelemetryState>(['UNKNOWN', 'NORMAL', 'ANOMALY', 'STALE', 'DEVICE_UNVERIFIED'], value, 'UNKNOWN');
export const toGridStatus = (value: string): GridStatus =>
  narrow<GridStatus>(['NO_DATA', 'NORMAL', 'WARNING', 'CRITICAL'], value, 'NO_DATA');
export const toConnectivityStatus = (value: string): ConnectivityStatus =>
  narrow<ConnectivityStatus>(['CONNECTED', 'DISCONNECTED'], value, 'DISCONNECTED');

/**
 * Severity rank used to sort equipment so the most urgent comes first (critical first, then
 * disconnected, warning, unknown, safe).
 */
export function riskRank(level: RiskLevel): number {
  return RISK_ORDER.indexOf(level);
}

/**
 * Whether readings of this state may be shown as current values. Stale, unknown and unverified
 * telemetry must never be shown as zero or healthy.
 */
export function hasFreshTelemetry(state: TelemetryState | OperationalState): boolean {
  return state === 'NORMAL' || state === 'ANOMALY';
}

/** One electrical reading. */
export interface ElectricalReading {
  readonly capturedAt: Date;
  readonly voltage: number;
  readonly current: number;
  readonly powerFactor: number;
  readonly frequency: number;
  readonly activePowerKw: number | null;
  readonly leakageCurrentAmps: number | null;
  readonly detectedAnomalyType: string | null;
}

/** Equipment row of the dashboard summary. */
export interface EquipmentStatus {
  readonly equipmentId: string;
  readonly name: string;
  readonly areaId: string;
  readonly areaName: string;
  readonly state: OperationalState;
  readonly lastMeasurementAt: Date | null;
  readonly openCriticalAlerts: number;
  readonly openNonCriticalAlerts: number;
}

/** Store dashboard summary (US08). */
export interface DashboardSummary {
  readonly generatedAt: Date;
  readonly totalEquipment: number;
  readonly monitoredEquipment: number;
  readonly offlineEquipment: number;
  readonly unmonitoredEquipment: number;
  readonly activeCriticalAlerts: number;
  readonly activeNonCriticalAlerts: number;
  readonly equipment: readonly EquipmentStatus[];
}

/** Equipment row of the grid status. */
export interface GridEquipment {
  readonly equipmentId: string;
  readonly name: string;
  readonly areaId: string;
  readonly areaName: string;
  readonly riskLevel: RiskLevel;
  readonly operationalState: OperationalState;
  readonly lastReading: ElectricalReading | null;
}

/** Electrical grid status of the store (US21). Aggregates are null when nothing reports. */
export interface GridStatusSnapshot {
  readonly generatedAt: Date;
  readonly status: GridStatus;
  readonly totalEquipment: number;
  readonly reportingEquipment: number;
  readonly totalActivePowerKw: number;
  readonly totalCurrentAmps: number;
  readonly averageVoltage: number | null;
  readonly averagePowerFactor: number | null;
  readonly averageFrequency: number | null;
  readonly maxLeakageCurrentAmps: number | null;
  readonly riskLevelCounts: Readonly<Record<RiskLevel, number>>;
  readonly equipment: readonly GridEquipment[];
}

/** Risk evaluation of one equipment (US16). */
export interface EquipmentRisk {
  readonly equipmentId: string;
  readonly name: string;
  readonly areaName: string;
  readonly riskLevel: RiskLevel;
  readonly operationalState: OperationalState;
  readonly reasons: readonly string[];
  readonly openCriticalAlerts: number;
  readonly openNonCriticalAlerts: number;
  readonly lastReading: ElectricalReading | null;
  readonly evaluatedAt: Date;
}

/** Latest telemetry of one equipment. */
export interface EquipmentTelemetry {
  readonly state: TelemetryState;
  readonly sensorSerialNumber: string | null;
  readonly lastMeasurement: ElectricalReading | null;
}

/** One measurement of the history. */
export interface Measurement extends ElectricalReading {
  readonly readingId: string;
  readonly detectedSeverity: string | null;
}

/** Connectivity of one sensor (US21). */
export interface SensorConnectivity {
  readonly sensorId: string;
  readonly serialNumber: string;
  readonly equipmentId: string;
  readonly equipmentName: string;
  readonly areaId: string;
  readonly areaName: string;
  readonly status: ConnectivityStatus;
  readonly lastTelemetryAt: Date | null;
  readonly secondsSinceLastTelemetry: number | null;
  readonly disconnectionThresholdMin: number;
}

/** Connectivity of every sensor of a store. */
export interface StoreConnectivity {
  readonly generatedAt: Date;
  readonly totalSensors: number;
  readonly connected: number;
  readonly disconnected: number;
  readonly lastEdgeSyncAt: Date | null;
  readonly sensors: readonly SensorConnectivity[];
}
