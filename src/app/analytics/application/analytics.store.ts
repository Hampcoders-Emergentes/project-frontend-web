import { inject, Injectable } from '@angular/core';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import { FileSaverPort } from '@shared/application/file-saver.port';
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
import type { AnalyticsEquipmentRef } from '@analytics/application/ports/analytics-equipment.port';
import {
  CompareEnergyPeriodsUseCase,
  DownloadEnergyReportUseCase,
  ExportConsumptionCsvUseCase,
  GenerateEnergyReportUseCase,
  GetBudgetStatusUseCase,
  GetCostProjectionUseCase,
  GetEnergyConsumptionUseCase,
  GetEquipmentConsumptionUseCase,
  GetMaintenancePredictionsUseCase,
  GetOffHoursConsumptionUseCase,
  GetOpeningHoursUseCase,
  ListAnalyticsEquipmentUseCase,
  SetEnergyBudgetUseCase,
  SetOpeningHoursUseCase,
} from '@analytics/application/use-cases/analytics-use-cases';

const rangeKey = (range: DateRange) => `${range.from.toISOString()}|${range.to.toISOString()}`;

/** Energy analytics state (US24-US29); everything is loaded on demand (no polling). */
@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
  private readonly fileSaver = inject(FileSaverPort);
  private readonly openingHoursUseCase = inject(GetOpeningHoursUseCase);
  private readonly setOpeningHoursUseCase = inject(SetOpeningHoursUseCase);
  private readonly consumptionUseCase = inject(GetEnergyConsumptionUseCase);
  private readonly exportCsvUseCase = inject(ExportConsumptionCsvUseCase);
  private readonly equipmentConsumptionUseCase = inject(GetEquipmentConsumptionUseCase);
  private readonly compareUseCase = inject(CompareEnergyPeriodsUseCase);
  private readonly offHoursUseCase = inject(GetOffHoursConsumptionUseCase);
  private readonly projectionUseCase = inject(GetCostProjectionUseCase);
  private readonly setBudgetUseCase = inject(SetEnergyBudgetUseCase);
  private readonly budgetStatusUseCase = inject(GetBudgetStatusUseCase);
  private readonly predictionsUseCase = inject(GetMaintenancePredictionsUseCase);
  private readonly generateReportUseCase = inject(GenerateEnergyReportUseCase);
  private readonly downloadReportUseCase = inject(DownloadEnergyReportUseCase);
  private readonly equipmentUseCase = inject(ListAnalyticsEquipmentUseCase);

  readonly openingHours = new AsyncResource<OpeningHours>();
  readonly consumption = new AsyncResource<StoreConsumption>();
  readonly equipmentConsumption = new AsyncResource<EquipmentConsumption>();
  readonly comparison = new AsyncResource<ConsumptionComparison>();
  readonly offHours = new AsyncResource<OffHoursConsumption>();
  readonly projection = new AsyncResource<CostProjection>();
  readonly budgetStatus = new AsyncResource<BudgetStatus>();
  readonly predictions = new AsyncResource<MaintenancePredictions>();
  readonly equipment = new AsyncResource<readonly AnalyticsEquipmentRef[]>();
  readonly openingHoursState = new MutationState();
  readonly budgetState = new MutationState();
  readonly exportState = new MutationState();
  readonly reportState = new MutationState();
  readonly downloadState = new MutationState();
  readonly generatedReports = new AsyncResource<readonly EnergyReport[]>();

  loadOpeningHours(storeId: string): void {
    this.openingHours.load(storeId, this.openingHoursUseCase.execute(storeId));
  }

  saveOpeningHours(storeId: string, days: readonly OpeningDay[]): void {
    this.openingHoursState.run(this.setOpeningHoursUseCase.execute(storeId, days), (saved) => this.openingHours.accept(storeId, saved));
  }

  loadConsumption(storeId: string, range: DateRange, granularity: Granularity): void {
    this.consumption.load(`${storeId}|${rangeKey(range)}|${granularity}`, this.consumptionUseCase.execute(storeId, range, granularity));
  }

  exportCsv(storeId: string, range: DateRange, granularity: Granularity): void {
    this.exportState.run(this.exportCsvUseCase.execute(storeId, range, granularity), (file) => this.fileSaver.save(file));
  }

  loadEquipment(storeId: string): void {
    if (this.equipment.key() !== storeId || this.equipment.error() !== null) {
      this.equipment.load(storeId, this.equipmentUseCase.execute(storeId));
    }
  }

  loadEquipmentConsumption(storeId: string, ref: AnalyticsEquipmentRef, range: DateRange): void {
    this.equipmentConsumption.load(
      `${storeId}|${ref.equipmentId}|${rangeKey(range)}`,
      this.equipmentConsumptionUseCase.execute(storeId, ref.areaId, ref.equipmentId, range),
    );
  }

  compare(storeId: string, period1: DateRange, period2: DateRange): void {
    this.comparison.load(`${storeId}|${rangeKey(period1)}|${rangeKey(period2)}`, this.compareUseCase.execute(storeId, period1, period2));
  }

  loadOffHours(storeId: string, range: DateRange, standbyThresholdKw: number): void {
    this.offHours.load(`${storeId}|${rangeKey(range)}|${standbyThresholdKw}`, this.offHoursUseCase.execute(storeId, range, standbyThresholdKw));
  }

  loadCosts(storeId: string, year: number, month: number): void {
    this.projection.load(storeId, this.projectionUseCase.execute(storeId));
    this.budgetStatus.load(`${storeId}|${year}-${month}`, this.budgetStatusUseCase.execute(storeId, year, month));
  }

  saveBudget(storeId: string, budget: BudgetInput): void {
    this.budgetState.run(this.setBudgetUseCase.execute(storeId, budget), () => this.loadCosts(storeId, budget.year, budget.month));
  }

  loadPredictions(storeId: string, days: number): void {
    this.predictions.load(`${storeId}|${days}`, this.predictionsUseCase.execute(storeId, days));
  }

  generateReport(storeId: string, range: DateRange, format: EnergyReportFormat): void {
    this.reportState.run(this.generateReportUseCase.execute(storeId, range, format), (report) => {
      const current = this.generatedReports.key() === storeId ? (this.generatedReports.data() ?? []) : [];
      this.generatedReports.accept(storeId, [report, ...current]);
    });
  }

  downloadReport(storeId: string, report: EnergyReport): void {
    this.downloadState.run(this.downloadReportUseCase.execute(storeId, report), (file) => this.fileSaver.save(file));
  }
}
