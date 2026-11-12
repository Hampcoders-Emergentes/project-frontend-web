import { inject, Injectable } from '@angular/core';
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
import { AnalyticsPort } from '@analytics/application/ports/analytics.port';
import { AnalyticsEquipmentPort, type AnalyticsEquipmentRef } from '@analytics/application/ports/analytics-equipment.port';

@Injectable({ providedIn: 'root' })
export class GetOpeningHoursUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string): Observable<OpeningHours> { return this.port.getOpeningHours(storeId); }
}

@Injectable({ providedIn: 'root' })
export class SetOpeningHoursUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, days: readonly OpeningDay[]): Observable<OpeningHours> { return this.port.setOpeningHours(storeId, days); }
}

@Injectable({ providedIn: 'root' })
export class GetEnergyConsumptionUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, range: DateRange, granularity: Granularity): Observable<StoreConsumption> {
    return this.port.getConsumption(storeId, range, granularity);
  }
}

@Injectable({ providedIn: 'root' })
export class ExportConsumptionCsvUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, range: DateRange, granularity: Granularity): Observable<DownloadedFile> {
    return this.port.exportConsumptionCsv(storeId, range, granularity);
  }
}

@Injectable({ providedIn: 'root' })
export class GetEquipmentConsumptionUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, areaId: string, equipmentId: string, range: DateRange): Observable<EquipmentConsumption> {
    return this.port.getEquipmentConsumption(storeId, areaId, equipmentId, range);
  }
}

@Injectable({ providedIn: 'root' })
export class CompareEnergyPeriodsUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, period1: DateRange, period2: DateRange): Observable<ConsumptionComparison> {
    return this.port.compare(storeId, period1, period2);
  }
}

@Injectable({ providedIn: 'root' })
export class GetOffHoursConsumptionUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, range: DateRange, standbyThresholdKw: number): Observable<OffHoursConsumption> {
    return this.port.getOffHours(storeId, range, standbyThresholdKw);
  }
}

@Injectable({ providedIn: 'root' })
export class GetCostProjectionUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string): Observable<CostProjection> { return this.port.getCostProjection(storeId); }
}

@Injectable({ providedIn: 'root' })
export class SetEnergyBudgetUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, budget: BudgetInput): Observable<void> { return this.port.setBudget(storeId, budget); }
}

@Injectable({ providedIn: 'root' })
export class GetBudgetStatusUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, year: number, month: number): Observable<BudgetStatus> {
    return this.port.getBudgetStatus(storeId, year, month);
  }
}

@Injectable({ providedIn: 'root' })
export class GetMaintenancePredictionsUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, days: number): Observable<MaintenancePredictions> {
    return this.port.getMaintenancePredictions(storeId, days);
  }
}

@Injectable({ providedIn: 'root' })
export class GenerateEnergyReportUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, range: DateRange, format: EnergyReportFormat): Observable<EnergyReport> {
    return this.port.generateReport(storeId, range, format);
  }
}

@Injectable({ providedIn: 'root' })
export class DownloadEnergyReportUseCase {
  private readonly port = inject(AnalyticsPort);
  execute(storeId: string, report: EnergyReport): Observable<DownloadedFile> { return this.port.downloadReport(storeId, report); }
}

@Injectable({ providedIn: 'root' })
export class ListAnalyticsEquipmentUseCase {
  private readonly port = inject(AnalyticsEquipmentPort);
  execute(storeId: string): Observable<readonly AnalyticsEquipmentRef[]> { return this.port.listEquipment(storeId); }
}
