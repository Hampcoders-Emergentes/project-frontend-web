/** Consumption bucket size. */
export type Granularity = 'hourly' | 'daily';
/** Energy report file format. */
export type EnergyReportFormat = 'csv' | 'pdf';

/** English day names expected by the opening-hours API. */
export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/** One opening window (`HH:mm`, store time zone). */
export interface OpeningDay {
  readonly dayOfWeek: DayOfWeek;
  readonly openTime: string;
  readonly closeTime: string;
}

/** Store opening hours (US26); off-hours detection depends on them. */
export interface OpeningHours {
  readonly timeZone: string;
  readonly isConfigured: boolean;
  readonly days: readonly OpeningDay[];
}

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Whether a time is a valid `HH:mm`. */
export function isValidClockTime(value: string): boolean {
  return HH_MM.test(value);
}

/** A consumption bucket. */
export interface ConsumptionBucket {
  readonly start: Date;
  readonly kwh: number;
}

/** Store consumption over a period (US24). */
export interface StoreConsumption {
  readonly from: Date;
  readonly to: Date;
  readonly granularity: string;
  readonly totalKwh: number;
  readonly series: readonly ConsumptionBucket[];
  readonly equipment: readonly {
    readonly equipmentId: string;
    readonly equipmentName: string;
    readonly kwh: number;
    readonly peakKw: number;
    readonly sampleCount: number;
  }[];
}

/** Cost breakdown in the payload currency. */
export interface EnergyCost {
  readonly currency: string;
  readonly totalCost: number;
  readonly peakKwh: number;
  readonly offPeakKwh: number;
  readonly peakCost: number;
  readonly offPeakCost: number;
}

/** Consumption and cost of one equipment. */
export interface EquipmentConsumption {
  readonly equipmentName: string;
  readonly timeZone: string;
  readonly granularity: string;
  readonly kwh: number;
  readonly peakKw: number;
  readonly averageKw: number;
  readonly sampleCount: number;
  readonly cost: EnergyCost;
  readonly series: readonly (ConsumptionBucket & { readonly cost: number })[];
}

/** One compared period. */
export interface PeriodConsumption {
  readonly from: Date;
  readonly to: Date;
  readonly days: number;
  readonly kwh: number;
  readonly cost: number;
  readonly averageDailyKwh: number;
}

/**
 * Comparison of two periods (US25). Change percentages are null when the baseline is zero: they are
 * shown as "not available", never as a fabricated percentage.
 */
export interface ConsumptionComparison {
  readonly currency: string;
  readonly period1: PeriodConsumption;
  readonly period2: PeriodConsumption;
  readonly kwhDifference: number;
  readonly costDifference: number;
  readonly kwhChangePercent: number | null;
  readonly costChangePercent: number | null;
  readonly averageDailyKwhChangePercent: number | null;
  /** True when either period has too few power samples: the numbers are not a measurement (show "not enough data"). */
  readonly insufficientData: boolean;
  readonly equipment: readonly {
    readonly equipmentId: string;
    readonly equipmentName: string;
    readonly period1Kwh: number;
    readonly period2Kwh: number;
    readonly kwhChangePercent: number | null;
  }[];
}

/** Off-hours consumption (US27). */
export interface OffHoursConsumption {
  readonly timeZone: string;
  readonly currency: string;
  readonly standbyThresholdKw: number;
  readonly totalKwh: number;
  readonly totalCost: number;
  readonly equipment: readonly { readonly equipmentId: string; readonly equipmentName: string; readonly episodes: number; readonly kwh: number; readonly cost: number; readonly peakKw: number }[];
  readonly episodes: readonly { readonly equipmentName: string; readonly start: Date; readonly end: Date; readonly kwh: number; readonly cost: number; readonly peakKw: number }[];
}

/** End-of-month cost projection (US28). */
export interface CostProjection {
  readonly currency: string;
  readonly timeZone: string;
  readonly generatedAt: Date;
  readonly monthToDateKwh: number;
  readonly monthToDateCost: number;
  readonly elapsedDays: number;
  readonly daysInMonth: number;
  readonly method: string;
  readonly projectedKwh: number;
  readonly projectedCost: number;
  readonly daily: readonly { readonly date: string; readonly kwh: number; readonly cost: number }[];
}

/** Monthly budget status; `isWarning` is authoritative (never match the status string). */
export interface BudgetStatus {
  readonly year: number;
  readonly month: number;
  readonly timeZone: string;
  readonly hasBudget: boolean;
  readonly isWarning: boolean;
  readonly targetKWh: number | null;
  readonly alertThresholdPercentage: number | null;
  readonly consumedKwh: number;
  readonly consumedPercentage: number | null;
  readonly remainingKwh: number | null;
  readonly projectedKwh: number;
  readonly projectedPercentage: number | null;
}

/** Input of a monthly budget. */
export interface BudgetInput {
  readonly year: number;
  readonly month: number;
  readonly targetKWh: number;
  readonly alertThresholdPercentage: number | null;
}

/** Predictive maintenance (US29). Insufficient data is reported apart; an empty list is not "healthy". */
export interface MaintenancePredictions {
  readonly generatedAt: Date;
  readonly analysedEquipment: number;
  readonly insufficientDataEquipmentIds: readonly string[];
  readonly predictions: readonly {
    readonly equipmentId: string;
    readonly equipmentName: string;
    readonly severity: string;
    readonly daysToPowerFactorLimit: number | null;
    readonly findings: readonly { readonly code: string; readonly severity: string; readonly description: string; readonly recommendedAction: string }[];
    readonly recommendedWindow: { readonly start: Date; readonly end: Date; readonly reason: string } | null;
  }[];
}

/** A generated energy report. */
export interface EnergyReport {
  readonly reportId: string;
  readonly format: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly from: Date;
  readonly to: Date;
  readonly generatedAt: Date;
  readonly expiresAt: Date;
}
