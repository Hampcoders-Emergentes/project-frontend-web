/** Alert workflow status. */
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESOLVED';
/** Presentation severity. */
export type AlertSeverity = 'CRITICAL' | 'NON_CRITICAL';
/** Alert origin. */
export type AlertSource = 'TELEMETRY' | 'MANUAL_REPORT';

export const ALERT_STATUSES: readonly AlertStatus[] = ['OPEN', 'ACKNOWLEDGED', 'ASSIGNED', 'RESOLVED'];
export const ALERT_SEVERITIES: readonly AlertSeverity[] = ['CRITICAL', 'NON_CRITICAL'];

/** Maximum length of resolution notes. */
export const RESOLUTION_NOTES_MAX_LENGTH = 1000;

/** A roster worker snapshot (code and name), never an IAM account. */
export interface Worker {
  readonly workerCode: string;
  readonly workerName: string;
}

/**
 * One alert. The API creates one alert per reading (no incident grouping), so several alerts can
 * refer to the same equipment and anomaly.
 */
export interface Alert {
  readonly id: string;
  readonly equipmentId: string;
  readonly anomalyType: string;
  readonly severity: AlertSeverity;
  readonly detectionSeverity: string;
  readonly status: AlertStatus;
  readonly source: AlertSource;
  readonly capturedAt: Date;
  readonly createdAt: Date;
  readonly isCriticalLeakage: boolean;
  readonly reportCategory: string | null;
  readonly description: string | null;
  readonly reportedBy: Worker | null;
  readonly onDutyWorker: Worker | null;
  readonly acknowledgedAt: Date | null;
  readonly assignedTechnicianId: string | null;
  readonly assignedTechnicianName: string | null;
  readonly assignedAt: Date | null;
  readonly resolvedAt: Date | null;
  readonly resolutionNotes: string | null;
}

/** Workflow actions on an alert. */
export type AlertAction = 'acknowledge' | 'assign' | 'resolve';

const NEXT_ACTION: Readonly<Record<AlertStatus, AlertAction | null>> = {
  OPEN: 'acknowledge',
  ACKNOWLEDGED: 'assign',
  ASSIGNED: 'resolve',
  RESOLVED: null,
};

/**
 * The only valid next action of the linear workflow `OPEN -> ACKNOWLEDGED -> ASSIGNED -> RESOLVED`.
 * @param status - The current status.
 */
export function nextAlertAction(status: AlertStatus): AlertAction | null {
  return NEXT_ACTION[status];
}

/** Counters of the active alerts. */
export interface ActiveAlerts {
  readonly generatedAt: Date;
  readonly openCritical: number;
  readonly openNonCritical: number;
  readonly hasCriticalLeakage: boolean;
  readonly items: readonly Alert[];
}

/**
 * Adds a realtime alert to the active list (newest first) without duplicating it, and updates the
 * counters for a new open alert.
 * @param active - The current active alerts.
 * @param alert - The received alert.
 */
export function withReceivedAlert(active: ActiveAlerts, alert: Alert): ActiveAlerts {
  if (active.items.some((item) => item.id === alert.id) || alert.status === 'RESOLVED') {
    return active;
  }
  const critical = alert.severity === 'CRITICAL';
  return {
    ...active,
    openCritical: active.openCritical + (critical ? 1 : 0),
    openNonCritical: active.openNonCritical + (critical ? 0 : 1),
    hasCriticalLeakage: active.hasCriticalLeakage || alert.isCriticalLeakage,
    items: [alert, ...active.items],
  };
}

/** Filters of the alert history; dates filter `createdAt` (`[from, to)`, both or neither). */
export interface AlertHistoryFilter {
  readonly status: AlertStatus | null;
  readonly severity: AlertSeverity | null;
  readonly equipmentId: string | null;
  readonly from: Date | null;
  readonly to: Date | null;
}
