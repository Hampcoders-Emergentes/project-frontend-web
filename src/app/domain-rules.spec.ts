import { nextAlertAction, withReceivedAlert, type ActiveAlerts, type Alert } from '@alerts/domain/model/alert';
import { certificateDatesProblem, checklistItemProblem } from '@compliance/domain/model/compliance';
import { hasFreshTelemetry, riskRank, toRiskLevel } from '@monitoring/domain/model/monitoring';
import { isPublicHttpsUrl, routeProblem } from '@notifications/domain/model/notification-route';
import { thresholdProblem } from '@stores/domain/model/equipment-safety';
import { bootstrapFor } from '@stores/domain/model/store-hierarchy';
import { clampToCanvas, layoutChanges, type StoreLayout } from '@stores/domain/model/store-layout';

describe('stores domain', () => {
  it('decides the post-sign-in bootstrap from the number of stores', () => {
    const store = { id: 'store-1', name: 'A', address: 'x', lastEdgeSyncAt: null };
    expect(bootstrapFor([]).kind).toBe('onboarding');
    expect(bootstrapFor([store])).toEqual({ kind: 'single', storeId: 'store-1' });
    expect(bootstrapFor([store, { ...store, id: 'store-2' }]).kind).toBe('switcher');
  });

  it('validates thresholds: power factor within 0-1, values required', () => {
    expect(thresholdProblem('minPowerFactor', 0.93)).toBeNull();
    expect(thresholdProblem('minPowerFactor', 1.2)).toBe('range');
    expect(thresholdProblem('nominalVoltage', null)).toBe('required');
    expect(thresholdProblem('maxCurrentAmps', -1)).toBe('range');
  });

  it('keeps placements inside the canvas and computes removals', () => {
    expect(clampToCanvas({ x: 950, y: -5, width: 100, height: 50, zIndex: 0 }, 1000, 600)).toEqual({ x: 900, y: 0, width: 100, height: 50, zIndex: 0 });
    const base = { name: 'Fryer', areaId: 'a', areaName: 'Hot', riskLevel: 'SAFE' as const };
    const original: StoreLayout = { canvasWidth: 1000, canvasHeight: 600, equipment: [{ ...base, equipmentId: 'e1', box: { x: 0, y: 0, width: 10, height: 10, zIndex: 0 } }, { ...base, equipmentId: 'e2', box: null }] };
    const edited: StoreLayout = { ...original, equipment: [{ ...base, equipmentId: 'e1', box: null }, { ...base, equipmentId: 'e2', box: { x: 5, y: 5, width: 10, height: 10, zIndex: 1 } }] };
    const changes = layoutChanges(original, edited);
    expect(changes.removedEquipmentIds).toEqual(['e1']);
    expect(changes.placements.map((p) => p.equipmentId)).toEqual(['e2']);
  });
});

describe('monitoring domain', () => {
  it('never treats unknown vocabulary or stale data as healthy', () => {
    expect(toRiskLevel('SOMETHING_NEW')).toBe('UNKNOWN');
    expect(hasFreshTelemetry('STALE')).toBe(false);
    expect(hasFreshTelemetry('UNKNOWN')).toBe(false);
    expect(hasFreshTelemetry('NORMAL')).toBe(true);
    expect(riskRank('CRITICAL_RISK')).toBeGreaterThan(riskRank('WARNING'));
  });
});

describe('alerts domain', () => {
  const alert: Alert = {
    id: 'alert-1', equipmentId: 'e1', anomalyType: 'CURRENT_LEAKAGE', severity: 'CRITICAL', detectionSeverity: 'Critical', status: 'OPEN',
    source: 'TELEMETRY', capturedAt: new Date(), createdAt: new Date(), isCriticalLeakage: true, reportCategory: null, description: null,
    reportedBy: null, onDutyWorker: null, acknowledgedAt: null, assignedTechnicianId: null, assignedTechnicianName: null, assignedAt: null,
    resolvedAt: null, resolutionNotes: null, sequence: 1,
  };

  it('follows the linear workflow OPEN -> ACKNOWLEDGED -> ASSIGNED -> RESOLVED', () => {
    expect(nextAlertAction('OPEN')).toBe('acknowledge');
    expect(nextAlertAction('ACKNOWLEDGED')).toBe('assign');
    expect(nextAlertAction('ASSIGNED')).toBe('resolve');
    expect(nextAlertAction('RESOLVED')).toBeNull();
  });

  it('merges a realtime alert once and updates counters', () => {
    const active: ActiveAlerts = { generatedAt: new Date(), openCritical: 0, openNonCritical: 0, hasCriticalLeakage: false, latestSequence: 0, items: [] };
    const merged = withReceivedAlert(active, alert);
    expect(merged.openCritical).toBe(1);
    expect(merged.hasCriticalLeakage).toBe(true);
    expect(withReceivedAlert(merged, alert)).toBe(merged);
  });
});

describe('compliance domain', () => {
  it('requires notes on failed checklist items', () => {
    expect(checklistItemProblem({ code: 'RCD_TEST', result: 'FAIL', notes: '' })).toBe('failNeedsNotes');
    expect(checklistItemProblem({ code: 'RCD_TEST', result: null, notes: '' })).toBe('missingResult');
    expect(checklistItemProblem({ code: 'RCD_TEST', result: 'PASS', notes: '' })).toBeNull();
  });

  it('applies the documented certificate date rules', () => {
    const now = new Date('2026-01-10T00:00:00Z');
    expect(certificateDatesProblem(new Date('2026-01-15'), new Date('2027-01-15'), now)).toBe('issuedInFuture');
    expect(certificateDatesProblem(new Date('2026-01-01'), new Date('2025-12-01'), now)).toBe('expiryBeforeIssue');
    expect(certificateDatesProblem(new Date('2026-01-01'), new Date('2037-01-02'), now)).toBe('expiryTooFar');
    expect(certificateDatesProblem(new Date('2026-01-01'), new Date('2027-01-01'), now)).toBeNull();
  });
});

describe('notifications domain', () => {
  it('accepts only public https webhooks', () => {
    expect(isPublicHttpsUrl('https://hooks.example.com/alerts')).toBe(true);
    expect(isPublicHttpsUrl('http://hooks.example.com')).toBe(false);
    expect(isPublicHttpsUrl('https://localhost/x')).toBe(false);
    expect(isPublicHttpsUrl('https://192.168.1.2/x')).toBe(false);
    expect(isPublicHttpsUrl('https://user:pw@example.com')).toBe(false);
    expect(isPublicHttpsUrl('https://printer.local')).toBe(false);
  });

  it('validates routes by channel', () => {
    const route = { channel: 'EMAIL' as const, destination: 'manager@example.com', recipientRole: 'STORE_MANAGER' as const, recipientName: null, urgencyLevels: ['CRITICAL' as const], enabled: true };
    expect(routeProblem(route)).toBeNull();
    expect(routeProblem({ ...route, destination: null })).toBe('destinationRequired');
    expect(routeProblem({ ...route, urgencyLevels: [] })).toBe('urgencyRequired');
    expect(routeProblem({ ...route, channel: 'DASHBOARD_PUSH', destination: null })).toBeNull();
  });
});
