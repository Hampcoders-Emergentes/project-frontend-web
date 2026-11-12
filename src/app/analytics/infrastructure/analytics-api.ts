import { inject, Injectable } from '@angular/core';
import { defer, map, type Observable } from 'rxjs';
import type { DownloadedFile } from '@shared/application/file-saver.port';
import type { DateRange } from '@shared/domain/date-range';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import { serializeRange } from '@shared/infrastructure/api/date-serialization';
import {
  type BudgetInput,
  type BudgetStatus,
  type ConsumptionComparison,
  type CostProjection,
  DAYS_OF_WEEK,
  type EnergyReport,
  type EnergyReportFormat,
  type EquipmentConsumption,
  type Granularity,
  type MaintenancePredictions,
  type OffHoursConsumption,
  type OpeningDay,
  type OpeningHours,
  type StoreConsumption,
} from '@analytics/domain/model/energy';
import type { AnalyticsPort } from '@analytics/application/ports/analytics.port';
import type * as R from '@analytics/infrastructure/analytics-resources';

const d = (value: string): Date => new Date(value);

/** AnalyticsApi implements AnalyticsPort against `/stores/{id}/analytics/*` and maintenance predictions. */
@Injectable({ providedIn: 'root' })
export class AnalyticsApi implements AnalyticsPort {
  private readonly api = inject(ApiClient);

  getOpeningHours(storeId: string): Observable<OpeningHours> {
    return this.api.get<R.StoreOpeningHoursResponse>(this.path(storeId, 'opening-hours')).pipe(map(toOpeningHours));
  }

  setOpeningHours(storeId: string, days: readonly OpeningDay[]): Observable<OpeningHours> {
    return this.api
      .put<R.StoreOpeningHoursResponse>(this.path(storeId, 'opening-hours'), {
        days: days.map(({ dayOfWeek, openTime, closeTime }) => ({ dayOfWeek, openTime, closeTime })),
      })
      .pipe(map(toOpeningHours));
  }

  getConsumption(storeId: string, range: DateRange, granularity: Granularity): Observable<StoreConsumption> {
    return defer(() => this.api.get<R.StoreConsumptionResponse>(this.path(storeId, 'consumption'), { ...serializeRange(range), granularity })).pipe(
      map((r) => ({
        from: d(r.fromUtc),
        to: d(r.toUtc),
        granularity: r.granularity,
        totalKwh: r.totalKwh,
        series: r.series.map((b) => ({ start: d(b.startUtc), kwh: b.kwh })),
        equipment: r.equipment.map((e) => ({ equipmentId: e.equipmentId, equipmentName: e.equipmentName, kwh: e.kwh, peakKw: e.peakKw, sampleCount: e.sampleCount })),
      })),
    );
  }

  exportConsumptionCsv(storeId: string, range: DateRange, granularity: Granularity): Observable<DownloadedFile> {
    return defer(() =>
      this.api.getFile(`${this.path(storeId, 'consumption')}/report`, 'consumption.csv', { ...serializeRange(range), granularity, format: 'csv' }),
    );
  }

  getEquipmentConsumption(storeId: string, areaId: string, equipmentId: string, range: DateRange): Observable<EquipmentConsumption> {
    return defer(() =>
      this.api.get<R.EquipmentPowerConsumptionResponse>(apiPath('stores', storeId, 'areas', areaId, 'equipment', equipmentId, 'consumption'), {
        ...serializeRange(range),
        granularity: 'daily',
      }),
    ).pipe(
      map((r) => ({
        equipmentName: r.equipmentName,
        timeZone: r.timeZone,
        granularity: r.granularity,
        kwh: r.kwh,
        peakKw: r.peakKw,
        averageKw: r.averageKw,
        sampleCount: r.sampleCount,
        cost: { ...r.cost },
        series: r.series.map((b) => ({ start: d(b.startUtc), kwh: b.kwh, cost: b.cost })),
      })),
    );
  }

  compare(storeId: string, period1: DateRange, period2: DateRange): Observable<ConsumptionComparison> {
    return defer(() => {
      const p1 = serializeRange(period1);
      const p2 = serializeRange(period2);
      return this.api.get<R.ConsumptionComparisonResponse>(this.path(storeId, 'comparison'), {
        period1From: p1.from,
        period1To: p1.to,
        period2From: p2.from,
        period2To: p2.to,
      });
    }).pipe(
      map((r) => ({
        currency: r.currency,
        period1: toPeriod(r.period1),
        period2: toPeriod(r.period2),
        kwhDifference: r.kwhDifference,
        costDifference: r.costDifference,
        kwhChangePercent: r.kwhChangePercent,
        costChangePercent: r.costChangePercent,
        averageDailyKwhChangePercent: r.averageDailyKwhChangePercent,
        equipment: r.equipment.map((e) => ({
          equipmentId: e.equipmentId,
          equipmentName: e.equipmentName,
          period1Kwh: e.period1Kwh,
          period2Kwh: e.period2Kwh,
          kwhChangePercent: e.kwhChangePercent,
        })),
      })),
    );
  }

