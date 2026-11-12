/**
 * The eight electrical thresholds of an equipment (US18). The API has no temperature threshold.
 * Units: V, W, A, power factor 0-1, Hz, minutes, A, A.
 */
export interface ElectricalThresholds {
  readonly nominalVoltage: number;
  readonly maxConsumptionWatts: number;
  readonly maxCurrentAmps: number;
  readonly minPowerFactor: number;
  readonly nominalFrequency: number;
  readonly disconnectionThresholdMin: number;
  readonly normalLimitAmps: number;
  readonly alertLimitAmps: number;
}

export type ThresholdField = keyof ElectricalThresholds;

/** Field order and units used to render and validate the thresholds. */
export const THRESHOLD_FIELDS: readonly { readonly field: ThresholdField; readonly unit: string }[] = [
  { field: 'nominalVoltage', unit: 'V' },
  { field: 'nominalFrequency', unit: 'Hz' },
  { field: 'maxConsumptionWatts', unit: 'W' },
  { field: 'maxCurrentAmps', unit: 'A' },
  { field: 'normalLimitAmps', unit: 'A' },
  { field: 'alertLimitAmps', unit: 'A' },
  { field: 'minPowerFactor', unit: '' },
  { field: 'disconnectionThresholdMin', unit: 'min' },
];

/**
 * Client-side checks that are documented by the API: every value is a finite number and the power
 * factor lies within 0-1. Exact server ranges are enforced by the API (`400` with field errors).
 * @param field - The threshold field.
 * @param value - The candidate value.
 * @returns A problem code, or null when acceptable.
 */
export function thresholdProblem(field: ThresholdField, value: number | null): 'required' | 'range' | null {
  if (value === null || !Number.isFinite(value)) {
    return 'required';
  }
  if (field === 'minPowerFactor') {
    return value >= 0 && value <= 1 ? null : 'range';
  }
  return value >= 0 ? null : 'range';
}

/** When the equipment counts as safe to clean (used by the kitchen panel; configured here). */
export interface SafeToCleanRule {
  readonly maxDeEnergizedCurrentAmps: number;
  readonly maxReadingAgeMinutes: number;
  readonly requireNoActiveCriticalAlerts: boolean;
}

/** Shutdown and emergency isolation instructions of an equipment (US12). */
export interface ShutdownProtocol {
  readonly equipmentId: string;
  readonly equipmentName: string;
  /** True while the platform default is in use (never customised). */
  readonly isDefault: boolean;
  readonly shutdownSteps: readonly string[];
  readonly emergencyIsolationSteps: readonly string[];
  readonly safeToCleanRule: SafeToCleanRule;
  readonly updatedAt: Date | null;
}

/** Documented limits of the shutdown protocol. */
export const SHUTDOWN_PROTOCOL_LIMITS = {
  minSteps: 1,
  maxSteps: 30,
  maxDeEnergizedCurrentAmps: { min: 0, max: 1 },
  maxReadingAgeMinutes: { min: 1, max: 30 },
} as const;

/**
 * Whether a step list respects the documented 1-30 non-blank steps.
 * @param steps - The steps.
 */
export function isValidStepList(steps: readonly string[]): boolean {
  const filled = steps.filter((step) => step.trim().length > 0);
  return (
    filled.length === steps.length &&
    filled.length >= SHUTDOWN_PROTOCOL_LIMITS.minSteps &&
    filled.length <= SHUTDOWN_PROTOCOL_LIMITS.maxSteps
  );
}
