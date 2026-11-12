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
 * refer to the same equipment and anomaly. `sequence` is the store's change sequence of the alert's
 * latest change (`0` for alerts changed before sequencing was deployed).
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
  readonly sequence: number;
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

/**
 * The active alerts of a store. `latestSequence` is the cursor: changes after it are fetched on catch-up.
 */
export interface ActiveAlerts {
  readonly generatedAt: Date;
  readonly openCritical: number;
  readonly openNonCritical: number;
  readonly hasCriticalLeakage: boolean;
  readonly latestSequence: number;
  readonly items: readonly Alert[];
}

/** One page of alert changes after a cursor (`alerts/changes`). Items are the current state of each alert. */
export interface AlertChanges {
  readonly items: readonly Alert[];
  readonly latestSequence: number;
  readonly hasMore: boolean;
}

/**
 * Applies a realtime alert. An alert already known is replaced only by a newer sequence; a new open alert
 * is added first and counted. The cursor moves to the highest sequence seen.
 * @param active - The current active alerts.
 * @param alert - The received alert.
 */
export function withReceivedAlert(active: ActiveAlerts, alert: Alert): ActiveAlerts {
  const latestSequence = Math.max(active.latestSequence, alert.sequence);
  const existing = active.items.find((item) => item.id === alert.id);
  if (existing !== undefined) {
    if (existing.sequence >= alert.sequence) {
      return latestSequence === active.latestSequence ? active : { ...active, latestSequence };
    }
    return { ...active, latestSequence, items: active.items.map((item) => (item.id === alert.id ? alert : item)) };
  }
  if (alert.status === 'RESOLVED') {
    return latestSequence === active.latestSequence ? active : { ...active, latestSequence };
  }
  const critical = alert.severity === 'CRITICAL';
  return {
    ...active,
    latestSequence,
    openCritical: active.openCritical + (critical ? 1 : 0),
    openNonCritical: active.openNonCritical + (critical ? 0 : 1),
    hasCriticalLeakage: active.hasCriticalLeakage || alert.isCriticalLeakage,
    items: [alert, ...active.items],
  };
}

/**
 * Merges a page of changes into the active list by alert id. A change is applied only when its sequence
 * is newer than the copy held; a resolved alert leaves the list. The counters are not recomputed from a
 * delta (the API's counter definition is not part of the change feed), so they keep their last full value.
 * @param active - The current active alerts.
 * @param changes - One page of changes.
 */
export function mergeAlertChanges(active: ActiveAlerts, changes: AlertChanges): ActiveAlerts {
  let items: readonly Alert[] = active.items;
  for (const change of changes.items) {
    const existing = items.find((item) => item.id === change.id);
    if (existing !== undefined && existing.sequence >= change.sequence) {
      continue;
    }
    if (change.status === 'RESOLVED') {
      items = items.filter((item) => item.id !== change.id);
    } else {
      items = existing === undefined ? [change, ...items] : items.map((item) => (item.id === change.id ? change : item));
    }
  }
  return { ...active, items, latestSequence: Math.max(active.latestSequence, changes.latestSequence) };
}

/** Filters of the alert history; dates filter `createdAt` (`[from, to)`, both or neither). */
export interface AlertHistoryFilter {
  readonly status: AlertStatus | null;
  readonly severity: AlertSeverity | null;
  readonly equipmentId: string | null;
  readonly from: Date | null;
  readonly to: Date | null;
}
