import type { Observable } from 'rxjs';
import type { DownloadedFile } from '@shared/application/file-saver.port';
import type { DateRange } from '@shared/domain/date-range';
import type {
  BudgetInput,
  BudgetStatus,
  ConsumptionComparison,
  CostProjection,
  EnergyReport,
  EnergyReportFormat,
  EquipmentConsumption,
  Granularity,
  MaintenancePredictions,
  OffHoursConsumption,
  OpeningDay,
  OpeningHours,
  StoreConsumption,
} from '@analytics/domain/model/energy';

/** Energy analytics of a store. Every range is half-open and at most 31 days. */
export abstract class AnalyticsPort {
  abstract getOpeningHours(storeId: string): Observable<OpeningHours>;
  abstract setOpeningHours(storeId: string, days: readonly OpeningDay[]): Observable<OpeningHours>;
  abstract getConsumption(storeId: string, range: DateRange, granularity: Granularity): Observable<StoreConsumption>;
  abstract exportConsumptionCsv(storeId: string, range: DateRange, granularity: Granularity): Observable<DownloadedFile>;
  abstract getEquipmentConsumption(storeId: string, areaId: string, equipmentId: string, range: DateRange): Observable<EquipmentConsumption>;
  abstract compare(storeId: string, period1: DateRange, period2: DateRange): Observable<ConsumptionComparison>;
  abstract getOffHours(storeId: string, range: DateRange, standbyThresholdKw: number): Observable<OffHoursConsumption>;
  abstract getCostProjection(storeId: string): Observable<CostProjection>;
  abstract setBudget(storeId: string, budget: BudgetInput): Observable<void>;
  abstract getBudgetStatus(storeId: string, year: number, month: number): Observable<BudgetStatus>;
  abstract getMaintenancePredictions(storeId: string, days: number): Observable<MaintenancePredictions>;
  /** Synchronous generation: may take several seconds; there is no progress API. */
  abstract generateReport(storeId: string, range: DateRange, format: EnergyReportFormat): Observable<EnergyReport>;
  abstract downloadReport(storeId: string, report: EnergyReport): Observable<DownloadedFile>;
}
