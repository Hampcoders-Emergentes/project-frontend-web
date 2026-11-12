import { inject, Injectable } from '@angular/core';
import { defer, map, type Observable } from 'rxjs';
import type { DateRange } from '@shared/domain/date-range';
import type { Page } from '@shared/application/page';
import { ApiClient } from '@shared/infrastructure/api/api-client';
import { apiPath } from '@shared/infrastructure/api/api-url';
import { parseInstant, serializeRange } from '@shared/infrastructure/api/date-serialization';
import { type HasMorePageResponse, toPage } from '@shared/infrastructure/api/paging';
import {
  type DashboardSummary,
  type ElectricalReading,
  type EquipmentRisk,
  type EquipmentTelemetry,
  type GridStatusSnapshot,
  type Measurement,
  type RiskLevel,
  type StoreConnectivity,
  toConnectivityStatus,
  toGridStatus,
  toOperationalState,
  toRiskLevel,
  toTelemetryState,
} from '@monitoring/domain/model/monitoring';
import type { MonitoringPort } from '@monitoring/application/ports/monitoring.port';

interface ElectricalReadingResponse {
  capturedAtUtc: string;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  activePowerKw?: number;
  leakageCurrentAmps?: number | null;
  detectedAnomalyType: string | null;
  detectedSeverity?: string | null;
}

interface DashboardSummaryResponse {
  generatedAtUtc: string;
  totalEquipment: number;
  monitoredEquipment: number;
  offlineEquipment: number;
  unmonitoredEquipment: number;
  activeCriticalAlerts: number;
  activeNonCriticalAlerts: number;
  equipment: {
    equipmentId: string;
    name: string;
    areaId: string;
    areaName: string;
    state: string;
    lastMeasurementAtUtc: string | null;
    openCriticalAlerts: number;
    openNonCriticalAlerts: number;
  }[];
}

interface GridStatusResponse {
  generatedAtUtc: string;
  status: string;
  totalEquipment: number;
  reportingEquipment: number;
  totalActivePowerKw: number;
  totalCurrentAmps: number;
  averageVoltage: number | null;
  averagePowerFactor: number | null;
  averageFrequency: number | null;
  maxLeakageCurrentAmps: number | null;
  riskLevelCounts: Record<string, number>;
  equipment: {
    equipmentId: string;
    name: string;
    areaId: string;
    areaName: string;
    riskLevel: string;
    operationalState: string;
    lastReading: ElectricalReadingResponse | null;
  }[];
}

interface EquipmentRiskResponse {
  equipmentId: string;
  name: string;
  areaName: string;
  riskLevel: string;
  operationalState: string;
  reasons: string[];
  openCriticalAlerts: number;
  openNonCriticalAlerts: number;
  lastReading: ElectricalReadingResponse | null;
  evaluatedAtUtc: string;
}

interface EquipmentTelemetryResponse {
  state: string;
  binding: { serialNumber: string } | null;
  lastMeasurement: ElectricalReadingResponse | null;
}

interface MeasurementHistoryResponse extends ElectricalReadingResponse {
  readingId: string;
}

interface ConnectivityResponse {
  generatedAtUtc: string;
  totalSensors: number;
  connected: number;
  disconnected: number;
  lastEdgeSyncAtUtc: string | null;
  sensors: {
    sensorId: string;
    serialNumber: string;
    equipmentId: string;
    equipmentName: string;
    areaId: string;
    areaName: string;
    status: string;
    lastTelemetryReceivedAtUtc: string | null;
    secondsSinceLastTelemetry: number | null;
    disconnectionThresholdMin: number;
  }[];
}

function toReading(resource: ElectricalReadingResponse): ElectricalReading {
  return {
    capturedAt: new Date(resource.capturedAtUtc),
    voltage: resource.voltage,
    current: resource.current,
    powerFactor: resource.powerFactor,
    frequency: resource.frequency,
    activePowerKw: resource.activePowerKw ?? null,
    leakageCurrentAmps: resource.leakageCurrentAmps ?? null,
    detectedAnomalyType: resource.detectedAnomalyType,
  };
}

function toRiskCounts(counts: Record<string, number>): Record<RiskLevel, number> {
  const result: Record<RiskLevel, number> = { SAFE: 0, WARNING: 0, CRITICAL_RISK: 0, DISCONNECTED: 0, UNKNOWN: 0 };
  for (const [level, count] of Object.entries(counts)) {
    result[toRiskLevel(level)] += count;
  }
  return result;
}

/** MonitoringApi implements MonitoringPort against the store monitoring endpoints. */
@Injectable({ providedIn: 'root' })
export class MonitoringApi implements MonitoringPort {
  private readonly api = inject(ApiClient);

