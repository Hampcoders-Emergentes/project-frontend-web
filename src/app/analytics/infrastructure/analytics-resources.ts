/** Wire resources of the analytics endpoints. */

export interface StoreOpeningHoursResponse {
  storeId: string;
  timeZone: string;
  isConfigured: boolean;
  days: { dayOfWeek: string; openTime: string; closeTime: string }[];
}

export interface StoreConsumptionResponse {
  fromUtc: string;
  toUtc: string;
  granularity: string;
  totalKwh: number;
  equipment: { equipmentId: string; equipmentName: string; kwh: number; peakKw: number; sampleCount: number }[];
  series: { startUtc: string; kwh: number }[];
}

export interface EquipmentPowerConsumptionResponse {
  equipmentName: string;
  granularity: string;
  timeZone: string;
  kwh: number;
  peakKw: number;
  averageKw: number;
  sampleCount: number;
  cost: { currency: string; baseRatePerKwh: number; totalCost: number; peakKwh: number; offPeakKwh: number; peakCost: number; offPeakCost: number };
  series: { startUtc: string; kwh: number; cost: number }[];
}

export interface PeriodConsumptionResponse {
  fromUtc: string;
  toUtc: string;
  days: number;
  kwh: number;
  cost: number;
  averageDailyKwh: number;
}

export interface ConsumptionComparisonResponse {
  currency: string;
  period1: PeriodConsumptionResponse;
  period2: PeriodConsumptionResponse;
  kwhDifference: number;
  costDifference: number;
  kwhChangePercent: number | null;
  costChangePercent: number | null;
  averageDailyKwhChangePercent: number | null;
  /** `SUFFICIENT` or `INSUFFICIENT_DATA`; absent on older responses. */
  dataQuality?: string;
  equipment: { equipmentId: string; equipmentName: string; period1Kwh: number; period2Kwh: number; kwhChangePercent: number | null }[];
}

export interface OffHoursConsumptionResponse {
  timeZone: string;
  currency: string;
  standbyThresholdKw: number;
  totalKwh: number;
  totalCost: number;
  equipment: { equipmentId: string; equipmentName: string; episodes: number; kwh: number; cost: number; peakKw: number }[];
  episodes: { equipmentName: string; startUtc: string; endUtc: string; kwh: number; cost: number; peakKw: number }[];
}

export interface StoreCostForecastResponse {
  currency: string;
  timeZone: string;
  generatedAtUtc: string;
  monthToDateKwh: number;
  monthToDateCost: number;
  elapsedDays: number;
  daysInMonth: number;
  method: string;
  projectedKwh: number;
  projectedCost: number;
  daily: { date: string; kwh: number; cost: number }[];
}

export interface BudgetStatusResponse {
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
}

export interface MaintenancePredictionsResponse {
  generatedAtUtc: string;
  analysedEquipment: number;
  insufficientDataEquipmentIds: string[];
  predictions: {
    equipmentId: string;
    equipmentName: string;
    severity: string;
    daysToPowerFactorLimit: number | null;
    findings: { code: string; severity: string; description: string; recommendedAction: string }[];
    recommendedWindow: { startUtc: string; endUtc: string; reason: string } | null;
  }[];
}

export interface EnergyReportResponse {
  reportId: string;
  format: string;
  fileName: string;
  sizeBytes: number;
  fromUtc: string;
  toUtc: string;
  generatedAtUtc: string;
  expiresAtUtc: string;
}
