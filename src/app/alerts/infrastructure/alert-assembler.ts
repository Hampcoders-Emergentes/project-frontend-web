import {
  ALERT_STATUSES,
  type Alert,
  type AlertChanges,
  type AlertSeverity,
  type Worker,
} from '@alerts/domain/model/alert';

/**
 * `AlertResponse` (also the `ReceiveAlert` realtime payload). Additive fields are tolerated: only the
 * members mapped below are read, so unknown properties are ignored. `sequence` is optional because alerts
 * changed before sequencing was deployed may not carry it.
 */
export interface AlertResponse {
  id: string;
  equipmentId: string;
  anomalyType: string;
  detectionSeverity: string;
  severity: string;
  capturedAtUtc: string;
  createdAtUtc: string;
  status: string;
  acknowledgedAtUtc: string | null;
  isCriticalLeakage: boolean;
  source: string;
  reportCategory: string | null;
  description: string | null;
  reportedBy: Worker | null;
  onDutyWorker: Worker | null;
  assignedTechnicianId: string | null;
  assignedTechnicianName: string | null;
  assignedAtUtc: string | null;
  resolvedAtUtc: string | null;
  resolutionNotes: string | null;
  sequence?: number;
}

/** `AlertChangesResponse`. */
export interface AlertChangesResponse {
  items: AlertResponse[];
  latestSequence: number;
  hasMore: boolean;
}

const date = (value: string | null): Date | null => (value === null ? null : new Date(value));

/** Maps an alert resource; unknown statuses are treated as open (still needing attention). */
export function toAlert(r: AlertResponse): Alert {
  const severity: AlertSeverity = r.severity === 'CRITICAL' ? 'CRITICAL' : 'NON_CRITICAL';
  return {
    id: r.id,
    equipmentId: r.equipmentId,
    anomalyType: r.anomalyType,
    severity,
    detectionSeverity: r.detectionSeverity,
    status: ALERT_STATUSES.find((status) => status === r.status) ?? 'OPEN',
    source: r.source === 'MANUAL_REPORT' ? 'MANUAL_REPORT' : 'TELEMETRY',
    capturedAt: new Date(r.capturedAtUtc),
    createdAt: new Date(r.createdAtUtc),
    isCriticalLeakage: r.isCriticalLeakage,
    reportCategory: r.reportCategory,
    description: r.description,
    reportedBy: r.reportedBy,
    onDutyWorker: r.onDutyWorker,
    acknowledgedAt: date(r.acknowledgedAtUtc),
    assignedTechnicianId: r.assignedTechnicianId,
    assignedTechnicianName: r.assignedTechnicianName,
    assignedAt: date(r.assignedAtUtc),
    resolvedAt: date(r.resolvedAtUtc),
    resolutionNotes: r.resolutionNotes,
    sequence: r.sequence ?? 0,
  };
}

/** Maps one page of `alerts/changes`. */
export function toAlertChanges(r: AlertChangesResponse): AlertChanges {
  return { items: r.items.map(toAlert), latestSequence: r.latestSequence, hasMore: r.hasMore };
}

/** Narrows an untrusted realtime payload to an alert resource. */
export function isAlertResponse(value: unknown): value is AlertResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record['id'] === 'string' &&
    typeof record['equipmentId'] === 'string' &&
    typeof record['status'] === 'string' &&
    typeof record['createdAtUtc'] === 'string' &&
    typeof record['capturedAtUtc'] === 'string'
  );
}
