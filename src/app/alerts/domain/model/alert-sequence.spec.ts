import {
  type ActiveAlerts,
  type Alert,
  mergeAlertChanges,
  withReceivedAlert,
} from '@alerts/domain/model/alert';

function alert(overrides: Partial<Alert> & Pick<Alert, 'id'>): Alert {
  return {
    equipmentId: 'equipment-1',
    anomalyType: 'CURRENT_LEAKAGE',
    severity: 'NON_CRITICAL',
    detectionSeverity: 'string',
    status: 'OPEN',
    source: 'TELEMETRY',
    capturedAt: new Date('2026-03-14T15:30:00Z'),
    createdAt: new Date('2026-03-14T15:30:00Z'),
    isCriticalLeakage: false,
    reportCategory: null,
    description: null,
    reportedBy: null,
    onDutyWorker: null,
    acknowledgedAt: null,
    assignedTechnicianId: null,
    assignedTechnicianName: null,
    assignedAt: null,
    resolvedAt: null,
    resolutionNotes: null,
    sequence: 1,
    ...overrides,
  };
}

function active(items: Alert[], latestSequence: number): ActiveAlerts {
  return {
    generatedAt: new Date('2026-03-14T15:30:00Z'),
    openCritical: 0,
    openNonCritical: items.length,
    hasCriticalLeakage: false,
    latestSequence,
    items,
  };
}

describe('alert change sequence', () => {
  it('adds a received open alert first, counts it and moves the cursor', () => {
    const next = withReceivedAlert(active([alert({ id: 'a1', sequence: 1 })], 1), alert({ id: 'a2', sequence: 2, severity: 'CRITICAL' }));
    expect(next.items.map((item) => item.id)).toEqual(['a2', 'a1']);
    expect(next.openCritical).toBe(1);
    expect(next.latestSequence).toBe(2);
  });

  it('ignores an older copy of a known alert and never moves the cursor backwards', () => {
    const current = active([alert({ id: 'a1', sequence: 5, status: 'ASSIGNED' })], 5);
    const next = withReceivedAlert(current, alert({ id: 'a1', sequence: 3, status: 'OPEN' }));
    expect(next.items[0]?.status).toBe('ASSIGNED');
    expect(next.latestSequence).toBe(5);
  });

  it('applies only newer changes, removes resolved alerts and takes the highest cursor', () => {
    const current = active(
      [alert({ id: 'a1', sequence: 1 }), alert({ id: 'a2', sequence: 4, status: 'ACKNOWLEDGED' })],
      4,
    );
    const merged = mergeAlertChanges(current, {
      items: [
        alert({ id: 'a2', sequence: 3, status: 'OPEN' }), // older than held: ignored
        alert({ id: 'a1', sequence: 6, status: 'RESOLVED' }), // newer and resolved: removed
        alert({ id: 'a3', sequence: 7, status: 'OPEN' }), // new open: added
      ],
      latestSequence: 7,
      hasMore: false,
    });
    expect(merged.items.map((item) => item.id)).toEqual(['a3', 'a2']);
    expect(merged.items.find((item) => item.id === 'a2')?.status).toBe('ACKNOWLEDGED');
    expect(merged.latestSequence).toBe(7);
  });

  it('keeps the last full counters on a delta (the change feed does not define them)', () => {
    const current = { ...active([], 1), openCritical: 3, openNonCritical: 2 };
    const merged = mergeAlertChanges(current, { items: [], latestSequence: 9, hasMore: false });
    expect(merged.openCritical).toBe(3);
    expect(merged.openNonCritical).toBe(2);
    expect(merged.latestSequence).toBe(9);
  });
});