  getDashboardSummary(storeId: string): Observable<DashboardSummary> {
    return this.api.get<DashboardSummaryResponse>(apiPath('stores', storeId, 'dashboard-summary')).pipe(
      map((r) => ({
        generatedAt: new Date(r.generatedAtUtc),
        totalEquipment: r.totalEquipment,
        monitoredEquipment: r.monitoredEquipment,
        offlineEquipment: r.offlineEquipment,
        unmonitoredEquipment: r.unmonitoredEquipment,
        activeCriticalAlerts: r.activeCriticalAlerts,
        activeNonCriticalAlerts: r.activeNonCriticalAlerts,
        equipment: r.equipment.map((e) => ({
          equipmentId: e.equipmentId,
          name: e.name,
          areaId: e.areaId,
          areaName: e.areaName,
          state: toOperationalState(e.state),
          lastMeasurementAt: parseInstant(e.lastMeasurementAtUtc),
          openCriticalAlerts: e.openCriticalAlerts,
          openNonCriticalAlerts: e.openNonCriticalAlerts,
        })),
      })),
    );
  }

  getGridStatus(storeId: string): Observable<GridStatusSnapshot> {
    return this.api.get<GridStatusResponse>(apiPath('stores', storeId, 'grid-status')).pipe(
      map((r) => ({
        generatedAt: new Date(r.generatedAtUtc),
        status: toGridStatus(r.status),
        totalEquipment: r.totalEquipment,
        reportingEquipment: r.reportingEquipment,
        totalActivePowerKw: r.totalActivePowerKw,
        totalCurrentAmps: r.totalCurrentAmps,
        averageVoltage: r.averageVoltage,
        averagePowerFactor: r.averagePowerFactor,
        averageFrequency: r.averageFrequency,
        maxLeakageCurrentAmps: r.maxLeakageCurrentAmps,
        riskLevelCounts: toRiskCounts(r.riskLevelCounts),
        equipment: r.equipment.map((e) => ({
          equipmentId: e.equipmentId,
          name: e.name,
          areaId: e.areaId,
          areaName: e.areaName,
          riskLevel: toRiskLevel(e.riskLevel),
          operationalState: toOperationalState(e.operationalState),
          lastReading: e.lastReading === null ? null : toReading(e.lastReading),
        })),
      })),
    );
  }

  getRiskLevel(storeId: string, areaId: string, equipmentId: string): Observable<EquipmentRisk> {
    return this.api.get<EquipmentRiskResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'risk-level')).pipe(
      map((r) => ({
        equipmentId: r.equipmentId,
        name: r.name,
        areaName: r.areaName,
        riskLevel: toRiskLevel(r.riskLevel),
        operationalState: toOperationalState(r.operationalState),
        reasons: r.reasons,
        openCriticalAlerts: r.openCriticalAlerts,
        openNonCriticalAlerts: r.openNonCriticalAlerts,
        lastReading: r.lastReading === null ? null : toReading(r.lastReading),
        evaluatedAt: new Date(r.evaluatedAtUtc),
      })),
    );
  }

  getTelemetry(storeId: string, areaId: string, equipmentId: string): Observable<EquipmentTelemetry> {
    return this.api.get<EquipmentTelemetryResponse>(this.equipmentPath(storeId, areaId, equipmentId, 'telemetry')).pipe(
      map((r) => ({
        state: toTelemetryState(r.state),
        sensorSerialNumber: r.binding?.serialNumber ?? null,
        lastMeasurement: r.lastMeasurement === null ? null : toReading(r.lastMeasurement),
      })),
    );
  }

  getMeasurements(storeId: string, areaId: string, equipmentId: string, range: DateRange, page: number): Observable<Page<Measurement>> {
    return defer(() => {
      const { from, to } = serializeRange(range);
      return this.api.get<HasMorePageResponse<MeasurementHistoryResponse>>(
        this.equipmentPath(storeId, areaId, equipmentId, 'measurements'),
        { from, to, page, pageSize: 50 },
      );
    }).pipe(
      map((response) =>
        toPage(response, (r) => ({ ...toReading(r), readingId: r.readingId, detectedSeverity: r.detectedSeverity ?? null })),
      ),
    );
  }

  getConnectivity(storeId: string): Observable<StoreConnectivity> {
    return this.api.get<ConnectivityResponse>(apiPath('stores', storeId, 'sensors', 'connectivity')).pipe(
      map((r) => ({
        generatedAt: new Date(r.generatedAtUtc),
        totalSensors: r.totalSensors,
        connected: r.connected,
        disconnected: r.disconnected,
        lastEdgeSyncAt: parseInstant(r.lastEdgeSyncAtUtc),
        sensors: r.sensors.map((s) => ({
          sensorId: s.sensorId,
          serialNumber: s.serialNumber,
          equipmentId: s.equipmentId,
          equipmentName: s.equipmentName,
          areaId: s.areaId,
          areaName: s.areaName,
          status: toConnectivityStatus(s.status),
          lastTelemetryAt: parseInstant(s.lastTelemetryReceivedAtUtc),
          secondsSinceLastTelemetry: s.secondsSinceLastTelemetry,
          disconnectionThresholdMin: s.disconnectionThresholdMin,
        })),
      })),
    );
  }

  private equipmentPath(storeId: string, areaId: string, equipmentId: string, resource: string): string {
    return apiPath('stores', storeId, 'areas', areaId, 'equipment', equipmentId, resource);
  }
}