  getOffHours(storeId: string, range: DateRange, standbyThresholdKw: number): Observable<OffHoursConsumption> {
    return defer(() =>
      this.api.get<R.OffHoursConsumptionResponse>(this.path(storeId, 'off-hours-consumption'), { ...serializeRange(range), standbyThresholdKw }),
    ).pipe(
      map((r) => ({
        timeZone: r.timeZone,
        currency: r.currency,
        standbyThresholdKw: r.standbyThresholdKw,
        totalKwh: r.totalKwh,
        totalCost: r.totalCost,
        equipment: r.equipment.map((e) => ({ ...e })),
        episodes: r.episodes.map((e) => ({ equipmentName: e.equipmentName, start: d(e.startUtc), end: d(e.endUtc), kwh: e.kwh, cost: e.cost, peakKw: e.peakKw })),
      })),
    );
  }

  getCostProjection(storeId: string): Observable<CostProjection> {
    return this.api.get<R.StoreCostForecastResponse>(this.path(storeId, 'cost-projection')).pipe(
      map((r) => ({
        currency: r.currency,
        timeZone: r.timeZone,
        generatedAt: d(r.generatedAtUtc),
        monthToDateKwh: r.monthToDateKwh,
        monthToDateCost: r.monthToDateCost,
        elapsedDays: r.elapsedDays,
        daysInMonth: r.daysInMonth,
        method: r.method,
        projectedKwh: r.projectedKwh,
        projectedCost: r.projectedCost,
        daily: r.daily.map((day) => ({ ...day })),
      })),
    );
  }

  setBudget(storeId: string, budget: BudgetInput): Observable<void> {
    const body =
      budget.alertThresholdPercentage === null
        ? { year: budget.year, month: budget.month, targetKWh: budget.targetKWh }
        : { year: budget.year, month: budget.month, targetKWh: budget.targetKWh, alertThresholdPercentage: budget.alertThresholdPercentage };
    return this.api.put<unknown>(this.path(storeId, 'budget'), body).pipe(map(() => undefined));
  }

  getBudgetStatus(storeId: string, year: number, month: number): Observable<BudgetStatus> {
    return this.api.get<R.BudgetStatusResponse>(this.path(storeId, 'budget-status'), { year, month }).pipe(
      map((r) => ({
        year: r.year,
        month: r.month,
        timeZone: r.timeZone,
        hasBudget: r.targetKWh !== null,
        isWarning: r.isWarning,
        targetKWh: r.targetKWh,
        alertThresholdPercentage: r.alertThresholdPercentage,
        consumedKwh: r.consumedKwh,
        consumedPercentage: r.consumedPercentage,
        remainingKwh: r.remainingKwh,
        projectedKwh: r.projectedKwh,
        projectedPercentage: r.projectedPercentage,
      })),
    );
  }

  getMaintenancePredictions(storeId: string, days: number): Observable<MaintenancePredictions> {
    return this.api.get<R.MaintenancePredictionsResponse>(apiPath('stores', storeId, 'maintenance', 'predictions'), { days }).pipe(
      map((r) => ({
        generatedAt: d(r.generatedAtUtc),
        analysedEquipment: r.analysedEquipment,
        insufficientDataEquipmentIds: r.insufficientDataEquipmentIds,
        predictions: r.predictions.map((p) => ({
          equipmentId: p.equipmentId,
          equipmentName: p.equipmentName,
          severity: p.severity,
          daysToPowerFactorLimit: p.daysToPowerFactorLimit,
          findings: p.findings.map((f) => ({ ...f })),
          recommendedWindow: p.recommendedWindow === null ? null : { start: d(p.recommendedWindow.startUtc), end: d(p.recommendedWindow.endUtc), reason: p.recommendedWindow.reason },
        })),
      })),
    );
  }

  generateReport(storeId: string, range: DateRange, format: EnergyReportFormat): Observable<EnergyReport> {
    return defer(() => this.api.post<R.EnergyReportResponse>(this.path(storeId, 'reports'), { ...serializeRange(range), format })).pipe(
      map((r) => ({
        reportId: r.reportId,
        format: r.format,
        fileName: r.fileName,
        sizeBytes: r.sizeBytes,
        from: d(r.fromUtc),
        to: d(r.toUtc),
        generatedAt: d(r.generatedAtUtc),
        expiresAt: d(r.expiresAtUtc),
      })),
    );
  }

  downloadReport(storeId: string, report: EnergyReport): Observable<DownloadedFile> {
    return this.api.getFile(`${this.path(storeId, 'reports')}/${encodeURIComponent(report.reportId)}/download`, report.fileName);
  }

  private path(storeId: string, resource: string): string {
    return apiPath('stores', storeId, 'analytics', resource);
  }
}

function toOpeningHours(r: R.StoreOpeningHoursResponse): OpeningHours {
  return {
    timeZone: r.timeZone,
    isConfigured: r.isConfigured,
    days: r.days.flatMap((day) => {
      const dayOfWeek = DAYS_OF_WEEK.find((name) => name.toLowerCase() === day.dayOfWeek.toLowerCase());
      return dayOfWeek === undefined ? [] : [{ dayOfWeek, openTime: day.openTime.slice(0, 5), closeTime: day.closeTime.slice(0, 5) }];
    }),
  };
}

function toPeriod(r: R.PeriodConsumptionResponse) {
  return { from: d(r.fromUtc), to: d(r.toUtc), days: r.days, kwh: r.kwh, cost: r.cost, averageDailyKwh: r.averageDailyKwh };
}
